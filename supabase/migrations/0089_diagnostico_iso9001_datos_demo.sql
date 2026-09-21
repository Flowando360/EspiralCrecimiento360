-- ============================================================================
-- 0089_diagnostico_iso9001_datos_demo.sql
-- Datos ficticios de dos corridas del Diagnóstico ISO 9001:2015 para la
-- empresa piloto, para poder mostrar el módulo funcionando: una de hace
-- ~7 meses (antes de tener el módulo de Procesos completo, con varios
-- numerales en No cumple) y una reciente (después de Mapa de procesos,
-- Gestión documental, Riesgos, Auditorías y ACPM), que muestra la mejora.
--
-- Escrita con ON CONFLICT DO NOTHING para poder correrse más de una vez sin
-- error, igual que las migraciones anteriores del módulo.
-- ============================================================================

insert into diagnosticos_iso9001 (id, empresa_id, fecha, realizado_por, estado, created_at) values
(
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  current_date - interval '210 days',
  (select id from colaboradores where empresa_id = '00000000-0000-0000-0000-000000000001' and estado = 'activo' order by nombre_completo limit 1),
  'completado',
  now() - interval '210 days'
),
(
  '30000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  current_date - interval '10 days',
  (select id from colaboradores where empresa_id = '00000000-0000-0000-0000-000000000001' and estado = 'activo' order by nombre_completo limit 1),
  'completado',
  now() - interval '10 days'
)
on conflict (id) do nothing;

-- ── Diagnóstico anterior (hace ~7 meses) ──

insert into diagnostico_iso9001_respuestas (diagnostico_id, item_id, nivel, observacion)
select '30000000-0000-0000-0000-000000000001', i.id, v.nivel, v.observacion
from diagnostico_iso9001_items i
join (values
  ('4.1', 'cumple_parcial', 'Se identifican algunas cuestiones del contexto de forma informal, sin documentarlo.'),
  ('4.2', 'cumple_parcial', null),
  ('4.3', 'no_cumple', 'El alcance del SGC no está definido por escrito todavia.'),
  ('4.4', 'cumple_parcial', 'Hay un mapa de procesos incompleto, sin caracterización de todos.'),
  ('5.1', 'cumple', null),
  ('5.2', 'cumple', null),
  ('5.3', 'cumple_parcial', null),
  ('6.1', 'no_cumple', 'No existe una matriz de riesgos y oportunidades formal.'),
  ('6.2', 'cumple_parcial', null),
  ('6.3', 'no_cumple', null),
  ('7.1', 'cumple', null),
  ('7.2', 'cumple_parcial', null),
  ('7.3', 'cumple_parcial', null),
  ('7.4', 'cumple_parcial', null),
  ('7.5', 'no_cumple', 'La gestion documental se hace por correo, sin control de versiones.'),
  ('8.1', 'cumple_parcial', null),
  ('8.2', 'cumple', null),
  ('8.3', 'no_aplica', 'No aplica: la organizacion no disena productos.'),
  ('8.4', 'cumple_parcial', null),
  ('8.5', 'cumple', null),
  ('8.6', 'cumple_parcial', null),
  ('8.7', 'no_cumple', null),
  ('9.1', 'cumple_parcial', null),
  ('9.2', 'no_cumple', 'No se han ejecutado auditorias internas todavia.'),
  ('9.3', 'no_cumple', 'La revision por la direccion es informal, sin registro.'),
  ('10.1', 'cumple_parcial', null),
  ('10.2', 'no_cumple', 'Se resuelven no conformidades pero sin dejar registro ni validar eficacia.'),
  ('10.3', 'cumple_parcial', null)
) as v(numeral, nivel, observacion) on v.numeral = i.numeral
on conflict (diagnostico_id, item_id) do nothing;

-- ── Diagnóstico reciente (hace ~10 días, con el módulo de Procesos ya construido) ──

insert into diagnostico_iso9001_respuestas (diagnostico_id, item_id, nivel, observacion)
select '30000000-0000-0000-0000-000000000002', i.id, v.nivel, v.observacion
from diagnostico_iso9001_items i
join (values
  ('4.1', 'cumple', null),
  ('4.2', 'cumple', null),
  ('4.3', 'cumple', 'Definido en el mapa de procesos y la caracterizacion de cada uno.'),
  ('4.4', 'cumple', 'Mapa de procesos completo, con interacciones y caracterizacion SIPOC.'),
  ('5.1', 'cumple', null),
  ('5.2', 'cumple', null),
  ('5.3', 'cumple', null),
  ('6.1', 'cumple', 'Matriz de riesgos y oportunidades con ciclo de revision periodica.'),
  ('6.2', 'cumple_parcial', 'Faltan objetivos de calidad medibles para todos los procesos.'),
  ('6.3', 'cumple', 'Gestion de cambio con evaluacion de impacto antes de aprobar.'),
  ('7.1', 'cumple', null),
  ('7.2', 'cumple_parcial', 'Falta consolidar la matriz de competencias por cargo.'),
  ('7.3', 'cumple_parcial', null),
  ('7.4', 'cumple', 'Feed corporativo y difusion automatica de documentos nuevos.'),
  ('7.5', 'cumple', 'Gestion documental digitalizada con control de versiones y confirmacion de lectura.'),
  ('8.1', 'cumple', null),
  ('8.2', 'cumple', null),
  ('8.3', 'no_aplica', 'No aplica: la organizacion no disena productos.'),
  ('8.4', 'cumple_parcial', 'Falta un criterio formal de evaluacion de proveedores.'),
  ('8.5', 'cumple', null),
  ('8.6', 'cumple', null),
  ('8.7', 'cumple_parcial', null),
  ('9.1', 'cumple', 'Matriz de indicadores por proceso con historico de mediciones.'),
  ('9.2', 'cumple', 'Auditorias internas con tablero de hallazgos.'),
  ('9.3', 'cumple', 'Informe de Revision por la Direccion auto-generado cada periodo.'),
  ('10.1', 'cumple', null),
  ('10.2', 'cumple', 'ACPM con ciclo completo de validacion de eficacia.'),
  ('10.3', 'cumple_parcial', null)
) as v(numeral, nivel, observacion) on v.numeral = i.numeral
on conflict (diagnostico_id, item_id) do nothing;
