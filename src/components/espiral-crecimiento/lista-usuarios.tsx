'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { FilaUsuario, type UsuarioFila } from './fila-usuario';
import { etiquetaRol, normalizarBusqueda } from '@/lib/utils';

interface Opcion {
  id: string;
  nombre_completo: string;
}

export function ListaUsuarios({
  usuarios,
  usuarioActualId,
  fichaPorUsuario,
  fichasDisponibles,
  rolesPersonalizados,
}: {
  usuarios: UsuarioFila[];
  usuarioActualId: string;
  fichaPorUsuario: Record<string, Opcion>;
  fichasDisponibles: Opcion[];
  rolesPersonalizados: { id: string; nombre: string }[];
}) {
  const [texto, setTexto] = useState('');
  const [rol, setRol] = useState(''); // 'sistema:lider' o 'personalizado:<id>'
  const [estado, setEstado] = useState('');
  const [ficha, setFicha] = useState('');

  const rolesSistema = Array.from(new Set(usuarios.map((u) => u.rol)));

  const visibles = usuarios.filter((u) => {
    const q = normalizarBusqueda(texto);
    if (q) {
      const pajar = normalizarBusqueda(
        [u.nombre_completo, u.nombre_preferido ?? '', u.usuario, u.email].join(' ')
      );
      if (!pajar.includes(q)) return false;
    }
    if (rol.startsWith('sistema:') && u.rol !== rol.slice(8)) return false;
    if (rol.startsWith('personalizado:') && u.rol_personalizado_id !== rol.slice(14)) return false;
    if (estado === 'activo' && !u.activo) return false;
    if (estado === 'inactivo' && u.activo) return false;
    if (ficha === 'con' && !fichaPorUsuario[u.id]) return false;
    if (ficha === 'sin' && fichaPorUsuario[u.id]) return false;
    return true;
  });
  const hayFiltro = Boolean(texto || rol || estado || ficha);
  const sel = 'rounded-lg border border-marmol-200 px-3 py-2 text-sm min-w-[10rem]';

  return (
    <div className="space-y-3">
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-marmol-400" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre, usuario o correo…"
            aria-label="Buscar usuario"
            className="w-full rounded-lg border border-marmol-200 pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <select value={rol} onChange={(e) => setRol(e.target.value)} aria-label="Filtrar por rol" className={sel}>
          <option value="">Rol: todos</option>
          {rolesSistema.map((r) => (
            <option key={r} value={`sistema:${r}`}>{etiquetaRol[r] ?? r}</option>
          ))}
          {rolesPersonalizados.map((r) => (
            <option key={r.id} value={`personalizado:${r.id}`}>{r.nombre} (personalizado)</option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado" className={sel}>
          <option value="">Estado: todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <select value={ficha} onChange={(e) => setFicha(e.target.value)} aria-label="Filtrar por ficha" className={sel}>
          <option value="">Ficha: todas</option>
          <option value="con">Con ficha de colaborador</option>
          <option value="sin">Sin ficha vinculada</option>
        </select>
        {hayFiltro && (
          <button
            type="button"
            onClick={() => { setTexto(''); setRol(''); setEstado(''); setFicha(''); }}
            className="text-xs text-flow-600 hover:text-flow-700"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <p className="text-xs text-marmol-500">
        Mostrando {visibles.length} de {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}.
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-marmol-500">
                  Ningún usuario coincide con estos filtros.
                </td>
              </tr>
            ) : (
              visibles.map((u) => (
                <FilaUsuario
                  key={u.id}
                  usuario={u}
                  esUsuarioActual={u.id === usuarioActualId}
                  ficha={fichaPorUsuario[u.id] ?? null}
                  fichasDisponibles={fichasDisponibles}
                  rolesPersonalizados={rolesPersonalizados}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
