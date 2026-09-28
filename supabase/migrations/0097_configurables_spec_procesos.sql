-- ============================================================================
-- 0097_configurables_spec_procesos.sql
-- Cierra 3 brechas encontradas en la auditoría de
-- Especificaciones_Mejoras_Aplicativo_Procesos_Sistemas_Gestion.docx:
--
--   1. ACPM: falta "Revisión de proceso" como origen (la especificación lo
--      nombra junto a Riesgo/Auditoría interna/Análisis de contexto/Otro).
--   2. Gestión Documental: la estructura de código (prefijo por tipo de
--      documento, separador, dígitos del consecutivo) estaba fija en el
--      código de la app; la especificación pide que sea configurable por
--      empresa (sección 9).
--   3. Riesgos: la escala de probabilidad/impacto (etiquetas de cada grado
--      1-3 y los umbrales bajo/medio) estaba fija en el código; la
--      especificación pide que sea configurable por empresa (sección 13).
--
-- Los valores por defecto de 2 y 3 son EXACTAMENTE los que ya estaban
-- hardcodeados, para que ninguna empresa existente note un cambio hasta que
-- alguien edite la configuración en Administración → Configuración.
--
-- Escrita con IF NOT EXISTS / DROP CONSTRAINT IF EXISTS para poder correrse
-- más de una vez sin error, igual que el resto de migraciones de este
-- proyecto.
-- ============================================================================

-- 1. Origen de ACPM: agregar 'revision_proceso'.
alter table acpm drop constraint if exists acpm_origen_tipo_check;
alter table acpm add constraint acpm_origen_tipo_check
  check (origen_tipo in ('hallazgo_auditoria', 'riesgo', 'contexto', 'revision_proceso', 'indicador', 'pqrs', 'mejora_propia'));

-- 2. Estructura de código documental, configurable por empresa.
alter table empresas add column if not exists documental_prefijos_tipo jsonb not null default
  '{"procedimiento": "PO", "politica": "PL", "formato": "FO", "instructivo": "IN", "registro": "RE"}'::jsonb;
alter table empresas add column if not exists documental_separador_codigo text not null default '-';
alter table empresas add column if not exists documental_digitos_consecutivo int not null default 3;

do $$ begin
  alter table empresas add constraint empresas_documental_digitos_consecutivo_check
    check (documental_digitos_consecutivo between 1 and 6);
exception when duplicate_object then null; end $$;

comment on column empresas.documental_prefijos_tipo is 'Prefijo de código por tipo de documento (procedimiento/politica/formato/instructivo/registro). Configurable en Administración → Configuración -- spec sección 9.';
comment on column empresas.documental_separador_codigo is 'Separador entre proceso/tipo/consecutivo en el código de documento (por defecto "-").';
comment on column empresas.documental_digitos_consecutivo is 'Cantidad de dígitos del consecutivo del código de documento (por defecto 3, ej. 007).';

-- 3. Escala de probabilidad/impacto de Riesgos, configurable por empresa.
alter table empresas add column if not exists riesgos_escala jsonb not null default '{
  "etiquetasImpacto": {
    "riesgo": ["Menor", "Moderado", "Catastrófico"],
    "oportunidad": ["Beneficio mínimo", "Beneficio relevante", "Beneficio alto"]
  },
  "etiquetasProbabilidad": {
    "riesgo": ["Inusual", "Probable", "Muy posible"],
    "oportunidad": ["Difícil de lograr", "Probable", "Factible"]
  },
  "umbralBajo": 2,
  "umbralMedio": 5
}'::jsonb;

comment on column empresas.riesgos_escala is 'Etiquetas de los 3 grados de impacto/probabilidad (riesgo y oportunidad) y los umbrales bajo/medio de la valoración 1-9. Configurable en Administración → Configuración -- spec sección 13. Ver src/lib/calculos/matriz-riesgos.ts (EscalaRiesgosConfig).';
