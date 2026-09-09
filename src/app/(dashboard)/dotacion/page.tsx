import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { ListaDotacion } from '@/components/dotacion/lista-dotacion';
import { FormularioEntrega } from '@/components/dotacion/formulario-entrega';
import { Shirt } from 'lucide-react';

export default async function DotacionPage({ searchParams }: { searchParams?: { colaborador_id?: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();

  let query = supabase
    .from('dotacion_entregas')
    .select(
      'id, categoria, nombre_elemento, talla, cantidad, fecha_entrega, fecha_vencimiento, estado, firma_confirmada, firmado_en, colaborador:colaboradores(id, nombre_completo)'
    )
    .eq('empresa_id', perfil.empresa_id)
    .order('fecha_entrega', { ascending: false });

  if (searchParams?.colaborador_id) query = query.eq('colaborador_id', searchParams.colaborador_id);

  const { data: entregas } = await query;

  const colaboradoresParaForm =
    perfil.rol === 'admin_th'
      ? (
          await supabase
            .from('colaboradores')
            .select('id, nombre_completo')
            .eq('empresa_id', perfil.empresa_id)
            .eq('estado', 'activo')
            .order('nombre_completo')
        ).data ?? []
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Shirt size={22} className="text-flow-600" /> Gestión de Dotaciones
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Elementos personales (uniformes, EPP) y equipos de trabajo entregados a cada colaborador, con
          constancia de entrega y alertas de vencimiento.
          {perfil.rol === 'colaborador' && ' Confirma aquí lo que ya recibiste.'}
        </p>
      </div>

      {perfil.rol === 'admin_th' && <FormularioEntrega colaboradores={colaboradoresParaForm} />}

      <ListaDotacion entregas={(entregas ?? []) as any} rol={perfil.rol} miColaboradorId={perfil.colaborador_id} />
    </div>
  );
}
