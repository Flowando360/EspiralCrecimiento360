import Link from 'next/link';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { NuevoMensajeSelector } from '@/components/espiral-crecimiento/nuevo-mensaje-selector';
import { formatearFecha } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

export default async function MensajesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  const [{ data: mensajes }, { data: personas }] = await Promise.all([
    supabase
      .from('mensajes_directos')
      .select('id, remitente_id, destinatario_id, contenido, leido, created_at')
      .or(`remitente_id.eq.${perfil.usuario_id},destinatario_id.eq.${perfil.usuario_id}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('perfiles_usuario')
      .select('id, nombre_completo')
      .eq('empresa_id', perfil.empresa_id)
      .eq('activo', true)
      .neq('id', perfil.usuario_id)
      .order('nombre_completo'),
  ]);

  const nombrePorId = new Map((personas ?? []).map((p) => [p.id, p.nombre_completo]));

  // Agrupar por la otra persona de la conversación, quedándonos con el
  // mensaje más reciente de cada una (los mensajes ya vienen ordenados desc).
  const conversaciones = new Map<
    string,
    { otroId: string; ultimoContenido: string; ultimaFecha: string; noLeidos: number }
  >();
  for (const m of mensajes ?? []) {
    const otroId = m.remitente_id === perfil.usuario_id ? m.destinatario_id : m.remitente_id;
    if (!conversaciones.has(otroId)) {
      conversaciones.set(otroId, { otroId, ultimoContenido: m.contenido, ultimaFecha: m.created_at, noLeidos: 0 });
    }
    if (m.destinatario_id === perfil.usuario_id && !m.leido) {
      conversaciones.get(otroId)!.noLeidos++;
    }
  }

  const listaConversaciones = [...conversaciones.values()];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Mensajes</h1>
          <p className="text-sm text-marmol-500 mt-1">Mensajería directa, distinta del feed corporativo.</p>
        </div>
        <NuevoMensajeSelector personas={personas ?? []} />
      </div>

      {listaConversaciones.length === 0 ? (
        <EmptyState icon={MessageCircle} titulo="Sin conversaciones todavía" descripcion="Usa 'Nuevo mensaje' para escribirle a alguien de tu empresa." />
      ) : (
        <div className="card overflow-hidden">
          {listaConversaciones.map((c) => (
            <Link
              key={c.otroId}
              href={`/mensajes/${c.otroId}`}
              className="flex items-center justify-between gap-3 px-4 py-3 border-b border-marmol-100 last:border-0 hover:bg-marmol-50 transition"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-marmol-900">{nombrePorId.get(c.otroId) ?? 'Usuario'}</p>
                <p className="text-xs text-marmol-500 truncate">{c.ultimoContenido}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-marmol-400">{formatearFecha(c.ultimaFecha)}</span>
                {c.noLeidos > 0 && (
                  <span className="h-5 min-w-5 rounded-full bg-flow-500 text-white text-[10px] flex items-center justify-center px-1.5">
                    {c.noLeidos}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
