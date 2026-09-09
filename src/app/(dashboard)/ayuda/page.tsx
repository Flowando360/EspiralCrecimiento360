'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MODULOS } from '@/content/ayuda';
import { buscarEnAyuda } from '@/content/ayuda/buscador';
import { HelpCircle, Search, HelpingHand, SpellCheck, ClipboardList } from 'lucide-react';

export default function AyudaHomePage() {
  const [consulta, setConsulta] = useState('');
  const resultados = consulta.trim() ? buscarEnAyuda(consulta) : [];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <HelpCircle size={22} className="text-flow-500" /> Centro de Ayuda
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Documentación por módulo, preguntas frecuentes, glosario y plan de pruebas de Espiral de Crecimiento.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-marmol-400" />
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Busca cualquier tema, pantalla o palabra…"
          className="w-full rounded-lg border border-marmol-200 pl-10 pr-3 py-2.5 text-sm"
        />
      </div>

      {consulta.trim() ? (
        <div className="space-y-2">
          {resultados.length === 0 ? (
            <p className="text-sm text-marmol-400">Sin resultados para "{consulta}".</p>
          ) : (
            resultados.map((r, i) => (
              <Link key={i} href={r.href} className="block card p-4 hover:border-flow-300 transition">
                <span className="text-[10px] uppercase tracking-wide text-flow-600 font-medium">{r.tipo}</span>
                <p className="text-sm font-medium text-marmol-800">{r.titulo}</p>
                <p className="text-xs text-marmol-500 line-clamp-2 mt-0.5">{r.texto}</p>
              </Link>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            {MODULOS.map((m) => (
              <Link key={m.slug} href={`/ayuda/modulo/${m.slug}`} className="card p-5 hover:border-flow-300 transition">
                <h2 className="font-display font-semibold text-secundario">{m.titulo}</h2>
                <p className="text-sm text-marmol-500 mt-1">{m.descripcion}</p>
                <p className="text-xs text-marmol-400 mt-2">{m.paginas.length} pantallas documentadas</p>
              </Link>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/ayuda/faq" className="card p-4 flex items-center gap-2.5 hover:border-flow-300 transition">
              <HelpingHand size={18} className="text-flow-600" />
              <span className="text-sm font-medium text-marmol-800">Preguntas frecuentes</span>
            </Link>
            <Link href="/ayuda/glosario" className="card p-4 flex items-center gap-2.5 hover:border-flow-300 transition">
              <SpellCheck size={18} className="text-flow-600" />
              <span className="text-sm font-medium text-marmol-800">Glosario</span>
            </Link>
            <Link href="/ayuda/plan-pruebas" className="card p-4 flex items-center gap-2.5 hover:border-flow-300 transition">
              <ClipboardList size={18} className="text-flow-600" />
              <span className="text-sm font-medium text-marmol-800">Plan de pruebas</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
