export interface Patient {
  idPaciente?: number;
  first_name: string;
  last_name_p: string;
  last_name_m?: string;
  birth_year?: number;
  sex?: string;
  height?: number;
  weight?: number;
  email?: string;
  physiotherapist_id: number; // Requisito de la BD
}