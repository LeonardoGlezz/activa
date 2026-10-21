/**
 * Avisos legales que cada tipo de cuenta debe aceptar.
 * Los textos viven en backend/legal/*.html y se sirven en /legal.
 *
 * Al cambiar un texto de forma importante, sube aquí su versión (fecha) y la
 * de la página: todos los usuarios de ese rol tendrán que aceptarlo de nuevo.
 */
export interface LegalDocument {
  id: string;
  title: string;
  version: string;
  path: string;
}

const PRIVACY_PATIENT: LegalDocument = {
  id: "privacidad-pacientes",
  title: "Aviso de privacidad para pacientes",
  version: "2026-10-21",
  path: "/legal/aviso-privacidad-pacientes.html",
};

const PRIVACY_PHYSIO: LegalDocument = {
  id: "privacidad-fisioterapeutas",
  title: "Aviso de privacidad para fisioterapeutas",
  version: "2026-10-21",
  path: "/legal/aviso-privacidad-fisioterapeutas.html",
};

const TERMS: LegalDocument = {
  id: "terminos-de-uso",
  title: "Términos y reglas de uso",
  version: "2026-10-21",
  path: "/legal/terminos-de-uso.html",
};

const REQUIRED_BY_ROLE: Record<string, LegalDocument[]> = {
  patient: [PRIVACY_PATIENT, TERMS],
  physio: [PRIVACY_PHYSIO, TERMS],
  admin: [],
};

export function requiredLegalDocuments(role: string): LegalDocument[] {
  return REQUIRED_BY_ROLE[role] ?? [];
}
