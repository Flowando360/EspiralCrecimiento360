'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { proponerOfertaVacante } from '@/app/(dashboard)/reclutamiento/actions';
import { MODALIDADES } from '@/lib/reclutamiento/oferta';
import { TIPOS_CONTRATO } from '@/lib/contratos';

export interface DatosOferta {
  descripcion: string;
  modalidad: string;
  ciudad: string;
  horario: string;
  tipoContrato: string;
  requisitos: string;
  beneficios: string;
}

const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
const label = 'block text-xs text-marmol-500 mb-1';

/**
 * Campos de la oferta de una vacante (modalidad, ciudad, horario, contrato, descripción, requisitos y beneficios) con un
 * botón que redacta el borrador desde el perfil del cargo, con o sin IA. Siempre editable antes de publicar.
 */
export function CamposOfertaVacante({
  valor,
  onChange,
  cargoId,
  titulo,
  iaDisponible = true,
}: {
  valor: DatosOferta;
  onChange: (v: DatosOferta) => void;
  cargoId: string;
  titulo: string;
  iaDisponible?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const set = (k: keyof DatosOferta, v: string) => onChange({ ...valor, [k]: v });

  function redactar(conIA: boolean) {
    if (!cargoId) return setAviso({ ok: false, texto: 'Elige primero el cargo: la oferta se redacta desde su perfil.' });
    if ((valor.descripcion.trim() || valor.requisitos.trim()) && !window.confirm('Esto reemplaza la descripción y los requisitos que ya escribiste. ¿Continuar?')) return;
    setAviso(null);
    startTransition(async () => {
      const res = await proponerOfertaVacante({
        cargoId,
        titulo,
        modalidad: valor.modalidad,
        ciudad: valor.ciudad,
        horario: valor.horario,
        tipoContrato: valor.tipoContrato,
        beneficios: valor.beneficios,
        conIA,
      });
      if (!res.ok) return setAviso({ ok: false, texto: res.error });
      onChange({ ...valor, descripcion: res.descripcion, requisitos: res.requisitos });
      setAviso({ ok: true, texto: ('aviso' in res && res.aviso) || 'Borrador listo. Revísalo y ajústalo antes de publicar.' });
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>Modalidad</label>
          <select className={campo} value={valor.modalidad} onChange={(e) => set('modalidad', e.target.value)}>
            <option value="">Sin especificar</option>
            {MODALIDADES.map((m) => (
              <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Ciudad</label>
          <input className={campo} value={valor.ciudad} onChange={(e) => set('ciudad', e.target.value)} placeholder="Ej. Medellín" />
        </div>
        <div>
          <label className={label}>Horario</label>
          <input className={campo} value={valor.horario} onChange={(e) => set('horario', e.target.value)} placeholder="Ej. Lunes a viernes, 7:00 a. m. a 5:00 p. m." />
        </div>
        <div>
          <label className={label}>Tipo de contrato</label>
          <select className={campo} value={valor.tipoContrato} onChange={(e) => set('tipoContrato', e.target.value)}>
            <option value="">Sin especificar</option>
            {TIPOS_CONTRATO.map((t) => (
              <option key={t.value} value={t.label}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => redactar(false)} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 px-3 py-1.5 text-xs font-medium text-marmol-600 disabled:opacity-50">
          <Wand2 size={12} /> Redactar desde el perfil del cargo
        </button>
        {iaDisponible && (
          <button type="button" onClick={() => redactar(true)} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 hover:border-flow-300 px-3 py-1.5 text-xs font-medium text-marmol-600 disabled:opacity-50">
            <Sparkles size={12} /> {pending ? 'Redactando…' : 'Redactar con IA'}
          </button>
        )}
        {aviso && <span className={aviso.ok ? 'text-xs text-alto' : 'text-xs text-bajo'}>{aviso.texto}</span>}
      </div>

      <div>
        <label className={label}>Descripción de la oferta</label>
        <textarea className={campo} rows={5} value={valor.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Qué hará la persona y por qué vale la pena postularse." />
      </div>
      <div>
        <label className={label}>Requisitos principales (una línea por requisito)</label>
        <textarea className={campo} rows={5} value={valor.requisitos} onChange={(e) => set('requisitos', e.target.value)} placeholder="• Técnico en logística&#10;• 1 año de experiencia" />
      </div>
      <div>
        <label className={label}>Beneficios (escríbelos tú: la IA no los inventa)</label>
        <textarea className={campo} rows={3} value={valor.beneficios} onChange={(e) => set('beneficios', e.target.value)} placeholder="Ej. Auxilio de transporte, prestaciones de ley, capacitación continua" />
      </div>
    </div>
  );
}
