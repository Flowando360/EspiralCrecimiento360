'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Send, FileText } from 'lucide-react';

interface Mensaje {
  rol: 'usuario' | 'asistente';
  texto: string;
}

export function AsistenteChat({ esAdminTh }: { esAdminTh: boolean }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: 'asistente',
      texto:
        'Hola, soy el asistente de Nexa. Puedo resolver dudas sobre protocolos de seguridad, uso de EPP, políticas internas y procedimientos de la compañía. ¿En qué te ayudo?',
    },
  ]);
  const [pregunta, setPregunta] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    if (!pregunta.trim()) return;
    const nuevaPregunta = pregunta;
    setMensajes((prev) => [...prev, { rol: 'usuario', texto: nuevaPregunta }]);
    setPregunta('');
    setCargando(true);

    try {
      const res = await fetch('/api/nexa/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: nuevaPregunta }),
      });
      const data = await res.json();
      setMensajes((prev) => [...prev, { rol: 'asistente', texto: data.respuesta }]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        { rol: 'asistente', texto: 'No pude conectarme al asistente. Intenta de nuevo en un momento.' },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
            <Bot size={22} className="text-flow-500" /> Asistente IA
          </h1>
          <p className="text-sm text-marmol-500 mt-1">
            Responde con las políticas y procedimientos propios cargados por Talento Humano, cuando aplica.
          </p>
        </div>
        {esAdminTh && (
          <Link
            href="/nexa/asistente/documentos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs font-medium px-3 py-1.5 shrink-0"
          >
            <FileText size={13} /> Base documental
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto card p-4 space-y-3">
        {mensajes.map((m, i) => (
          <div key={i} className={m.rol === 'usuario' ? 'text-right' : 'text-left'}>
            <span
              className={
                m.rol === 'usuario'
                  ? 'inline-block rounded-2xl rounded-br-sm bg-flow-500 text-white px-4 py-2 text-sm max-w-[85%]'
                  : 'inline-block rounded-2xl rounded-bl-sm bg-marmol-100 text-marmol-800 px-4 py-2 text-sm max-w-[85%]'
              }
            >
              {m.texto}
            </span>
          </div>
        ))}
        {cargando && <p className="text-xs text-marmol-400">Escribiendo…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="flex-1 rounded-lg border border-marmol-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flow-400"
        />
        <button
          type="submit"
          disabled={cargando}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white px-3.5 py-2 transition disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
