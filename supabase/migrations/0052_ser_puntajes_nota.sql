-- ============================================================================
-- 0052_ser_puntajes_nota.sql
--
-- Complementa el puntaje 1-5 de cada aspecto no sensible con una nota corta
-- (frase, no párrafo) que resume el resultado real de la Guía del Flow para
-- ese aspecto — sigue sin ser el texto de FlowAndo copiado tal cual, es una
-- paráfrasis breve que admin_th escribe (o que se carga junto con el
-- puntaje). Sirve como insumo para generarInformesSer(): un puntaje solo
-- ("Comunicación: 4/5") no le da a la IA nada concreto sobre esa persona;
-- con la nota, el informe generado refleja de verdad su perfil.
-- ============================================================================

alter table ser_puntajes add column nota text;

comment on column ser_puntajes.nota is 'Frase corta (no párrafo) que resume el resultado de este aspecto no sensible, para enriquecer el informe generado por IA. Igual que el puntaje: solo admin_th la carga, nunca un aspecto sensible (bloqueado por la misma RLS de ser_puntajes).';
