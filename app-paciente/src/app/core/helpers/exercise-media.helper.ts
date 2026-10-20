import { RoutineExercise } from '../infrastructure/api/routine-api.service';

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

/** URL para embed de YouTube (iframe) */
export function getExerciseYouTubeEmbedUrl(ex: RoutineExercise): string | null {
  const url = getExerciseVideoUrl(ex);
  if (!url) return null;

  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}
