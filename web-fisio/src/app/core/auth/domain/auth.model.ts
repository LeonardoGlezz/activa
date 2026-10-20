export interface RegisterPhysioDTO {
  firstName: string;
  lastNameP: string;
  lastNameM: string;
  birthDate: string; // El backend lo espera como string 'YYYY-MM-DD'
  email: string;
  password: string;
  professionalLicense: string;
  curp: string;
}