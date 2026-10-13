'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearEmpresaConAdministrador } from '@/app/(dashboard)/meta-admin/actions';
import { generarPassword, usuarioSugerido } from '@/lib/utils';
import { Building2, Check, Copy } from 'lucide-react';

const CAMPO = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

function slugDesde(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function FormularioNuevaEmpresa() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTocado, setSlugTocado] = useState(false);
  const [plan, setPlan] = useState<'piloto' | 'estandar' | 'premium'>('piloto');
  const [colorMarca, setColorMarca] = useState('#16A34A');
  const [colorSecundario, setColorSecundario] = useState('#1E3A8A');
  const [colorAcento, setColorAcento] = useState('#A3E635');
  const [logoUrl, setLogoUrl] = useState('');
  const [adminNombre, setAdminNombre] = useState('');
  const [adminUsuario, setAdminUsuario] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState(generarPassword());
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; error?: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  function cambiarNombre(valor: string) {
    setNombre(valor);
    if (!slugTocado) setSlug(slugDesde(valor));
  }

  function cambiarAdminNombre(valor: string) {
    setAdminNombre(valor);
    setAdminUsuario(usuarioSugerido(valor));
  }

  function crear() {
    setResultado(null);
    startTransition(async () => {
      const res = await crearEmpresaConAdministrador({
        nombre,
        slug,
        planMembresia: plan,
        colorMarca,
        colorSecundario,
        colorAcento,
        logoUrl: logoUrl || null,
        adminNombre,
        adminUsuario,
        adminEmail,
        adminPassword,
      });
      setResultado(res);
      if (res.ok) {
        setNombre('');
        setSlug('');
        setSlugTocado(false);
        setLogoUrl('');
        setAdminNombre('');
        setAdminUsuario('');
        setAdminEmail('');
        setAdminPassword(generarPassword());
        router.refresh();
      }
    });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-4 py-2 transition"
      >
        <Building2 size={15} /> Nueva empresa
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-5">
      <div>
        <h2 className="font-semibold text-marmol-800">Nueva empresa y su administrador</h2>
        <p className="text-xs text-marmol-500 mt-1">
          Se crea la empresa con su marca y una cuenta admin_th. Esa persona crea después los usuarios y los roles de su
          empresa. Entrégale la contraseña por un canal seguro.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Nombre de la empresa</label>
          <input value={nombre} onChange={(e) => cambiarNombre(e.target.value)} className={CAMPO} />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Identificador (URL)</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTocado(true);
              setSlug(e.target.value.toLowerCase());
            }}
            className={`${CAMPO} font-mono`}
          />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Plan de membresía</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} className={CAMPO}>
            <option value="piloto">Piloto</option>
            <option value="estandar">Estándar</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Logo (ruta o URL)</label>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="/logos/empresa.png o https://…"
            className={CAMPO}
          />
        </div>
      </div>

      <div>
        <p className="text-xs text-marmol-500 mb-2">Colores de la marca</p>
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Principal', valor: colorMarca, set: setColorMarca },
            { label: 'Secundario', valor: colorSecundario, set: setColorSecundario },
            { label: 'Acento', valor: colorAcento, set: setColorAcento },
          ].map((c) => (
            <label key={c.label} className="flex items-center gap-2 text-sm text-marmol-700">
              <input type="color" value={c.valor} onChange={(e) => c.set(e.target.value.toUpperCase())} className="h-8 w-10 rounded border border-marmol-200" />
              {c.label} <span className="font-mono text-xs text-marmol-400">{c.valor}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Nombre del administrador</label>
          <input value={adminNombre} onChange={(e) => cambiarAdminNombre(e.target.value)} className={CAMPO} />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Usuario de inicio de sesión</label>
          <input value={adminUsuario} onChange={(e) => setAdminUsuario(e.target.value.toLowerCase())} placeholder="nombre.apellido" className={`${CAMPO} font-mono`} />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Correo del administrador</label>
          <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={CAMPO} />
        </div>
        <div>
          <label className="block text-xs text-marmol-500 mb-1">Contraseña temporal</label>
          <div className="flex items-center gap-2">
            <input value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`${CAMPO} font-mono`} />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(adminPassword);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 1500);
              }}
              className="rounded-lg border border-marmol-200 px-2.5 py-1.5 text-marmol-600 hover:bg-marmol-50"
              title="Copiar"
            >
              {copiado ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {resultado && (
        <p className={resultado.ok ? 'text-sm text-flow-700' : 'text-sm text-bajo'}>
          {resultado.ok ? 'Empresa creada. Ya puedes entregar el acceso a su administrador.' : resultado.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={crear}
          disabled={pending}
          className="rounded-lg bg-flow-600 hover:bg-flow-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
        >
          {pending ? 'Creando…' : 'Crear empresa'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="rounded-lg border border-marmol-200 text-marmol-600 text-sm px-4 py-2">
          Cerrar
        </button>
      </div>
    </div>
  );
}
