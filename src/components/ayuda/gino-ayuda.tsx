'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buscarPaginaPorRuta } from '@/content/ayuda';
import { buscarEnAyuda, type ResultadoBusqueda } from '@/content/ayuda/buscador';
import { X, Search, BookOpen, HelpingHand, SpellCheck, ClipboardList, MessageSquarePlus, Sparkles, MessageCircle } from 'lucide-react';
import { FormularioRequerimiento, type TipoRequerimiento } from './formulario-requerimiento';

const ETIQUETA_TIPO: Record<ResultadoBusqueda['tipo'], string> = {
  manual: 'Manual',
  faq: 'FAQ',
  glosario: 'Glosario',
};

/**
 * Gino: el amigo que acompaña a cada persona en la plataforma. Es el botón flotante
 * de la esquina inferior derecha; al abrirlo muestra la ayuda de la pantalla donde
 * estás, busca respuestas en el manual y lleva al chat con IA.
 */
export function GinoAyuda({ nombre, rol }: { nombre: string; rol: string }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [saludo, setSaludo] = useState(false);
  const primerNombre = (nombre ?? '').trim().split(/\s+/)[0] || '';
  const puedeChatear = ['admin_th', 'lider', 'colaborador'].includes(rol);

  /** Saludo breve, una sola vez por sesión del navegador. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem('gino-saludo')) return;
    } catch {
      return;
    }
    const mostrar = setTimeout(() => {
      try {
        sessionStorage.setItem('gino-saludo', '1');
      } catch {
        /* sin almacenamiento: el saludo simplemente puede repetirse */
      }
      setSaludo(true);
    }, 1500);
    const ocultar = setTimeout(() => setSaludo(false), 11000);
    return () => {
      clearTimeout(mostrar);
      clearTimeout(ocultar);
    };
  }, []);

  const [consulta, setConsulta] = useState('');
  const [requerimiento, setRequerimiento] = useState<{ tipo: TipoRequerimiento; consulta?: string; respuesta?: string } | null>(null);

  const contextual = buscarPaginaPorRuta(pathname);
  const resultados = consulta.trim() ? buscarEnAyuda(consulta) : [];
  const primero = resultados[0];

  /** Cerrar el panel reinicia la búsqueda y el formulario, para que al volver se vea el Centro completo. */
  function cerrar() {
    setAbierto(false);
    setRequerimiento(null);
    setConsulta('');
  }

  /** Esc también cierra el panel. */
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        setRequerimiento(null);
        setConsulta('');
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  /** Vuelve a la vista completa del Centro de ayuda (todas las opciones). */
  function volverAlCentro() {
    setRequerimiento(null);
    setConsulta('');
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 print:hidden">
        {saludo && !abierto && (
          <div className="relative max-w-[240px] rounded-2xl rounded-br-sm bg-white text-marmol-800 shadow-lg border border-marmol-100 px-3.5 py-2.5 text-sm">
            <button
              type="button"
              onClick={() => setSaludo(false)}
              aria-label="Cerrar saludo"
              className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-marmol-100 text-marmol-500 hover:bg-marmol-200 flex items-center justify-center"
            >
              <X size={11} />
            </button>
            ¡Hola{primerNombre ? `, ${primerNombre}` : ''}! Soy <strong>Gino</strong>. Si algo no es claro, aquí estoy para ayudarte.
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setSaludo(false);
            setAbierto(true);
          }}
          title="Gino, tu amigo en Espiral. ¿Te ayudo?"
          aria-label="Abrir a Gino, tu asistente y Centro de Ayuda"
          className="group relative h-16 w-16 rounded-full bg-[#050b18] shadow-[0_0_22px_rgba(132,204,22,0.45),0_4px_14px_rgba(0,0,0,0.35)] hover:shadow-[0_0_30px_rgba(132,204,22,0.7),0_6px_18px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition motion-reduce:transition-none focus:outline-none focus-visible:ring-4 focus-visible:ring-flow-300"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca/gino-128.png" alt="" className="h-full w-full rounded-full object-cover" draggable={false} />
        </button>
      </div>

      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => cerrar()} />
          <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-marmol-100">
              <button
                type="button"
                onClick={volverAlCentro}
                className="flex items-center gap-3 text-left hover:opacity-90 transition"
                title="Volver al inicio de Gino"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/marca/gino-128.png" alt="Gino" className="h-11 w-11 rounded-full shrink-0 shadow-[0_0_12px_rgba(132,204,22,0.4)]" />
                <span>
                  <span className="block font-display font-semibold text-secundario leading-tight">Gino</span>
                  <span className="block text-xs text-marmol-500">Tu amigo en Espiral de Crecimiento</span>
                </span>
              </button>
              <button type="button" onClick={() => cerrar()} aria-label="Cerrar a Gino" title="Cerrar" className="text-marmol-400 hover:text-marmol-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-marmol-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-marmol-400" />
                <input
                  value={consulta}
                  onChange={(e) => setConsulta(e.target.value)}
                  placeholder="Pregúntale a Gino: ¿cómo hago esto?"
                  className="w-full rounded-lg border border-marmol-200 pl-8 pr-2.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {requerimiento ? (
                <FormularioRequerimiento
                  pagina={pathname}
                  tipoInicial={requerimiento.tipo}
                  consulta={requerimiento.consulta}
                  respuestaMostrada={requerimiento.respuesta}
                  onCerrar={() => setRequerimiento(null)}
                />
              ) : consulta.trim() ? (
                <div className="space-y-4">
                  {primero?.pasos && primero.pasos.length > 0 && (
                    <div className="rounded-lg bg-flow-50 border border-flow-100 p-3">
                      <p className="text-[12px] uppercase tracking-wide text-flow-700 font-medium mb-1">Así se hace</p>
                      <p className="text-sm font-medium text-marmol-800 mb-1">{primero.titulo}</p>
                      <ol className="list-decimal list-inside text-sm text-marmol-700 space-y-1">
                        {primero.pasos.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                      <Link
                        href={primero.href}
                        onClick={() => cerrar()}
                        className="inline-block mt-2 text-sm text-flow-600 hover:text-flow-700 font-medium"
                      >
                        Ver en el manual →
                      </Link>
                    </div>
                  )}
                  {resultados.length === 0 ? (
                    <p className="text-sm text-marmol-500">Mmm, no encontré una respuesta para “{consulta}”. Cuéntame qué necesitas y lo anotamos.</p>
                  ) : (
                    <p className="text-xs uppercase tracking-wide text-marmol-400">Coincidencias</p>
                  )}
                  {resultados.map((r, i) => (
                      <Link
                        key={i}
                        href={r.href}
                        onClick={() => cerrar()}
                        className="block rounded-lg border border-marmol-200 p-3 hover:border-flow-300 transition"
                      >
                        <span className="text-[12px] uppercase tracking-wide text-flow-600 font-medium">
                          {ETIQUETA_TIPO[r.tipo]}
                        </span>
                        <p className="text-sm font-medium text-marmol-800">{r.titulo}</p>
                        <p className="text-xs text-marmol-500 line-clamp-2 mt-0.5">{r.texto}</p>
                      </Link>
                  ))}
                  {primero ? (
                    <button
                      type="button"
                      onClick={() => setRequerimiento({ tipo: 'mejora', consulta, respuesta: primero.titulo })}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-flow-200 text-flow-700 hover:bg-flow-50 text-sm font-medium px-3 py-2"
                    >
                      <MessageSquarePlus size={15} /> ¿Quieres que esta opción se mejore? Envía tu sugerencia
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRequerimiento({ tipo: 'nueva_funcion', consulta })}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-flow-200 text-flow-700 hover:bg-flow-50 text-sm font-medium px-3 py-2"
                    >
                      <MessageSquarePlus size={15} /> No encontré cómo hacerlo. Envía tu requerimiento
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-flow-50 border border-flow-100 p-3 text-sm text-marmol-700">
                    <p>
                      ¡Hola{primerNombre ? `, ${primerNombre}` : ''}! Soy <strong>Gino</strong>, tu amigo en Espiral. Te cuento cómo funciona esta
                      pantalla, busco respuestas en el manual y, si algo no existe todavía, me lo cuentas y lo anotamos para mejorarlo.
                    </p>
                    <Link
                      href="/ayuda/modulo/general/que-es-espiral"
                      onClick={() => cerrar()}
                      className="inline-flex items-center gap-1.5 mt-2 text-flow-700 hover:text-flow-800 font-medium"
                    >
                      <Sparkles size={14} /> ¿Qué es Espiral de Crecimiento?
                    </Link>
                  </div>

                  {contextual ? (
                    <div>
                      <p className="text-[12px] uppercase tracking-wide text-flow-600 font-medium mb-1">
                        Esta pantalla · {contextual.modulo.titulo}
                      </p>
                      <h3 className="font-display font-semibold text-secundario">{contextual.pagina.titulo}</h3>
                      <p className="text-sm text-marmol-600 mt-1">{contextual.pagina.resumen}</p>

                      {contextual.pagina.camposYBotones && contextual.pagina.camposYBotones.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {contextual.pagina.camposYBotones.map((c) => (
                            <div key={c.nombre} className="text-sm">
                              <span className="font-medium text-marmol-800">{c.nombre}: </span>
                              <span className="text-marmol-600">{c.explicacion}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {contextual.pagina.proceso && contextual.pagina.proceso.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-marmol-500 mb-1">Proceso</p>
                          <ol className="list-decimal list-inside text-sm text-marmol-600 space-y-1">
                            {contextual.pagina.proceso.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {contextual.pagina.notas && contextual.pagina.notas.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {contextual.pagina.notas.map((n, i) => (
                            <p key={i} className="text-xs text-marmol-500 bg-marmol-50 rounded-lg px-2.5 py-2">
                              {n}
                            </p>
                          ))}
                        </div>
                      )}

                      <Link
                        href={`/ayuda/modulo/${contextual.modulo.slug}/${contextual.pagina.slug}`}
                        onClick={() => cerrar()}
                        className="inline-block mt-4 text-sm text-flow-600 hover:text-flow-700 font-medium"
                      >
                        Ver en el manual completo →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-marmol-500">
                      Todavía no tengo una explicación específica para esta pantalla, pero puedes explorar el Centro de Ayuda completo aquí abajo.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setRequerimiento({ tipo: 'nueva_funcion' })}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-flow-200 text-flow-700 hover:bg-flow-50 text-sm font-medium px-3 py-2"
                  >
                    <MessageSquarePlus size={15} /> ¿Algo que no puedes hacer? Envía tu requerimiento
                  </button>

                  <div className="border-t border-marmol-100 pt-4 space-y-1">
                    {puedeChatear && (
                      <Link
                        href="/nexa/asistente"
                        onClick={() => cerrar()}
                        className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                      >
                        <MessageCircle size={15} /> Conversar con Gino (asistente con IA)
                      </Link>
                    )}
                    <Link
                      href="/ayuda"
                      onClick={() => cerrar()}
                      className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                    >
                      <BookOpen size={15} /> Centro de Ayuda completo
                    </Link>
                    <Link
                      href="/ayuda/faq"
                      onClick={() => cerrar()}
                      className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                    >
                      <HelpingHand size={15} /> Preguntas frecuentes
                    </Link>
                    <Link
                      href="/ayuda/glosario"
                      onClick={() => cerrar()}
                      className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                    >
                      <SpellCheck size={15} /> Glosario
                    </Link>
                    <Link
                      href="/ayuda/plan-pruebas"
                      onClick={() => cerrar()}
                      className="flex items-center gap-2 text-sm text-marmol-700 hover:text-flow-600 py-1.5"
                    >
                      <ClipboardList size={15} /> Plan de pruebas
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
