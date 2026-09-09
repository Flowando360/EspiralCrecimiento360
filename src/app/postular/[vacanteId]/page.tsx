import { createAdminClient } from '@/lib/supabase/server';
import { FormularioPostulacionPublica } from '@/components/reclutamiento/formulario-postulacion-publica';
import { Briefcase } from 'lucide-react';

export default async function PostularPage({ params }: { params: { vacanteId: string } }) {
  const supabase = createAdminClient();
  const { data: vacante } = await supabase
    .from('vacantes')
    .select('id, titulo, descripcion, estado, empresa:empresas(nombre), cargo:cargos(nombre)')
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
            <p className="text-sm text-marmol-500 mt-1 mb-5">
              {(vacante.cargo as any)?.nombre ? `Cargo: ${(vacante.cargo as any).nombre}` : ''}
              {vacante.descripcion ? ` — ${vacante.descripcion}` : ''}
            </p>
            <FormularioPostulacionPublica vacanteId={vacante.id} />
          </div>
        )}
      </div>
    </div>
  );
}
