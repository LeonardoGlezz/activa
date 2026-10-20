import { Router } from "express";
import express from "express";
import { authMiddleware } from "./middlewares/auth.middleware";
import { uploadDocuments } from "./middlewares/upload.middleware";
import { requireApproval } from "./middlewares/approved.middleware";
import { requireActivePlan } from "./middlewares/active-plan.middleware";
import { requireAdmin } from "./middlewares/admin.middleware";
import { PhysiotherapistModel } from "../persistence/sequelize/client";
import { uploadPatientMedicalPdf } from "./middlewares/upload-patient-medical.middleware";
import { uploadExerciseMedia } from "./middlewares/upload-exercise-media.middleware";
import { persistUploads } from "../storage/object-storage";
import { requirePatientAccess, requireRoutineAccess, requirePhysio } from "./middlewares/patient-access.middleware";

export function buildRoutes(controllers: {
  patientController:       any;
  physioController:        any;
  exerciseController:      any;
  trackingController:      any;
  routineController:       any;
  authController:          any;
  appointmentController:   any;
  logbookController:       any;
  notificationController:  any;
  dashboardController:     any;
  documentController:      any;
  subscriptionController:  any;
  adminController:         any;
  legalController:         any;
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

  router.post("/physiotherapists",    authMiddleware, controllers.physioController.create);
  router.get("/physiotherapists/:id", authMiddleware, controllers.physioController.getById);
  router.patch("/auth/update-email",    authMiddleware, controllers.authController.updateEmail);
  router.patch("/auth/update-password", authMiddleware, controllers.authController.updatePassword);

  // Aviso de privacidad y términos: estado y aceptación de la cuenta actual
  router.get("/legal/consent",  authMiddleware, controllers.legalController.getStatus);
  router.post("/legal/consent", authMiddleware, controllers.legalController.accept);

  // Subida de documentos (fisio aún no aprobado, no necesita plan)
  router.post(
    "/physiotherapists/upload-documents",
    authMiddleware,
    uploadDocuments.fields([
      { name: 'ineFront',   maxCount: 1 },
      { name: 'cedulaPdf', maxCount: 1 }
    ]),
    persistUploads,
    async (req: any, res: any) => {
      try {
        const idUsuario = req.user.id;
        const fisio: any = await PhysiotherapistModel.findOne({ where: { id_user: idUsuario } });

        if (!fisio) return res.status(404).json({ message: "Fisioterapeuta no encontrado." });

        if (fisio.getDataValue('status') !== 'pending_profile') {
          return res.status(400).json({
            message: "Acción denegada. Tus documentos ya fueron recibidos o tu cuenta ya está validada."
          });
        }

        if (!req.files || !req.files['ineFront'] || !req.files['cedulaPdf']) {
          return res.status(400).json({ message: "Faltan documentos en la petición." });
        }

        await PhysiotherapistModel.update({
          ine_doc_url:      req.files['ineFront'][0].filename,
          license_doc_url:  req.files['cedulaPdf'][0].filename,
          status:           'pending_approval'
        }, { where: { id_user: idUsuario } });

        res.status(200).json({ success: true, message: 'Documentos guardados exitosamente.' });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

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
  router.post("/routines",                           authMiddleware, requireActivePlan, requirePhysio, requirePatientAccess((req) => req.body?.patientId), controllers.routineController.create);
  router.post("/routines/templates",                 authMiddleware, requireActivePlan, requirePhysio, controllers.routineController.createTemplate);
  router.put("/routines/templates/:id",              authMiddleware, requireActivePlan, requirePhysio, controllers.routineController.updateTemplate);
  router.get("/routines/templates",                  authMiddleware, requireActivePlan, requirePhysio, controllers.routineController.listTemplates);
  router.get("/routines/templates/:id",              authMiddleware, requireActivePlan, requirePhysio, controllers.routineController.getTemplateById);
  router.post("/routines/:id/template",              authMiddleware, requireActivePlan, requirePhysio, requireRoutineAccess, controllers.routineController.saveAsTemplate);
  router.get("/routines/patient/:patientId",         authMiddleware, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.routineController.getByPatient);
  router.get("/routines/history/patient/:patientId", authMiddleware, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.routineController.getHistoryByPatient);
  router.get("/routines/:id",                        authMiddleware, requireActivePlan, requireRoutineAccess, controllers.routineController.getById);
  router.put("/routines/:id",                        authMiddleware, requireActivePlan, requirePhysio, requireRoutineAccess, controllers.routineController.update);
  router.delete("/routines/:id",                     authMiddleware, requireActivePlan, requirePhysio, requireRoutineAccess, controllers.routineController.remove);

  // Citas
  router.post("/appointments",                   authMiddleware, requireApproval, requireActivePlan, controllers.appointmentController.create);
  router.get("/appointments/patient/:patientId", authMiddleware, requireApproval, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.appointmentController.getByPatient);
  router.put("/appointments/:id",                authMiddleware, requireApproval, requireActivePlan, controllers.appointmentController.update);
  router.get("/appointments",                    authMiddleware, requireApproval, requireActivePlan, controllers.appointmentController.getMyPhysioAppointments);

  // Bitácora
  router.post("/logbook",                           authMiddleware, requireApproval, requireActivePlan, controllers.logbookController.create);
  router.get("/logbook/appointment/:appointmentId", authMiddleware, requireApproval, requireActivePlan, controllers.logbookController.getByAppointment);

  // Notificaciones
  router.post("/notifications",                   authMiddleware, requireApproval, requireActivePlan, controllers.notificationController.create);
  router.get("/notifications/patient/:patientId", authMiddleware, requireApproval, requireActivePlan, requirePatientAccess((req) => req.params.patientId), controllers.notificationController.getByPatient);
  router.patch("/notifications/:id/read",         authMiddleware, requireApproval, requireActivePlan, controllers.notificationController.markAsRead);

  // Documentos médicos
  router.get("/documents", authMiddleware, requireApproval, requireActivePlan, controllers.documentController.list);
  router.post(
    "/documents",
    authMiddleware, requireApproval, requireActivePlan,
    uploadPatientMedicalPdf.single("file"),
    persistUploads,
    controllers.documentController.create
  );
  router.delete("/documents/:id", authMiddleware, requireApproval, requireActivePlan, controllers.documentController.remove);

  return router;
}
