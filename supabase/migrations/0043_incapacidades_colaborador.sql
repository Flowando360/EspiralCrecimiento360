-- ============================================================================
-- 0043_incapacidades_colaborador.sql
-- Módulo de incapacidades (docs/Requerimientos.docx, secc. 3 "Gestión del
-- tiempo": solicitud y aprobación de vacaciones, permisos e incapacidades —
-- hoy no existía ningún registro de esto en el sistema).
--
-- Alcance de esta primera versión: registro administrativo de la
-- incapacidad (tipo, fechas, quién la certifica, soporte adjunto), no un
-- flujo de solicitud/aprobación por el propio colaborador — coherente con
-- cómo ya funciona el resto de datos de la ficha (Talento Humano registra
-- lo que recibe del colaborador/EPS/ARL, la persona lo consulta).
--
-- Privacidad: mismo nivel que "Documentos" (0020) -- admin_th y el propio
-- colaborador, SIN el líder -- por ser información de salud (dato sensible
-- bajo la Ley 1581 de 2012). A propósito no se guarda el diagnóstico
-- médico como texto, solo la categoría general (tipo) -- si se necesita el
-- detalle, queda en el soporte adjunto (PDF), no en un campo de texto
-- plano en la base de datos.
-- ============================================================================

create type tipo_incapacidad as enum (
  'enfermedad_general',
  'accidente_laboral',
  'enfermedad_laboral',
  'licencia_maternidad',
  'licencia_paternidad',
  'otra'
);

create table incapacidades_colaborador (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  tipo tipo_incapacidad not null default 'enfermedad_general',
  fecha_inicio date not null,
  fecha_fin date not null,
  dias integer generated always as (fecha_fin - fecha_inicio + 1) stored,
  entidad_emisora text, -- EPS (enfermedad general) o ARL (laboral) que la certifica/cubre
  soporte_url text, -- ruta en el bucket privado documentos-colaborador (carpeta "incapacidad")
  registrada_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint incapacidad_fechas_validas check (fecha_fin >= fecha_inicio)
);

comment on table incapacidades_colaborador is 'Incapacidades y licencias (enfermedad general, accidente/enfermedad laboral, maternidad/paternidad) registradas por Talento Humano. Dato sensible de salud: mismo nivel de privacidad que Documentos (admin_th + propio colaborador, sin líder).';

create index idx_incapacidades_colaborador on incapacidades_colaborador(colaborador_id);

alter table incapacidades_colaborador enable row level security;

create policy "incapacidades: admin_th administra" on incapacidades_colaborador for all
  using (exists(select 1 from colaboradores co where co.id = colaborador_id and co.empresa_id = fn_mi_empresa_id()) and fn_mi_rol() = 'admin_th');
create policy "incapacidades: colaborador ve las propias" on incapacidades_colaborador for select
  using (colaborador_id = fn_mi_colaborador_id());

-- ── Soporte adjunto: reusa el bucket privado documentos-colaborador (0020),
-- con un tercer "tipo" de carpeta junto a hoja-vida/contrato:
-- empresa_id/colaborador_id/incapacidad/archivo.ext. Las policies de
-- insert/update de ese bucket ya son genéricas por rol (no filtran por
-- tipo), así que solo hace falta la policy de lectura para este tipo nuevo.
create policy "documentos-colaborador: lectura incapacidad" on storage.objects for select
  using (
    bucket_id = 'documentos-colaborador'
    and (storage.foldername(name))[3] = 'incapacidad'
    and (
      public.fn_mi_rol() = 'admin_th'
      or (storage.foldername(name))[2]::uuid = public.fn_mi_colaborador_id()
    )
  );
