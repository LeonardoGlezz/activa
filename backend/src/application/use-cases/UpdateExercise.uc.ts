import { ExerciseRepository } from "../ports/out/ExerciseRepository";
import { UpdateExerciseDTO } from "../dtos/exercise.dto";
import { Exercise } from "../../domain/entities/Exercise";

export class UpdateExerciseUseCase {
  constructor(private readonly exerciseRepository: ExerciseRepository) {}

  async execute(id: number, data: UpdateExerciseDTO): Promise<Exercise | null> {
    return await this.exerciseRepository.update(id, data);
  }
}
