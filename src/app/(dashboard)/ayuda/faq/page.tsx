'use client';

import { useState } from 'react';
import Link from 'next/link';
import { preguntasFrecuentes } from '@/content/ayuda';
import { ArrowLeft, Search } from 'lucide-react';

export default function FaqPage() {
  const [filtro, setFiltro] = useState('');
  const q = filtro.trim().toLowerCase();
  const preguntas = q
    ? preguntasFrecuentes.filter(
        (p) => p.pregunta.toLowerCase().includes(q) || p.respuesta.toLowerCase().includes(q)
      )
    : preguntasFrecuentes;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/ayuda" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Centro de Ayuda
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Preguntas frecuentes</h1>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-marmol-400" />
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar preguntas…"
          className="w-full rounded-lg border border-marmol-200 pl-8 pr-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        {preguntas.length === 0 ? (
          <p className="text-sm text-marmol-400">Sin resultados.</p>
        ) : (
          preguntas.map((p, i) => (
            <details key={i} id={`faq-${preguntasFrecuentes.indexOf(p)}`} className="card p-4 group">
              <summary className="text-sm font-medium text-marmol-800 cursor-pointer list-none flex items-center justify-between">
                {p.pregunta}
                <span className="text-marmol-400 group-open:rotate-45 transition text-lg leading-none">+</span>
              </summary>
              <p className="text-sm text-marmol-600 mt-2">{p.respuesta}</p>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
