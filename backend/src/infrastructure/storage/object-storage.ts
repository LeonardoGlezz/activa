/**
 * **************************************************************************
 * MÓDULO: object-storage
 * DESCRIPCIÓN: Guarda los archivos subidos (documentos, PDFs, videos de
 *              ejercicios) en un bucket compatible con S3, como Cloudflare R2.
 *
 * En hostings gratuitos el disco se borra en cada reinicio. Si están
 * configuradas las variables S3_*, cada archivo que multer escribe en
 * uploads/ se copia al bucket con la misma ruta (uploads/...) y se borra del
 * disco; GET /uploads/... lo lee del bucket. Las rutas guardadas en la base no
 * cambian. Sin S3_* todo sigue en el disco local como antes.
 * **************************************************************************
 */

import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { NextFunction, Request, Response } from "express";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

export function isObjectStorageEnabled(): boolean {
  return getClient() !== null;
}

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

/** Va después de un middleware de multer: sube al bucket lo que multer dejó en disco. */
export const persistUploads = async (req: Request, res: Response, next: NextFunction) => {
  const s3 = getClient();
  if (!s3) return next();
  try {
    for (const file of uploadedFiles(req)) {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: keyFor(file.path),
          Body: fs.createReadStream(file.path),
          ContentLength: file.size,
          ContentType: file.mimetype,
        })
      );
      await fs.promises.unlink(file.path).catch(() => {});
    }
    next();
  } catch (error) {
    console.error("Error al guardar archivo en el bucket:", error);
    res.status(500).json({ success: false, message: "No se pudo guardar el archivo." });
  }
};

/** GET /uploads/... desde el bucket. Respeta Range para que los videos se puedan adelantar. */
export const serveUploadsFromStorage = async (req: Request, res: Response, next: NextFunction) => {
  const s3 = getClient();
  if (!s3 || (req.method !== "GET" && req.method !== "HEAD")) return next();
  const key = "uploads" + decodeURIComponent(req.path);
  if (key.includes("..")) return next();
  try {
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
    console.error("Error al leer archivo del bucket:", error);
    res.status(502).end();
  }
};
