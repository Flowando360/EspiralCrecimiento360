import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { MatrizComunicaciones } from '@/components/procesos-gestion/matriz-comunicaciones';

export default async function MatrizComunicacionesPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (!['admin_th', 'lider', 'gerencia'].includes(perfil.rol)) redirect('/inicio');

  const supabase = createClient();
  const [{ data: filas }, { data: procesos }, { data: colaboradores }] = await Promise.all([
    supabase
      .from('matriz_comunicaciones')
      .select('id, que_comunicar, a_quien, como, frecuencia, proceso_id, responsable_id, ultima_fecha, observaciones')
      .eq('empresa_id', perfil.empresa_id)
      .order('created_at'),
    supabase.from('procesos_gestion').select('id, nombre').eq('empresa_id', perfil.empresa_id).order('nombre'),
    supabase.from('colaboradores').select('id, nombre_completo').eq('empresa_id', perfil.empresa_id).eq('estado', 'activo').order('nombre_completo'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/procesos-gestion" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Procesos
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Megaphone size={22} className="text-flow-600" /> Matriz de comunicaciones
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Qué se comunica, a quién, por qué canal, con qué frecuencia y quién responde. Hace parte de la planeación (ISO 9001, requisito 7.4).
        </p>
      </div>

      <MatrizComunicaciones
        filasIniciales={(filas ?? []) as any}
        procesos={(procesos ?? []) as { id: string; nombre: string }[]}
        colaboradores={(colaboradores ?? []) as { id: string; nombre_completo: string }[]}
        puedeEditar={perfil.rol === 'admin_th'}
      />
    </div>
  );
}
