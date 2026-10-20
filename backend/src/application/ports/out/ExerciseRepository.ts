import { Exercise } from "../../../domain/entities/Exercise";
import { CreateExerciseDTO, UpdateExerciseDTO } from "../../dtos/exercise.dto";

export interface ExerciseRepository {
  create(data: CreateExerciseDTO): Promise<Exercise>;
  findAll(limit: number, offset: number): Promise<{ rows: Exercise[]; count: number }>;
  findById(id: number): Promise<Exercise | null>;
  update(id: number, data: UpdateExerciseDTO): Promise<Exercise | null>;
}
