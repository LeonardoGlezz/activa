export interface User {
  id: number;
  fullName: string;
  email: string;
  nextAppointment?: string;
  progress: number;
  specialist?: string;
  therapyType?: string;
}
