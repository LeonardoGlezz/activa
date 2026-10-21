import { getJwtSecret } from "../../infrastructure/config/env";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IAuthRepository } from "../ports/IAuthRepository";
import { LoginPhysiotherapistDto } from "../dtos/auth.dto";
import { PhysiotherapistModel } from "../../infrastructure/persistence/sequelize/client";

export class LoginPhysiotherapistUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: LoginPhysiotherapistDto): Promise<{ token: string; fisio: object }> {
    // Mismo mensaje si el correo no existe o la contraseña no coincide,
    // para no revelar qué correos tienen cuenta.
    const invalid = () => new Error("Correo o contraseña incorrectos.");

    const fisio = await this.authRepo.findByEmail(String(dto?.email ?? "").trim().toLowerCase());
    if (!fisio || fisio.role !== "physio" || !fisio.password) throw invalid();

    const passwordMatch = await bcrypt.compare(String(dto?.password ?? ""), fisio.password);
    if (!passwordMatch) throw invalid();

    return issuePhysioSession(fisio);
  }

  /** Token nuevo con el estado actual de la base (p. ej. justo después de que el admin lo aprueba) */
  async refresh(idUser: number): Promise<{ token: string; fisio: object }> {
    const user = await this.authRepo.findById(idUser);
    if (!user || user.role !== "physio") throw new Error("Tu sesión ya no es válida. Vuelve a entrar.");
    return issuePhysioSession(user);
  }
}

async function issuePhysioSession(fisio: { id_user: number; email: string; role: string }) {
  const datosFisio: any = await PhysiotherapistModel.findOne({ where: { id_user: fisio.id_user } });
  const estatusReal = datosFisio ? datosFisio.status : "pending_approval";
  const firstName = datosFisio ? datosFisio.first_name : "";
  const lastNameP = datosFisio ? datosFisio.last_name_paternal : "";
  const lastNameM = datosFisio ? datosFisio.last_name_maternal : "";
  const idPhysioReal = datosFisio ? Number(datosFisio.getDataValue("id_physio")) : undefined;

  const token = jwt.sign(
    {
      id: fisio.id_user,
      id_physio: idPhysioReal,
      email: fisio.email,
      role: fisio.role,
      status: estatusReal,
      first_name: firstName,
      last_name_paternal: lastNameP,
      last_name_maternal: lastNameM,
      professional_license: datosFisio ? datosFisio.professional_license : "",
    },
    getJwtSecret(),
    { expiresIn: "8h" }
  );

  return {
    token,
    fisio: {
      id: fisio.id_user,
      id_physio: idPhysioReal,
      email: fisio.email,
      role: fisio.role,
      status: estatusReal,
      first_name: firstName,
      last_name_paternal: lastNameP,
    },
  };
}
