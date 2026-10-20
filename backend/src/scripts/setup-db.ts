/**
 * **************************************************************************
 * SCRIPT: setup-db
 * DESCRIPCIÓN: Prepara una base de datos LOCAL para desarrollo.
 *   1. Crea las tablas que faltan a partir de los modelos de Sequelize.
 *   2. Agrega las columnas del plan/suscripción que usa el código pero que
 *      no están en los modelos.
 *   3. Inserta datos de prueba (admin, fisio aprobado, paciente, ejercicios
 *      y una rutina) si todavía no existen.
 *
 * USO: npm run db:setup   (desde la raíz o desde backend/)
 * Se puede correr varias veces: no duplica datos ni borra nada.
 * **************************************************************************
 */

import {
  sequelize,
  PhysiotherapistModel,
  PatientModel,
  ExerciseModel,
  RoutineModel,
  RoutineExerciseModel,
} from "../infrastructure/persistence/sequelize/client";
import { ensureSchema, ensureAdmin, findOrCreateUser } from "../infrastructure/persistence/schema";

const DEMO = {
  admin: { email: "admin@activa.local", password: "admin123" },
  physio: { email: "fisio@activa.local", password: "fisio123" },
  patient: { email: "paciente@activa.local", password: "paciente123" },
};

async function seed() {
  // --- Admin ---
  await ensureAdmin(DEMO.admin.email, DEMO.admin.password);

  // --- Fisioterapeuta aprobado y con plan activo ---
  const physioUser = await findOrCreateUser(DEMO.physio.email, "physio", DEMO.physio.password);
  const [physio]: any = await PhysiotherapistModel.findOrCreate({
    where: { id_user: physioUser.id_user },
    defaults: {
      first_name: "Fisio",
      last_name_paternal: "Demo",
      professional_license: "00000000",
      status: "approved",
      id_user: physioUser.id_user,
    },
  });
  const idPhysio = physio.getDataValue("id_physio");
  // Estas columnas no están en el modelo, por eso va en SQL directo
  await sequelize.query(
    "UPDATE physiotherapist SET plan_activo = 'activo', plan_status = 'active' WHERE id_physio = :idPhysio",
    { replacements: { idPhysio } }
  );

  // --- Paciente del fisio ---
  const patientUser = await findOrCreateUser(DEMO.patient.email, "patient", DEMO.patient.password);
  const [patient]: any = await PatientModel.findOrCreate({
    where: { id_user: patientUser.id_user },
    defaults: {
      first_name: "Paciente",
      last_name_paternal: "Demo",
      gender: "Other",
      id_user: patientUser.id_user,
      id_physio: idPhysio,
    },
  });
  const idPatient = patient.getDataValue("id_patient");

  // --- Banco de ejercicios ---
  if ((await ExerciseModel.count()) === 0) {
    await ExerciseModel.bulkCreate([
      { name: "Sentadilla a silla", body_zone: "Rodilla", description: "Siéntate y levántate de una silla sin usar las manos." },
      { name: "Puente de glúteo", body_zone: "Cadera", description: "Boca arriba, eleva la cadera apretando glúteos." },
      { name: "Elevación de pierna recta", body_zone: "Rodilla", description: "Boca arriba, eleva la pierna estirada a 45°." },
      { name: "Estiramiento de hombro cruzado", body_zone: "Hombro", description: "Cruza el brazo frente al pecho y sostén 30 s." },
      { name: "Gato-camello", body_zone: "Columna", description: "En cuatro apoyos, alterna arquear y redondear la espalda." },
    ]);
  }

  // --- Rutina de ejemplo para el paciente ---
  const hasRoutine = await RoutineModel.count({ where: { id_patient: idPatient } });
  if (!hasRoutine) {
    const today = new Date();
    const inAMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const routine: any = await RoutineModel.create({
      name: "Rutina de rodilla (demo)",
      start_date: today.toISOString().slice(0, 10),
      end_date: inAMonth.toISOString().slice(0, 10),
      id_patient: idPatient,
      id_physio: idPhysio,
    });
    const exercises: any[] = await ExerciseModel.findAll({ limit: 3, order: [["id_exercise", "ASC"]] });
    await RoutineExerciseModel.bulkCreate(
      exercises.map((e, i) => ({
        id_routine: routine.getDataValue("id_routine"),
        id_exercise: e.getDataValue("id_exercise"),
        sets: 3,
        repetitions: 12,
        exercise_order: i + 1,
      }))
    );
  }
}

async function main() {
  await sequelize.authenticate();
  console.log("✅ Conectado a MySQL");

  await ensureSchema();
  console.log("✅ Tablas listas");

  await seed();

  console.log("\n✅ Base de datos local lista. Usuarios de prueba:");
  console.log(`   Admin:     ${DEMO.admin.email} / ${DEMO.admin.password}`);
  console.log(`   Fisio:     ${DEMO.physio.email} / ${DEMO.physio.password}`);
  console.log(`   Paciente:  ${DEMO.patient.email} / ${DEMO.patient.password}`);
  await sequelize.close();
}

main().catch(async (err) => {
  console.error("❌ No se pudo preparar la base de datos:", err.message || err);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
