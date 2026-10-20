import { ExerciseRepository } from "../../../application/ports/out/ExerciseRepository";
import { CreateExerciseDTO, UpdateExerciseDTO } from "../../../application/dtos/exercise.dto";
import { Exercise } from "../../../domain/entities/Exercise";
import { ExerciseModel } from "../sequelize/client";

/** Traduce el DTO (camelCase) a las columnas de la tabla (snake_case) */
function toColumns(data: UpdateExerciseDTO): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  if (data.name !== undefined) columns.name = data.name;
  if (data.bodyZone !== undefined) columns.body_zone = data.bodyZone;
  if (data.description !== undefined) columns.description = data.description;
  if (data.videoUrl !== undefined) columns.video_url = data.videoUrl || null;
  return columns;
}

export class SequelizeExerciseRepository implements ExerciseRepository {
  async create(data: CreateExerciseDTO): Promise<Exercise> {
    const created = await ExerciseModel.create(toColumns(data) as any);
    return created.toJSON() as Exercise;
  }

  async findAll(limit: number, offset: number): Promise<{ rows: Exercise[]; count: number }> {
    const result = await ExerciseModel.findAndCountAll({ limit, offset });
    return { rows: result.rows.map(r => r.toJSON() as Exercise), count: result.count };
  }

  // NUEVO: Implementación de la búsqueda por ID
  async findById(id: number): Promise<Exercise | null> {
    const exercise = await ExerciseModel.findByPk(id);
    return exercise ? (exercise.toJSON() as Exercise) : null;
  }

  async update(id: number, data: UpdateExerciseDTO): Promise<Exercise | null> {
    const exercise = await ExerciseModel.findByPk(id);
    if (!exercise) return null;
    await exercise.update(toColumns(data));
    return exercise.toJSON() as Exercise;
  }
}
