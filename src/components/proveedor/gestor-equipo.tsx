'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearProveedor, cambiarEstadoProveedor } from '@/app/proveedor/(panel)/actions';
import { generarPassword } from '@/lib/utils';
import { UserPlus, UserMinus, UserCheck } from 'lucide-react';

export interface ProveedorFila {
  id: string;
  nombre: string;
  email: string;
  rol: 'propietario' | 'operador';
  activo: boolean;
  ultimoAcceso: string | null;
}

const CAMPO = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

export function GestorEquipo({ equipo, proveedorActualId }: { equipo: ProveedorFila[]; proveedorActualId: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'propietario' | 'operador'>('operador');
  const [password, setPassword] = useState(generarPassword());
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function crear() {
    setMensaje(null);
    startTransition(async () => {
      const res = await crearProveedor({ nombre, email, password, rol });
      if (!res.ok) return setMensaje({ ok: false, texto: res.error });
      setMensaje({ ok: true, texto: 'Cuenta creada. Entrégale la contraseña por un canal seguro.' });
      setNombre('');
      setEmail('');
      setPassword(generarPassword());
      router.refresh();
    });
  }

  function cambiar(p: ProveedorFila) {
    setMensaje(null);
    startTransition(async () => {
      const res = await cambiarEstadoProveedor(p.id, !p.activo);
      if (!res.ok) return setMensaje({ ok: false, texto: res.error });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-marmol-200 text-left text-xs uppercase tracking-wide text-marmol-400">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Último acceso</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {equipo.map((p) => (
              <tr key={p.id} className="border-b border-marmol-100 last:border-0">
                <td className="px-4 py-2.5 text-marmol-900">
                  {p.nombre} {p.id === proveedorActualId && <span className="text-xs text-flow-600">(tú)</span>}
                </td>
                <td className="px-4 py-2.5 text-marmol-600">{p.email}</td>
                <td className="px-4 py-2.5 text-marmol-600">{p.rol}</td>
                <td className="px-4 py-2.5 text-marmol-500 text-xs">{p.ultimoAcceso ? new Date(p.ultimoAcceso).toLocaleString('es-CO') : 'Nunca'}</td>
                <td className="px-4 py-2.5 text-right">
                  {p.id !== proveedorActualId && (
                    <button type="button" onClick={() => cambiar(p)} disabled={pending} className="inline-flex items-center gap-1 text-xs hover:underline disabled:opacity-60">
                      {p.activo ? <><UserMinus size={13} /> Desactivar</> : <><UserCheck size={13} /> Activar</>}
                    </button>
                  )}
                  {!p.activo && <span className="ml-2 text-xs text-bajo">Inactivo</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5 space-y-3 h-fit">
        <h2 className="font-semibold text-marmol-800 flex items-center gap-2"><UserPlus size={16} className="text-flow-600" /> Nueva cuenta</h2>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" className={CAMPO} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" className={CAMPO} />
        <select value={rol} onChange={(e) => setRol(e.target.value as typeof rol)} className={CAMPO}>
          <option value="operador">Operador (opera empresas)</option>
          <option value="propietario">Propietario (gestiona el equipo)</option>
        </select>
        <input value={password} onChange={(e) => setPassword(e.target.value)} className={`${CAMPO} font-mono`} />
        {mensaje && <p className={mensaje.ok ? 'text-sm text-flow-700' : 'text-sm text-bajo'}>{mensaje.texto}</p>}
        <button type="button" onClick={crear} disabled={pending} className="w-full rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium py-2 disabled:opacity-60">
          Crear cuenta
        </button>
      </div>
    </div>
  );
}
