import multer from "multer";
import AWS from "aws-sdk";
import { ulid } from "ulid";
import path from "path";
import { CONFIG } from "./config";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: Function) => {
    cb(null, "uploads/");
  },
  filename: (req: Request, file: any, cb: Function) => {
    cb(null, "file_" + ulid() + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});
