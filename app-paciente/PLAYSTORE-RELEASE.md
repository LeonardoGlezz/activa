# Guía de publicación en Play Store — ACTIVA

Checklist para publicar la app ACTIVA en Google Play Store.

---

## 1. Configuración previa

### 1.1 URL de API de producción

Antes de compilar para producción, define la URL real del backend:

- Edita `src/environments/environment.prod.ts`
- Reemplaza `https://tu-api-backend.com/api` por tu URL real (ej: `https://api.activa.cl/api`)

### 1.2 Datos de la clínica

En **un solo archivo** (`src/environments/environment.prod.ts`) configura:

- `clinicName` – Nombre de la clínica (se usa en Perfil y en Cita confirmada)
- `clinicAddress` – Dirección (pantalla de cita confirmada)
- `clinicMapsUrl` – Enlace de Google Maps (botón "Ver en mapa")

---

## 2. Cuenta de desarrollador

- [ ] Cuenta de Google Play Console ([play.google.com/console](https://play.google.com/console))
- [ ] Pago único de registro (25 USD, una sola vez)

---

## 3. Política de privacidad

Play Store exige una URL pública de política de privacidad.

- [ ] Crea la política en tu web o usa un generador (ej: [privacypolicies.com](https://www.privacypolicies.com/))
- [ ] Publica la URL (ej: `https://activa.cl/privacidad`)
- [ ] Indica qué datos recopilas (email, nombre, sesiones, reportes de dolor, etc.)

---

## 4. Icono y splash

### Icono

- Debe ser 512×512 px para Play Store
- Resolución adaptativa para Android (ya existen en `android/app/src/main/res/mipmap-*`)
- Para personalizar: genera iconos con [icon.kitchen](https://icon.kitchen) o `cordova-res`

### Splash

- Verifica que el splash se vea bien en modo claro/oscuro

---

## 5. Permisos de Android

Actualmente la app solo solicita:

- `INTERNET` — necesario para las APIs

No hay permisos sensibles (cámara, ubicación, etc.). Si añades funcionalidades, actualiza la política de privacidad.

---

## 6. Compilación para producción

```bash
# En la raíz del proyecto mobile
npm run build -- --configuration=production
npx cap sync android
npx cap open android
```

En Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. Elige **Android App Bundle (AAB)** — formato requerido por Play Store
3. Crea o usa un keystore para firmar
4. Genera el AAB

Guarda el keystore y las contraseñas en un lugar seguro; los necesitarás para futuras actualizaciones.

---

## 7. En Play Console

1. Crea una nueva aplicación
2. Completa la ficha de la tienda:
   - Nombre corto: **ACTIVA**
   - Descripción larga (hasta 4000 caracteres)
   - Capturas de pantalla (al menos 2, recomendado 4–8)
   - Icono 512×512
   - Categoría: Salud y bienestar
3. Contenido de la app:
   - Política de privacidad (URL)
   - Clasificación de contenido (cuestionario)
   - Datos de seguridad (qué datos recopilas)
4. Producción → Crear nueva versión → Sube el AAB
5. Revisa y envía a revisión

---

## 8. Identificadores actuales

| Elemento        | Valor                    |
|-----------------|--------------------------|
| **applicationId** | `com.activa.fisioterapia` |
| **Nombre**      | ACTIVA                   |
| **Versión**     | 1.0.0 (versionCode 1)    |

---

## 9. Próximas actualizaciones

Para subir una nueva versión:

1. Incrementa `version` en `package.json` (ej: 1.0.1)
2. Incrementa `versionCode` en `android/app/build.gradle` (ej: 2)
3. Recompila y genera un nuevo AAB
4. Sube en Play Console → Producción → Nueva versión
