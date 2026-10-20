export interface Physiotherapist {
  id?: number;
  firstName: string;
  lastNameP: string;
  lastNameM: string;
  birthYear: number;
  professionalLicense: string;
  curp: string;
}

export interface CreatePhysiotherapistDTO extends Omit<Physiotherapist, 'id'> {}