-- Informe de Luisa 4.18.1: el catálogo de formación deja de estar concentrado en SST.
-- Se amplían las categorías permitidas (liderazgo, habilidades blandas, cumplimiento normativo). Idempotente.

alter table nexa_cursos drop constraint if exists nexa_cursos_categoria_check;
alter table nexa_cursos add constraint nexa_cursos_categoria_check
  check (categoria in (
    'induccion_sst', 'alturas', 'manejo_cargas', 'epp', 'protocolos_emergencia',
    'cultura', 'tecnico', 'liderazgo', 'habilidades_blandas', 'cumplimiento_normativo', 'otro'
  ));
