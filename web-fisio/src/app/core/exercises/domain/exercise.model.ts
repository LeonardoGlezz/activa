export interface Exercise {
  id?: number | string;
  name: string;
  bodyZone?: string;
  description?: string;
  videoUrl?: string;
  /** 'base' = banco de Activa (no se edita); 'mine' = Mis ejercicios */
  scope?: 'base' | 'mine';
  editable?: boolean;
}

export interface CreateExerciseDTO extends Omit<Exercise, 'id'> {
  /** El fisio confirma que la foto o el video es suyo o tiene permiso */
  rightsConfirmed?: boolean;
}

/** Zonas del cuerpo del banco (las mismas que usa el servidor) */
export const BODY_ZONES = [
  'Cuello',
  'Hombro',
  'Codo, muñeca y mano',
  'Espalda alta',
  'Lumbar y core',
  'Cadera',
  'Rodilla',
  'Tobillo y pie',
  'Equilibrio',
];
