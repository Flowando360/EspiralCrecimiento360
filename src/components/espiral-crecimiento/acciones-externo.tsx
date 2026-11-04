'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { convertirExternoEnColaborador } from '@/app/(dashboard)/espiral-crecimiento/externos/actions';
import { eliminarColaborador } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/actions';

export function AccionesExterno({ colaboradorId, nombre }: { colaboradorId: string; nombre: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function convertir() {
    if (!confirm(`¿Pasar a ${nombre} a colaboradora/or vinculado? Quedará en período de prueba, con su responsable como líder, y entrará a las evaluaciones.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await convertirExternoEnColaborador(colaboradorId);
      if (res.ok) router.push(`/espiral-crecimiento/colaboradores/${colaboradorId}`);
      else setError(res.error);
    });
  }

  function eliminar() {
    if (!confirm(`¿Eliminar a ${nombre}? Se borra su registro con documentos y seguimientos; antes queda constancia en el Histórico de eliminados. Si solo terminó el servicio, mejor márcalo como inactivo en Editar.`)) return;
    const motivo = window.prompt('Motivo (opcional, queda en el histórico):', '') ?? '';
    setError(null);
    startTransition(async () => {
      const res = await eliminarColaborador(colaboradorId, motivo);
      if (res.ok) router.push('/espiral-crecimiento/externos');
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-xs">
        <button type="button" onClick={convertir} disabled={pending} className="text-marmol-500 hover:text-flow-600 underline disabled:opacity-40">
          Pasar a colaborador vinculado
        </button>
        <button type="button" onClick={eliminar} disabled={pending} className="text-marmol-400 hover:text-bajo underline disabled:opacity-40">
          Eliminar
        </button>
      </div>
      {error && <p className="text-xs text-bajo">{error}</p>}
    </div>
  );
}
