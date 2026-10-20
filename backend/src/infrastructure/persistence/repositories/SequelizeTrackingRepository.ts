import { TrackingModel, RoutineModel } from "../sequelize/client";
import { TrackingRepository } from "../../../application/ports/out/TrackingRepository";

export class SequelizeTrackingRepository implements TrackingRepository {

  async create(data: any): Promise<any> {
    const record = await TrackingModel.create(data);
    return record.toJSON();
  }

  async findByPatient(id_patient: number): Promise<any[]> {
    const records = await TrackingModel.findAll({
      where: { id_patient },
      include: [{ model: RoutineModel, attributes: ["id_routine", "name"] }],
      order: [["date", "DESC"], ["id_tracking", "DESC"]],
      limit: 200,
    });
    return records.map(r => r.toJSON());
  }
}
