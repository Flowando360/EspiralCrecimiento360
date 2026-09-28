-- ============================================================================
-- 0096_flujo_aprobacion_documental_completo.sql
--
-- A partir de Especificaciones_Mejoras_Aplicativo_Procesos_Sistemas_Gestion
-- (sección 4): el flujo de solicitudes_documento (0076) tenía un solo punto
-- de control (pendiente -> aprobado/rechazado, siempre admin_th). La
-- especificación pide un flujo de trabajo explícito con responsables
-- diferenciados: Borrador -> En revisión -> En validación -> Aprobado
-- (-> Vigente, ya cubierto por documentos_proceso.estado) / Rechazado.
--
-- Revisor y validador son OPCIONALES por solicitud (columnas nuevas,
-- referencian colaboradores) -- si no se asignan, admin_th sigue pudiendo
-- resolver cualquier etapa él mismo, exactamente como funcionaba antes. Si
-- se asignan, esa persona también puede actuar en su etapa (además de
-- admin_th, que conserva el rol de superusuario en todo el módulo).
--
-- Escrita para poder correrse más de una vez sin error (IF NOT EXISTS / DROP
-- CONSTRAINT IF EXISTS en todo lo creado) — ver nota de la 0074.
-- ============================================================================

alter table solicitudes_documento add column if not exists revisor_id uuid references colaboradores(id) on delete set null;
alter table solicitudes_documento add column if not exists validador_id uuid references colaboradores(id) on delete set null;
alter table solicitudes_documento add column if not exists enviado_revision_at timestamptz;
alter table solicitudes_documento add column if not exists revisado_at timestamptz;
alter table solicitudes_documento add column if not exists comentarios_revisor text;
alter table solicitudes_documento add column if not exists validado_at timestamptz;
alter table solicitudes_documento add column if not exists comentarios_validador text;

comment on column solicitudes_documento.revisor_id is 'Opcional: quién revisa esta solicitud (etapa "En revisión"). Si es null, cualquier admin_th puede revisarla.';
comment on column solicitudes_documento.validador_id is 'Opcional: quién valida esta solicitud (etapa "En validación", el paso previo a publicarla). Si es null, cualquier admin_th puede validarla.';

-- Tres pasos, en este orden exacto, para no chocar contra el constraint en
-- ningún momento: 1) ampliarlo a un superconjunto que acepte tanto los
-- valores viejos como los nuevos, 2) migrar los datos, 3) angostarlo al
-- conjunto final (sin 'pendiente', que ya no debería quedar ninguna fila
-- usándolo).
alter table solicitudes_documento drop constraint if exists solicitudes_documento_estado_check;
alter table solicitudes_documento add constraint solicitudes_documento_estado_check
  check (estado in ('pendiente', 'borrador', 'en_revision', 'en_validacion', 'aprobado', 'rechazado', 'cancelada'));

-- Migra datos existentes: 'pendiente' (el único estado intermedio que
-- existía) pasa a 'en_revision' -- sigue siendo accionable por admin_th
-- igual que antes, solo cambia la etiqueta.
update solicitudes_documento set estado = 'en_revision' where estado = 'pendiente';

alter table solicitudes_documento drop constraint if exists solicitudes_documento_estado_check;
alter table solicitudes_documento add constraint solicitudes_documento_estado_check
  check (estado in ('borrador', 'en_revision', 'en_validacion', 'aprobado', 'rechazado', 'cancelada'));

alter table solicitudes_documento alter column estado set default 'borrador';

create index if not exists idx_solicitudes_documento_revisor on solicitudes_documento(revisor_id);
create index if not exists idx_solicitudes_documento_validador on solicitudes_documento(validador_id);
