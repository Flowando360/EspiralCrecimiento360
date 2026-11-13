'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

const CLAVE = 'tour-bienvenida-v1';
export const EVENTO_ABRIR_TOUR = 'abrir-tour-bienvenida';

interface Paso {
  titulo: string;
  texto: string;
}

function pasosPorRol(rol: string): Paso[] {
  const comunes: Paso[] = [
    {
      titulo: 'Bienvenida a Espiral de Crecimiento 360°',
      texto:
        'Aquí cada persona tiene una ficha con cuatro dimensiones: Ser, Saber, Hacer y Deber. Sirve para acompañar el crecimiento, no para juzgar. Te mostramos en un minuto dónde está todo.',
    },
    {
      titulo: 'El menú de arriba',
      texto:
        'Cada opción de la barra superior es un módulo: tu perfil, Espiral 360° (fichas, evaluaciones y planes de desarrollo), Nexa (cultura y formación), Reclutamiento, Procesos y más. Solo ves lo que tu rol necesita.',
    },
  ];
  const porRol: Record<string, Paso[]> = {
    admin_th: [
      { titulo: 'Tu punto de partida', texto: 'En Inicio ves el estado del equipo y las alertas que vencen. En Administración configuras cargos, organigrama, usuarios y roles.' },
      { titulo: 'Un ciclo de crecimiento', texto: 'En Espiral 360° → Ciclos de Crecimiento abres la valoración de un equipo; cada acompañante responde y el sistema calcula los índices y propone el plan de desarrollo.' },
    ],
    lider: [
      { titulo: 'Tu equipo', texto: 'En Espiral 360° ves a tu equipo, valoras a tus colaboradores en cada ciclo y acompañas sus planes de desarrollo.' },
    ],
    colaborador: [
      { titulo: 'Lo tuyo', texto: 'En Mi perfil ves tu ficha, tus valoraciones y tu plan de desarrollo. En Formación tienes tus cursos, y en Nexa puedes reconocer a tus compañeros.' },
    ],
    gerencia: [
      { titulo: 'Panorama', texto: 'Tus pantallas son de lectura: indicadores, informes y organigrama de la empresa, siempre con datos agrupados.' },
    ],
  };
  const cierre: Paso[] = [
    { titulo: 'Las alertas', texto: 'La campana de arriba te avisa de fechas que importan: contratos, exámenes, evaluaciones y también cumpleaños y aniversarios.' },
    {
      titulo: 'Conoce a Gino',
      texto:
        'Gino es el amigo de la plataforma: el botón redondo abajo a la derecha. Te explica la pantalla donde estás, busca en el manual y responde tus dudas. Pregúntale lo que quieras, por ejemplo «¿qué es la Guía del Flow?».',
    },
  ];
  return [...comunes, ...(porRol[rol] ?? []), ...cierre];
}

/** Recorrido de bienvenida: se abre solo la primera vez en cada navegador y se puede repetir desde Gino. */
export function TourBienvenida({ rol }: { rol: string }) {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState(0);
  const pasos = pasosPorRol(rol);

  useEffect(() => {
    let yaVisto = false;
    try {
      yaVisto = !!localStorage.getItem(CLAVE);
    } catch {
      yaVisto = true; // sin almacenamiento no lo repetimos en cada pantalla
    }
    const t = yaVisto ? null : setTimeout(() => setAbierto(true), 1200);
    const abrir = () => {
      setPaso(0);
      setAbierto(true);
    };
    window.addEventListener(EVENTO_ABRIR_TOUR, abrir);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener(EVENTO_ABRIR_TOUR, abrir);
    };
  }, []);

  function cerrar() {
    setAbierto(false);
    try {
      localStorage.setItem(CLAVE, '1');
    } catch {
      /* sin almacenamiento: puede volver a aparecer */
    }
  }

  if (!abierto) return null;
  const actual = pasos[paso] ?? pasos[0]!;
  const ultimo = paso === pasos.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Recorrido de bienvenida">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-secundario">{actual.titulo}</h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar recorrido" className="text-marmol-400 hover:text-marmol-600">
            <X size={18} />
          </button>
        </div>
        <p className="mt-3 text-sm text-marmol-600">{actual.texto}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-marmol-400">
            {paso + 1} de {pasos.length}
          </span>
          <div className="flex gap-2">
            {paso > 0 && (
              <button type="button" onClick={() => setPaso((p) => p - 1)} className="inline-flex items-center gap-1 rounded-lg border border-marmol-200 px-3 py-1.5 text-sm text-marmol-600">
                <ArrowLeft size={14} /> Atrás
              </button>
            )}
            {ultimo ? (
              <button type="button" onClick={cerrar} className="rounded-lg bg-flow-500 hover:bg-flow-600 px-4 py-1.5 text-sm font-medium text-white">
                Empezar
              </button>
            ) : (
              <button type="button" onClick={() => setPaso((p) => p + 1)} className="inline-flex items-center gap-1 rounded-lg bg-flow-500 hover:bg-flow-600 px-3 py-1.5 text-sm font-medium text-white">
                Siguiente <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
        {!ultimo && (
          <button type="button" onClick={cerrar} className="mt-3 text-xs text-marmol-400 hover:text-marmol-600">
            Saltar recorrido
          </button>
        )}
      </div>
    </div>
  );
}
