import { Router } from "express";
import express from "express";
import { authMiddleware } from "./middlewares/auth.middleware";
import { requireApproval } from "./middlewares/approved.middleware";
import { requireActivePlan } from "./middlewares/active-plan.middleware";
import { requireAdmin } from "./middlewares/admin.middleware";
import { uploadExerciseMedia } from "./middlewares/upload-exercise-media.middleware";
import { persistUploads } from "../storage/object-storage";
import { requirePatientAccess, requireRoutineAccess, requirePhysio, requirePatient, requireAppointmentAccess, requireNotificationAccess, requireOwnPhysioOrAdmin } from "./middlewares/patient-access.middleware";

export function buildRoutes(controllers: {
  patientController:       any;
  physioController:        any;
  exerciseController:      any;
  trackingController:      any;
  routineController:       any;
  authController:          any;
  appointmentController:   any;
  notificationController:  any;
  dashboardController:     any;
  subscriptionController:  any;
  adminController:         any;
  legalController:         any;
  patientNoteController:   any;
  physioContactController: any;
}) {
  const router = Router();

  // ============================================================
  // RUTAS PÚBLICAS (sin token)
  // ============================================================
  router.post("/auth/register",      controllers.authController.register);
  router.post("/auth/login",         controllers.authController.login);
  router.post("/auth/login-patient", controllers.authController.loginPatient);
  router.post("/auth/login-admin",   controllers.authController.loginAdmin);

  // Planes públicos (sin autenticación — usado por frontend para mostrar precios)
  router.get("/publico/planes", controllers.subscriptionController.getPublicPlans);

  // ============================================================
  // RUTAS PROTEGIDAS — Solo JWT
  // ============================================================

  // Fisioterapeutas — solo administradores
  router.get("/physiotherapists/pending",       authMiddleware, requireAdmin, controllers.physioController.listPending);
  router.patch("/physiotherapists/:id/approve", authMiddleware, requireAdmin, controllers.physioController.approve);
  router.get("/admin/overview",                 authMiddleware, requireAdmin, controllers.adminController.getOverview);
  router.get("/admin/activity",                 authMiddleware, requireAdmin, controllers.adminController.activity);
  router.get("/admin/physiotherapists",         authMiddleware, requireAdmin, controllers.adminController.listPhysios);
  router.post("/admin/physiotherapists",        authMiddleware, requireAdmin, controllers.adminController.createPhysio);
  router.put("/admin/physiotherapists/:id",     authMiddleware, requireAdmin, controllers.adminController.updatePhysio);
  router.put("/admin/physiotherapists/:id/password", authMiddleware, requireAdmin, controllers.adminController.setPhysioPassword);
  router.get("/admin/patients",                 authMiddleware, requireAdmin, controllers.adminController.listPatients);
  router.get("/admin/patients/:id",             authMiddleware, requireAdmin, controllers.adminController.getPatient);
  router.put("/admin/patients/:id/password",    authMiddleware, requireAdmin, controllers.adminController.setPatientPassword);

  router.post("/physiotherapists",    authMiddleware, requireAdmin, controllers.physioController.create);
  // Contacto del fisio: él decide si sus pacientes ven su WhatsApp
  router.get("/physiotherapists/me/contact",   authMiddleware, requirePhysio, controllers.physioContactController.getMine);
  router.put("/physiotherapists/me/contact",   authMiddleware, requirePhysio, controllers.physioContactController.updateMine);
  router.get("/patient/my-physio",             authMiddleware, requirePatient, controllers.physioContactController.getForPatient);
  router.get("/physiotherapists/:id", authMiddleware, requireOwnPhysioOrAdmin, controllers.physioController.getById);
  router.post("/auth/refresh",          authMiddleware, requirePhysio, controllers.authController.refresh);
  router.patch("/auth/update-email",    authMiddleware, controllers.authController.updateEmail);
  router.patch("/auth/update-password", authMiddleware, controllers.authController.updatePassword);

  // Aviso de privacidad y términos: estado y aceptación de la cuenta actual
  router.get("/legal/consent",  authMiddleware, controllers.legalController.getStatus);
  router.post("/legal/consent", authMiddleware, controllers.legalController.accept);

  // ============================================================
  // 💳 SUSCRIPCIONES (Stripe)
  // El webhook va ANTES del express.json() global, necesita body RAW
  // ============================================================
  router.post(
    "/suscripciones/webhook",
    express.raw({ type: 'application/json' }),
    controllers.subscriptionController.webhook
  );

  // Checkout: requiere JWT pero NO requireActivePlan
  router.post("/suscripciones/checkout",           authMiddleware, controllers.subscriptionController.checkout);

  // Planes privados (con JWT)
  router.get("/suscripciones/planes",              authMiddleware, controllers.subscriptionController.getPlans);

  // Mi plan actual
  router.get("/suscripciones/mi-plan",             authMiddleware, controllers.subscriptionController.getMiPlan);

  // Confirmar checkout después de regresar de Stripe
  router.get("/suscripciones/confirmar-checkout",  authMiddleware, controllers.subscriptionController.confirmarCheckout);

  // Cambiar plan (upgrade/downgrade)
  router.post("/suscripciones/cambiar-plan",       authMiddleware, controllers.subscriptionController.cambiarPlan);

  // Cancelar cambio pendiente
  router.delete("/suscripciones/cambio-pendiente", authMiddleware, controllers.subscriptionController.cancelarCambioPendiente);

  // Portal de billing de Stripe
  router.post("/suscripciones/portal",             authMiddleware, controllers.subscriptionController.abrirPortal);

  // ============================================================
  // RUTAS OPERATIVAS
  // Cadena: authMiddleware → requireApproval → requireActivePlan → controller
  // ============================================================

  // Dashboard
  router.get("/dashboard/stats",
    authMiddleware, requireApproval, requireActivePlan,
    controllers.dashboardController.getStats
  );

  // Pacientes
  router.post("/patients",    authMiddleware, requireApproval, requireActivePlan, requirePhysio, controllers.patientController.create);
  router.get("/patients",     authMiddleware, requireApproval, requireActivePlan, controllers.patientController.list);
  router.put("/patients/:id", authMiddleware, requireApproval, requireActivePlan, requirePhysio, requirePatientAccess((req) => req.params.id), controllers.patientController.update);
  router.get("/patients/:id", authMiddleware, requireApproval, requireActivePlan, controllers.patientController.getById);

  // Ejercicios
  router.post("/exercises",     authMiddleware, requireApproval, requireActivePlan, controllers.exerciseController.create);
  router.get("/exercises",      authMiddleware, requireApproval, requireActivePlan, controllers.exerciseController.list);
  router.post("/exercises/media", authMiddleware, requireApproval, requireActivePlan, requirePhysio, uploadExerciseMedia, persistUploads, controllers.exerciseController.uploadMedia);
  router.get("/exercises/:id",  authMiddleware, requireApproval, requireActivePlan, controllers.exerciseController.getById);
  router.put("/exercises/:id",  authMiddleware, requireApproval, requireActivePlan, requirePhysio, controllers.exerciseController.update);

  // Seguimiento
  router.post("/tracking", authMiddleware, requireApproval, requireActivePlan, controllers.trackingController.create);
  router.get("/tracking/patient/:patientId", authMiddleware, requireApproval, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.trackingController.listByPatient);

  // Rutinas
  router.post("/routines",                           authMiddleware, requireApproval, requireActivePlan, requirePhysio, requirePatientAccess((req) => req.body?.patientId), controllers.routineController.create);
  router.post("/routines/templates",                 authMiddleware, requireApproval, requireActivePlan, requirePhysio, controllers.routineController.createTemplate);
  router.put("/routines/templates/:id",              authMiddleware, requireApproval, requireActivePlan, requirePhysio, controllers.routineController.updateTemplate);
  router.get("/routines/templates",                  authMiddleware, requireApproval, requireActivePlan, requirePhysio, controllers.routineController.listTemplates);
  router.get("/routines/templates/:id",              authMiddleware, requireApproval, requireActivePlan, requirePhysio, controllers.routineController.getTemplateById);
  router.post("/routines/:id/template",              authMiddleware, requireApproval, requireActivePlan, requirePhysio, requireRoutineAccess, controllers.routineController.saveAsTemplate);
  router.get("/routines/patient/:patientId",         authMiddleware, requireApproval, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.routineController.getByPatient);
  router.get("/routines/history/patient/:patientId", authMiddleware, requireApproval, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.routineController.getHistoryByPatient);
  router.get("/routines/:id",                        authMiddleware, requireApproval, requireActivePlan, requireRoutineAccess, controllers.routineController.getById);
  router.put("/routines/:id",                        authMiddleware, requireApproval, requireActivePlan, requirePhysio, requireRoutineAccess, controllers.routineController.update);
  router.delete("/routines/:id",                     authMiddleware, requireApproval, requireActivePlan, requirePhysio, requireRoutineAccess, controllers.routineController.remove);

  // Citas
  router.post("/appointments",                   authMiddleware, requireApproval, requireActivePlan, requirePhysio, requirePatientAccess((req) => req.body?.id_patient), controllers.appointmentController.create);
  router.get("/appointments/patient/:patientId", authMiddleware, requireApproval, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.appointmentController.getByPatient);
  router.put("/appointments/:id",                authMiddleware, requireApproval, requireActivePlan, requirePhysio, requireAppointmentAccess, controllers.appointmentController.update);
  router.get("/appointments",                    authMiddleware, requireApproval, requireActivePlan, controllers.appointmentController.getMyPhysioAppointments);

  // Notas de seguimiento (solo el fisio del paciente)
  const noteAccess = [authMiddleware, requireApproval, requireActivePlan, requirePhysio];
  router.get("/patients/:patientId/notes",         ...noteAccess, requirePatientAccess((req) => req.params.patientId), controllers.patientNoteController.list);
  router.post("/patients/:patientId/notes",        ...noteAccess, requirePatientAccess((req) => req.params.patientId), controllers.patientNoteController.create);
  router.post("/patients/:patientId/notes/import", ...noteAccess, requirePatientAccess((req) => req.params.patientId), controllers.patientNoteController.importMany);
  router.put("/notes/:id",                         ...noteAccess, controllers.patientNoteController.update);
  router.delete("/notes/:id",                      ...noteAccess, controllers.patientNoteController.remove);

  // Notificaciones
  router.post("/notifications",                   authMiddleware, requireApproval, requireActivePlan, controllers.notificationController.create);
  router.get("/notifications/patient/:patientId", authMiddleware, requireApproval, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.notificationController.getByPatient);
  router.patch("/notifications/:id/read",         authMiddleware, requireApproval, requireActivePlan, requireNotificationAccess, controllers.notificationController.markAsRead);

  return router;
}
