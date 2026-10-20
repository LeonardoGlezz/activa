import { RoutineExercise } from '../infrastructure/api/routine-api.service';
import { environment } from '../../../environments/environment';

/** Videos de YouTube para ejercicios (fisioterapia) */
const EXERCISE_VIDEOS: Record<string, string> = {
  'elevación pierna recta': 'lce6GqtfHzM', // Pain Therapy - Straight Leg Raise
  'estiramiento hombros': '4W-xie4ZOfs',   // Fisiolution - Estiramientos hombro
  'estiramiento hombro': '4W-xie4ZOfs',
};

function matchesExercise(name: string, key: string): boolean {
  const n = name.toLowerCase();
  return key.split(' ').every((word) => n.includes(word));
}

/** Obtiene la URL del video del ejercicio (prioriza API, luego demos de YouTube) */
export function getExerciseVideoUrl(ex: RoutineExercise): string | null {
  const apiUrl = ex?.videoUrl?.trim();
  // Archivo subido por el fisio: el backend guarda la ruta relativa
  if (apiUrl && apiUrl.startsWith('/')) {
    return `${environment.backendUrl}${apiUrl}`;
  }
  if (apiUrl && (apiUrl.startsWith('http') || apiUrl.startsWith('https'))) {
    if (!apiUrl.includes('cloudinary.com/video1') && !apiUrl.includes('cloudinary.com/demo')) {
      return apiUrl;
    }
  }

  const name = (ex?.name || '').toLowerCase();
  for (const [key, videoId] of Object.entries(EXERCISE_VIDEOS)) {
    if (matchesExercise(name, key)) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }
  return null;
}

/** URL para embed de YouTube o Vimeo (iframe) */
export function getExerciseYouTubeEmbedUrl(ex: RoutineExercise): string | null {
  const url = getExerciseVideoUrl(ex);
  if (!url) return null;

  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }
  return null;
}

/** Video directo (MP4/WEBM/MOV) que se reproduce dentro de la app */
export function getExerciseDirectVideoUrl(ex: RoutineExercise): string | null {
  const url = getExerciseVideoUrl(ex);
  return url && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) ? url : null;
}

/** GIF o foto de demostración */
export function getExerciseImageUrl(ex: RoutineExercise): string | null {
  const url = getExerciseVideoUrl(ex);
  return url && /\.(gif|jpe?g|png|webp)(\?.*)?$/i.test(url) ? url : null;
}
