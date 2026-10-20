import { getJwtSecret } from "../../infrastructure/config/env";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PatientRepository } from "../ports/out/PatientRepository";

export class LoginPatientByEmailUseCase {
  constructor(private readonly patientRepo: PatientRepository) {}

  async execute(email: string, password: string): Promise<{ token: string; patient: object }> {

    const raw = await this.patientRepo.findByEmail(email);
    // Pacientes creados antes de este cambio tienen una contraseña falsa sin hash:
    // bcrypt.compare devuelve false y el fisio debe asignarles una nueva.
    const valid = raw?.password_hash ? await bcrypt.compare(password, raw.password_hash) : false;
    if (!raw || !valid) {
      throw new Error("Correo o contraseña incorrectos.");
    }

    // Mapeo robusto: acepta tanto snake_case (BD) como camelCase (por si acaso)
    const patient = {
      id:               raw.id_patient   ?? raw.id,
      firstName:        raw.first_name   ?? raw.firstName,
      lastNameP:        raw.last_name_paternal ?? raw.lastNameP,
      lastNameM:        raw.last_name_maternal ?? raw.lastNameM,
      email:            raw.email,
      physiotherapistId: raw.id_physio   ?? raw.physiotherapistId ?? null,
    };

    // IMPORTANTE: role debe ser "patient" (inglés) para que requireApproval
    // lo reconozca y deje pasar al paciente sin exigir status de fisioterapeuta.
    const token = jwt.sign(
      { id: patient.id, email: patient.email, role: "patient" },
      getJwtSecret(),
      { expiresIn: "8h" }
    );

    return { token, patient };
  }
}
