export interface Routine {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  physiotherapistId: number;
  patientId: number;
}