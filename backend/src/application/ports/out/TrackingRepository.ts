export interface TrackingRepository {
  /** Fila lista para Sequelize `TrackingModel` */
  create(data: Record<string, unknown>): Promise<any>;
  /** Sesiones registradas por el paciente, de la más reciente a la más antigua */
  findByPatient(id_patient: number): Promise<any[]>;
}