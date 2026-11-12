-- Modelo integral (§6.5, §9.3), Fase 1 parte 5: criterios congelados por ciclo.
-- Al generar una evaluación se guarda una "foto" de lo que la rige (guía de valoración por nivel, mínimo crítico y su
-- justificación en cada ítem; pesos de Saber/Hacer/Deber del nivel de cargo en la evaluación). Así, cambiar después el
-- catálogo de competencias o los pesos NO altera el resultado de ciclos ya abiertos: cada ciclo se juzga con las reglas
-- con que se abrió. Idempotente.

alter table evaluacion_items add column if not exists criterios_congelados jsonb;
alter table evaluaciones add column if not exists pesos_integral_congelados jsonb;

comment on column evaluacion_items.criterios_congelados is 'Foto del criterio al generar la evaluación: {criterios:[{nivel,criterio}], umbral_critico, umbral_justificacion, congelado_en}. Los lectores la prefieren sobre el catálogo vivo.';
comment on column evaluaciones.pesos_integral_congelados is 'Pesos {saber,hacer,deber,personalizados,nivel_cargo,congelado_en} del índice integral vigentes al generar la evaluación. Null = evaluación anterior a esta función (se usan los pesos vigentes).';

-- Evaluaciones ya generadas: se congela lo que hay hoy (es lo mejor que se puede reconstruir).
update evaluacion_items i
set criterios_congelados = jsonb_build_object(
  'criterios', coalesce((select jsonb_agg(jsonb_build_object('nivel', cc.nivel, 'criterio', cc.criterio) order by cc.nivel)
                         from competencia_criterios cc where cc.competencia_id = c.id), '[]'::jsonb),
  'umbral_critico', c.umbral_critico,
  'umbral_justificacion', c.umbral_justificacion,
  'congelado_en', now()
)
from competencias c
where c.id = i.competencia_id and i.criterios_congelados is null;
