export interface Patient {
  id: number;
  firstName: string;
  lastNameP: string;
  lastNameM: string;
  birthYear: number;
  sex: string;
  height: number;
  weight: number;
  createdAt: Date;
  physiotherapistId: number;
  email: string;
}