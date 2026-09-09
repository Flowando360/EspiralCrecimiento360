import { redirect } from 'next/navigation';
import { FileArchive, ShieldCheck, ClipboardCheck, ScrollText, Layers } from 'lucide-react';
import { obtenerEvidenciaAuditoria } from './data';

const PAQUETES = [
  { tipo: 'todos', titulo: 'Paquete completo', descripcion: 'SST + ISO 9001 + SARLAFT/SAGRILAFT + PTEE.', icon: Layers },
  { tipo: 'sst', titulo: 'SST', descripcion: 'Certificaciones y su estado de vencimiento.', icon: ShieldCheck },
  { tipo: 'iso_9001', titulo: 'ISO 9001', descripcion: 'Checklist, riesgos y procesos documentados.', icon: ClipboardCheck },
  { tipo: 'sarlaft_sagrilaft', titulo: 'SARLAFT/SAGRILAFT', descripcion: 'Checklist y matriz de riesgos de cumplimiento.', icon: ScrollText },
] as const;

export default async function EvidenciaAuditoriaPage() {
  const { perfil, evidencia } = await obtenerEvidenciaAuditoria('todos');
  if (!perfil || !evidencia) redirect('/informes');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario">Evidencia de auditoría</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Descarga un paquete ZIP con el resumen (PDF y Excel) más los documentos de evidencia adjuntos, listo
          para entregar a un auditor externo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PAQUETES.map((p) => (
          <div key={p.tipo} className="card p-5">
            <p.icon size={20} className="text-flow-600 mb-2" />
            <h2 className="font-display font-semibold text-secundario">{p.titulo}</h2>
            <p className="text-sm text-marmol-500 mt-1 mb-3">{p.descripcion}</p>
            <a
              href={`/api/informes/evidencia-auditoria?tipo=${p.tipo}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-2 transition"
            >
              <FileArchive size={16} /> Descargar ZIP
            </a>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold text-secundario mb-3">Qué incluye cada paquete</h2>
        <ul className="text-sm text-marmol-600 space-y-1.5 list-disc pl-5">
          <li>
            Un PDF de portada con el resumen: {evidencia.certificacionesSST.length} certificaciones SST,{' '}
            {evidencia.checklist.length} ítems de checklist, {evidencia.riesgos.length} riesgos registrados y{' '}
            {evidencia.procesos.length} procesos documentados.
          </li>
          <li>Un Excel con el detalle de cada tabla.</li>
          <li>
            Los archivos de evidencia adjuntos al checklist de cumplimiento (los de certificaciones SST se
            listan como referencia; su documento vive en un link externo, no en este servidor).
          </li>
        </ul>
      </div>
    </div>
  );
}
