'use client';

import { useState, useTransition } from 'react';
import { alternarReaccion } from '@/app/(dashboard)/nexa/feed/actions';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BotonReaccion({
  publicacionId,
  totalInicial,
  yaReaccionoInicial,
}: {
  publicacionId: string;
  totalInicial: number;
  yaReaccionoInicial: boolean;
}) {
  const [total, setTotal] = useState(totalInicial);
  const [yaReacciono, setYaReacciono] = useState(yaReaccionoInicial);
  const [, startTransition] = useTransition();

  function alternar() {
    const nuevoEstado = !yaReacciono;
    setYaReacciono(nuevoEstado);
    setTotal((prev) => prev + (nuevoEstado ? 1 : -1));
    startTransition(async () => {
      await alternarReaccion(publicacionId);
    });
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition',
        yaReacciono ? 'bg-flow-50 text-flow-700' : 'text-marmol-500 hover:bg-marmol-50'
      )}
    >
      <ThumbsUp size={13} className={yaReacciono ? 'fill-flow-500 text-flow-500' : ''} />
      {total > 0 ? total : 'Me gusta'}
    </button>
  );
}
