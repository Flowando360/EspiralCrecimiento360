'use client';

import { useState, useTransition } from 'react';
import { firmarAcuerdo } from '@/app/(dashboard)/espiral-crecimiento/evaluaciones/[evaluacionId]/acuerdo/actions';
import { cn, formatearFecha } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

export function FirmaAcuerdo({
  evaluacionId,
  parte,
  titulo,
  firmadoInicial,
  fechaInicial,
  puedeFirmar,
}: {
  evaluacionId: string;
  parte: 'colaborador' | 'lider';
  titulo: string;
  firmadoInicial: boolean;
  fechaInicial: string | null;
  puedeFirmar: boolean;
}) {
  const [firmado, setFirmado] = useState(firmadoInicial);
  const [fecha, setFecha] = useState(fechaInicial);
  const [, startTransition] = useTransition();

  function alternar() {
    const nuevoValor = !firmado;
    setFirmado(nuevoValor);
    setFecha(nuevoValor ? new Date().toISOString() : null);
    startTransition(async () => {
      const res = await firmarAcuerdo({ evaluacionId, parte, firmado: nuevoValor });
      if (!res.ok) {
        // revertir si no se pudo guardar (ej. no autorizado)
        setFirmado(!nuevoValor);
        setFecha(fechaInicial);
      }
    });
  }

  return (
    <div className="card p-4 flex items-start gap-3">
      <button
        type="button"
        disabled={!puedeFirmar}
        onClick={alternar}
        className={cn('mt-0.5 transition', puedeFirmar ? 'cursor-pointer' : 'cursor-not-allowed opacity-60')}
        aria-label={firmado ? 'Quitar firma' : 'Firmar'}
      >
        {firmado ? <CheckCircle2 size={20} className="text-alto" /> : <Circle size={20} className="text-marmol-300" />}
      </button>
      <div>
        <p className="text-sm font-medium text-marmol-800">{titulo}</p>
        <p className="text-xs text-marmol-400">
          {firmado && fecha ? `Firmado el ${formatearFecha(fecha)}` : 'Pendiente de firma'}
        </p>
      </div>
    </div>
  );
}
