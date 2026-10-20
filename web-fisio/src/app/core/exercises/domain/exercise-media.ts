import { environment } from '../../../../environments/environment';

/** Cómo se debe mostrar el material de demostración de un ejercicio */
export type ExerciseMediaKind = 'youtube' | 'vimeo' | 'video' | 'image' | 'link' | 'none';

/**
 * Los archivos subidos se guardan como ruta relativa (/uploads/exercise-media/...)
 * para no amarrarlos a un dominio; aquí se completan con la URL del backend.
 */
export function resolveMediaUrl(url?: string | null): string {
  const value = (url || '').trim();
  if (!value) return '';
  if (value.startsWith('/')) return `${environment.webservice.baseUrl}${value}`;
  return value;
}

export function getMediaKind(url?: string | null): ExerciseMediaKind {
  const value = (url || '').trim().toLowerCase();
  if (!value) return 'none';
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube';
  if (value.includes('vimeo.com')) return 'vimeo';
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/.test(value)) return 'video';
  if (/\.(gif|jpe?g|png|webp)(\?.*)?$/.test(value)) return 'image';
  return 'link';
}

function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  return match?.[1] ?? null;
}

/** URL para iframe (YouTube/Vimeo); null si el enlace no se puede incrustar */
export function getEmbedUrl(url?: string | null): string | null {
  const value = (url || '').trim();
  const yt = youtubeId(value);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** Miniatura para tarjetas: imagen/GIF directo o portada de YouTube */
export function getMediaThumbnail(url?: string | null): string | null {
  const resolved = resolveMediaUrl(url);
  const kind = getMediaKind(resolved);
  if (kind === 'image') return resolved;
  if (kind === 'youtube') {
    const yt = youtubeId(resolved);
    return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
  }
  return null;
}
