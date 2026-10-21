export interface IAuthRepository {
  findByEmail(email: string): Promise<any | null>;
  register(data: {
    firstName: string;
    lastNameP: string;
    lastNameM: string;
    email: string;
    password: string;
    professionalLicense: string;
    phone: string;
  }): Promise<any>;
  findById(idUser: number): Promise<any | null>;
  updateEmail(idUser: number, newEmail: string): Promise<void>;
  updatePassword(idUser: number, newPasswordHash: string): Promise<void>;
}
