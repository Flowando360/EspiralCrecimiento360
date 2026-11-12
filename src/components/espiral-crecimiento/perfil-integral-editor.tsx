'use client';

import { useState, useTransition } from 'react';
import { Sparkles, RefreshCw, Save } from 'lucide-react';
import { guardarPerfilIntegral, proponerPerfilIntegral } from '@/app/(dashboard)/espiral-crecimiento/evaluaciones/[evaluacionId]/perfil-integral/actions';
import type { CamposPerfilIntegral } from '@/lib/perfil-integral/borrador';

type Fuente = 'automatico' | 'ia' | 'manual';

const CAMPOS: { clave: keyof CamposPerfilIntegral; titulo: string; ayuda?: string; filas: number }[] = [
  { clave: 'hipotesis_ser', titulo: 'SER — hipótesis y recursos para conversar', ayuda: 'No son conclusiones ni explican automáticamente el desempeño.', filas: 3 },
  { clave: 'lectura_saber', titulo: 'SABER — lectura', filas: 2 },
  { clave: 'lectura_hacer', titulo: 'HACER — lectura', filas: 2 },
  { clave: 'lectura_deber', titulo: 'DEBER — lectura', filas: 2 },
  { clave: 'interpretacion', titulo: 'Interpretación integral', filas: 5 },
  { clave: 'acciones', titulo: 'Posibles acciones', ayuda: 'Una por línea.', filas: 6 },
];

export function PerfilIntegralEditor({
  evaluacionId,
  inicial,
  fuenteInicial,
  guardado,
  iaDisponible,
}: {
  evaluacionId: string;
  inicial: CamposPerfilIntegral;
  fuenteInicial: Fuente;
  guardado: boolean;
  iaDisponible: boolean;
}) {
  const [campos, setCampos] = useState(inicial);
  const [fuente, setFuente] = useState<Fuente>(fuenteInicial);
  const [sinGuardar, setSinGuardar] = useState(!guardado);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function editar(clave: keyof CamposPerfilIntegral, valor: string) {
    setCampos((c) => ({ ...c, [clave]: valor }));
    setFuente('manual');
    setSinGuardar(true);
    setMensaje(null);
  }

  function proponer(modo: 'automatico' | 'ia') {
    if (sinGuardar && guardado && !window.confirm('Esto reemplaza lo que tienes en pantalla (lo guardado no se pierde hasta que pulses Guardar). ¿Continuar?')) return;
    setMensaje(null);
    startTransition(async () => {
      const res = await proponerPerfilIntegral({ evaluacionId, modo });
      if (!res.ok) return setMensaje({ ok: false, texto: res.error });
      setCampos(res.campos);
      setFuente(res.fuente);
      setSinGuardar(true);
      setMensaje({ ok: true, texto: ('aviso' in res && res.aviso) || 'Borrador propuesto. Revísalo, ajústalo y guárdalo: tú decides.' });
    });
  }

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await guardarPerfilIntegral({ evaluacionId, ...campos, fuente });
      if (!res.ok) return setMensaje({ ok: false, texto: res.error });
      setSinGuardar(false);
      setMensaje({ ok: true, texto: 'Perfil integral guardado.' });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => proponer('automatico')} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 px-3 py-1.5 text-xs font-medium text-marmol-600">
          <RefreshCw size={12} /> Rehacer borrador con los datos
        </button>
        {iaDisponible && (
          <button type="button" onClick={() => proponer('ia')} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 px-3 py-1.5 text-xs font-medium text-marmol-600">
            <Sparkles size={12} /> Mejorar la redacción con IA
          </button>
        )}
        <span className="text-xs text-marmol-400">Fuente: {fuente === 'ia' ? 'propuesta de la IA' : fuente === 'manual' ? 'editado a mano' : 'borrador automático'}</span>
      </div>

      {CAMPOS.map((c) => (
        <div key={c.clave} className="card p-4 space-y-1.5">
          <label className="block font-display font-semibold text-secundario text-sm" htmlFor={`pi-${c.clave}`}>{c.titulo}</label>
          {c.ayuda && <p className="text-xs text-marmol-400">{c.ayuda}</p>}
          <textarea id={`pi-${c.clave}`} value={campos[c.clave]} onChange={(e) => editar(c.clave, e.target.value)} rows={c.filas} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
        </div>
      ))}

      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={guardar} disabled={pending || !sinGuardar} className="btn-primary text-xs inline-flex items-center gap-1 disabled:opacity-40">
          <Save size={12} /> {pending ? 'Trabajando…' : 'Guardar perfil integral'}
        </button>
        {sinGuardar && <span className="text-xs text-medio">Hay cambios sin guardar</span>}
        {mensaje && <span className={mensaje.ok ? 'text-xs text-alto' : 'text-xs text-red-600'}>{mensaje.texto}</span>}
      </div>
    </div>
  );
}
