import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { etiquetaPeriodo, periodoDeFecha, proximoCorte, fechaCorte } from '@/lib/dotacion/normativa';

export default async function SeguimientoDotacionPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const periodo = periodoDeFecha(hoy);
  const anioPeriodo = periodo.anio;

  const [{ data: colaboradores }, { data: kits }, { data: entregas }] = await Promise.all([
    supabase
      .from('colaboradores')
      .select('id, nombre_completo, cargo_id, cargo:cargos(nombre)')
      .eq('empresa_id', perfil.empresa_id)
      .eq('estado', 'activo')
      .eq('es_externo', false)
      .order('nombre_completo'),
    supabase
      .from('dotacion_kit_cargo')
      .select('cargo_id, cantidad, articulo:dotacion_catalogo_articulos(id, nombre, referencia)')
      .eq('empresa_id', perfil.empresa_id),
    supabase
      .from('dotacion_entregas')
      .select('colaborador_id, nombre_elemento, fecha_entrega, estado, tallas:dotacion_catalogo_tallas(articulo_id)')
      .eq('empresa_id', perfil.empresa_id)
      .eq('categoria', 'elemento_personal')
      .eq('periodo_anio', anioPeriodo)
      .eq('periodo_corte', periodo.corte),
  ]);

  // Elegibilidad a la fecha de hoy, según la misma función de la base de datos.
  const elegibilidad = new Map<string, { elegible: boolean; motivos: string[] }>();
  for (const c of colaboradores ?? []) {
    const { data } = await supabase.rpc('fn_evaluar_elegibilidad_dotacion', { p_colaborador_id: c.id, p_fecha: hoy });
    const r = data as { elegible: boolean; motivos: string[] } | null;
    if (r) elegibilidad.set(c.id, { elegible: r.elegible, motivos: r.motivos });
  }

  const filas = (colaboradores ?? []).map((c: any) => {
    const kitCargo = (kits ?? []).filter((k: any) => k.cargo_id === c.cargo_id);
    const entregadosArticulos = new Set(
      (entregas ?? [])
        .filter((e: any) => e.colaborador_id === c.id && e.estado !== 'devuelto' && e.estado !== 'perdido')
        .map((e: any) => e.tallas?.articulo_id)
        .filter(Boolean)
    );
    const pendientes = kitCargo.filter((k: any) => !entregadosArticulos.has(k.articulo?.id)).map((k: any) => k.articulo?.nombre as string);
    return {
      id: c.id,
      nombre: c.nombre_completo as string,
      cargo: (c.cargo?.nombre as string) ?? 'Sin cargo',
      kitTotal: kitCargo.length,
      entregados: kitCargo.length - pendientes.length,
      pendientes,
      elegibilidad: elegibilidad.get(c.id),
    };
  });

  const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/administracion/dotaciones" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Dotaciones
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <Users size={22} className="text-flow-600" /> Seguimiento por persona
        </h1>
        <p className="text-sm text-marmol-500 mt-1">
          Qué le corresponde a cada colaborador según su cargo, qué ya recibió en el corte actual y si es elegible.
        </p>
      </div>

      <div className="card p-4 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-xs text-marmol-500">Corte actual</p>
          <p className="font-medium text-marmol-800">{etiquetaPeriodo(periodo.anio, periodo.corte)}</p>
        </div>
        <div>
          <p className="text-xs text-marmol-500">Fecha límite</p>
          <p className="font-medium text-marmol-800">{fechaCorte(periodo.anio, periodo.corte)}</p>
        </div>
        <div>
          <p className="text-xs text-marmol-500">Vence la dotación del corte</p>
          <p className="font-medium text-marmol-800">{proximoCorte(hoy)}</p>
        </div>
      </div>

      <div className="card divide-y divide-marmol-100">
        {filas.length === 0 ? (
          <p className="p-6 text-sm text-marmol-500">No hay colaboradores activos.</p>
        ) : (
          filas.map((f) => (
            <div key={f.id} className="px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-medium text-marmol-800">{f.nombre}</p>
                <p className="text-xs text-marmol-400">{f.cargo}</p>
                {f.kitTotal === 0 ? (
                  <p className="text-xs text-marmol-400 mt-1">Su cargo no tiene kit definido en el catálogo.</p>
                ) : f.pendientes.length === 0 ? (
                  <p className="text-xs text-alto mt-1">Kit completo en este corte ({f.entregados}/{f.kitTotal}).</p>
                ) : (
                  <p className="text-xs text-marmol-600 mt-1">
                    Falta en este corte ({f.entregados}/{f.kitTotal}): {f.pendientes.join(', ')}
                  </p>
                )}
              </div>
              <div className="text-xs">
                {!f.elegibilidad ? (
                  <span className="text-marmol-400">Sin verificar</span>
                ) : f.elegibilidad.elegible ? (
                  <span className="text-alto font-medium">Elegible</span>
                ) : (
                  <span className="text-bajo">No elegible: {f.elegibilidad.motivos.join('; ')}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
