-- ============================================================================
-- 0085_indicadores_datos_demo.sql
-- Datos ficticios de la Matriz de indicadores, para que el Índice de
-- Madurez del mapa de procesos y el Informe de Revisión por la Dirección
-- tengan datos reales que mostrar — mismo criterio que 0077/0082.
-- ============================================================================

insert into indicadores_proceso (id, proceso_id, nombre, formula, meta, unidad, sentido, frecuencia_medicion) values
('28000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Cobertura de Encuentros de Crecimiento realizados', 'Encuentros realizados / Encuentros programados', 90, 'porcentaje', 'mayor_mejor', 'trimestral'),
('28000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', 'Tiempo promedio de contratación', 'Días entre apertura de vacante y firma de contrato', 20, 'dias', 'menor_mejor', 'trimestral'),
('28000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Cumplimiento del cronograma SST', 'Actividades SST ejecutadas / Actividades SST programadas', 95, 'porcentaje', 'mayor_mejor', 'trimestral')
on conflict (id) do nothing;

insert into mediciones_indicador (id, indicador_id, periodo, valor, fecha_medicion) values
('29000000-0000-0000-0000-000000000001', '28000000-0000-0000-0000-000000000001', 'Q2 2026', 85, '2026-06-30'),
('29000000-0000-0000-0000-000000000002', '28000000-0000-0000-0000-000000000001', 'Q3 2026', 78, '2026-09-15'),
('29000000-0000-0000-0000-000000000003', '28000000-0000-0000-0000-000000000002', 'Q2 2026', 25, '2026-06-30'),
('29000000-0000-0000-0000-000000000004', '28000000-0000-0000-0000-000000000002', 'Q3 2026', 18, '2026-09-10'),
('29000000-0000-0000-0000-000000000005', '28000000-0000-0000-0000-000000000003', 'Q2 2026', 91, '2026-06-30'),
('29000000-0000-0000-0000-000000000006', '28000000-0000-0000-0000-000000000003', 'Q3 2026', 88, '2026-09-12')
on conflict (id) do nothing;
