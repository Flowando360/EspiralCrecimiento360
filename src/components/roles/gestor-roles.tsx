'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarRol, crearRol, eliminarRol, guardarPermisosRol } from '@/app/(dashboard)/administracion/roles/actions';
import { cn } from '@/lib/utils';
import { Plus, Save, Trash2, Check } from 'lucide-react';

type Modulo =
  | 'inicio'
  | 'mi_perfil'
  | 'espiral_360'
  | 'reclutamiento'
  | 'nexa'
  | 'procesos'
  | 'informes'
  | 'dotaciones'
  | 'administracion';

export interface PermisoRol {
  modulo: Modulo;
  leer: boolean;
  escribir: boolean;
  borrar: boolean;
}

export interface RolEmpresa {
  id: string;
  nombre: string;
  descripcion: string | null;
  usuarios: number;
  permisos: PermisoRol[];
}

const MODULOS: { id: Modulo; etiqueta: string }[] = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'mi_perfil', etiqueta: 'Mi perfil' },
  { id: 'espiral_360', etiqueta: 'Espiral de Crecimiento 360°' },
  { id: 'reclutamiento', etiqueta: 'Reclutamiento y selección' },
  { id: 'nexa', etiqueta: 'Nexa · Cultura y formación' },
  { id: 'procesos', etiqueta: 'Procesos y cumplimiento' },
  { id: 'informes', etiqueta: 'Informes' },
  { id: 'dotaciones', etiqueta: 'Dotaciones' },
  { id: 'administracion', etiqueta: 'Administración' },
];

type Matriz = Record<Modulo, { leer: boolean; escribir: boolean; borrar: boolean }>;

function matrizDesde(permisos: PermisoRol[]): Matriz {
  const matriz = {} as Matriz;
  for (const { id } of MODULOS) {
    const p = permisos.find((x) => x.modulo === id);
    matriz[id] = { leer: p?.leer ?? false, escribir: p?.escribir ?? false, borrar: p?.borrar ?? false };
  }
  return matriz;
}

/** Misma regla que la base de datos: escribir implica leer, borrar implica escribir. */
function ajustar(celda: Matriz[Modulo], campo: 'leer' | 'escribir' | 'borrar', valor: boolean) {
  const siguiente = { ...celda, [campo]: valor };
  if (campo === 'leer' && !valor) {
    siguiente.escribir = false;
    siguiente.borrar = false;
  }
  if (campo === 'escribir' && valor) siguiente.leer = true;
  if (campo === 'escribir' && !valor) siguiente.borrar = false;
  if (campo === 'borrar' && valor) {
    siguiente.escribir = true;
    siguiente.leer = true;
  }
  return siguiente;
}

export function GestorRoles({ roles }: { roles: RolEmpresa[] }) {
  const router = useRouter();
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(roles[0]?.id ?? null);
  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [descripcionNueva, setDescripcionNueva] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rol = roles.find((r) => r.id === seleccionadoId) ?? null;

  const [matriz, setMatriz] = useState<Matriz>(() => (rol ? matrizDesde(rol.permisos) : matrizDesde([])));
  const [nombreEdit, setNombreEdit] = useState(rol?.nombre ?? '');
  const [descripcionEdit, setDescripcionEdit] = useState(rol?.descripcion ?? '');

  function seleccionar(id: string) {
    const r = roles.find((x) => x.id === id);
    setSeleccionadoId(id);
    setMatriz(matrizDesde(r?.permisos ?? []));
    setNombreEdit(r?.nombre ?? '');
    setDescripcionEdit(r?.descripcion ?? '');
    setError(null);
    setMensaje(null);
  }

  function cambiar(modulo: Modulo, campo: 'leer' | 'escribir' | 'borrar', valor: boolean) {
    setMatriz((m) => ({ ...m, [modulo]: ajustar(m[modulo], campo, valor) }));
  }

  function crear() {
    setError(null);
    startTransition(async () => {
      const res = await crearRol({ nombre: nombreNuevo, descripcion: descripcionNueva });
      if (!res.ok) return setError(res.error);
      setCreando(false);
      setNombreNuevo('');
      setDescripcionNueva('');
      setSeleccionadoId(res.id);
      setMatriz(matrizDesde([]));
      setNombreEdit(nombreNuevo.trim());
      setDescripcionEdit(descripcionNueva.trim());
      router.refresh();
    });
  }

  function guardar() {
    if (!rol) return;
    setError(null);
    setMensaje(null);
    startTransition(async () => {
      const cambioDatos = nombreEdit !== rol.nombre || (descripcionEdit || '') !== (rol.descripcion ?? '');
      if (cambioDatos) {
        const datos = await actualizarRol({ rolId: rol.id, nombre: nombreEdit, descripcion: descripcionEdit });
        if (!datos.ok) return setError(datos.error);
      }
      const res = await guardarPermisosRol({
        rolId: rol.id,
        permisos: MODULOS.map(({ id }) => ({ modulo: id, ...matriz[id] })),
      });
      if (!res.ok) return setError(res.error);
      setMensaje('Cambios guardados.');
      router.refresh();
    });
  }

  function eliminar() {
    if (!rol) return;
    const aviso = rol.usuarios > 0
      ? `Este rol está asignado a ${rol.usuarios} usuario(s). Quedarán solo con su rol de sistema. ¿Eliminarlo?`
      : `¿Eliminar el rol "${rol.nombre}"?`;
    if (!window.confirm(aviso)) return;
    setError(null);
    startTransition(async () => {
      const res = await eliminarRol(rol.id);
      if (!res.ok) return setError(res.error);
      setSeleccionadoId(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <div className="card p-3 space-y-1">
          {roles.length === 0 && <p className="text-sm text-marmol-500 px-2 py-3">Todavía no hay roles personalizados.</p>}
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => seleccionar(r.id)}
              className={cn(
                'w-full text-left rounded-lg px-3 py-2 text-sm transition',
                r.id === seleccionadoId ? 'bg-flow-50 text-flow-700 font-medium' : 'text-marmol-700 hover:bg-marmol-50'
              )}
            >
              <span className="block">{r.nombre}</span>
              <span className="text-xs text-marmol-400">
                {r.usuarios} usuario{r.usuarios === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </div>

        {!creando ? (
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm font-medium px-3 py-2 transition"
          >
            <Plus size={15} /> Nuevo rol
          </button>
        ) : (
          <div className="card p-3 space-y-2">
            <input
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Nombre del rol (ej. Gerencia de solo lectura)"
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
            <input
              value={descripcionNueva}
              onChange={(e) => setDescripcionNueva(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={crear}
                disabled={pending}
                className="flex-1 rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-3 py-1.5 disabled:opacity-60"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setCreando(false)}
                className="rounded-lg border border-marmol-200 text-marmol-600 text-sm px-3 py-1.5"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </aside>

      <section className="card p-5 space-y-5">
        {!rol ? (
          <p className="text-sm text-marmol-500">Crea un rol o selecciona uno para editar sus permisos.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-marmol-500 mb-1">Nombre</label>
                <input
                  value={nombreEdit}
                  onChange={(e) => setNombreEdit(e.target.value)}
                  className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-marmol-500 mb-1">Descripción</label>
                <input
                  value={descripcionEdit}
                  onChange={(e) => setDescripcionEdit(e.target.value)}
                  className="w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
                    <th className="py-2 pr-3 font-medium">Módulo</th>
                    <th className="py-2 px-3 font-medium text-center">Leer</th>
                    <th className="py-2 px-3 font-medium text-center">Escribir</th>
                    <th className="py-2 px-3 font-medium text-center">Borrar</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULOS.map(({ id, etiqueta }) => (
                    <tr key={id} className="border-b border-marmol-100">
                      <td className="py-2 pr-3 text-marmol-700">{etiqueta}</td>
                      {(['leer', 'escribir', 'borrar'] as const).map((campo) => (
                        <td key={campo} className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`${etiqueta} · ${campo}`}
                            checked={matriz[id][campo]}
                            onChange={(e) => cambiar(id, campo, e.target.checked)}
                            className="h-4 w-4 accent-flow-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-marmol-500">
              Escribir incluye leer, y borrar incluye escribir. Un módulo sin lectura no aparece en el menú de quien
              tenga este rol.
            </p>

            {error && <p className="text-sm text-bajo">{error}</p>}
            {mensaje && (
              <p className="text-sm text-flow-700 inline-flex items-center gap-1">
                <Check size={14} /> {mensaje}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={guardar}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
              >
                <Save size={15} /> Guardar cambios
              </button>
              <button
                type="button"
                onClick={eliminar}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-bajo/30 text-bajo hover:bg-bajo/5 text-sm font-medium px-4 py-2 disabled:opacity-60"
              >
                <Trash2 size={15} /> Eliminar rol
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
