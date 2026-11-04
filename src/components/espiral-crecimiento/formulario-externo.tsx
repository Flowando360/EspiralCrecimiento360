'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  crearExterno,
  crearExternosMasivo,
  actualizarExterno,
} from '@/app/(dashboard)/espiral-crecimiento/externos/actions';
import { TIPOS_EXTERNO, type TipoExterno } from '@/lib/colaboradores/externos';

export interface DatosExterno {
  nombreCompleto: string;
  numeroDocumento: string;
  email: string;
  telefono: string;
  tipoExterno: TipoExterno;
  entidad: string;
  servicio: string;
  responsableId: string;
  fechaInicio: string;
  fechaFin: string;
  notas: string;
  estado: 'activo' | 'inactivo';
}

const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm bg-white';
const label = 'block text-xs text-marmol-500 mb-1';
const hoy = () => new Date().toISOString().slice(0, 10);

function CamposVinculo({
  v,
  set,
  responsables,
}: {
  v: Pick<DatosExterno, 'tipoExterno' | 'entidad' | 'servicio' | 'responsableId' | 'fechaInicio' | 'fechaFin' | 'notas'>;
  set: (c: Partial<DatosExterno>) => void;
  responsables: { id: string; nombre: string }[];
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className={label}>Tipo de vínculo *</label>
        <select value={v.tipoExterno} onChange={(e) => set({ tipoExterno: e.target.value as TipoExterno })} className={campo}>
          {TIPOS_EXTERNO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Servicio o cargo que presta *</label>
        <input
          value={v.servicio}
          onChange={(e) => set({ servicio: e.target.value })}
          placeholder="ej. Contratista instalador"
          className={campo}
        />
      </div>
      <div>
        <label className={label}>Empresa o firma (si aplica)</label>
        <input value={v.entidad} onChange={(e) => set({ entidad: e.target.value })} className={campo} />
      </div>
      <div>
        <label className={label}>Responsable interno</label>
        <select value={v.responsableId} onChange={(e) => set({ responsableId: e.target.value })} className={campo}>
          <option value="">— Sin responsable —</option>
          {responsables.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        <p className="text-[12px] text-marmol-400 mt-1">Quien lo contrata o coordina. Aparece en el organigrama bajo esa persona.</p>
      </div>
      <div>
        <label className={label}>Inicio del vínculo *</label>
        <input type="date" value={v.fechaInicio} onChange={(e) => set({ fechaInicio: e.target.value })} className={campo} />
      </div>
      <div>
        <label className={label}>Fin del contrato o servicio</label>
        <input type="date" value={v.fechaFin} onChange={(e) => set({ fechaFin: e.target.value })} className={campo} />
        <p className="text-[12px] text-marmol-400 mt-1">Si la llenas, el sistema te avisa 30 días antes de que venza.</p>
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Notas</label>
        <textarea value={v.notas} onChange={(e) => set({ notas: e.target.value })} rows={2} className={campo} />
      </div>
    </div>
  );
}

const vacio: DatosExterno = {
  nombreCompleto: '',
  numeroDocumento: '',
  email: '',
  telefono: '',
  tipoExterno: 'contratista',
  entidad: '',
  servicio: '',
  responsableId: '',
  fechaInicio: '',
  fechaFin: '',
  notas: '',
  estado: 'activo',
};

/** Alta de un externo, edición de uno existente, o carga de varios a la vez. */
export function FormularioExterno({
  responsables,
  colaboradorId,
  datosIniciales,
}: {
  responsables: { id: string; nombre: string }[];
  colaboradorId?: string;
  datosIniciales?: DatosExterno;
}) {
  const router = useRouter();
  const editando = Boolean(colaboradorId);
  const [modo, setModo] = useState<'uno' | 'varios'>('uno');
  const [d, setD] = useState<DatosExterno>(datosIniciales ?? { ...vacio, fechaInicio: hoy() });
  const [lineas, setLineas] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ creados: number; omitidas: string[] } | null>(null);
  const set = (c: Partial<DatosExterno>) => setD((prev) => ({ ...prev, ...c }));

  function guardar() {
    setError(null);
    setResultado(null);
    startTransition(async () => {
      const comun = {
        tipoExterno: d.tipoExterno,
        entidad: d.entidad,
        servicio: d.servicio,
        responsableId: d.responsableId,
        fechaInicio: d.fechaInicio,
        fechaFin: d.fechaFin,
        notas: d.notas,
      };
      if (modo === 'varios' && !editando) {
        const res = await crearExternosMasivo({ ...comun, lineas });
        if (!res.ok) return setError(res.error);
        setResultado({ creados: res.creados, omitidas: res.omitidas });
        if (res.omitidas.length === 0) router.push('/espiral-crecimiento/externos');
        return;
      }
      const persona = {
        ...comun,
        nombreCompleto: d.nombreCompleto,
        numeroDocumento: d.numeroDocumento,
        email: d.email,
        telefono: d.telefono,
      };
      const res = editando ? await actualizarExterno({ ...persona, colaboradorId: colaboradorId!, estado: d.estado }) : await crearExterno(persona);
      if (!res.ok) return setError(res.error);
      router.push(`/espiral-crecimiento/externos/${editando ? colaboradorId : (res as any).id}`);
    });
  }

  const listo =
    d.servicio.trim() && d.fechaInicio && (modo === 'varios' && !editando ? lineas.trim() : d.nombreCompleto.trim());

  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      {!editando && (
        <div className="inline-flex rounded-lg border border-marmol-200 overflow-hidden text-sm">
          {(['uno', 'varios'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`px-3.5 py-1.5 ${modo === m ? 'bg-flow-500 text-white' : 'bg-white text-marmol-600 hover:bg-marmol-50'}`}
            >
              {m === 'uno' ? 'Una persona' : 'Varias a la vez'}
            </button>
          ))}
        </div>
      )}

      {modo === 'varios' && !editando ? (
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-secundario text-sm">Personas</h2>
          <p className="text-[13px] text-marmol-400">
            Una por línea: <strong>Nombre ; documento ; correo ; teléfono</strong> (solo el nombre es obligatorio). Puedes pegar
            columnas de Excel. Todas comparten el vínculo de abajo.
          </p>
          <textarea
            value={lineas}
            onChange={(e) => setLineas(e.target.value)}
            rows={8}
            placeholder={'Ana Pérez ; 1020304050 ; ana@correo.com ; 3001234567\nLuis Gómez'}
            className={`${campo} font-mono`}
          />
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-secundario text-sm">Datos de la persona</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={label}>Nombre completo *</label>
              <input value={d.nombreCompleto} onChange={(e) => set({ nombreCompleto: e.target.value })} className={campo} />
            </div>
            <div>
              <label className={label}>Documento</label>
              <input value={d.numeroDocumento} onChange={(e) => set({ numeroDocumento: e.target.value })} className={campo} />
            </div>
            <div>
              <label className={label}>Teléfono</label>
              <input value={d.telefono} onChange={(e) => set({ telefono: e.target.value })} className={campo} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Correo</label>
              <input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} className={campo} />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4 pt-4 border-t border-marmol-100">
        <h2 className="font-display font-semibold text-secundario text-sm">Vínculo con la empresa</h2>
        <CamposVinculo v={d} set={set} responsables={responsables} />
        {editando && (
          <div>
            <label className={label}>Estado</label>
            <select value={d.estado} onChange={(e) => set({ estado: e.target.value as 'activo' | 'inactivo' })} className={campo}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo (terminó el servicio)</option>
            </select>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-bajo">{error}</p>}
      {resultado && (
        <div className="text-sm rounded-lg border border-marmol-200 p-3 space-y-1">
          <p className="text-alto">Se registraron {resultado.creados} persona(s).</p>
          {resultado.omitidas.length > 0 && (
            <>
              <p className="text-medio">No se registraron {resultado.omitidas.length}:</p>
              <ul className="list-disc pl-5 text-xs text-marmol-600">
                {resultado.omitidas.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={pending || !listo}
        onClick={guardar}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2"
      >
        {pending ? 'Guardando…' : editando ? 'Guardar cambios' : modo === 'varios' ? 'Registrar a todas' : 'Registrar externo'}
      </button>
    </div>
  );
}
