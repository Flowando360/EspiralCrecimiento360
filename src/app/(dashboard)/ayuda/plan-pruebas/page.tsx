import Link from 'next/link';
import { planPruebas } from '@/content/ayuda';
import { ArrowLeft } from 'lucide-react';

export default function PlanPruebasPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/ayuda" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Centro de Ayuda
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario">Plan de pruebas</h1>
        <p className="text-sm text-marmol-500 mt-1">
          Escenarios paso a paso para verificar que cada módulo funciona correctamente, organizados por
          rol y por módulo.
        </p>
      </div>

      <div className="space-y-6">
        {planPruebas.map((seccion) => (
          <div key={seccion.modulo}>
            <h2 className="font-display font-semibold text-secundario mb-3">{seccion.modulo}</h2>
            <div className="space-y-3">
              {seccion.escenarios.map((esc) => (
                <details key={esc.titulo} className="card p-4 group">
                  <summary className="cursor-pointer list-none flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-marmol-800">{esc.titulo}</p>
                      <p className="text-xs text-marmol-400">Rol necesario: {esc.rolNecesario}</p>
                    </div>
                    <span className="text-marmol-400 group-open:rotate-45 transition text-lg leading-none">+</span>
                  </summary>
                  <ol className="mt-3 space-y-2 border-t border-marmol-100 pt-3">
                    {esc.pasos.map((p, i) => (
                      <li key={i} className="text-sm">
                        <span className="text-marmol-800">
                          {i + 1}. {p.paso}
                        </span>
                        <p className="text-xs text-marmol-500 mt-0.5 pl-4">
                          Resultado esperado: {p.resultadoEsperado}
                        </p>
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
