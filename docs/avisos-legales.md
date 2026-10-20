# Avisos legales de Activa: qué falta antes de producción

Estos textos son un **borrador** pensado para México (Ley Federal de Protección de Datos Personales en Posesión de los Particulares y NOM-004-SSA3-2012). **No son asesoría legal**: antes de usarlos con pacientes reales conviene que los revise un abogado especialista en protección de datos.

## Dónde están

| Archivo | Se ve en |
|---|---|
| `backend/legal/aviso-privacidad-pacientes.html` | `/legal/aviso-privacidad-pacientes.html`, login y perfil de la app del paciente, pantalla de consentimiento |
| `backend/legal/aviso-privacidad-fisioterapeutas.html` | `/legal/aviso-privacidad-fisioterapeutas.html`, login y registro del panel del fisio |
| `backend/legal/terminos-de-uso.html` | `/legal/terminos-de-uso.html`, en todas las apps |
| `backend/legal/index.html` | `/legal/` con la lista de documentos (útil para enlazar desde la página principal) |

Los sirve el backend (también `/legal/legal.css`), así que se editan en un solo lugar.

## Datos que hay que llenar (marcados en amarillo en las páginas)

Del **consultorio del fisioterapeuta** (responsable de los datos de los pacientes):
- [ ] Nombre completo del fisioterapeuta o razón social del consultorio
- [ ] Domicilio completo
- [ ] Correo para temas de privacidad (derechos ARCO)
- [ ] Teléfono

Del **operador de Activa** (Leonardo; responsable de los datos de los fisioterapeutas y encargado de los de pacientes):
- [ ] Nombre completo o razón social
- [ ] Domicilio
- [ ] Correo de privacidad y correo de soporte
- [x] Proveedor de nube: Railway (propuesto en el PR de despliegue)
- [ ] Región de los servidores en Railway (aparece al crear el proyecto; casi siempre es Estados Unidos)
- [ ] Ciudad y estado para la cláusula de jurisdicción
- [ ] Si habrá cobro a fisioterapeutas: precio, reembolsos y facturación (o quitar la sección 9 de los términos)

## Puntos para revisar con el abogado

- La ley de datos personales se reformó en marzo de 2025 y el INAI desapareció. Confirmar qué autoridad mencionar y si cambian los plazos de 20 + 15 días hábiles para responder solicitudes ARCO.
- Que marcar una casilla en la app basta como consentimiento expreso para datos de salud (Activa guarda fecha, hora, IP y navegador de cada aceptación en la tabla `legal_consent`).
- El acuerdo entre el consultorio (responsable) y el operador (encargado) está dentro de los términos de uso. Quizá convenga un contrato aparte firmado.
- Plazo de conservación del expediente clínico (NOM-004: mínimo 5 años).
- Pacientes menores de edad.
- Si hay transferencia internacional porque los servidores están fuera de México.

## Cuando cambies un texto

1. Edita el HTML y cambia la fecha de "Versión" arriba.
2. Cambia la misma fecha en `backend/src/infrastructure/legal/legal-documents.ts`.
3. Al entrar, todos los usuarios de ese tipo de cuenta tendrán que aceptar la nueva versión.

Cuando el abogado apruebe los textos, borra el recuadro amarillo de "Borrador" de cada página.
