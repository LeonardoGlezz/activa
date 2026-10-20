export type CreateExerciseDTO = {
  name: string;
  bodyZone: string;
  description: string;
  videoUrl?: string | null;
};

export type UpdateExerciseDTO = Partial<CreateExerciseDTO>;
