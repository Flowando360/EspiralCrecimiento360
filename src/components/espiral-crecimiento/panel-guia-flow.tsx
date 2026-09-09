'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  crearGuiaDelFlow,
  crearInvitacionGuiaFlow,
  generarInformesSer,
  guardarComentarioColaborador,
} from '@/app/(dashboard)/espiral-crecimiento/colaboradores/[id]/guia-flow/actions';
import { Plus, Check, Sparkles, Send, Copy, Clock } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';

export function InvitacionGuiaFlow({
  colaboradorId,
  invitacionInicial,
}: {
  colaboradorId: string;
  invitacionInicial: { link: string; creadaEl: string; usadaEl: string | null } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [invitacion, setInvitacion] = useState(invitacionInicial);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function generar() {
    setError(null);
    setCopiado(false);
    startTransition(async () => {
      const res = await crearInvitacionGuiaFlow({ colaboradorId });
      if (res.ok) {
        setInvitacion({ link: res.link, creadaEl: new Date().toISOString(), usadaEl: null });
      } else {
        setError(res.error);
      }
    });
  }

  function copiar() {
    if (!invitacion) return;
    navigator.clipboard.writeText(invitacion.link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div className="card p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-marmol-800">Invitar a la Guía del Flow</h3>
        <p className="text-xs text-marmol-500 mt-1">
          Genera un link único para esta persona. Cuando complete su cuestionario y genere su Guía en
          guiadelflow, sus 18 aspectos con relevancia laboral y los dos informes se cargan solos aquí —
          sin que nadie tenga que escribir su correo ni el sistema tenga que adivinar quién es.
        </p>
      </div>

      {invitacion && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            readOnly
            value={invitacion.link}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-[220px] rounded-lg border border-marmol-200 px-2.5 py-1.5 text-xs text-marmol-600"
          />
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs font-medium px-2.5 py-1.5 transition"
          >
            <Copy size={12} /> {copiado ? 'Copiado' : 'Copiar'}
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-marmol-400">
            <Clock size={12} />
            {invitacion.usadaEl ? `Usada el ${formatearFecha(invitacion.usadaEl)}` : `Pendiente — creada el ${formatearFecha(invitacion.creadaEl)}`}
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={generar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Send size={16} /> {pending ? 'Generando…' : invitacion ? 'Generar nueva invitación' : 'Generar invitación'}
      </button>
      {error && <p className="text-xs text-alto">{error}</p>}
    </div>
  );
}

export function BotonCrearGuiaFlow({ colaboradorId }: { colaboradorId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function crear() {
    startTransition(async () => {
      const res = await crearGuiaDelFlow({ colaboradorId });
      if (res.ok) router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={crear}
      className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3.5 py-2 transition"
    >
      <Plus size={16} /> {pending ? 'Creando…' : 'Crear Guía del Flow'}
    </button>
  );
}

export function BotonGenerarInformes({ colaboradorId, guiaDelFlowId, yaTieneInforme }: { colaboradorId: string; guiaDelFlowId: string; yaTieneInforme: boolean }) {
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const router = useRouter();

  function generar() {
    setMensaje(null);
    startTransition(async () => {
      const res = await generarInformesSer({ colaboradorId, guiaDelFlowId });
      if (res.ok) {
        router.refresh();
      } else {
        setMensaje(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        disabled={pending}
        onClick={generar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-50 text-white text-sm font-medium px-3.5 py-2 transition"
      >
        <Sparkles size={16} /> {pending ? 'Generando…' : yaTieneInforme ? 'Regenerar informes' : 'Generar informes con IA'}
      </button>
      {mensaje && <span className="text-xs text-marmol-500">{mensaje}</span>}
    </div>
  );
}

export function ComentarioGeneralSer({
  colaboradorId,
  guiaDelFlowId,
  comentarioInicial,
  puedeComentar,
}: {
  colaboradorId: string;
  guiaDelFlowId: string;
  comentarioInicial: string | null;
  puedeComentar: boolean;
}) {
  const [, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(false);

  if (!puedeComentar && !comentarioInicial) return null;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-marmol-800 mb-2">Comentario general</h3>
      {puedeComentar ? (
        <>
          <textarea
            placeholder="Tu reflexión sobre tu informe de desarrollo (opcional)…"
            defaultValue={comentarioInicial ?? ''}
            onBlur={(e) => {
              const valor = e.target.value;
              if (!valor.trim()) return;
              startTransition(async () => {
                const res = await guardarComentarioColaborador({
                  colaboradorId,
                  guiaDelFlowId,
                  aspectoId: null,
                  comentario: valor,
                });
                if (res.ok) setGuardado(true);
              });
            }}
            rows={3}
            className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
          />
          {guardado && (
            <p className="text-xs text-alto flex items-center gap-1 mt-1">
              <Check size={12} /> Guardado
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-marmol-600 italic">"{comentarioInicial}"</p>
      )}
    </div>
  );
}
