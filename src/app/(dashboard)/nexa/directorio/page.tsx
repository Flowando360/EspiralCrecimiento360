import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { FiltroTabla } from '@/components/ui/filtro-tabla';
import { EmptyState } from '@/components/ui/empty-state';
import { FormularioCrearAliado } from '@/components/espiral-crecimiento/formulario-crear-aliado';
import { FilaAliado } from '@/components/espiral-crecimiento/fila-aliado';
import { Handshake } from 'lucide-react';
import { calcularDesempenoAliados, type ActividadAliado, type DesempenoAliado } from '@/lib/nexa/desempeno-aliados';

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

  // Desempeño por aliado (presupuesto y calificaciones: solo Talento Humano).
  let desempeno = new Map<string, DesempenoAliado>();
  if (esAdminTh) {
    const { data: acts } = await supabase
      .from('plan_trabajo_actividades')
      .select('aliado_id, estado, horas, personas_objetivo, personas_alcanzadas, presupuesto_estimado, presupuesto_ejecutado, calificacion')
      .eq('empresa_id', perfil.empresa_id)
      .not('aliado_id', 'is', null);
    desempeno = calcularDesempenoAliados((acts ?? []) as unknown as ActividadAliado[]);
  }
  const pesos = (n: number) => `$${n.toLocaleString('es-CO')}`;

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
        <FiltroTabla columnas={['Tipo']} plural="contactos" placeholder="Buscar contacto…">
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
        </FiltroTabla>
      )}

      {esAdminTh && aliados && aliados.length > 0 && (
        <div className="card overflow-hidden overflow-x-auto">
          <div className="px-4 py-3 border-b border-marmol-200">
            <h2 className="font-display font-semibold text-secundario">Desempeño por aliado</h2>
            <p className="text-xs text-marmol-400">
              Sale de las actividades del Plan de trabajo anual que cada aliado ejecuta (Procesos → Plan de trabajo anual → campo «Aliado»). Sirve para decidir si
              renovar o cambiar una alianza. La calificación es la que se registra al ejecutar cada actividad.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-2 font-medium">Aliado</th>
                <th className="px-4 py-2 font-medium">Actividades (ejecutadas)</th>
                <th className="px-4 py-2 font-medium">Cumplimiento</th>
                <th className="px-4 py-2 font-medium">Cobertura</th>
                <th className="px-4 py-2 font-medium">Calificación</th>
                <th className="px-4 py-2 font-medium">Invertido</th>
                <th className="px-4 py-2 font-medium">Costo por persona</th>
              </tr>
            </thead>
            <tbody>
              {aliados.map((a) => {
                const d = desempeno.get(a.id);
                return (
                  <tr key={a.id} className="border-b border-marmol-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-marmol-900">{a.nombre}</td>
                    {d ? (
                      <>
                        <td className="px-4 py-2 text-marmol-600">{d.actividades} ({d.ejecutadas})</td>
                        <td className="px-4 py-2 text-marmol-600">{d.cumplimientoPct != null ? `${d.cumplimientoPct}%` : '—'}</td>
                        <td className="px-4 py-2 text-marmol-600">{d.coberturaPct != null ? `${d.coberturaPct}%` : '—'}</td>
                        <td className="px-4 py-2 text-marmol-600">{d.calificacionPromedio ?? '—'}</td>
                        <td className="px-4 py-2 text-marmol-600">{d.presupuestoEjecutado > 0 ? pesos(d.presupuestoEjecutado) : '—'}</td>
                        <td className="px-4 py-2 text-marmol-600">{d.costoPorPersona != null ? pesos(d.costoPorPersona) : '—'}</td>
                      </>
                    ) : (
                      <td colSpan={6} className="px-4 py-2 text-marmol-400">Aún sin actividades del plan vinculadas</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
