'use client';

import { useState, useTransition } from 'react';
import {
  agregarEntradaHojaVida,
  marcarVerificadoHojaVida,
  eliminarEntradaHojaVida,
} from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/hoja-vida/actions';
import { cn, formatearFecha } from '@/lib/utils';
import { Plus, Trash2, Check } from 'lucide-react';
import type { HojaVidaFormacion, TipoHojaVida } from '@/types/colaborador';

const ETIQUETA_TIPO: Record<TipoHojaVida, string> = {
  academica: 'Formación académica',
  certificacion: 'Certificación',
  curso: 'Curso',
  experiencia_laboral: 'Experiencia laboral',
};

const TIPOS: TipoHojaVida[] = ['academica', 'certificacion', 'curso', 'experiencia_laboral'];

const VACIO = {
  tipo: 'certificacion' as TipoHojaVida,
  titulo: '',
  institucion: '',
  fechaInicio: '',
  fechaFin: '',
  fechaVencimiento: '',
  documentoUrl: '',
};

export function ListaHojaVida({
  colaboradorId,
  itemsIniciales,
  puedeEditar,
}: {
  colaboradorId: string;
  itemsIniciales: HojaVidaFormacion[];
  puedeEditar: boolean;
}) {
  const [items, setItems] = useState(itemsIniciales);
  const [nuevo, setNuevo] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [, startTransition] = useTransition();

  function agregar() {
    if (!nuevo.titulo.trim()) return;
    startTransition(async () => {
      const res = await agregarEntradaHojaVida({ colaboradorId, ...nuevo });
      if (res.ok && res.item) {
        setItems((prev) => [res.item as HojaVidaFormacion, ...prev]);
        setNuevo(VACIO);
        setMostrarForm(false);
      }
    });
  }

  function alternarVerificado(id: string, actual: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, verificado: !actual } : i)));
    startTransition(() => {
      marcarVerificadoHojaVida({ id, colaboradorId, verificado: !actual });
    });
  }

  function eliminar(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => {
      eliminarEntradaHojaVida({ id, colaboradorId });
    });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-marmol-400">Sin registros de formación cargados.</p>}

      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-marmol-200 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs text-marmol-400">{ETIQUETA_TIPO[item.tipo]}</span>
              <p className="text-sm font-medium text-marmol-800">{item.titulo}</p>
              {item.institucion && <p className="text-xs text-marmol-500">{item.institucion}</p>}
              {item.fecha_vencimiento && (
                <p className="text-xs text-medio mt-1">Vence: {formatearFecha(item.fecha_vencimiento)}</p>
              )}
              {item.documento_url && (
                <a
                  href={item.documento_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-flow-600 hover:underline"
                >
                  Ver evidencia
                </a>
              )}
            </div>
            {puedeEditar && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => alternarVerificado(item.id, item.verificado)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition',
                    item.verificado ? 'badge-alto' : 'border-marmol-200 text-marmol-400 hover:border-marmol-300'
                  )}
                >
                  <Check size={12} /> {item.verificado ? 'Verificado' : 'Sin verificar'}
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(item.id)}
                  className="text-marmol-300 hover:text-bajo transition"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {puedeEditar && (
        <div>
          {!mostrarForm ? (
            <button
              type="button"
              onClick={() => setMostrarForm(true)}
              className="inline-flex items-center gap-1.5 text-sm text-flow-600 hover:text-flow-700"
            >
              <Plus size={16} /> Agregar registro
            </button>
          ) : (
            <div className="rounded-lg border border-marmol-200 p-3 space-y-2">
              <select
                value={nuevo.tipo}
                onChange={(e) => setNuevo((p) => ({ ...p, tipo: e.target.value as TipoHojaVida }))}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETA_TIPO[t]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Título (ej. Certificación de trabajo en alturas)"
                value={nuevo.titulo}
                onChange={(e) => setNuevo((p) => ({ ...p, titulo: e.target.value }))}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="Institución (opcional)"
                value={nuevo.institucion}
                onChange={(e) => setNuevo((p) => ({ ...p, institucion: e.target.value }))}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-marmol-500 mb-1">Inicio</label>
                  <input
                    type="date"
                    value={nuevo.fechaInicio}
                    onChange={(e) => setNuevo((p) => ({ ...p, fechaInicio: e.target.value }))}
                    className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-marmol-500 mb-1">Vencimiento</label>
                  <input
                    type="date"
                    value={nuevo.fechaVencimiento}
                    onChange={(e) => setNuevo((p) => ({ ...p, fechaVencimiento: e.target.value }))}
                    className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Enlace a la evidencia (opcional)"
                value={nuevo.documentoUrl}
                onChange={(e) => setNuevo((p) => ({ ...p, documentoUrl: e.target.value }))}
                className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={agregar}
                  className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3.5 py-1.5 transition"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarForm(false);
                    setNuevo(VACIO);
                  }}
                  className="rounded-lg border border-marmol-200 text-marmol-500 text-sm font-medium px-3.5 py-1.5 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
