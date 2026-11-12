-- Informe de pruebas (Luisa), 4.19.1: los reconocimientos manuales dejan de tener puntos
-- libres; el líder elige una categoría del catálogo y el sistema asigna el puntaje fijo.

create table if not exists nexa_reconocimiento_categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  descripcion text,
  puntos int not null default 10 check (puntos >= 0),
  activa boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

create unique index if not exists nexa_reconocimiento_categorias_nombre_uq
  on nexa_reconocimiento_categorias (empresa_id, lower(nombre));

alter table nexa_reconocimientos
  add column if not exists categoria_id uuid references nexa_reconocimiento_categorias(id) on delete set null;

alter table nexa_reconocimiento_categorias enable row level security;

drop policy if exists "nexa_reconocimiento_categorias: lectura empresa" on nexa_reconocimiento_categorias;
create policy "nexa_reconocimiento_categorias: lectura empresa" on nexa_reconocimiento_categorias
  for select using (empresa_id = fn_mi_empresa_id());

drop policy if exists "nexa_reconocimiento_categorias: admin_th gestiona" on nexa_reconocimiento_categorias;
create policy "nexa_reconocimiento_categorias: admin_th gestiona" on nexa_reconocimiento_categorias
  for all using (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th')
  with check (empresa_id = fn_mi_empresa_id() and fn_mi_rol() = 'admin_th');

-- Catálogo inicial para cada empresa (editable desde Nexa → Reconocimientos).
insert into nexa_reconocimiento_categorias (empresa_id, nombre, descripcion, puntos, orden)
select e.id, c.nombre, c.descripcion, c.puntos, c.orden
from empresas e
cross join (values
  ('Desempeño excepcional', 'Resultados que superan claramente lo esperado en su cargo.', 50, 1),
  ('Innovación', 'Una idea o mejora que cambió la forma de hacer las cosas.', 40, 2),
  ('Trabajo en equipo', 'Apoyó a otros y sumó al resultado colectivo.', 30, 3),
  ('Servicio al cliente', 'Atención ejemplar a clientes internos o externos.', 30, 4),
  ('Vivir los valores', 'Su comportamiento refleja los valores de la empresa.', 20, 5),
  ('Seguridad (SST)', 'Cuidó su seguridad y la de los demás.', 20, 6)
) as c(nombre, descripcion, puntos, orden)
where not exists (
  select 1 from nexa_reconocimiento_categorias x where x.empresa_id = e.id and lower(x.nombre) = lower(c.nombre)
);
