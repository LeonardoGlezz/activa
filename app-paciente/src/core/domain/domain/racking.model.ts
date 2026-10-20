export interface Tracking {
  id?: number; // El '?' es vital para que sea opcional al enviar
  startTime: string;
  endTime: string;
  painLevel: number;
  postObservations: string;
  intraObservations: string;
  alert: number;
  routineId: number;
}