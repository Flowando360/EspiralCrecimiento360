'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Sparkles, Wand2, Check } from 'lucide-react';
import {
  generarBorradorBrief,
  guardarBriefCampos,
} from '@/app/(dashboard)/espiral-crecimiento/evaluaciones/[evaluacionId]/brief/actions';

export interface CamposBriefUI {
  talento_central: string;
  resumen_ser: string;
  resumen_saber: string;
  resumen_hacer: string;
  resumen_deber: string;
  sugerencias_enfoque: string;
}

const SECCIONES: { k: keyof CamposBriefUI; titulo: string; ayuda: string; filas: number }[] = [
  { k: 'talento_central', titulo: 'Talento central', ayuda: 'Lo más fuerte de esta persona, para partir la conversación desde ahí.', filas: 2 },
  { k: 'resumen_ser', titulo: 'Resumen de Ser (Guía del Flow)', ayuda: 'Quién es y qué la mueve, solo con los aspectos de relevancia laboral.', filas: 3 },
  { k: 'resumen_saber', titulo: 'Resumen de Saber (hoja de vida, cursos y cargo)', ayuda: 'Lo que sabe frente a lo que su cargo exige: cumplimiento, certificaciones y formación.', filas: 3 },
  { k: 'resumen_hacer', titulo: 'Resumen de Hacer', ayuda: 'Lo más relevante del resultado en Hacer.', filas: 3 },
  { k: 'resumen_deber', titulo: 'Resumen de Deber', ayuda: 'Lo más relevante del resultado en Deber (cultura).', filas: 3 },
  { k: 'sugerencias_enfoque', titulo: 'Sugerencias de enfoque', ayuda: 'Cómo abordar la conversación y qué priorizar.', filas: 4 },
];

/** Caja de texto que crece sola según lo que contiene, para que nunca quede texto escondido. */
function AutoTextarea({ value, onChange, minFilas }: { value: string; onChange: (v: string) => void; minFilas: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={minFilas}
      className="w-full rounded-lg border border-marmol-200 px-3 py-2 text-sm resize-y overflow-hidden"
    />
  );
}

export function BriefEditor({
  evaluacionId,
  inicial,
  fuenteInicial,
  esBorradorAutomatico,
  faltaSerSaber,
  iaDisponible,
}: {
  evaluacionId: string;
  inicial: CamposBriefUI;
  fuenteInicial: 'manual' | 'automatico' | 'ia';
  /** true cuando todavía no hay Brief guardado y los textos son el borrador que armó el sistema. */
  esBorradorAutomatico: boolean;
  /** Brief guardado antes de existir Ser y Saber: esas dos secciones vienen del borrador y aún no se guardan. */
  faltaSerSaber?: boolean;
  iaDisponible: boolean;
}) {
  const [campos, setCampos] = useState<CamposBriefUI>(inicial);
  const [fuente, setFuente] = useState(fuenteInicial);
  const [sinGuardar, setSinGuardar] = useState(esBorradorAutomatico || Boolean(faltaSerSaber));
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function cambiar(k: keyof CamposBriefUI, v: string) {
    setCampos((p) => ({ ...p, [k]: v }));
    setSinGuardar(true);
    if (fuente !== 'manual') setFuente('manual');
  }

  function generar(conIA: boolean) {
    const hayTexto = Object.values(campos).some((v) => v.trim());
    if (hayTexto && !confirm('Esto reemplaza lo que hay escrito en las seis secciones con un borrador nuevo (aún no se guarda). ¿Continuar?')) return;
    setMensaje(null);
    startTransition(async () => {
      const res = await generarBorradorBrief(evaluacionId, conIA);
      if (!res.ok) return setMensaje({ ok: false, texto: res.error });
      setCampos(res.campos);
      setFuente(res.fuente);
      setSinGuardar(true);
      setMensaje({
        ok: !('aviso' in res && res.aviso),
        texto: ('aviso' in res && res.aviso) || (res.fuente === 'ia' ? 'Listo: mejoré la redacción con IA. Revísalo y edítalo antes de guardar.' : 'Listo: actualicé el borrador con los datos más recientes. Revísalo y edítalo antes de guardar.'),
      });
    });
  }

  function guardar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await guardarBriefCampos({ evaluacionId, ...campos, fuente });
      if (res.ok) {
        setSinGuardar(false);
        setMensaje({ ok: true, texto: 'Brief guardado.' });
      } else setMensaje({ ok: false, texto: res.error });
    });
  }

  return (
    <div className="card p-5 space-y-4">
      {faltaSerSaber && sinGuardar && (
        <p className="text-sm text-flow-700 bg-flow-50 border border-flow-100 rounded-lg px-3 py-2">
          Este Brief se guardó antes de incluir <strong>Ser</strong> y <strong>Saber</strong>. Agregué esas dos secciones con los datos actuales: revísalas y pulsa <strong>Guardar</strong>.
        </p>
      )}
      {esBorradorAutomatico && sinGuardar && (
        <p className="text-sm text-flow-700 bg-flow-50 border border-flow-100 rounded-lg px-3 py-2">
          Armé este borrador cruzando la Guía del Flow (Ser), la hoja de vida, los cursos y el cumplimiento del cargo (Saber) y la valoración del ciclo (Hacer y
          Deber). Léelo, ajústalo con lo que tú ves en el día a día y pulsa <strong>Guardar</strong>.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => generar(false)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-700 text-xs font-medium px-3 py-1.5 disabled:opacity-50"
        >
          <Wand2 size={13} /> Rehacer borrador con los datos
        </button>
        {iaDisponible && (
          <button
            type="button"
            onClick={() => generar(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-flow-200 text-flow-700 hover:bg-flow-50 text-xs font-medium px-3 py-1.5 disabled:opacity-50"
          >
            <Sparkles size={13} /> Mejorar la redacción con IA
          </button>
        )}
        {pending && <span className="text-xs text-marmol-400 self-center">Trabajando…</span>}
      </div>

      {SECCIONES.map((s) => (
        <div key={s.k}>
          <label className="block text-sm font-medium text-marmol-700">{s.titulo}</label>
          <p className="text-[12px] text-marmol-400 mb-1">{s.ayuda}</p>
          <AutoTextarea value={campos[s.k]} onChange={(v) => cambiar(s.k, v)} minFilas={s.filas} />
        </div>
      ))}

      {mensaje && <p className={`text-sm ${mensaje.ok ? 'text-alto' : 'text-bajo'}`}>{mensaje.texto}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition"
        >
          <Check size={14} /> Guardar
        </button>
        {sinGuardar && <span className="text-xs text-medio">Hay cambios sin guardar</span>}
      </div>
    </div>
  );
}
