import { FileArchive, ShieldOff } from 'lucide-react';
import { validarEnlaceEvidenciaPublico } from '@/lib/informes/enlace-evidencia-publico';
import { obtenerEvidenciaAuditoria } from '@/app/(dashboard)/informes/evidencia-auditoria/data';
import { formatearFecha } from '@/lib/utils';

const TIPO_LABEL: Record<string, string> = {
  todos: 'Paquete completo (SST + ISO 9001 + SARLAFT/SAGRILAFT + PTEE)',
  sst: 'SST',
  iso_9001: 'ISO 9001',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
};

export default async function AuditoriaExternaPage({ params }: { params: { token: string } }) {
  const enlace = await validarEnlaceEvidenciaPublico(params.token);

  if (!enlace) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md card p-6 text-center">
          <ShieldOff size={32} className="text-bajo mx-auto mb-3" />
          <h1 className="font-display text-lg font-semibold text-secundario">Este enlace ya no está disponible</h1>
          <p className="text-sm text-marmol-500 mt-1.5">Puede haber expirado o haber sido revocado. Solicita uno nuevo a quien te lo compartió.</p>
        </div>
      </div>
    );
  }

  const { evidencia } = await obtenerEvidenciaAuditoria(enlace.tipoPaquete, { empresaId: enlace.empresaId });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg card p-6 space-y-4">
        <div>
          <p className="text-xs text-marmol-400 uppercase tracking-wide">Evidencia de auditoría — acceso externo</p>
          <h1 className="font-display text-xl font-semibold text-secundario mt-1">{enlace.empresaNombre}</h1>
          <p className="text-sm text-marmol-500 mt-1">{TIPO_LABEL[enlace.tipoPaquete]}</p>
        </div>

        {evidencia && (
          <ul className="text-sm text-marmol-600 space-y-1 list-disc pl-5">
            <li>{evidencia.certificacionesSST.length} certificaciones SST</li>
            <li>{evidencia.checklist.length} ítems de checklist</li>
            <li>{evidencia.riesgos.length} riesgos y oportunidades</li>
            <li>{evidencia.auditorias.length} auditorías internas</li>
            <li>
              {evidencia.acpm.length} ACPM{evidencia.tasaEficaciaAcpm !== null && ` (${evidencia.tasaEficaciaAcpm}% de eficacia)`}
            </li>
            <li>{evidencia.cambios.length} solicitudes de gestión de cambio</li>
            <li>{evidencia.procesos.length} procesos documentados</li>
          </ul>
        )}

        <a
          href={`/api/auditoria/${params.token}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-4 py-2.5 transition"
        >
          <FileArchive size={16} /> Descargar paquete ZIP
        </a>

        <p className="text-xs text-marmol-400">Este enlace vence el {formatearFecha(enlace.expiraEn)} y es de solo lectura.</p>
      </div>
    </div>
  );
}
