import { Request, Response } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';
import OpenAI from 'openai';
import { getDb } from '../lib/db';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Cache for storing assistant and vector store IDs
 * This helps reduce the need to recreate resources for the same document
 */
interface DocumentCache {
  vectorStoreId: string;
  assistantId: string;
  threadId: string;
  lastUsed: Date;
}

const documentCache = new Map<string, DocumentCache>();

/**
 * Clean up old cache entries to prevent memory leaks
 * Run this periodically
 */
function cleanupCache() {
  const now = new Date();
  for (const [documentId, cache] of documentCache.entries()) {
    // Remove entries older than 24 hours
    if (now.getTime() - cache.lastUsed.getTime() > 24 * 60 * 60 * 1000) {
      documentCache.delete(documentId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

/**
 * Optimized RAG-based document Q&A function
 */
export async function askWithRAG(req: Request, res: Response) {
  const { documentId, question } = req.body;

  if (!documentId || !question) {
    return res.status(400).json({ error: "Missing documentId or question parameter" });
  }

  try {
    // 1. Get the document details from the database
    const file = await (await getDb())
      .collection("files")
      .findOne({ documentId });

    if (!file) {
      return res.status(404).json({ error: "Document not found" });
    }

    let cachedData = documentCache.get(documentId);
    let assistantId: string;
    let threadId: string;
    let vectorStoreId: string;

    // 2. Check if we already have a cached assistant and vector store for this document
    if (cachedData && file.extractedData) {
      // Update the last used timestamp
      cachedData.lastUsed = new Date();
      assistantId = cachedData.assistantId;
      threadId = cachedData.threadId;
      vectorStoreId = cachedData.vectorStoreId;
      
      console.log(`Using cached resources for document ${documentId}`);
    } else {
      // 3. If not in cache, we need to process the document
      console.log(`Processing document ${documentId} for the first time`);
      
      // a. Download the document from S3
      const bucketName = process.env.S3_BUCKET_NAME!;
      const key = file.fileKey;
      
      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
      
      // b. Create a temporary file
      const tmpDir = os.tmpdir();
      const filePath = path.join(tmpDir, file.filename);
      
      // Ensure the temporary directory exists
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      // c. Save the S3 file to the temporary location
      const fileStream = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        (s3Response.Body as Readable).pipe(fileStream)
          .on("error", reject)
          .on("finish", resolve);
      });
      
      // d. Check if we've previously processed this document
      if (file.extractedData?.openaiFileId && 
          file.extractedData?.assistantId && 
          file.extractedData?.vectorStoreId) {
        // We can reuse existing OpenAI resources
        assistantId = file.extractedData.assistantId;
        vectorStoreId = file.extractedData.vectorStoreId;
        
        // Create a new thread for this conversation
        const threadResponse = await openai.beta.threads.create();
        threadId = threadResponse.id;
      } else {
        // e. Upload the file to OpenAI
        const openAIFile = await openai.files.create({
          file: fs.createReadStream(filePath),
          purpose: "assistants",
        });
        
        // f. Create a vector store
        const vectorStore = await openai.beta.vectorStores.create({
          name: `VectorStore-${documentId}`,
          file_ids: [openAIFile.id],
        });
        vectorStoreId = vectorStore.id;
        
        // g. Wait for vector store processing (with timeout)
        let vectorStoreStatus;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        
        do {
          vectorStoreStatus = await openai.beta.vectorStores.retrieve(vectorStoreId);
          if (vectorStoreStatus.status === "completed") break;
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } while (attempts < maxAttempts);
        
        if (vectorStoreStatus.status !== "completed") {
          throw new Error("Vector store processing timed out");
        }
        
        // h. Create an assistant
        const assistant = await openai.beta.assistants.create({
          name: `Assistant-${documentId}`,
          instructions: 
            "You are a helpful assistant that answers questions about the uploaded document. " +
            "Answer questions truthfully and directly based on the document content. " +
            "If information is not in the document, admit that you don't know rather than making up an answer. " +
            "When relevant, cite specific sections or pages from the document.",
          model: "gpt-4-turbo-preview",
          tools: [{ type: "file_search" }],
          tool_resources: {
            file_search: {
              vector_store_ids: [vectorStoreId],
            },
          },
        });
        assistantId = assistant.id;
        
        // i. Create a thread
        const threadResponse = await openai.beta.threads.create();
        threadId = threadResponse.id;
        
        // j. Save the IDs in the database for future use
        await (await getDb())
          .collection("files")
          .updateOne(
            { documentId },
            { 
              $set: { 
                extractedData: {
                  openaiFileId: openAIFile.id,
                  assistantId: assistantId,
                  vectorStoreId: vectorStoreId,
                  threadId: threadId
                }
              }
            }
          );
      }
      
      // k. Clean up the temporary file
      fs.unlinkSync(filePath);
      
      // l. Add to our in-memory cache
      documentCache.set(documentId, {
        assistantId,
        vectorStoreId,
        threadId,
        lastUsed: new Date()
      });
    }

    // 4. Add the user's question to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: question,
    });

    // 5. Run the assistant with progress tracking
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // 6. Wait for the run to complete with a timeout
    let runStatus;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    do {
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      if (runStatus.status === "completed" || 
          runStatus.status === "failed" || 
          runStatus.status === "cancelled" || 
          runStatus.status === "expired") {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    } while (attempts < maxAttempts);

    if (runStatus.status !== "completed") {
      if (attempts >= maxAttempts) {
        return res.status(504).json({ error: "Processing timed out" });
      } else {
        return res.status(500).json({ 
          error: "Run failed", 
          status: runStatus.status,
          details: runStatus.last_error
        });
      }
    }

    // 7. Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId);

    // Find the latest assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
    
    if (assistantMessages.length === 0) {
      return res.status(404).json({ error: "No assistant response found" });
    }

    const latestMessage = assistantMessages[0]; // Most recent message first
    
    // Format the answer based on the content type
    let answer = "";
    let citations = [];
    
    for (const contentItem of latestMessage.content) {
      if (contentItem.type === "text") {
        answer += contentItem.text.value;
        
        // Extract citations if they exist
        if (contentItem.text.annotations) {
          for (const annotation of contentItem.text.annotations) {
            if (annotation.type === "file_citation") {
              citations.push({
                text: annotation.text,
                fileCitation: annotation.file_citation
              });
            }
          }
        }
      }
    }

    // 8. Return the formatted response
    res.json({
      documentId,
      question,
      answer,
      citations: citations.length > 0 ? citations : undefined,
      threadId // Return the threadId so the client can continue the conversation
    });

  } catch (error) {
    console.error("Error in askWithRAG:", error);
    res.status(500).json({
      error: "Failed to process question",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}