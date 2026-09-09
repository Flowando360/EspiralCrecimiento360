import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { GraduationCap, FileDown, FileSpreadsheet } from 'lucide-react';
import { formatearFecha, cn } from '@/lib/utils';
import { obtenerInformeFormacion } from './data';

const ESTADO_COLOR: Record<string, string> = {
  asignado: 'bg-marmol-100 text-marmol-600',
  en_curso: 'bg-flow-50 text-flow-700',
  completado: 'bg-green-100 text-alto',
  vencido: 'bg-red-100 text-bajo',
};

const CATEGORIA_LABEL: Record<string, string> = {
  induccion_sst: 'Inducción SST',
  alturas: 'Alturas',
  manejo_cargas: 'Manejo de cargas',
  epp: 'EPP',
  protocolos_emergencia: 'Protocolos de emergencia',
  cultura: 'Cultura',
  tecnico: 'Técnico',
  otro: 'Otro',
};

export default async function InformeFormacionPage() {
  const { perfil, filas } = await obtenerInformeFormacion();
  if (!perfil) redirect('/inicio');

  const completados = filas.filter((f) => f.estado === 'completado').length;
  const pctCompletado = filas.length > 0 ? Math.round((completados / filas.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Informe de Formación</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Cursos y rutas de aprendizaje asignados en Nexa, con su estado y avance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/informes/formacion/pdf"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileDown size={16} /> PDF
          </a>
          <a
            href="/api/informes/formacion/excel"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-sm font-medium px-3.5 py-2 transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-marmol-500 mb-1">Asignaciones totales</p>
          <p className="text-2xl font-display font-semibold text-secundario">{filas.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-marmol-500 mb-1">Completadas</p>
          <p className="text-2xl font-display font-semibold text-secundario">{completados}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-marmol-500 mb-1">% de cumplimiento</p>
          <p className="text-2xl font-display font-semibold text-secundario">{pctCompletado}%</p>
        </div>
      </div>

      {filas.length === 0 ? (
        <EmptyState icon={GraduationCap} titulo="Sin formación asignada" descripcion="No hay cursos asignados que coincidan con tu alcance." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                <th className="px-4 py-3 font-medium">Colaborador</th>
                <th className="px-4 py-3 font-medium">Curso</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Avance</th>
                <th className="px-4 py-3 font-medium">Fecha límite</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-marmol-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-marmol-900">{f.colaborador_nombre}</td>
                  <td className="px-4 py-3 text-marmol-600">{f.curso_titulo}</td>
                  <td className="px-4 py-3 text-marmol-500">{CATEGORIA_LABEL[f.categoria] ?? f.categoria}</td>
                  <td className="px-4 py-3 text-marmol-600">{f.progreso_pct}%</td>
                  <td className="px-4 py-3 text-marmol-500">{f.fecha_limite ? formatearFecha(f.fecha_limite) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium capitalize', ESTADO_COLOR[f.estado])}>
                      {f.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
