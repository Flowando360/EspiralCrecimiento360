-- ============================================================================
-- 0082_fase2_datos_demo.sql
-- Datos ficticios para demostrar la fase 2 del módulo de Procesos (Riesgos
-- con ciclo de revisión, Auditorías internas + hallazgos, ACPM, Gestión de
-- cambio) en la empresa piloto Flow, Nexus y Visión — a pedido del cliente,
-- igual que 0077.
--
-- Usa los procesos demo creados en 0077 (prefijo 20000000-…). Referencias a
-- colaboradores, cuando aplica, se resuelven con subconsultas dinámicas en
-- vez de UUID fijos (mismo criterio de 0077).
-- ============================================================================

-- ── Riesgos y oportunidades con ciclo de revisión ──────────────────────────

insert into matriz_riesgos_controles (id, empresa_id, proceso_id, marco_normativo, tipo, riesgo, categoria_riesgo, probabilidad, impacto, control, frecuencia_revision, fecha_ultima_revision, riesgo_residual) values
('22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'interno', 'riesgo', 'Rotación de personal en cargos críticos sin plan de sucesión', 'Talento humano', 'media', 'alto', 'Plan de sucesión para cargos críticos', 'semestral', current_date - interval '8 months', 'medio'),
('22000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'sst', 'riesgo', 'Incumplimiento del cronograma anual de actividades SST', 'SST', 'alta', 'alto', 'Auditorías SST trimestrales y seguimiento al cronograma', 'trimestral', current_date - interval '1 month', 'medio'),
('22000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'interno', 'oportunidad', 'Automatizar el filtro inicial de hojas de vida con IA para reducir tiempo de selección', 'Reclutamiento', 'media', 'alto', null, 'anual', current_date - interval '15 days', null),
('22000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'interno', 'riesgo', 'Tratamiento inadecuado de datos personales de candidatos durante el proceso de selección', 'Protección de datos', 'baja', 'alto', 'Política de tratamiento de datos personales', 'anual', null, null)
on conflict (id) do nothing;

-- ── Auditorías internas ─────────────────────────────────────────────────────

insert into auditorias_internas (id, empresa_id, codigo, objetivo, alcance, marco_normativo, auditor_externo_nombre, fecha_planeada, fecha_ejecutada, estado) values
('23000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'AI-001', 'Auditoría integral del SGC — ciclo 2026', 'Procesos misionales (Talento Humano, Formación y Desarrollo, Reclutamiento y Selección) y su documentación asociada', 'iso_9001', 'Laura Gómez — Bureau Veritas', '2026-08-15', '2026-08-20', 'cerrada'),
('23000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'AI-002', 'Auditoría del Sistema de Gestión de Seguridad y Salud en el Trabajo', 'Cronograma anual SST y su ejecución', 'sst', null, '2026-10-10', null, 'planeada')
on conflict (id) do nothing;

insert into auditoria_procesos (auditoria_id, proceso_id) values
('23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004'),
('23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005'),
('23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006'),
('23000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003')
on conflict do nothing;

insert into hallazgos_auditoria (id, auditoria_id, proceso_id, codigo, tipo, descripcion, requisito_incumplido, estado, fecha_deteccion, fecha_cierre) values
('24000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'H-AI-001-01', 'no_conformidad_menor', 'No se evidencia registro de retroalimentación en 3 de 10 Encuentros de Crecimiento revisados en la muestra', 'ISO 9001 — 9.1 Seguimiento, medición, análisis y evaluación', 'cerrado', '2026-08-20', '2026-09-05'),
('24000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'H-AI-001-02', 'observacion', 'El plan de formación del período no referencia explícitamente las brechas detectadas en el ciclo de evaluación anterior', null, 'seguimiento', '2026-08-20', null),
('24000000-0000-0000-0000-000000000003', '23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'H-AI-001-03', 'no_conformidad_mayor', 'No existe evidencia de verificación de referencias laborales en el 40% de las contrataciones revisadas en el período', 'ISO 9001 — 8.5.1 Control de la producción y de la provisión del servicio', 'plan_accion', '2026-08-20', null),
('24000000-0000-0000-0000-000000000004', '23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'H-AI-001-04', 'oportunidad_mejora', 'Se podría automatizar el envío de recordatorios de Encuentros de Crecimiento próximos a vencer', null, 'abierto', '2026-08-20', null)
on conflict (id) do nothing;

-- ── ACPM (dos originadas en hallazgos, una en un riesgo, una de mejora propia) ──

insert into acpm (id, empresa_id, proceso_id, codigo, origen_tipo, origen_hallazgo_id, origen_riesgo_id, origen_detalle, tipo_accion, descripcion, metodologia_causa, analisis_causa, estado, eficaz, fecha_registro, fecha_compromiso, fecha_cierre) values
('25000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'ACPM-001', 'hallazgo_auditoria', '24000000-0000-0000-0000-000000000001', null, null, 'correctiva', 'Corregir la omisión de registro de retroalimentación en los Encuentros de Crecimiento', 'cinco_porques', 'La plantilla del acta no tiene un campo obligatorio de retroalimentación, así que algunos líderes lo omiten sin darse cuenta.', 'cerrada_efectiva', true, '2026-08-21', '2026-09-01', '2026-09-10'),
('25000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'ACPM-002', 'hallazgo_auditoria', '24000000-0000-0000-0000-000000000003', null, null, 'correctiva', 'Implementar verificación obligatoria de referencias laborales antes de pasar un candidato a la etapa de oferta', 'ishikawa', 'Falta un paso de control obligatorio en el tablero de Reclutamiento antes de mover un candidato a "Oferta".', 'validacion_eficacia', null, '2026-08-21', '2026-09-15', null),
('25000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'ACPM-003', 'mejora_propia', null, null, 'Propuesta del equipo de Talento Humano', 'mejora', 'Automatizar el envío de recordatorios de Encuentros de Crecimiento próximos a vencer', null, null, 'plan_accion', null, '2026-09-01', '2026-10-01', null),
('25000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'ACPM-004', 'riesgo', null, '22000000-0000-0000-0000-000000000001', null, 'preventiva', 'Diseñar el plan de sucesión para los cargos críticos de la organización', null, null, 'registrada', null, current_date, null, null)
on conflict (id) do nothing;

insert into tareas_acpm (id, acpm_id, descripcion, completada, orden) values
('26000000-0000-0000-0000-000000000001', '25000000-0000-0000-0000-000000000001', 'Agregar campo obligatorio de retroalimentación a la plantilla del acta', true, 1),
('26000000-0000-0000-0000-000000000002', '25000000-0000-0000-0000-000000000001', 'Capacitar a los líderes en el nuevo campo', true, 2),
('26000000-0000-0000-0000-000000000003', '25000000-0000-0000-0000-000000000002', 'Agregar etapa de verificación de referencias al tablero de Reclutamiento', true, 1),
('26000000-0000-0000-0000-000000000004', '25000000-0000-0000-0000-000000000002', 'Auditar 10 contrataciones recientes con la nueva etapa', true, 2),
('26000000-0000-0000-0000-000000000005', '25000000-0000-0000-0000-000000000002', 'Validar el resultado con el líder de Reclutamiento', false, 3),
('26000000-0000-0000-0000-000000000006', '25000000-0000-0000-0000-000000000003', 'Definir las reglas de recordatorio (cuándo y a quién notificar)', false, 1)
on conflict (id) do nothing;

-- ── Gestión de cambio ────────────────────────────────────────────────────────

insert into solicitudes_cambio (id, proceso_id, codigo, titulo, descripcion, tipo_cambio, motivo, impacto, evaluacion, estado, fecha_solicitud, fecha_implementacion) values
('27000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'CAM-PM-1-001', 'Cambiar la periodicidad de los Encuentros de Crecimiento de anual a semestral', 'Pasar de un ciclo anual a uno semestral para dar retroalimentación más frecuente.', 'proceso', 'La retroalimentación más frecuente mejora el desarrollo del talento y reduce sorpresas en la evaluación final.', null, null, 'solicitado', now() - interval '3 days', null),
('27000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000009', 'CAM-PA-2-001', 'Migrar el módulo de video de Nexa a un nuevo proveedor', 'Cambiar el proveedor de hosting de video usado en Formación y Desarrollo.', 'sistema', 'El proveedor actual subió sus precios significativamente en la última renovación.', 'medio', 'Se evaluó con Tecnología: la migración toma aproximadamente 2 semanas y no afecta el historial de cursos completados.', 'aprobado', now() - interval '10 days', null),
('27000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'CAM-PE-3-001', 'Actualizar la Política de Gestión de Riesgos para incluir oportunidades', 'Ampliar el alcance de la política para cubrir explícitamente oportunidades, no solo riesgos.', 'documento', 'Alinear con la versión de ISO 9001 ya implementada en la plataforma (numeral 6.1).', 'bajo', 'Cambio de bajo impacto — la matriz de riesgos de la plataforma ya soporta el tipo "oportunidad".', 'implementado', now() - interval '20 days', current_date - 5)
on conflict (id) do nothing;
