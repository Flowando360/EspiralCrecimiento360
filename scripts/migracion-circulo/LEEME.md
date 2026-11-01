# Migración Círculo de Crecimiento → Espiral (empresa Mármoles y Servicios)

Cargador por fases, **sin datos ni claves** (solo lógica). Lee el origen (solo GET) y escribe únicamente en Espiral.

Variables de entorno: `ORIGEN_SUPABASE_URL`, `ORIGEN_SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (destino).
Ejecución con proxy de la nube: `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.

```
node cargador.cjs plan                 # simulacro + foto previa del destino (f3_snapshot_previo.json)
node cargador.cjs cuentas   [--aplicar]
node cargador.cjs borrar    [--aplicar]   # reemplaza lo actual de Mármoles (primera carga)
node cargador.cjs datos     [--aplicar]
node cargador.cjs archivos  [--aplicar]
node cargador.cjs extras --corte=<ISO>    # filas creadas por disparadores (p. ej. alertas duplicadas)
node cargador.cjs verificar
```

Reglas: todo entra a la empresa Mármoles (7fda2fa1-…); CONVERGIA no se toca; los identificadores se recalculan (UUID v5) salvo los de la Guía del Flow, que se conservan; las cuentas se reutilizan por correo; el usuario duplicado de otra empresa recibe el sufijo `.mys`.
Tras la carga hay que borrar las alertas que los disparadores duplican (`extras` y luego borrarlas por id).
Para la copia final (delta): volver a correr `datos` y `archivos` con `--aplicar` (es idempotente) y NO correr `borrar`.
