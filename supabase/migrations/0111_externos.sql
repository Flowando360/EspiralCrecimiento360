-- ============================================================================
-- 0111_externos.sql
-- Gestión de personas externas (contratistas, transportadores, asesores,
-- freelance, proveedores): no son empleados y no se evalúan como tales, pero
-- la empresa debe tenerlas registradas y hacerles seguimiento.
-- Reutiliza colaboradores (es_externo = true) para heredar documentos y Guía
-- del Flow, y agrega lo propio del externo.
-- ============================================================================

alter table colaboradores
  add column if not exists tipo_externo text
    check (tipo_externo in ('contratista', 'transportador', 'asesor', 'freelance', 'proveedor', 'otro')),
  add column if not exists entidad_externa text,
  add column if not exists servicio text,
  add column if not exists fecha_fin_vinculo date,
  add column if not exists notas_externo text;

comment on column colaboradores.tipo_externo is 'Solo para es_externo = true: tipo de vínculo (contratista, transportador, asesor, freelance, proveedor, otro).';
comment on column colaboradores.entidad_externa is 'Firma o empresa a la que pertenece el externo (p. ej. la firma del revisor fiscal).';
comment on column colaboradores.fecha_fin_vinculo is 'Fecha en que termina el contrato o servicio del externo; genera alerta de vencimiento.';

-- Los externos no tienen período de prueba ni aniversario: no generar esas alertas.
create or replace function fn_generar_alertas_ingreso_colaborador()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.es_externo then
    return new;
  end if;

  if new.tipo_contrato in ('indefinido','fijo') then
    insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, fecha_objetivo, dias_anticipacion)
    values (new.empresa_id, new.id, 'periodo_prueba_fin', 'info', 'Fin de periodo de prueba', new.fecha_ingreso + interval '2 months', 7);
  end if;

  insert into alertas (empresa_id, colaborador_id, tipo, severidad, titulo, fecha_objetivo, dias_anticipacion)
  values (new.empresa_id, new.id, 'aniversario_ingreso', 'info', 'Aniversario de ingreso', new.fecha_ingreso + interval '1 year', 7);

  return new;
end;
$$;

-- Seguimiento del externo: novedades y calificación del servicio por su responsable interno.
create table if not exists externos_seguimiento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  fecha date not null default current_date,
  calificacion int check (calificacion between 1 and 5),
  comentario text not null,
  registrado_por uuid references perfiles_usuario(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table externos_seguimiento is 'Bitácora de seguimiento a un externo: fecha, calificación opcional (1 a 5) y comentario.';
create index if not exists idx_externos_seguimiento_colab on externos_seguimiento(colaborador_id, fecha desc);

alter table externos_seguimiento enable row level security;

create policy "externos_seguimiento: admin_th gestiona" on externos_seguimiento for all
  using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

create policy "externos_seguimiento: lider ve y registra el de su gente" on externos_seguimiento for all
  using (
    empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'lider'
    and exists (select 1 from colaboradores c where c.id = externos_seguimiento.colaborador_id and c.lider_id = fn_mi_colaborador_id())
  )
  with check (
    empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'lider'
    and exists (select 1 from colaboradores c where c.id = externos_seguimiento.colaborador_id and c.lider_id = fn_mi_colaborador_id())
  );
