'use client';

import { useState, useTransition } from 'react';
import { enviarRequerimiento } from '@/app/(dashboard)/ayuda/actions';
import { Send, Check } from 'lucide-react';

const AREA = 'w-full rounded-lg border border-marmol-200 px-2.5 py-2 text-sm min-h-[80px]';

/** Tres preguntas para entender el problema o la necesidad: qué pasa, qué se esperaba y cómo imagina la solución. */
export type TipoRequerimiento = 'mejora' | 'nueva_funcion' | 'falla';

const OPCIONES_TIPO: { valor: TipoRequerimiento; etiqueta: string }[] = [
  { valor: 'mejora', etiqueta: 'Quiero mejorar algo que ya existe en el aplicativo' },
  { valor: 'nueva_funcion', etiqueta: 'No encontré cómo hacerlo / quiero algo nuevo' },
  { valor: 'falla', etiqueta: 'Algo no funciona como debería' },
];

/**
 * Formulario de requerimiento. Puede abrirse para mejorar una función que sí existe
 * (tipo "mejora"), o cuando la búsqueda no encontró cómo hacer algo (tipo "nueva_funcion").
 */
export function FormularioRequerimiento({
  pagina,
  tipoInicial,
  consulta,
  respuestaMostrada,
  onCerrar,
}: {
  pagina: string;
  tipoInicial: TipoRequerimiento;
  consulta?: string;
  respuestaMostrada?: string;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoRequerimiento>(tipoInicial);
  const [quePasa, setQuePasa] = useState('');
  const [quePesperaba, setQuePesperaba] = useState('');
  const [solucion, setSolucion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ correoEnviado: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await enviarRequerimiento({
        quePasa,
        quePesperaba,
        solucion,
        pagina,
        tipo,
        consulta,
        respuestaMostrada,
      });
      if (!res.ok) return setError(res.error);
      setResultado({ correoEnviado: res.correoEnviado });
    });
  }

  if (resultado) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-flow-700 inline-flex items-center gap-1.5">
          <Check size={16} /> Tu requerimiento quedó registrado.
        </p>
        <p className="text-xs text-marmol-500">
          {resultado.correoEnviado
            ? 'También se envió por correo al equipo de Espiral.'
            : 'El equipo de Espiral lo revisará desde su panel.'}
        </p>
        <button type="button" onClick={onCerrar} className="text-sm text-flow-600 hover:underline">
          Volver a la ayuda
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div>
        <h3 className="font-display font-semibold text-secundario">Envía tu requerimiento</h3>
        <p className="text-xs text-marmol-500 mt-0.5">
          Cuéntanos con tus palabras. Lo recibe el equipo de Espiral y lo revisa.
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-marmol-700 mb-1">¿Qué quieres decirnos?</label>
        <select className="w-full rounded-lg border border-marmol-200 px-2.5 py-2 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value as TipoRequerimiento)}>
          {OPCIONES_TIPO.map((o) => (
            <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-marmol-700 mb-1">¿Qué pasa?</label>
        <textarea className={AREA} value={quePasa} onChange={(e) => setQuePasa(e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-marmol-700 mb-1">¿Qué esperabas que pasara?</label>
        <textarea className={AREA} value={quePesperaba} onChange={(e) => setQuePesperaba(e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-marmol-700 mb-1">¿Cómo imaginas la solución?</label>
        <textarea className={AREA} value={solucion} onChange={(e) => setSolucion(e.target.value)} required />
      </div>
      {pagina && <p className="text-xs text-marmol-400">Pantalla: {pagina}</p>}
      {consulta && <p className="text-xs text-marmol-400">Buscaste: “{consulta}”</p>}
      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
        >
          <Send size={14} /> {pending ? 'Enviando…' : 'Enviar requerimiento'}
        </button>
        <button type="button" onClick={onCerrar} className="rounded-lg border border-marmol-200 text-marmol-600 text-sm px-3 py-2">
          Cancelar
        </button>
      </div>
    </form>
  );
}
