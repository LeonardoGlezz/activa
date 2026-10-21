export interface RegisterPhysiotherapistDto {
  firstName: string;
  lastNameP: string;
  lastNameM: string;
  email: string;
  password: string;
  professionalLicense: string;
  phone: string;
}

export interface LoginPhysiotherapistDto {
  email: string;
  password: string;
}
