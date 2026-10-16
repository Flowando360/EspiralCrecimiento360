'use client';

import { useState, useTransition } from 'react';
import { procesarHojaVidaAhora, reintentarProcesamiento } from '@/app/(dashboard)/reclutamiento/procesamiento-actions';
import { Bot, AlertTriangle, CheckCircle2, RotateCw, Play } from 'lucide-react';

type Trabajo = {
  id: string;
  estado: string;
  intentos: number;
  max_intentos: number;
  ultimo_error: string | null;
};

type Resultado = {
  campos_faltantes: string[];
  conflictos: { campo: string; descripcion: string }[];
  revision_requerida: boolean;
} | null;

const ESTADO_TEXTO: Record<string, string> = {
  pendiente: 'En cola: pendiente de lectura',
  procesando: 'Leyendo la hoja de vida…',
  completado: 'Lectura completada',
  requiere_revision: 'Lectura completada con datos por revisar',
  error: 'No se pudo leer',
};

const ESTADO_CLASE: Record<string, string> = {
  pendiente: 'text-marmol-500',
  procesando: 'text-flow-600',
  completado: 'text-alto',
  requiere_revision: 'text-medio',
  error: 'text-bajo',
};

export function PanelHojaVidaIA({
  candidatoId,
  trabajo,
  resultado,
  puedeAdministrar,
  tieneHojaVida,
}: {
  candidatoId: string;
  trabajo: Trabajo | null;
  resultado: Resultado;
  puedeAdministrar: boolean;
  tieneHojaVida: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const ejecutar = (accion: () => Promise<{ ok: true; resultado: { estado: string; error?: string } } | { ok: false; error: string }>) => {
    setMensaje(null);
    startTransition(async () => {
      const r = await accion();
      if (!r.ok) setMensaje(r.error);
      else if (r.resultado.estado === 'omitido') setMensaje('Esta hoja de vida ya se estaba procesando o ya fue leída.');
      else if (r.resultado.error) setMensaje(`No se pudo leer: ${r.resultado.error}`);
    });
  };

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display font-semibold text-secundario flex items-center gap-1.5">
          <Bot size={16} /> Lectura de la hoja de vida con IA
        </h2>
        {puedeAdministrar && trabajo && (trabajo.estado === 'pendiente' || trabajo.estado === 'error') && (
          <div className="flex items-center gap-2">
            {trabajo.estado === 'pendiente' ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => ejecutar(() => procesarHojaVidaAhora(trabajo.id))}
                className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-50"
              >
                <Play size={12} /> {pending ? 'Leyendo…' : 'Procesar con IA'}
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => ejecutar(() => reintentarProcesamiento(trabajo.id))}
                className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-xs font-medium px-3 py-1.5 disabled:opacity-50"
              >
                <RotateCw size={12} /> {pending ? 'Reintentando…' : 'Reintentar'}
              </button>
            )}
          </div>
        )}
      </div>

      {!tieneHojaVida || !trabajo ? (
        <p className="text-sm text-marmol-400">Este candidato no tiene una hoja de vida cargada para leer.</p>
      ) : (
        <>
          <p className={`text-sm font-medium flex items-center gap-1.5 ${ESTADO_CLASE[trabajo.estado] ?? ''}`}>
            {trabajo.estado === 'completado' ? <CheckCircle2 size={14} /> : trabajo.estado === 'error' ? <AlertTriangle size={14} /> : null}
            {ESTADO_TEXTO[trabajo.estado] ?? trabajo.estado}
            <span className="text-xs text-marmol-400 font-normal">
              · intento {trabajo.intentos} de {trabajo.max_intentos}
            </span>
          </p>
          {trabajo.ultimo_error && trabajo.estado !== 'completado' && (
            <p className="text-xs text-bajo bg-bajo/5 rounded-lg p-2">{trabajo.ultimo_error}</p>
          )}
        </>
      )}

      {resultado && (resultado.conflictos.length > 0 || resultado.campos_faltantes.length > 0) && (
        <div className="space-y-2 text-sm">
          {resultado.conflictos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-medio mb-1">Inconsistencias a revisar</p>
              <ul className="space-y-1">
                {resultado.conflictos.map((c, i) => (
                  <li key={`${c.campo}-${i}`} className="text-xs text-marmol-600 bg-medio/5 rounded-lg px-2 py-1.5">
                    {c.descripcion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resultado.campos_faltantes.length > 0 && (
            <p className="text-xs text-marmol-500">
              <span className="font-medium">No encontrado en la hoja de vida:</span> {resultado.campos_faltantes.join(', ')}
            </p>
          )}
        </div>
      )}

      {mensaje && <p className="text-xs text-bajo">{mensaje}</p>}
    </div>
  );
}
