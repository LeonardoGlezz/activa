import bcrypt from "bcrypt";
import { z } from "zod";
import { IAuthRepository } from "../ports/IAuthRepository";
import { PhysiotherapistModel } from "../../infrastructure/persistence/sequelize/client";

/**
 * Registro del fisio sin documentos: nombre, correo, contraseña, celular y
 * número de cédula. El admin revisa la cédula en el Registro Nacional de
 * Profesionistas (SEP) y aprueba la cuenta.
 */
export const RegisterPhysioSchema = z.object({
  firstName: z.string().trim().min(2, "Escribe tu nombre"),
  lastNameP: z.string().trim().min(2, "Escribe tu apellido"),
  lastNameM: z.string().trim().optional().default(""),
  email: z.string().trim().toLowerCase().email("El correo no es válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  professionalLicense: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, "La cédula profesional debe tener 7 u 8 números"),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^\d{10}$/.test(v), "El celular debe tener 10 números"),
});

export class RegisterPhysiotherapistUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(input: unknown): Promise<{ message: string }> {
    const parsed = RegisterPhysioSchema.safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revisa los datos.");
    const dto = parsed.data;

    if (await this.authRepo.findByEmail(dto.email)) {
      throw new Error("Ese correo ya tiene una cuenta. Inicia sesión.");
    }
    if (await PhysiotherapistModel.findOne({ where: { professional_license: dto.professionalLicense } })) {
      throw new Error("Esa cédula profesional ya está registrada en otra cuenta. Si es tuya, escríbenos.");
    }

    await this.authRepo.register({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
    });

    return { message: "Cuenta creada. Revisaremos tu cédula y te avisaremos cuando esté lista." };
  }
}
