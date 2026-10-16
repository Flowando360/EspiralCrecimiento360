import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { obtenerUrlFirmadaHojaVidaCandidato } from '@/lib/supabase/storage';
import { notFound } from 'next/navigation';
import { PanelReferencias } from '@/components/reclutamiento/panel-referencias';
import { EditarCandidato, SubirHojaVidaCandidato } from '@/components/reclutamiento/editar-candidato';
import { CalificacionEstrellas } from '@/components/reclutamiento/calificacion-estrellas';
import { PanelHojaVidaIA } from '@/components/reclutamiento/panel-hoja-vida-ia';
import { DatosEstructurados } from '@/components/reclutamiento/datos-estructurados';
import { ArrowLeft, User, FileText, Briefcase } from 'lucide-react';

const ETAPA_LABEL: Record<string, string> = {
  recibido: 'Recibido',
  preseleccionado: 'Preseleccionado',
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
    .select('id, empresa_id, nombre_completo, numero_documento, correo, telefono, hoja_vida_url, linkedin_url, notas, origen, created_at, ciudad, pais, profesion, resumen_profesional, anios_experiencia_total')
    .eq('id', params.id)
    .maybeSingle();

  if (!candidato || candidato.empresa_id !== perfil.empresa_id) notFound();

  const esAdmin = perfil.rol === 'admin_th';
  const [
    { data: postulaciones },
    { data: referencias },
    urlHojaVida,
    { data: trabajo },
    { data: resultado },
    { data: educacion },
    { data: experiencia },
    { data: competencias },
    { data: idiomas },
    { data: certificaciones },
  ] = await Promise.all([
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
    // La lectura con IA es información interna de Talento Humano (RLS la limita a admin_th).
    supabase
      .from('ai_processing_jobs')
      .select('id, estado, intentos, max_intentos, ultimo_error')
      .eq('candidato_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('ai_extraction_results')
      .select('campos_faltantes, conflictos, revision_requerida')
      .eq('candidato_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('candidato_educacion').select('*').eq('candidato_id', params.id).eq('activo', true).order('fecha_inicio', { ascending: false }),
    supabase.from('candidato_experiencia').select('*').eq('candidato_id', params.id).eq('activo', true).order('fecha_inicio', { ascending: false }),
    supabase.from('candidato_competencias').select('*').eq('candidato_id', params.id).eq('activo', true).order('nombre'),
    supabase.from('candidato_idiomas').select('*').eq('candidato_id', params.id).eq('activo', true).order('idioma'),
    supabase.from('candidato_certificaciones').select('*').eq('candidato_id', params.id).eq('activo', true).order('nombre'),
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
        {(candidato.profesion || candidato.anios_experiencia_total != null || candidato.ciudad) && (
          <p className="text-sm text-marmol-600 mt-1">
            {[candidato.profesion, candidato.ciudad, candidato.pais].filter(Boolean).join(' · ')}
            {candidato.anios_experiencia_total != null && ` · ${Number(candidato.anios_experiencia_total)} años de experiencia documentados`}
          </p>
        )}
        {candidato.resumen_profesional && <p className="text-sm text-marmol-500 mt-2 max-w-2xl">{candidato.resumen_profesional}</p>}
      </div>

      <div className="card p-5 space-y-2">
        <h2 className="font-display font-semibold text-secundario mb-1 flex items-center gap-1.5">
          <FileText size={16} /> Hoja de vida y datos de contacto
        </h2>
        {urlHojaVida ? (
          <a href={urlHojaVida} target="_blank" rel="noopener noreferrer" className="text-sm text-flow-600 hover:underline block">
            Ver / descargar hoja de vida
          </a>
        ) : (
          <p className="text-sm text-marmol-400">Sin hoja de vida cargada.</p>
        )}
        {perfil.rol === 'admin_th' && <SubirHojaVidaCandidato candidatoId={candidato.id} />}
        {candidato.linkedin_url && (
          <p className="text-sm">
            <a href={candidato.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-flow-600 hover:underline">
              Perfil de LinkedIn
            </a>
          </p>
        )}
        {candidato.notas && <p className="text-sm text-marmol-600 mt-2 whitespace-pre-wrap">{candidato.notas}</p>}

        {perfil.rol === 'admin_th' && (
          <div className="pt-2 border-t border-marmol-100 mt-2">
            <EditarCandidato
              candidatoId={candidato.id}
              datosIniciales={{
                nombreCompleto: candidato.nombre_completo,
                correo: candidato.correo ?? '',
                telefono: candidato.telefono ?? '',
                linkedinUrl: candidato.linkedin_url ?? '',
                notas: candidato.notas ?? '',
              }}
            />
          </div>
        )}
      </div>

      {esAdmin && (
        <PanelHojaVidaIA
          candidatoId={candidato.id}
          trabajo={trabajo}
          resultado={resultado ? { ...resultado, conflictos: (resultado.conflictos as unknown as { campo: string; descripcion: string }[]) ?? [], campos_faltantes: resultado.campos_faltantes ?? [] } : null}
          puedeAdministrar={esAdmin}
          tieneHojaVida={!!candidato.hoja_vida_url}
        />
      )}

      <DatosEstructurados
        candidatoId={candidato.id}
        puedeRevisar={esAdmin}
        educacion={(educacion ?? []) as any}
        experiencia={(experiencia ?? []) as any}
        competencias={(competencias ?? []) as any}
        idiomas={(idiomas ?? []) as any}
        certificaciones={(certificaciones ?? []) as any}
      />

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
                  <span className="flex items-center gap-2 text-xs text-marmol-400">
                    {ETAPA_LABEL[p.etapa]}
                    {p.calificacion != null && <CalificacionEstrellas valor={p.calificacion} soloLectura tamano={12} />}
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
