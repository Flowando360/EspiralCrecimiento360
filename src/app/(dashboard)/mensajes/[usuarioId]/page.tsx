import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { HiloMensajes, type MensajeItem } from '@/components/espiral-crecimiento/hilo-mensajes';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default async function HiloMensajePage({ params }: { params: { usuarioId: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const { data: otraPersona } = await supabase
    .from('perfiles_usuario')
    .select('id, nombre_completo, empresa_id')
    .eq('id', params.usuarioId)
    .maybeSingle();

  if (!otraPersona || otraPersona.empresa_id !== perfil.empresa_id) notFound();

  const { data: mensajesRaw } = await supabase
    .from('mensajes_directos')
    .select('id, remitente_id, contenido, created_at')
    .or(
      `and(remitente_id.eq.${perfil.usuario_id},destinatario_id.eq.${params.usuarioId}),and(remitente_id.eq.${params.usuarioId},destinatario_id.eq.${perfil.usuario_id})`
    )
    .order('created_at', { ascending: true });

  // Marca como leídos los mensajes que esta persona me envió, al abrir el hilo.
  await supabase
    .from('mensajes_directos')
    .update({ leido: true, leido_en: new Date().toISOString() })
    .eq('destinatario_id', perfil.usuario_id)
    .eq('remitente_id', params.usuarioId)
    .eq('leido', false);

  const mensajes: MensajeItem[] = (mensajesRaw ?? []).map((m) => ({
    id: m.id,
    contenido: m.contenido,
    created_at: m.created_at,
    esMio: m.remitente_id === perfil.usuario_id,
  }));

  return (
    <div className="max-w-2xl">
      <Link href="/mensajes" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-3">
        <ArrowLeft size={12} /> Todas las conversaciones
      </Link>
      <h1 className="font-display text-xl font-semibold text-secundario mb-4">{otraPersona.nombre_completo}</h1>

      <HiloMensajes destinatarioId={params.usuarioId} itemsIniciales={mensajes} />
    </div>
  );
}
