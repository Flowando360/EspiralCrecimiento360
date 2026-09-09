-- ============================================================================
-- 0053_sincronizaciones_guia_flow.sql
--
-- Trazabilidad de la integración automática con guiadelflow (ver
-- src/lib/circulo/sincronizar.ts en ese repo): cada vez que alguien genera
-- su Guía del Flow, guiadelflow intenta emparejarlo por correo con un
-- colaborador de Espiral de Crecimiento. Antes de esta migración, solo
-- quedaba rastro cuando el emparejamiento SÍ funcionaba (la fila nueva en
-- guia_del_flow) — los intentos sin match no dejaban ningún rastro visible
-- para Talento Humano, solo en los logs de servidor de guiadelflow.
--
-- Esta tabla registra TODOS los intentos, con o sin match, para que
-- admin_th pueda ver por ejemplo "Juan Pérez generó su Guía con
-- juan.gmail@... pero no coincide con ningún correo registrado" y corregir
-- el dato en la ficha del colaborador si hace falta.
-- ============================================================================

create table guia_del_flow_sincronizaciones (
  id uuid primary key default gen_random_uuid(),
  intentado_at timestamptz not null default now(),
  correo text not null,
  nombre_flow text,
  resultado text not null check (resultado in ('vinculado', 'sin_colaborador', 'correo_ambiguo', 'error')),
  detalle text,
  colaborador_id uuid references colaboradores(id) on delete set null,
  empresa_id uuid references empresas(id) on delete set null,
  guia_del_flow_id uuid references guia_del_flow(id) on delete set null
);

comment on table guia_del_flow_sincronizaciones is 'Bitácora de cada intento de sincronización automática desde guiadelflow (con o sin match). Escrita con service_role desde guiadelflow, nunca desde esta app. Ver src/lib/circulo/sincronizar.ts en el repo guiadelflow.';
comment on column guia_del_flow_sincronizaciones.resultado is 'vinculado = se encontró exactamente un colaborador y se cargaron sus 18 aspectos + informes. sin_colaborador = ningún colaborador tiene ese correo. correo_ambiguo = el correo coincide con más de un colaborador (no se adivina). error = falló algo al escribir/generar (ver detalle).';
comment on column guia_del_flow_sincronizaciones.empresa_id is 'Solo se conoce cuando resultado=vinculado (se deriva del colaborador encontrado). En los demás casos queda null — no hay forma de saber a qué empresa "debería" pertenecer alguien que no hizo match. Simplificación válida mientras Flow, Nexus y Visión sea la única empresa cliente activa (ver 0001_core_organizacion.sql); si se suma una segunda empresa, revisar la policy de lectura de abajo.';

alter table guia_del_flow_sincronizaciones enable row level security;

-- Sin match no hay empresa a la cual restringir la lectura (ver comentario
-- de la columna) — se deja visible a cualquier admin_th mientras solo haya
-- una empresa cliente activa. Las filas SÍ vinculadas a una empresa quedan
-- correctamente restringidas a admin_th de esa empresa.
create policy "sincronizaciones: admin_th lee las de su empresa o sin empresa" on guia_del_flow_sincronizaciones for select
  using (fn_mi_rol() = 'admin_th' and (empresa_id is null or empresa_id = fn_mi_empresa_id()));

-- Sin policy de insert/update/delete a propósito: esta tabla solo la
-- escribe el service_role de guiadelflow (bypassa RLS), nunca esta app.
