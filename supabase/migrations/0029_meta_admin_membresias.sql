-- ============================================================================
-- 0029_meta_admin_membresias.sql
-- Panel meta-admin de cuentas y membresías (Modelo de Negocio Espiral
-- Evolutiva secc. 5: membresía mensual según usuarios activos + rubros
-- adicionales). Es un panel interno de la alianza Flowando/Nexus/V&E, por
-- ENCIMA de admin_th (que solo administra su propia empresa cliente) — ve
-- todas las empresas.
--
-- Se implementa con una columna es_superadmin en vez de un rol_usuario
-- nuevo, porque un superadmin no pertenece a "una" empresa para efectos de
-- RLS (todas las policies existentes filtran por fn_mi_empresa_id()). El
-- panel se sirve con el cliente admin (service role, ya usado en
-- src/lib/supabase/server.ts para tareas de servidor) y se autoriza en la
-- capa de aplicación verificando este campo — no se tocan las policies
-- existentes de ninguna tabla.
-- ============================================================================

alter table perfiles_usuario add column if not exists es_superadmin boolean not null default false;
comment on column perfiles_usuario.es_superadmin is 'true solo para el equipo interno de la alianza (Flowando/Nexus/V&E) que administra cuentas y membresías de TODAS las empresas cliente, ver /meta-admin. No se otorga a usuarios de una empresa cliente.';

alter table empresas add column if not exists plan_membresia text not null default 'piloto' check (plan_membresia in ('piloto', 'estandar', 'premium'));
alter table empresas add column if not exists precio_membresia_mensual numeric;
alter table empresas add column if not exists estado_facturacion text not null default 'al_dia' check (estado_facturacion in ('al_dia', 'pendiente', 'vencido'));
alter table empresas add column if not exists fecha_proximo_pago date;

comment on column empresas.plan_membresia is 'Plan contratado de la membresía SaaS (secc. 5 del Modelo de Negocio: precio base desde 1 SMMLV según usuarios activos).';
comment on column empresas.precio_membresia_mensual is 'Valor mensual acordado con esta empresa cliente (incluye cuota de administración).';
comment on column empresas.estado_facturacion is 'Estado de pago de la membresía mensual, gestionado desde el panel meta-admin.';
comment on column empresas.fecha_proximo_pago is 'Próxima fecha de cobro de la membresía.';
