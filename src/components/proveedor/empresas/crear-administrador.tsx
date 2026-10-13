'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearAdministradorEmpresa } from '@/app/proveedor/(panel)/actions';
import { generarPassword, usuarioSugerido } from '@/lib/utils';
import { UserPlus } from 'lucide-react';

const CAMPO = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

/** Crea el administrador (admin_th) de una empresa existente. La contraseña temporal se muestra una sola vez. */
export function CrearAdministrador({ empresaId }: { empresaId: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generarPassword());
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function crear() {
    setMensaje(null);
    startTransition(async () => {
      const res = await crearAdministradorEmpresa({ empresaId, nombre, usuario, email, password });
      if (!res.ok) return setMensaje({ ok: false, texto: res.error });
      setMensaje({ ok: true, texto: `Administrador creado. Usuario: ${usuario} · Contraseña: ${password}` });
      setNombre('');
      setUsuario('');
      setEmail('');
      setPassword(generarPassword());
      router.refresh();
    });
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-semibold text-marmol-800 flex items-center gap-2"><UserPlus size={16} className="text-flow-600" /> Crear administrador de la empresa</h2>
      <p className="text-xs text-marmol-500">Esta persona entra con su usuario y crea después los usuarios y roles de su empresa. Entrégale la contraseña por un canal seguro.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={nombre} onChange={(e) => { setNombre(e.target.value); setUsuario(usuarioSugerido(e.target.value)); }} placeholder="Nombre completo" className={CAMPO} />
        <input value={usuario} onChange={(e) => setUsuario(e.target.value.toLowerCase())} placeholder="usuario (ej. nombre.apellido)" className={`${CAMPO} font-mono`} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" className={CAMPO} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} className={`${CAMPO} font-mono`} />
      </div>
      {mensaje && <p className={mensaje.ok ? 'text-sm text-flow-700 font-mono' : 'text-sm text-bajo'}>{mensaje.texto}</p>}
      <button type="button" onClick={crear} disabled={pending} className="rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60">
        {pending ? 'Creando…' : 'Crear administrador'}
      </button>
    </div>
  );
}
