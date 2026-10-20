# ACTIVA en producción: una sola imagen con la API, la página principal y las
# tres apps web ya compiladas. Todo se sirve desde el mismo dominio:
#   /           página principal (landing/)
#   /paciente/  app del paciente
#   /fisio/     panel del fisioterapeuta
#   /admin/     panel de administración
#   /api        backend

FROM node:22-bookworm-slim AS build
WORKDIR /src

# Dependencias primero, para que Docker las reutilice si solo cambia el código
COPY backend/package.json backend/package-lock.json backend/
COPY web-fisio/package.json web-fisio/package-lock.json web-fisio/
COPY app-paciente/package.json app-paciente/package-lock.json app-paciente/
# admin no guarda package-lock.json (npm ci falla con su árbol de dependencias)
COPY admin/package.json admin/
RUN npm --prefix backend ci \
 && npm --prefix web-fisio ci \
 && npm --prefix app-paciente ci \
 && npm --prefix admin install --no-audit --no-fund

COPY backend backend
COPY web-fisio web-fisio
COPY app-paciente app-paciente
COPY admin admin
RUN npm --prefix backend run build \
 && cd web-fisio && npx ng build --configuration production --base-href /fisio/ \
 && cd ../app-paciente && npx ng build --configuration web --base-href /paciente/ \
 && cd ../admin && npx ng build --configuration production --base-href /admin/


FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /src/backend/dist ./dist
COPY backend/legal ./legal
COPY landing ./public
COPY --from=build /src/web-fisio/dist/web-code-frontend/browser ./public/fisio
COPY --from=build /src/app-paciente/www ./public/paciente
COPY --from=build /src/admin/dist/web-code-studio-admin ./public/admin

# Archivos que suben los usuarios. En el hosting monta aquí un volumen
# persistente (/app/backend/uploads) para que no se borren en cada despliegue.
RUN mkdir -p uploads/documents uploads/patient-medical

EXPOSE 3000
CMD ["node", "dist/main.js"]
