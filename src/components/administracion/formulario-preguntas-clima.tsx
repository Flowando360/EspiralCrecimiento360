'use client';

import { useState, useTransition } from 'react';
import { guardarPreguntasClima } from '@/app/(dashboard)/administracion/configuracion/actions';
import { ENPS_PREGUNTA_DEFECTO } from '@/components/espiral-crecimiento/formulario-clima';
import { Check } from 'lucide-react';

export interface PreguntasClimaIniciales {
  enps: string;
  reconocimiento: string;
  liderazgo: string;
  desarrollo: string;
  comunicacion: string;
  condiciones: string;
  pertenencia: string;
}

const CAMPOS: { key: keyof PreguntasClimaIniciales; label: string; placeholder: string }[] = [
  { key: 'enps', label: 'Pregunta de eNPS (0-10)', placeholder: ENPS_PREGUNTA_DEFECTO },
  { key: 'reconocimiento', label: 'Afirmación de "reconocimiento" (1-5)', placeholder: 'Me siento reconocido/a por mi trabajo' },
  { key: 'liderazgo', label: 'Afirmación de "liderazgo" (1-5)', placeholder: 'Confío en el liderazgo de mi jefe directo' },
  { key: 'desarrollo', label: 'Afirmación de "desarrollo" (1-5)', placeholder: 'Tengo oportunidades reales de crecer y aprender' },
  { key: 'comunicacion', label: 'Afirmación de "comunicación" (1-5)', placeholder: 'La comunicación en la empresa es clara y oportuna' },
  { key: 'condiciones', label: 'Afirmación de "condiciones" (1-5)', placeholder: 'Mis condiciones de trabajo son adecuadas' },
  { key: 'pertenencia', label: 'Afirmación de "pertenencia" (1-5)', placeholder: 'Siento que pertenezco a esta empresa' },
];

export function FormularioPreguntasClima({ inicial }: { inicial: PreguntasClimaIniciales }) {
  const [datos, setDatos] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);

  function guardar() {
    startTransition(async () => {
      const res = await guardarPreguntasClima(datos);
      setResultado(res);
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-display font-semibold text-secundario">Preguntas de Clima Organizacional</h2>
        <p className="text-xs text-marmol-400 mt-0.5">
          Ajusta el enunciado de cada pregunta al lenguaje de tu empresa. Las 7 preguntas (eNPS + 6
          afirmaciones) se mantienen fijas para poder comparar el resultado entre rondas — deja un
          campo vacío para usar el texto por defecto.
        </p>
      </div>

      <div className="space-y-3">
        {CAMPOS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs text-marmol-500 mb-1">{label}</label>
            <textarea
              value={datos[key]}
              onChange={(e) => {
                setDatos((prev) => ({ ...prev, [key]: e.target.value }));
                setResultado(null);
              }}
              placeholder={placeholder}
              rows={2}
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={guardar}
          className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {resultado?.ok && (
          <p className="text-xs text-alto flex items-center gap-1">
            <Check size={12} /> Guardado
          </p>
        )}
        {resultado && !resultado.ok && <p className="text-xs text-bajo">{resultado.error}</p>}
      </div>
    </div>
  );
}
