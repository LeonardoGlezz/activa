/**
 * **************************************************************************
 * MÓDULO: object-storage
 * DESCRIPCIÓN: Guarda los archivos subidos (documentos, PDFs, imágenes y
 *              videos de ejercicios) fuera del disco del servidor.
 *
 * En hostings gratuitos el disco se borra en cada reinicio. Según las
 * variables de entorno, cada archivo que multer escribe en uploads/ se copia:
 *   - S3_* configuradas      → a un bucket compatible con S3 (Cloudflare R2...)
 *   - UPLOADS_IN_DB=true     → a la tabla stored_file de la propia base MySQL
 * con la misma ruta (uploads/...) y se borra del disco; GET /uploads/... lo
 * lee de ahí. Las rutas guardadas en la base no cambian. Sin ninguna de las
 * dos, todo sigue en el disco local como antes.
 * **************************************************************************
 */

import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { NextFunction, Request, Response } from "express";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { StoredFileModel } from "../persistence/sequelize/client";

let client: S3Client | null | undefined;

function getClient(): S3Client | null {
  if (client !== undefined) return client;
  const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  client =
    S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY
      ? new S3Client({
          region: process.env.S3_REGION || "auto",
          endpoint: S3_ENDPOINT,
          forcePathStyle: true,
          credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
        })
      : null;
  return client;
}

function useDatabase(): boolean {
  return !getClient() && process.env.UPLOADS_IN_DB === "true";
}

/** Tope por archivo cuando se guardan en la base (TiDB no acepta filas de más de 6 MB) */
export const DB_UPLOAD_MAX_MB = 5;

/** Ruta del archivo relativa a la carpeta del backend, con "/" (ej. uploads/documents/x.pdf) */
function keyFor(filePath: string): string {
  return path.relative(process.cwd(), path.resolve(filePath)).split(path.sep).join("/");
}

function uploadedFiles(req: any): Express.Multer.File[] {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files) return Object.values(req.files).flat() as Express.Multer.File[];
  return [];
}

async function removeLocal(files: Express.Multer.File[]) {
  await Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})));
}

/** Va después de un middleware de multer: guarda en el bucket o en la base lo que multer dejó en disco. */
export const persistUploads = async (req: Request, res: Response, next: NextFunction) => {
  const s3 = getClient();
  const inDb = useDatabase();
  if (!s3 && !inDb) return next();
  const files = uploadedFiles(req);
  try {
    if (inDb && files.some((f) => f.size > DB_UPLOAD_MAX_MB * 1024 * 1024)) {
      await removeLocal(files);
      res.status(400).json({
        success: false,
        message: `El archivo supera ${DB_UPLOAD_MAX_MB} MB. Para videos usa un enlace de YouTube (no listado).`,
      });
      return;
    }
    for (const file of files) {
      if (s3) {
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: keyFor(file.path),
            Body: fs.createReadStream(file.path),
            ContentLength: file.size,
            ContentType: file.mimetype,
          })
        );
      } else {
        await StoredFileModel.upsert({
          file_path: keyFor(file.path),
          mime_type: file.mimetype,
          size: file.size,
          content: await fs.promises.readFile(file.path),
        });
      }
    }
    await removeLocal(files);
    next();
  } catch (error) {
    console.error("Error al guardar archivo subido:", error);
    await removeLocal(files);
    res.status(500).json({ success: false, message: "No se pudo guardar el archivo." });
  }
};

/** "bytes=a-b" → [inicio, fin] dentro de un archivo de `size` bytes, o null si no aplica */
function parseRange(header: string | undefined, size: number): [number, number] | null | "invalid" {
  const m = header && /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return null;
  let start = m[1] ? Number(m[1]) : Math.max(size - Number(m[2]), 0);
  let end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start > end || start >= size) return "invalid";
  return [start, end];
}

async function serveFromDatabase(req: Request, res: Response, next: NextFunction, key: string) {
  const row: any = await StoredFileModel.findByPk(key);
  if (!row) return next();
  const content: Buffer = row.getDataValue("content");
  const range = parseRange(req.headers.range, content.length);
  if (range === "invalid") {
    res.setHeader("Content-Range", `bytes */${content.length}`);
    return res.status(416).end();
  }
  const [start, end] = range ?? [0, content.length - 1];
  res.status(range ? 206 : 200);
  res.setHeader("Content-Type", row.getDataValue("mime_type"));
  res.setHeader("Content-Length", String(end - start + 1));
  if (range) res.setHeader("Content-Range", `bytes ${start}-${end}/${content.length}`);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  if (req.method === "HEAD") return res.end();
  res.end(content.subarray(start, end + 1));
}

/** GET /uploads/... desde el bucket o la base. Respeta Range para que los videos se puedan adelantar. */
export const serveUploadsFromStorage = async (req: Request, res: Response, next: NextFunction) => {
  const s3 = getClient();
  if ((!s3 && !useDatabase()) || (req.method !== "GET" && req.method !== "HEAD")) return next();
  const key = "uploads" + decodeURIComponent(req.path);
  if (key.includes("..")) return next();
  try {
    if (!s3) return await serveFromDatabase(req, res, next, key);
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Range: typeof req.headers.range === "string" ? req.headers.range : undefined,
      })
    );
    res.status(obj.ContentRange ? 206 : 200);
    if (obj.ContentType) res.setHeader("Content-Type", obj.ContentType);
    if (obj.ContentLength !== undefined) res.setHeader("Content-Length", String(obj.ContentLength));
    if (obj.ContentRange) res.setHeader("Content-Range", obj.ContentRange);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (req.method === "HEAD") {
      (obj.Body as Readable | undefined)?.destroy();
      return res.end();
    }
    (obj.Body as Readable).pipe(res);
  } catch (error: any) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 404 || error?.name === "NoSuchKey") return next();
    if (status === 416) return res.status(416).end();
    console.error("Error al leer archivo subido:", error);
    res.status(502).end();
  }
};
