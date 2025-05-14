import express from "express";
import cors from "cors";
import helmet from "helmet";
import { logger } from "./src/lib/logger";
import { healthcheckService } from "./src/api/healthcheck";
import { loginService, signupService } from "./src/api/auth";
import { ulid } from "ulid";
import { Request, Response, NextFunction } from "express";
import { upload } from "./src/lib/storage";
import { ask, deleteFile, editFile, uploadFile } from "./src/api/files";
import { getDb } from "./src/lib/db";
import { askWithRAG } from "./src/api/rag";

const port = process.env.PORT ?? 3001;
const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());
app.use(helmet());

//set req id
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.requestId = "req_" + ulid();
  next();
});

app.post("/upload", upload.single('file'), uploadFile);

app.post("/ask", ask)
// app.post("/ask", askWithRAG)

app.get("/files", async (req, res) => {
  const report = await (await getDb())
        .collection("report")
        .find({token: req.headers.authorization})
        .toArray();

  return res.status(200).json({report});
});

app.put("/files/:documentId", editFile);

app.delete("/files/:documentId", deleteFile);

// app.post("/files", filesService);

// app.post("/summary", summaryService);

app.post("/register", signupService);

app.post("/login", loginService);

// app.post("/share", shareService);

// app.post("/chat", getChatService);

// app.get("/files-shared", sharedFilesService);

// app.post("/chat-all", getChatAllService)

app.get("/", healthcheckService);

app.listen(port, () => {
  logger.info(`MED BUDDY app listening on port ${port}`);
});
