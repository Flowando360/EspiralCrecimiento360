'use client';

import { useState, useTransition } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { actualizarVacante } from '@/app/(dashboard)/reclutamiento/actions';
import { CamposOfertaVacante, type DatosOferta } from '@/components/reclutamiento/campos-oferta-vacante';

export function EditarVacante({
  vacanteId,
  cargos,
  lideres,
  datosIniciales,
  iaDisponible = true,
}: {
  iaDisponible?: boolean;
  vacanteId: string;
  cargos: { id: string; nombre: string }[];
  lideres: { id: string; nombre_completo: string }[];
  datosIniciales: { titulo: string; descripcion: string; cargoId: string; liderSolicitanteId: string; presupuestoSalarial: string; modalidad?: string; ciudad?: string; horario?: string; tipoContrato?: string; requisitos?: string; beneficios?: string };
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(datosIniciales.titulo);
  const oferta0: DatosOferta = { descripcion: datosIniciales.descripcion, modalidad: datosIniciales.modalidad ?? '', ciudad: datosIniciales.ciudad ?? '', horario: datosIniciales.horario ?? '', tipoContrato: datosIniciales.tipoContrato ?? '', requisitos: datosIniciales.requisitos ?? '', beneficios: datosIniciales.beneficios ?? '' };
  const [oferta, setOferta] = useState<DatosOferta>(oferta0);
  const [cargoId, setCargoId] = useState(datosIniciales.cargoId);
  const [liderSolicitanteId, setLiderSolicitanteId] = useState(datosIniciales.liderSolicitanteId);
  const [presupuestoSalarial, setPresupuestoSalarial] = useState(datosIniciales.presupuestoSalarial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await actualizarVacante({ vacanteId, titulo, descripcion: oferta.descripcion, cargoId, liderSolicitanteId, presupuestoSalarial, modalidad: oferta.modalidad as any, ciudad: oferta.ciudad, horario: oferta.horario, tipoContrato: oferta.tipoContrato, requisitos: oferta.requisitos, beneficios: oferta.beneficios });
      if (res.ok) setEditando(false);
      else setError(res.error);
    });
  }

  function cancelar() {
    setTitulo(datosIniciales.titulo);
    setOferta(oferta0);
    setCargoId(datosIniciales.cargoId);
    setLiderSolicitanteId(datosIniciales.liderSolicitanteId);
    setPresupuestoSalarial(datosIniciales.presupuestoSalarial);
    setError(null);
    setEditando(false);
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-flow-600"
      >
        <Pencil size={12} /> Editar
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-2 w-full max-w-2xl">
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-marmol-500 mb-1">Cargo</label>
        <select value={cargoId} onChange={(e) => setCargoId(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
          {cargos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Líder solicitante</label>
          <select value={liderSolicitanteId} onChange={(e) => setLiderSolicitanteId(e.target.value)} className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm">
            <option value="">Sin especificar</option>
            {lideres.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre_completo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Presupuesto salarial</label>
          <input
            type="number"
            value={presupuestoSalarial}
            onChange={(e) => setPresupuestoSalarial(e.target.value)}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>
      <CamposOfertaVacante valor={oferta} onChange={setOferta} cargoId={cargoId} titulo={titulo} iaDisponible={iaDisponible} />
      {error && <p className="text-xs text-bajo">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending || !titulo.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1.5"
        >
          <Check size={12} /> {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={cancelar} disabled={pending} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 text-marmol-600 hover:bg-marmol-100 text-xs font-medium px-2.5 py-1.5">
          <X size={12} /> Cancelar
        </button>
      </div>
    </div>
  );
}
