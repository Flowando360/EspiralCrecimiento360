import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { Users, ArrowLeft } from 'lucide-react';
import { PanelBanco } from '@/components/reclutamiento/panel-banco';

export default async function BancoCandidatosPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider'].includes(perfil.rol)) return null;

  const supabase = createClient();
  const { data: candidatos } = await supabase
    .from('candidatos')
    .select('id, nombre_completo, correo, telefono, origen, created_at, disponible_otros_cargos, conservar_hasta, postulaciones(count)')
    .eq('empresa_id', perfil.empresa_id)
    .order('created_at', { ascending: false });

  const { data: solicitudes } = await supabase
    .from('solicitudes_titular')
    .select('id, tipo, nombre_titular, correo, detalle, recibida_en')
    .eq('empresa_id', perfil.empresa_id)
    .eq('estado', 'recibida')
    .order('recibida_en');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reclutamiento" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Reclutamiento
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Users size={22} className="text-flow-600" /> Banco de candidatos
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Todas las personas que se han postulado o se han registrado manualmente, sin importar a cuántas
          vacantes hayan aplicado.
        </p>
      </div>

      {!candidatos || candidatos.length === 0 ? (
        <div className="card p-6 text-sm text-marmol-500">Todavía no hay candidatos registrados.</div>
      ) : (
        <div className="card divide-y divide-marmol-100">
          {candidatos.map((c: any) => (
            <Link key={c.id} href={`/reclutamiento/candidatos/${c.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-marmol-50 transition">
              <div>
                <p className="font-medium text-marmol-800">{c.nombre_completo}</p>
                <p className="text-xs text-marmol-400">{[c.correo, c.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-marmol-400">{c.postulaciones?.[0]?.count ?? 0} postulación{(c.postulaciones?.[0]?.count ?? 0) === 1 ? '' : 'es'}</p>
                <p className="text-[13px] text-marmol-300 capitalize">{c.origen === 'postulacion_publica' ? 'Formulario público' : 'Manual'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {perfil.rol === 'admin_th' && (
        <PanelBanco
          candidatos={(candidatos ?? []).map((c: any) => ({
            id: c.id,
            nombre: c.nombre_completo,
            origen: c.origen,
            disponible: !!c.disponible_otros_cargos,
            conservarHasta: c.conservar_hasta,
          }))}
          solicitudes={(solicitudes ?? []).map((s: any) => ({
            id: s.id,
            tipo: s.tipo,
            nombre: s.nombre_titular,
            correo: s.correo,
            detalle: s.detalle,
            recibidaEn: s.recibida_en,
          }))}
        />
      )}
    </div>
  );
}
