import { createAdminClient } from '@/lib/supabase/server';
import { FormularioPostulacionPublica } from '@/components/reclutamiento/formulario-postulacion-publica';
import { Briefcase, MapPin, Clock, FileText } from 'lucide-react';
import { ETIQUETA_MODALIDAD } from '@/lib/reclutamiento/oferta';

// Siempre se lee el estado actual de la vacante: si se cubre o se cierra, el enlace público debe dejar de aceptar postulaciones al instante.
export const dynamic = 'force-dynamic';

export default async function PostularPage({ params }: { params: { vacanteId: string } }) {
  const supabase = createAdminClient();
  const { data: vacante } = await supabase
    .from('vacantes')
    .select('id, titulo, descripcion, modalidad, ciudad, horario, tipo_contrato, requisitos, beneficios, estado, empresa:empresas(nombre), cargo:cargos(nombre)')
    .eq('id', params.vacanteId)
    .maybeSingle();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-9 w-9 rounded-lg bg-crecimiento flex items-center justify-center text-white">
            <Briefcase size={18} />
          </div>
          <p className="font-display text-lg font-semibold text-secundario">
            {(vacante?.empresa as any)?.nombre ?? 'Espiral Evolutiva 360°'}
          </p>
        </div>

        {!vacante ? (
          <div className="card p-6 text-center text-sm text-marmol-500">Esta vacante no existe o el enlace es incorrecto.</div>
        ) : vacante.estado !== 'abierta' ? (
          <div className="card p-6 text-center text-sm text-marmol-500">
            Esta vacante ya no está recibiendo postulaciones. Gracias por tu interés.
          </div>
        ) : (
          <div className="card p-6">
            <h1 className="font-display text-xl font-semibold text-secundario">{vacante.titulo}</h1>
            <p className="text-sm text-marmol-500 mt-1">{(vacante.cargo as any)?.nombre ? `Cargo: ${(vacante.cargo as any).nombre}` : ''}</p>
            {(() => {
              const v = vacante as any;
              const datos = [
                v.modalidad && { icono: <MapPin size={13} />, texto: ETIQUETA_MODALIDAD[v.modalidad] ?? v.modalidad },
                v.ciudad && { icono: <MapPin size={13} />, texto: v.ciudad },
                v.horario && { icono: <Clock size={13} />, texto: v.horario },
                v.tipo_contrato && { icono: <FileText size={13} />, texto: v.tipo_contrato },
              ].filter(Boolean) as { icono: JSX.Element; texto: string }[];
              return (
                <div className="mt-3 mb-5 space-y-3 text-sm text-marmol-700">
                  {datos.length > 0 && (
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-marmol-500">
                      {datos.map((d, i) => (
                        <li key={i} className="inline-flex items-center gap-1">{d.icono} {d.texto}</li>
                      ))}
                    </ul>
                  )}
                  {v.descripcion && <p className="whitespace-pre-wrap">{v.descripcion}</p>}
                  {v.requisitos && (
                    <div>
                      <p className="font-medium text-marmol-800">Requisitos</p>
                      <p className="whitespace-pre-wrap">{v.requisitos}</p>
                    </div>
                  )}
                  {v.beneficios && (
                    <div>
                      <p className="font-medium text-marmol-800">Beneficios</p>
                      <p className="whitespace-pre-wrap">{v.beneficios}</p>
                    </div>
                  )}
                </div>
              );
            })()}
            <FormularioPostulacionPublica vacanteId={vacante.id} nombreEmpresa={(vacante.empresa as any)?.nombre ?? 'la empresa'} />
          </div>
        )}
      </div>
    </div>
  );
}
