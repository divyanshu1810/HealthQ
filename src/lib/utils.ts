import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "./config";
import path from "path";
import OpenAI from "openai";
import { S3 } from "aws-sdk";

export function deleteFile(filename: string) {
  const filePath = path.join(__dirname, "..", "..", "uploads", filename);

  console.log(filePath);
  if (fs.existsSync(filePath)) {
    // Delete the file
    fs.unlinkSync(filePath);
    console.log(`${filename} has been deleted successfully.`);
  } else {
    console.log(`File ${filename} does not exist.`);
  }
}

export const genAI = new GoogleGenerativeAI(CONFIG.GEN_AI_GOOGLE_API_KEY);

// Initialize OpenAI and S3 clients
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "us-west-2",
});
