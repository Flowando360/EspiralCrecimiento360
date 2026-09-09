-- ============================================================================
-- Notebook personal de aprendizaje (especificacion-funcional.md 4.4, 8.2):
-- espacio de apuntes propios dentro de Nexa/Formación. Es estrictamente
-- privado — a diferencia del resto de tablas del sistema, aquí ni admin_th
-- tiene acceso de lectura: son notas personales, no un registro de gestión
-- humana.
-- ============================================================================

create table notebook_notas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles_usuario(id) on delete cascade,
  titulo text not null,
  contenido text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table notebook_notas is 'Apuntes personales del colaborador dentro de Nexa/Formación. Privado: solo el dueño puede leerlos o escribirlos, ni siquiera admin_th.';

create index idx_notebook_notas_usuario on notebook_notas(usuario_id, updated_at desc);

alter table notebook_notas enable row level security;

create policy "notebook_notas: solo el dueño" on notebook_notas for all
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
