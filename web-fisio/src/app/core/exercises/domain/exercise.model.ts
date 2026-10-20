export interface Exercise {
  id?: number | string;
  name: string;
  bodyZone?: string;
  description?: string;
  videoUrl?: string;
  // add other fields matching the backend schema if needed
}
 
export interface CreateExerciseDTO extends Omit<Exercise, 'id'> {}