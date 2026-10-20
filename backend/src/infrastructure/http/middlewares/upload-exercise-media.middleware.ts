import multer from "multer";
import path from "path";
import fs from "fs";

/** Carpeta pública (servida en /uploads) para los videos, GIFs e imágenes de demostración */
export const EXERCISE_MEDIA_DIR = "uploads/exercise-media";
if (!fs.existsSync(EXERCISE_MEDIA_DIR)) {
  fs.mkdirSync(EXERCISE_MEDIA_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const EXERCISE_MEDIA_MAX_MB = 50;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, EXERCISE_MEDIA_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // La extensión sale del tipo validado, no del nombre que manda el navegador
    cb(null, "exercise-" + uniqueSuffix + ALLOWED_MIME_TYPES[file.mimetype]);
  }
});

const uploader = multer({
  storage,
  limits: { fileSize: EXERCISE_MEDIA_MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error("Formato inválido. Usa MP4, WEBM, MOV, GIF, JPG, PNG o WEBP."));
    }
  }
}).single("file");

/** Sube un archivo en el campo "file" y responde 400 con un mensaje claro si falla */
export const uploadExerciseMedia = (req: any, res: any, next: any) => {
  uploader(req, res, (err: any) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE"
      ? `El archivo supera ${EXERCISE_MEDIA_MAX_MB} MB. Recorta el video o bájale la calidad.`
      : err.message;
    res.status(400).json({ success: false, message });
  });
};
