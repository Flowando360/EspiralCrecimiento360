'use client';

import { useState, useTransition } from 'react';
import { guardarEntrevistaSalida } from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/historial/actions';
import { Check } from 'lucide-react';

const MOTIVOS = [
  { valor: 'renuncia_voluntaria', etiqueta: 'Renuncia voluntaria' },
  { valor: 'despido', etiqueta: 'Despido' },
  { valor: 'fin_contrato', etiqueta: 'Fin de contrato' },
  { valor: 'mutuo_acuerdo', etiqueta: 'Mutuo acuerdo' },
  { valor: 'jubilacion', etiqueta: 'Jubilación' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const;

export interface EntrevistaInicial {
  fecha: string;
  motivo_categoria: string;
  motivo_detalle: string | null;
  recomendaria_empresa: boolean | null;
  comentarios: string | null;
}

export function EntrevistaSalida({
  colaboradorId,
  inicial,
}: {
  colaboradorId: string;
  inicial: EntrevistaInicial | null;
}) {
  const [fecha, setFecha] = useState(inicial?.fecha ?? new Date().toISOString().slice(0, 10));
  const [motivoCategoria, setMotivoCategoria] = useState(inicial?.motivo_categoria ?? 'renuncia_voluntaria');
  const [motivoDetalle, setMotivoDetalle] = useState(inicial?.motivo_detalle ?? '');
  const [recomendaria, setRecomendaria] = useState<'si' | 'no' | 'sin_dato'>(
    inicial?.recomendaria_empresa === true ? 'si' : inicial?.recomendaria_empresa === false ? 'no' : 'sin_dato'
  );
  const [comentarios, setComentarios] = useState(inicial?.comentarios ?? '');
  const [pending, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      const res = await guardarEntrevistaSalida({
        colaboradorId,
        fecha,
        motivoCategoria: motivoCategoria as any,
        motivoDetalle: motivoDetalle || undefined,
        recomendariaEmpresa: recomendaria,
        comentarios: comentarios || undefined,
      });
      if (res.ok) setGuardado(true);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Motivo</label>
          <select
            value={motivoCategoria}
            onChange={(e) => setMotivoCategoria(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          >
            {MOTIVOS.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      <textarea
        placeholder="Detalle del motivo (opcional)…"
        value={motivoDetalle}
        onChange={(e) => setMotivoDetalle(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />

      <div>
        <label className="block text-xs text-marmol-500 mb-1">¿Recomendaría la empresa?</label>
        <div className="flex gap-2">
          {(['si', 'no', 'sin_dato'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setRecomendaria(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                recomendaria === v ? 'bg-flow-500 text-white' : 'bg-marmol-100 text-marmol-600'
              }`}
            >
              {v === 'si' ? 'Sí' : v === 'no' ? 'No' : 'Sin dato'}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Comentarios (opcional)…"
        value={comentarios}
        onChange={(e) => setComentarios(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending || !fecha}
          onClick={guardar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        {guardado && (
          <p className="text-xs text-alto flex items-center gap-1">
            <Check size={12} /> Guardado
          </p>
        )}
      </div>
    </div>
  );
}
