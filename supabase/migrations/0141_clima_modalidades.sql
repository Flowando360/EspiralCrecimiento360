-- Informe de Luisa 11.1: dos modalidades de encuesta de clima.
--  · «pulso»: 1 afirmación por dimensión (lo de siempre), para medir tendencias seguido sin cansar a la gente.
--  · «completo»: 3 afirmaciones por dimensión, para un diagnóstico con confiabilidad estadística (alfa por dimensión).
-- Las columnas por dimensión (1 a 5) siguen existiendo: en el completo guardan el promedio redondeado de sus 3 ítems, así
-- todas las vistas y promedios actuales siguen funcionando. Las respuestas ítem por ítem van en respuestas_items (jsonb),
-- sin ninguna referencia a la persona. Idempotente.

alter table clima_rondas add column if not exists modalidad text not null default 'pulso' check (modalidad in ('pulso', 'completo'));
comment on column clima_rondas.modalidad is 'pulso = 1 afirmación por dimensión; completo = 3 por dimensión (diagnóstico con alfa por dimensión).';

alter table clima_respuestas add column if not exists respuestas_items jsonb;
comment on column clima_respuestas.respuestas_items is 'Solo en rondas completas: { dimensión: [n1, n2, n3] } con las respuestas ítem por ítem (1 a 5). Anónimo, igual que el resto de la fila.';
