'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MODULOS } from '@/content/ayuda';
import { buscarEnAyuda } from '@/content/ayuda/buscador';
import { Sparkles, Search, HelpingHand, SpellCheck, ClipboardList, BookOpenCheck } from 'lucide-react';

export default function AyudaHomePage() {
  const [consulta, setConsulta] = useState('');
  const resultados = consulta.trim() ? buscarEnAyuda(consulta) : [];

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marca/gino-128.png" alt="Gino" className="h-16 w-16 rounded-full shrink-0 shadow-[0_0_18px_rgba(132,204,22,0.45)]" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-secundario">Centro de Ayuda</h1>
          <p className="text-sm text-marmol-500 mt-1">
            Soy <strong>Gino</strong>, tu amigo en Espiral de Crecimiento. Aquí encuentras el manual por módulo, las preguntas frecuentes, el
            glosario y el plan de pruebas. Si no encuentras algo, búscalo abajo o cuéntamelo.
          </p>
        </div>
      </div>

      <div className="card p-5 border-flow-200">
        <h2 className="font-display font-semibold text-secundario flex items-center gap-2">
          <Sparkles size={16} className="text-flow-500" /> ¿Qué es Espiral de Crecimiento 360°?
        </h2>
        <p className="text-sm text-marmol-600 mt-2">
          Es la plataforma de Talento Humano para acompañar el crecimiento de cada persona y de la empresa. Mira a cada persona en cuatro
          dimensiones (<strong>Ser, Saber, Hacer y Deber</strong>), reúne la valoración de su líder, sus pares, sus colaboradores y la suya
          propia, y la convierte en conversaciones, acuerdos y planes de desarrollo. Se llama «espiral» porque cuando un ciclo de
          acompañamiento se cierra empieza otro: no se da vueltas sobre lo mismo, se va creciendo hacia arriba.
        </p>
        <Link href="/ayuda/modulo/general/que-es-espiral" className="inline-block mt-3 text-sm text-flow-600 hover:text-flow-700 font-medium">
          Leer la explicación completa →
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-marmol-400" />
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Pregúntale a Gino: busca cualquier tema, pantalla o palabra…"
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
                <span className="text-[12px] uppercase tracking-wide text-flow-600 font-medium">{r.tipo}</span>
                <p className="text-sm font-medium text-marmol-800">{r.titulo}</p>
                <p className="text-xs text-marmol-500 line-clamp-2 mt-0.5">{r.texto}</p>
              </Link>
            ))
          )}
        </div>
      ) : (
        <>
          <a
            href="/guia-lider-th"
            target="_blank"
            rel="noopener"
            className="block rounded-xl p-5 text-white bg-gradient-to-br from-secundario to-flow-800 hover:opacity-95 transition shadow-sm"
          >
            <span className="inline-flex items-center gap-2 text-[13px] uppercase tracking-wide text-flow-200 font-medium">
              <BookOpenCheck size={16} /> Guía paso a paso
            </span>
            <h2 className="font-display text-lg font-semibold mt-1">Guía del líder de Talento Humano</h2>
            <p className="text-sm text-white/80 mt-1">
              Del primer candidato a la salida de una persona, con capturas reales: cargos, reclutamiento, ficha 360°, evaluación y seguimiento.
              Se abre en una pestaña nueva.
            </p>
          </a>

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
