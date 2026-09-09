'use client';

import { useState } from 'react';
import Link from 'next/link';
import { glosario } from '@/content/ayuda';
import { ArrowLeft, Search } from 'lucide-react';

export default function GlosarioPage() {
  const [filtro, setFiltro] = useState('');
  const q = filtro.trim().toLowerCase();
  const terminos = q
    ? glosario.filter((t) => t.termino.toLowerCase().includes(q) || t.definicion.toLowerCase().includes(q))
    : glosario;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/ayuda" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Centro de Ayuda
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Glosario</h1>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-marmol-400" />
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar un término…"
          className="w-full rounded-lg border border-marmol-200 pl-8 pr-3 py-2 text-sm"
        />
      </div>

      <dl className="card divide-y divide-marmol-100">
        {terminos.length === 0 ? (
          <p className="text-sm text-marmol-400 p-4">Sin resultados.</p>
        ) : (
          terminos.map((t) => (
            <div key={t.termino} id={`term-${glosario.indexOf(t)}`} className="px-4 py-3">
              <dt className="text-sm font-semibold text-marmol-900">{t.termino}</dt>
              <dd className="text-sm text-marmol-600 mt-0.5">{t.definicion}</dd>
            </div>
          ))
        )}
      </dl>
    </div>
  );
}
