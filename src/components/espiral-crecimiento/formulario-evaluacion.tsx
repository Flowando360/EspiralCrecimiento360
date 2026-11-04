'use client';

import { useMemo, useState, useTransition } from 'react';
import { guardarRespuesta, guardarBorrador, enviarValoracion } from '@/app/(dashboard)/espiral-crecimiento/evaluar/actions';
import { cn } from '@/lib/utils';
import { Check, Lock, Save, Send } from 'lucide-react';

interface Criterio {
  nivel: number;
  criterio: string;
}

type Bloque =
  | 'competencias_organizacionales'
  | 'competencias_funcionales'
  | 'competencias_liderazgo'
  | 'roles_y_funciones'
  | 'cultura';

export interface ItemEvaluacion {
  id: string; // evaluacion_item id
  bloque: Bloque;
  titulo: string;
  descripcion: string | null;
  criterios?: Criterio[]; // solo si el ítem viene de una competencia con guía de valoración
}

const ETIQUETA_BLOQUE: Record<Bloque, { titulo: string; color: string }> = {
  competencias_organizacionales: { titulo: 'Competencias Organizacionales', color: 'text-flow-600' },
  competencias_funcionales: { titulo: 'Competencias Funcionales del Cargo', color: 'text-hacer' },
  competencias_liderazgo: { titulo: 'Competencias de Liderazgo', color: 'text-deber' },
  roles_y_funciones: { titulo: 'Roles y Funciones', color: 'text-saber' },
  cultura: { titulo: 'Cultura', color: 'text-ser' },
};

const ORDEN_BLOQUES = [
  'competencias_organizacionales',
  'competencias_funcionales',
  'competencias_liderazgo',
  'roles_y_funciones',
  'cultura',
] as const;

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

export function FormularioEvaluacion({
  evaluacionTareaId,
  items,
  respuestasIniciales,
  enviadaEn,
}: {
  evaluacionTareaId: string;
  items: ItemEvaluacion[];
  respuestasIniciales: Record<string, { nota: number; observacion?: string; resultadoReal?: string }>;
  /** Fecha de envío si la valoración ya fue enviada (solo lectura); null si sigue en borrador */
  enviadaEn: string | null;
}) {
  const [notas, setNotas] = useState<Record<string, number>>(
    Object.fromEntries(Object.entries(respuestasIniciales).map(([k, v]) => [k, v.nota]))
  );
  const [observaciones, setObservaciones] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(respuestasIniciales).map(([k, v]) => [k, v.observacion ?? '']))
  );
  const [resultadosReales, setResultadosReales] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(respuestasIniciales).map(([k, v]) => [k, v.resultadoReal ?? '']))
  );
  const [, startTransition] = useTransition();
  const [guardados, setGuardados] = useState<Record<string, boolean>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [expandido, setExpandido] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(Boolean(enviadaEn));
  const [fechaEnvio, setFechaEnvio] = useState<string | null>(enviadaEn);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [accion, setAccion] = useState<'guardando' | 'enviando' | null>(null);

  function respuestasActuales() {
    return items
      .filter((i) => typeof notas[i.id] === 'number')
      .map((i) => ({
        evaluacionItemId: i.id,
        nota: notas[i.id] as number,
        observacion: observaciones[i.id] || undefined,
        resultadoReal: resultadosReales[i.id] || undefined,
      }));
  }

  async function guardarAvance() {
    setMensaje(null);
    setAccion('guardando');
    try {
      const res = await guardarBorrador({ evaluacionTareaId, respuestas: respuestasActuales() });
      if (res.ok) {
        const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        setMensaje({ tipo: 'ok', texto: `Avance guardado a las ${hora}. Puedes seguir después: aún no se ha enviado.` });
      } else {
        setMensaje({ tipo: 'error', texto: `No se pudo guardar: ${res.error}` });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar. Revisa tu conexión y vuelve a intentar.' });
    } finally {
      setAccion(null);
    }
  }

  async function enviar() {
    if (
      !confirm(
        'Vas a enviar tu valoración. Una vez enviada ya no podrás cambiar ninguna respuesta. ¿Quieres enviarla ahora?'
      )
    )
      return;
    setMensaje(null);
    setAccion('enviando');
    try {
      const guardado = await guardarBorrador({ evaluacionTareaId, respuestas: respuestasActuales() });
      if (!guardado.ok) {
        setMensaje({ tipo: 'error', texto: `No se pudo guardar antes de enviar: ${guardado.error}` });
        return;
      }
      const res = await enviarValoracion({ evaluacionTareaId });
      if (res.ok) {
        setEnviada(true);
        setFechaEnvio(new Date().toISOString());
        setMensaje(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMensaje({ tipo: 'error', texto: res.error });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo enviar. Revisa tu conexión y vuelve a intentar.' });
    } finally {
      setAccion(null);
    }
  }

  function guardar(itemId: string, nota: number) {
    if (enviada) return;
    setNotas((prev) => ({ ...prev, [itemId]: nota }));
    startTransition(async () => {
      const res = await guardarRespuesta({
        evaluacionTareaId,
        evaluacionItemId: itemId,
        nota,
        observacion: observaciones[itemId],
        resultadoReal: resultadosReales[itemId],
      });
      if (res.ok) {
        setGuardados((prev) => ({ ...prev, [itemId]: true }));
        setErrores((prev) => {
          const { [itemId]: _quitado, ...resto } = prev;
          return resto;
        });
      } else {
        setGuardados((prev) => ({ ...prev, [itemId]: false }));
        setErrores((prev) => ({ ...prev, [itemId]: res.error ?? 'No se pudo guardar' }));
      }
    });
  }

  const itemsPorBloque = ORDEN_BLOQUES.map((bloque) => ({
    bloque,
    items: items.filter((i) => i.bloque === bloque),
  })).filter((g) => g.items.length > 0);

  const subtotalesPorBloque = useMemo(
    () =>
      Object.fromEntries(
        itemsPorBloque.map(({ bloque, items: itemsBloque }) => [
          bloque,
          promedio(itemsBloque.map((i) => notas[i.id]).filter((n): n is number => typeof n === 'number')),
        ])
      ),
    [itemsPorBloque, notas]
  );

  const totalGeneral = useMemo(
    () => promedio(items.map((i) => notas[i.id]).filter((n): n is number => typeof n === 'number')),
    [items, notas]
  );
  const totalRespondidos = Object.keys(notas).filter((id) => items.some((i) => i.id === id)).length;

  const faltan = items.length - totalRespondidos;

  return (
    <div className="space-y-6">
      {enviada && (
        <div role="status" className="rounded-lg border border-flow-200 bg-flow-50 p-4 flex items-start gap-2">
          <Lock size={16} className="text-flow-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-flow-700">
              Valoración enviada
              {fechaEnvio && !isNaN(Date.parse(fechaEnvio)) &&
                ` el ${new Date(fechaEnvio).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              .
            </p>
            <p className="text-xs text-marmol-600">Ya no se pueden hacer cambios. Aquí puedes consultar lo que respondiste.</p>
          </div>
        </div>
      )}

      {/* ── Barra fija: avance, subtotales y acciones (se queda arriba al hacer scroll) ── */}
      <div className="card p-4 sticky top-16 sm:top-[4.5rem] z-10 backdrop-blur bg-white/95 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-full bg-flow-50 flex items-center justify-center">
              <span className="font-display text-base font-bold text-flow-700">{totalGeneral ?? '—'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-marmol-800">Promedio general</p>
              <p className="text-xs text-marmol-500">
                {totalRespondidos} de {items.length} ítems respondidos
              </p>
              <div className="mt-1 h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-marmol-100">
                <div
                  className="h-full bg-crecimiento transition-all"
                  style={{ width: `${items.length ? Math.round((100 * totalRespondidos) / items.length) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {!enviada && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={guardarAvance}
                disabled={accion !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-flow-500 text-flow-700 hover:bg-flow-50 disabled:opacity-50 text-sm font-medium px-3.5 py-2 transition"
              >
                <Save size={14} /> {accion === 'guardando' ? 'Guardando…' : 'Guardar avance'}
              </button>
              <button
                type="button"
                onClick={enviar}
                disabled={accion !== null || faltan > 0}
                title={faltan > 0 ? `Faltan ${faltan} ítems por responder` : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 text-white disabled:opacity-50 text-sm font-medium px-3.5 py-2 transition"
              >
                <Send size={14} /> {accion === 'enviando' ? 'Enviando…' : 'Enviar valoración'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {itemsPorBloque.map(({ bloque, items: itemsBloque }) => (
            <div key={bloque} className="rounded-lg bg-marmol-50 px-3 py-2">
              <p className={cn('text-[11px] font-medium leading-tight', ETIQUETA_BLOQUE[bloque].color)}>
                {ETIQUETA_BLOQUE[bloque].titulo}
              </p>
              <p className="mt-0.5 font-display text-base font-semibold text-marmol-800">
                {subtotalesPorBloque[bloque] ?? '—'}
                <span className="text-xs font-normal text-marmol-400">
                  {' '}· {itemsBloque.length} {itemsBloque.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </p>
            </div>
          ))}
        </div>

        {!enviada && (
          <p className="text-xs text-marmol-500">
            {faltan > 0
              ? `Puedes guardar tu avance y terminar después. Para enviar necesitas responder todos los ítems (faltan ${faltan}).`
              : 'Respondiste todos los ítems. Cuando estés lista o listo, envía tu valoración: después no podrás cambiarla.'}
          </p>
        )}
        {mensaje && (
          <p role={mensaje.tipo === 'error' ? 'alert' : 'status'} className={cn('text-sm', mensaje.tipo === 'error' ? 'text-bajo' : 'text-alto')}>
            {mensaje.texto}
          </p>
        )}
      </div>

      {itemsPorBloque.map(({ bloque, items: itemsBloque }) => (
        <div key={bloque}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={cn('font-display text-sm font-bold uppercase tracking-wide', ETIQUETA_BLOQUE[bloque].color)}>
              {ETIQUETA_BLOQUE[bloque].titulo}
            </h2>
            <span className="text-xs text-marmol-400">
              Subtotal: <span className="font-semibold text-marmol-700">{subtotalesPorBloque[bloque] ?? '—'}</span>
            </span>
          </div>

          <div className="card divide-y divide-marmol-100 overflow-hidden">
            {itemsBloque.map((item) => {
              const nota = notas[item.id];
              const criterioSeleccionado = item.criterios?.find((c) => c.nivel === nota);
              const estaExpandido = expandido === item.id;

              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-marmol-900 text-sm">{item.titulo}</h3>
                      {item.descripcion && (
                        <p className="text-xs text-marmol-500 mt-0.5">
                          {bloque === 'roles_y_funciones' ? `Resultado esperado: ${item.descripcion}` : item.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          disabled={enviada}
                          onClick={() => {
                            guardar(item.id, n);
                            if (item.criterios) setExpandido(item.id);
                          }}
                          className={cn(
                            'h-8 w-8 rounded-lg border text-sm font-medium transition',
                            nota === n
                              ? 'border-flow-500 bg-flow-500 text-white'
                              : 'border-marmol-200 text-marmol-600 hover:border-flow-300'
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {bloque === 'roles_y_funciones' && (
                    <input
                      type="text"
                      placeholder="Resultado real observado…"
                      defaultValue={resultadosReales[item.id] ?? ''}
                      onChange={(e) => setResultadosReales((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => {
                        if (nota) guardar(item.id, nota);
                      }}
                      readOnly={enviada}
                      className="mt-2.5 w-full rounded-lg border border-marmol-200 px-3 py-1.5 text-sm read-only:bg-marmol-50"
                    />
                  )}

                  {/* Solo se muestra el criterio del nivel YA elegido — nunca los 5 a la vez */}
                  {criterioSeleccionado && (
                    <p className="mt-2.5 text-xs text-marmol-600 bg-flow-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-flow-700">Nivel {criterioSeleccionado.nivel}: </span>
                      {criterioSeleccionado.criterio}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandido(estaExpandido ? null : item.id)}
                      className="text-xs text-marmol-400 hover:text-flow-600"
                    >
                      {estaExpandido ? 'Ocultar observación' : enviada ? 'Ver observación' : 'Agregar observación'}
                    </button>
                    {errores[item.id] && (
                      <span className="text-xs text-bajo">No se guardó: {errores[item.id]}. Vuelve a intentarlo.</span>
                    )}
                    {guardados[item.id] && (
                      <span className="text-xs text-alto flex items-center gap-1">
                        <Check size={11} /> Guardado
                      </span>
                    )}
                  </div>

                  {estaExpandido && (
                    <textarea
                      placeholder="Observación (opcional)…"
                      defaultValue={observaciones[item.id] ?? ''}
                      onChange={(e) => setObservaciones((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => {
                        if (nota) guardar(item.id, nota);
                      }}
                      readOnly={enviada}
                      className="mt-2 w-full rounded-lg border border-marmol-200 p-2.5 text-sm read-only:bg-marmol-50"
                      rows={2}
                      autoFocus
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
