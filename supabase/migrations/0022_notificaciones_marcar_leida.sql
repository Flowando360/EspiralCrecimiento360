-- ============================================================================
-- La tabla notificaciones ya tenía "leido"/"leido_en" desde 0003_alertas.sql,
-- pero nunca se construyó el centro in-app que las mostrara ni la policy
-- para que cada quien marque las suyas como leídas (solo existía "cada
-- quien ve las suyas" para select, y "admin_th todo" para el resto).
-- ============================================================================

create policy "notificaciones: cada quien marca las suyas como leidas" on notificaciones for update
  using (destinatario_usuario_id = auth.uid());
