import { Request, Response } from "express";
import { getDb } from "../lib/db";
import { ulid } from "ulid";
import { openai, s3 } from "../lib/utils";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { Readable } from "stream";
import path from "path";
import os from "os";

export async function filesService(req: Request, res: Response) {
  const token = req.headers.authorization;
  const tokenObj = await (await getDb())
    .collection("tokens")
    .findOne({ token });
  if (!tokenObj) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }
  const userId = tokenObj.userId;
  const data = await (await getDb())
    .collection("files")
    .find({ userId })
    .toArray();
  const updatedData = data.map((e) => {
    const { _id, ...eNew } = e;
    return {
      ...eNew,
      fileUrl: `https://cf.shawshankkumar.me/file%2F${e.userId}%2F${e.fileName}`,
      shared: false
    };
  });
  const emailData = await (await getDb())
    .collection("users")
    .findOne({ userId });

  const dataShared = await (
    await getDb()
  )
    .collection("files")
    .find({ sharedWith: [emailData!.email] })
    .toArray();

  const updatedDataShared = dataShared.map((e) => {
    const { _id, ...eNew } = e;
    return {
      ...eNew,
      fileUrl: `https://cf.shawshankkumar.me/file%2F${e.userId}%2F${e.fileName}`,
      shared: true
    };
  });

  res.status(200).json({
    data: updatedData.concat(updatedDataShared),
  });
}

export async function shareService(req: Request, res: Response) {
  const token = req.headers.authorization;
  const tokenObj = await (await getDb())
    .collection("tokens")
    .findOne({ token });
  if (!tokenObj) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }
  if (!req.body.fileName) {
    return res.status(422).json({ message: "File name mandatory" });
  }
  if (!req.body.email) {
    return res.status(422).json({ message: "Email name mandatory" });
  }
  const userId = tokenObj.userId;
  await (await getDb())
    .collection("files")
    .updateOne(
      { userId, fileName: req.body.fileName },
      { $push: { sharedWith: req.body.email } }
    );
  res.status(200).json({
    success: true,
  });
}

export async function sharedFilesService(req: Request, res: Response) {
  const token = req.headers.authorization;
  const tokenObj = await (await getDb())
    .collection("tokens")
    .findOne({ token });
  if (!tokenObj) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }
  const userId = tokenObj.userId;
  const emailData = await (await getDb())
    .collection("users")
    .findOne({ userId });
  const data = await (
    await getDb()
  )
    .collection("files")
    .find({ sharedWith: [emailData?.email] })
    .toArray();

  const updatedData = data.map((e) => {
    const { _id, ...eNew } = e;
    return {
      ...eNew,
      fileUrl: `https://cf.shawshankkumar.me/file%2F${e.userId}%2F${e.fileName}`,
    };
  });
  res.status(200).json({
    data: updatedData,
  });
}

export async function getChatAllService(req: Request, res: Response) {
  const token = req.headers.authorization;
  console.log("uauau")
  const tokenObj = await (await getDb())
    .collection("tokens")
    .findOne({ token });
  console.log(tokenObj)
  if (!tokenObj) {
    return res.status(401).json({ message: "Unauthorized: Token not found" });
  }
  const data = await (await getDb())
    .collection("files")
    .findOne({ fileName: req.body.fileName });
  if (!data) {
    res.status(404).json({ message: "File not found" });
  }
  console.log(data)
  res.status(200).json({
    data: data!.chat,
    fileData: data
  });
}

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // 1. Upload to S3
    const fileKey = `uploads/${Date.now()}-${req.file.originalname}`;
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // 5. Store everything in database
    const report = {
      documentId: "document_" + ulid(),
      token: req.headers.authorization,
      s3Url: uploadResult.Location,
      fileKey: fileKey,
      filename: req.file.originalname,
      uploadDate: new Date(),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    };

    await (await getDb()).collection("report").insertOne(report);

    res.json({
      documentId: report.documentId,
      s3Url: uploadResult.Location,
      message: "File uploaded and processed successfully"
    });

  } catch (error) {
    console.error("Error in file upload:", error);
    res.status(500).json({ 
      error: "File upload failed", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export const editFile = async (req: Request, res: Response) => {
  const documentId = req.params.documentId;
  try {
    await (await getDb())
      .collection("report")
      .updateOne(
        { documentId },
        { $set: { filename: req.body.fileName } }
      );
    res.status(200).json({
      success: true,
      message: "File updated successfully"
    });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update file"
    });
  }
}

export const deleteFile = async (req: Request, res: Response) => {
  const documentId = req.params.documentId;
  try {
    const result = await (await getDb())
      .collection("report")
      .deleteOne({ documentId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete file"
    });
  }
}

const s3Client = new S3Client({ region: "us-west-2" }); // Initialize S3 client

export async function ask(req: Request, res: Response) {
  const { documentId, question } = req.body;

  if (!documentId || !question) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    // 1. Get the document details from the database
    const report = await (await getDb())
      .collection("report")
      .findOne({ documentId });

    if (!report) {
      return res.status(404).json({ error: "Document not found" });
    }

    // 2. Fetch the document from S3
    const bucketName = process.env.S3_BUCKET_NAME!;
    const key = report.fileKey;

    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    // 3. Create a temporary file path
    const tmpDir = os.tmpdir(); // Get the system's default temporary directory
    const filePath = path.join(tmpDir, `${documentId}.pdf`); // Create a unique file path

    // Ensure the temporary directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true }); // Create the directory if it doesn't exist
    }

    // Convert the S3 stream to a file
    const fileStream = fs.createWriteStream(filePath);

    await new Promise((resolve, reject) => {
      (s3Response.Body as Readable).pipe(fileStream)
        .on("error", reject)
        .on("finish", resolve);
    });

    // 4. Upload the file to OpenAI
    const openAIFile = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });

    // 5. Create a vector store and add the file
    const vectorStore = await openai.beta.vectorStores.create({
      name: `Vector Store for ${documentId}`,
      file_ids: [openAIFile.id],
    });

    // Wait for the vector store to process the file
    let vectorStoreStatus;
    do {
      vectorStoreStatus = await openai.beta.vectorStores.retrieve(vectorStore.id);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    } while (vectorStoreStatus.status !== "completed");

    // 6. Create or use an existing assistant
    const assistant = await openai.beta.assistants.create({
      name: `Document Assistant - ${documentId}`,
      instructions: "You are a helpful assistant that answers questions about the uploaded document. Provide accurate and relevant information based on the document content.",
      model: "gpt-4-turbo-preview",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id],
        },
      },
    });

    // 7. Create a thread and add the user's question
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: question,
    });

    // 8. Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // 9. Wait for the run to complete
    let runStatus;
    do {
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    } while (runStatus.status === "in_progress" || runStatus.status === "queued");

    // 10. Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);

    // Find the latest assistant message
    const latestMessage = messages.data
      .filter((msg) => msg.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const answer = latestMessage.content[0].type === "text"
      ? latestMessage.content[0].text.value
      : "No text response available";

    // 11. Return the response
    res.json({
      documentId,
      question,
      answer,
    });

  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({
      error: "Error processing question",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}