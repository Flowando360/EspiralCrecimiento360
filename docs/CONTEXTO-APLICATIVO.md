# Contexto del aplicativo (para Claude)

Sin claves ni datos personales: este repositorio es público. Última revisión: 2026-11-01.

## Piezas y dónde viven
| Pieza | Dónde | Notas |
|---|---|---|
| Aplicativo Espiral (Next.js 14, React, Tailwind, Supabase) | GitHub `Flowando360/EspiralCrecimiento360` · Vercel `espiral-crecimiento-360` (equipo `flow-ando360`) · `https://espiral-crecimiento-360.vercel.app` | Despliega desde `main`. |
| Base de datos y accesos de Espiral | Supabase, proyecto `dsunoydgabtfdypmnana` | Plan gratuito: sin respaldos, se pausa tras 7 días sin uso. 106 migraciones en `supabase/migrations/`. |
| Guía del Flow (aplicativo aparte, el Ser) | GitHub `Flowando360/GuiaDelFlow` · Vercel `guia-del-flow` · `https://guia-del-flow.vercel.app` | **Una sola aplicación para todas las empresas.** Escribe directo en la base de Espiral. |
| Círculo de Crecimiento (versión inicial) | GitHub `Flowando360/CirculoCrecimiento` · Vercel `circulo-crecimiento` · Supabase `zmpggzrmsuudxyjtobzy` | **Va a borrarse** cuando Diana lo confirme. Ya se migró de allí todo lo de Mármoles y la Guía del Flow. |
| Correos | Resend (remitente `notificaciones@flowando.com`) | La app envía por Resend; Supabase Auth también usa Resend por SMTP. |
| IA | Anthropic (variable `ANTHROPIC_API_KEY` en Vercel de Espiral y de la Guía) | Límite de gasto en la consola de Anthropic: US$ 20. |

## Empresas (multiempresa)
- **CONVERGIA** — `00000000-0000-0000-0000-000000000001` — demostración y pruebas, datos ficticios (nació como copia anonimizada de Mármoles).
- **Mármoles y Servicios** — `7fda2fa1-b69c-5acc-9f17-374f828831a6` — empresa real, con datos reales cargados desde Círculo.
- Cada fila de negocio lleva `empresa_id`; las políticas RLS de Supabase aíslan empresas. Un usuario pertenece a una sola empresa.

## Roles
`admin_th` (Talento Humano: todo en su empresa) · `lider` (su equipo) · `colaborador` (lo propio) · `gerencia` (agregados) · `auditor_externo` (solo evidencia) · panel del **proveedor** (tabla `proveedores`, ve todas las empresas; acceso separado en `/proveedor`). Roles personalizados por empresa en Administración → Roles y permisos.

## Modelo conceptual
Cuatro dimensiones por persona: **Ser** (Guía del Flow: 18 aspectos con relevancia laboral), **Saber** (cargo vs. hoja de vida, checklist con Cumple/Parcial/No cumple), **Hacer** y **Deber** (evaluación por ciclo, escala 1–5, índice y semáforo). Evaluadores: autoevaluación, líder, pares, colaboradores a cargo (deducidos del organigrama). Ponderación por defecto líder 40 / pares 30 / equipo 30. El bloque "Roles y funciones" sale del manual de funciones del cargo. El PDI se crea solo cuando el semáforo es bajo, o a mano desde el resultado.

## Módulos y estado de pruebas
| Módulo | Estado |
|---|---|
| Espiral 360° (ficha, hoja de vida, Saber, Ser, ciclos, evaluación, brief, acuerdo, PDI, organigrama, indicadores, historial, salida) | **Probado y corregido** |
| Reclutamiento (vacantes, formulario público, tablero de 7 etapas, evaluación del líder, entrevistas, referencias, contratación, banco, histórico de candidatos, derechos del titular) | **Probado y corregido** |
| Administración: cargos (incluye "Nuevo cargo"), organigrama, usuarios | Probado parcialmente |
| Informes: 360° (PDF y Excel) | Probado; los demás informes **sin probar** |
| Guía del Flow ↔ Espiral | Funciona de punta a punta; falta repetir una prueba limpia y el límite de 60 s |
| Nexa, Procesos y Cumplimiento, Dotación, panel Proveedor, auditor externo, tareas programadas (cron) | **Sin probar a fondo** |

## Decisiones ya tomadas (no las reabras)
- Supresión de datos de un candidato: **manual** de Talento Humano. El histórico de candidatos **se conserva siempre**; quien vuelve a postularse se reconoce por documento o correo y no se duplica.
- Planes gratuitos/Hobby por ahora.
- La Guía del Flow se mueve a Espiral; Círculo se borra solo cuando Diana lo confirme y después de un último respaldo.
- La guía pública del líder de TH vive en `public/guia-lider-th/` (dirección `/guia-lider-th`, sin iniciar sesión). El manual en línea está en `src/content/ayuda/`.

## Variables de entorno (solo los NOMBRES)
Aplicativo Espiral (Vercel y `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, `GUIA_FLOW_PANEL_SECRET` (compartido con la Guía del Flow), opcionales `GUIADELFLOW_URL`, `NOTIFICACIONES_EMAIL_FROM`, `REQUERIMIENTOS_EMAIL`. **`BYPASS_AUTH` no debe existir en producción** (salta el inicio de sesión).
Guía del Flow (Vercel): las tres de Supabase apuntando a Espiral, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `GUIA_FLOW_PANEL_SECRET`, `ADMIN_EMAILS`.
Entorno de las sesiones en la nube: además `VERCEL_TOKEN`, `ORIGEN_SUPABASE_URL` y `ORIGEN_SUPABASE_SERVICE_ROLE_KEY` (mientras exista Círculo) y `CLAVE_ANTHROPIC_ESPIRAL` (la variable `ANTHROPIC_API_KEY` no llega a la sesión; se usa otro nombre).
Las claves reales las tiene Diana; pídelas, no las inventes ni las escribas en archivos.

## Cuentas de prueba
Existen cuentas `pru.*` en CONVERGIA (admin, líder, colaborador, gerencia, auditor) y un proveedor de prueba. **Sus contraseñas no están en el repositorio: pídelas a Diana.** Son un riesgo si quedan activas con datos reales: recomienda desactivarlas antes de que entre gente real (la de proveedor ve todas las empresas).

## Cómo probamos en la nube (cuando no hay PowerShell)
- El servidor de Next no puede salir a Supabase por el proxy de la nube: se usa un reenviador local (`localhost:54321`) y `NODE_USE_ENV_PROXY=1`. Playwright viene instalado; entra como cada rol y recorre pantallas. Para escribir clics usa teclado real (`pressSequentially`), no `fill`, en formularios de React.
- Para tocar la base desde scripts: cliente `@supabase/supabase-js` con la clave de servicio y la URL real, con `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.
- Migración Círculo → Espiral: `scripts/migracion-circulo/` (ver su `LEEME.md`). Es idempotente; para una copia final se repite `datos` y `archivos` sin `borrar`, y se borran las alertas duplicadas que generan los disparadores.

## Lecciones técnicas (errores ya encontrados)
- `respuestas_evaluacion` necesita restricción única completa (migración 0107): con índice parcial no se guardaban las notas.
- `resultados_evaluacion` es relación uno a uno: PostgREST la devuelve como **objeto**; usa `primero()` de `src/lib/utils.ts`.
- Páginas públicas que leen estado de la base necesitan `export const dynamic = 'force-dynamic'` (se quedaban en caché).
- Insertar colaboradores/hoja de vida en masa dispara alertas duplicadas: revisar y borrar los duplicados.
- Los correos de ejemplo no deben ser de ninguna empresa concreta.
- En Vercel, las variables "sensitive" no se pueden leer: solo reemplazar.
