import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { obtenerUrlFirmadaHojaVidaCandidato } from '@/lib/supabase/storage';
import { notFound } from 'next/navigation';
import { PanelReferencias } from '@/components/reclutamiento/panel-referencias';
import { ArrowLeft, User, FileText, Briefcase } from 'lucide-react';

const ETAPA_LABEL: Record<string, string> = {
  recibido: 'Recibido',
  entrevista: 'Entrevista',
  prueba: 'Prueba',
  oferta: 'Oferta',
  contratado: 'Contratado',
  descartado: 'Descartado',
};

export default async function FichaCandidatoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider'].includes(perfil.rol)) return null;

  const supabase = createClient();
  const { data: candidato } = await supabase
    .from('candidatos')
    .select('id, empresa_id, nombre_completo, numero_documento, correo, telefono, hoja_vida_url, linkedin_url, notas, origen, created_at')
    .eq('id', params.id)
    .maybeSingle();

  if (!candidato || candidato.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: postulaciones }, { data: referencias }, urlHojaVida] = await Promise.all([
    supabase
      .from('postulaciones')
      .select('id, etapa, calificacion, created_at, vacante:vacantes(id, titulo)')
      .eq('candidato_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('referencias_candidato')
      .select('id, nombre_referencia, telefono_referencia, relacion, verificada, notas, verificado_en')
      .eq('candidato_id', params.id)
      .order('created_at', { ascending: false }),
    obtenerUrlFirmadaHojaVidaCandidato(candidato.hoja_vida_url),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/reclutamiento/candidatos" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver al banco de candidatos
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <User size={22} className="text-flow-600" /> {candidato.nombre_completo}
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          {[candidato.correo, candidato.telefono, candidato.numero_documento].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
        </p>
      </div>

      <div className="card p-5 space-y-2">
        <h2 className="font-display font-semibold text-secundario mb-1 flex items-center gap-1.5">
          <FileText size={16} /> Hoja de vida
        </h2>
        {urlHojaVida ? (
          <a href={urlHojaVida} target="_blank" rel="noopener noreferrer" className="text-sm text-flow-600 hover:underline">
            Ver / descargar hoja de vida
          </a>
        ) : (
          <p className="text-sm text-marmol-400">Sin hoja de vida cargada.</p>
        )}
        {candidato.linkedin_url && (
          <p className="text-sm">
            <a href={candidato.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-flow-600 hover:underline">
              Perfil de LinkedIn
            </a>
          </p>
        )}
        {candidato.notas && <p className="text-sm text-marmol-600 mt-2">{candidato.notas}</p>}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3 flex items-center gap-1.5">
          <Briefcase size={16} /> Postulaciones
        </h2>
        {!postulaciones || postulaciones.length === 0 ? (
          <p className="text-sm text-marmol-400">Sin postulaciones registradas.</p>
        ) : (
          <ul className="space-y-2">
            {postulaciones.map((p: any) => (
              <li key={p.id}>
                <Link href={`/reclutamiento/vacantes/${p.vacante.id}`} className="flex items-center justify-between text-sm hover:text-flow-600">
                  <span>{p.vacante.titulo}</span>
                  <span className="text-xs text-marmol-400">
                    {ETAPA_LABEL[p.etapa]} {p.calificacion != null ? `· ${p.calificacion}/10` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PanelReferencias candidatoId={candidato.id} referencias={referencias ?? []} puedeAdministrar={perfil.rol === 'admin_th'} />
    </div>
  );
}
