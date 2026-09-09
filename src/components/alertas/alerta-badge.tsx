import { cn } from '@/lib/utils';

const ETIQUETAS: Record<string, string> = {
  contrato_vencimiento: 'Contrato',
  periodo_prueba_fin: 'Periodo de prueba',
  sst_examen_medico: 'Examen médico SST',
  sst_certificacion: 'Certificación SST',
  sst_induccion: 'Inducción SST',
  sst_epp: 'EPP',
  formacion_vencimiento: 'Formación',
  ciclo_evaluacion: 'Ciclo de Crecimiento',
  cumpleanos: 'Cumpleaños',
  aniversario_ingreso: 'Aniversario',
  aniversario_bodas: 'Aniversario de bodas',
  baby_shower: 'Baby shower',
  fecha_especial: 'Fecha especial',
  otro: 'Otro',
};

export function AlertaTipoBadge({ tipo }: { tipo: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-marmol-100 px-2 py-0.5 text-xs font-medium text-marmol-600">
      {ETIQUETAS[tipo] ?? tipo}
    </span>
  );
}

export function AlertaSeveridadDot({ severidad }: { severidad: 'info' | 'atencion' | 'critica' }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        severidad === 'critica' && 'bg-bajo',
        severidad === 'atencion' && 'bg-medio',
        severidad === 'info' && 'bg-flow-400'
      )}
    />
  );
}
