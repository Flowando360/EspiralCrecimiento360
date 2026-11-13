-- Informe de Luisa 4.10: la inducción deja de ser solo un checklist que marca TH.
--  · Cada punto puede llevar una pregunta de comprensión (quiz); la respuesta correcta vive aparte y solo la lee TH,
--    así quien responde no puede verla.
--  · Propósito organizacional, funciones y riesgos SST los confirma la propia persona (confirmado_colaborador_en);
--    TH o el líder supervisan y aprueban (completado). Idempotente.

alter table induccion_items add column if not exists pregunta text;
alter table induccion_items add column if not exists opciones jsonb;

alter table colaborador_induccion_items add column if not exists confirmado_colaborador_en timestamptz;
alter table colaborador_induccion_items add column if not exists intentos_quiz integer not null default 0;

create table if not exists induccion_item_clave (
  item_id uuid primary key references induccion_items(id) on delete cascade,
  correcta smallint not null check (correcta >= 0)
);

alter table induccion_item_clave enable row level security;

drop policy if exists "induccion_clave: admin_th" on induccion_item_clave;
create policy "induccion_clave: admin_th" on induccion_item_clave for all
  using (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from induccion_items i where i.id = item_id and i.empresa_id = fn_mi_empresa_id())
  )
  with check (
    fn_mi_rol() = 'admin_th'
    and exists (select 1 from induccion_items i where i.id = item_id and i.empresa_id = fn_mi_empresa_id())
  );
