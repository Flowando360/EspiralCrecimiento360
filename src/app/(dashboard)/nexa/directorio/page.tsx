import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { FormularioCrearAliado } from '@/components/espiral-crecimiento/formulario-crear-aliado';
import { FilaAliado } from '@/components/espiral-crecimiento/fila-aliado';
import { Handshake } from 'lucide-react';

export default async function NexaDirectorioPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: aliados } = await supabase
    .from('nexa_directorio_aliados')
    .select('id, nombre, tipo, contacto, notas')
    .eq('empresa_id', perfil.empresa_id)
    .order('nombre');

  const esAdminTh = perfil.rol === 'admin_th';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Directorio de aliados</h1>
          <p className="text-sm text-marmol-500 mt-1">
            ARL, asesores SST y proveedores de formación certificada conectados con la empresa.
          </p>
        </div>
        {esAdminTh && <FormularioCrearAliado />}
      </div>

      {!aliados || aliados.length === 0 ? (
        <EmptyState icon={Handshake} titulo="Sin aliados registrados todavía" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Notas</th>
                {esAdminTh && <th className="px-4 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {aliados.map((a) => (
                <FilaAliado key={a.id} aliado={a} esAdminTh={esAdminTh} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
