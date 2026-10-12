import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect } from 'next/navigation';
import { ArrowLeft, FileBarChart } from 'lucide-react';
import { etiquetaPeriodo } from '@/lib/dotacion/normativa';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default async function ReporteConsumoDotacionPage({
  searchParams,
}: {
  searchParams?: { area?: string; cargo?: string; mes?: string; anio?: string };
}) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/dotacion');

  const supabase = createClient();

  const { data: entregas } = await supabase
    .from('dotacion_entregas')
    .select('categoria, cantidad, fecha_entrega, colaborador:colaboradores(cargo:cargos(nombre, proceso_area))')
    .eq('empresa_id', perfil.empresa_id);

  const filas = (entregas ?? []).map((e: any) => ({
    categoria: e.categoria as string,
    cantidad: e.cantidad as number,
    mes: (e.fecha_entrega as string).slice(0, 7), // "2026-09"
    area: e.colaborador?.cargo?.proceso_area ?? 'Sin área',
    cargo: e.colaborador?.cargo?.nombre ?? 'Sin cargo',
  }));

  const areas = Array.from(new Set(filas.map((f) => f.area))).sort();
  const cargos = Array.from(new Set(filas.map((f) => f.cargo))).sort();
  const meses = Array.from(new Set(filas.map((f) => f.mes))).sort().reverse();

  const filtradas = filas.filter(
    (f) => (!searchParams?.area || f.area === searchParams.area) && (!searchParams?.cargo || f.cargo === searchParams.cargo) && (!searchParams?.mes || f.mes === searchParams.mes)
  );

  function agrupar(clave: 'mes' | 'area' | 'cargo') {
    const mapa = new Map<string, { entregas: number; unidades: number }>();
    for (const f of filtradas) {
      const actual = mapa.get(f[clave]) ?? { entregas: 0, unidades: 0 };
      actual.entregas += 1;
      actual.unidades += f.cantidad;
      mapa.set(f[clave], actual);
    }
    return Array.from(mapa.entries())
      .map(([nombre, v]) => ({ nombre, ...v }))
      .sort((a, b) => b.unidades - a.unidades);
  }

  function etiquetaMes(m: string) {
    const [anio, mesNum] = m.split('-');
    return `${MESES[Number(mesNum) - 1]} ${anio}`;
  }

  const totalUnidades = filtradas.reduce((acc, f) => acc + f.cantidad, 0);

  // Cumplimiento de los cortes obligatorios (30 abr, 31 ago, 20 dic): elegibles frente a entregados.
  const anioCumplimiento = Number(searchParams?.anio) || new Date().getFullYear();
  const { data: cumplimiento } = await supabase.rpc('fn_cumplimiento_dotacion', { p_anio: anioCumplimiento });

  const campo = 'rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dotacion" className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2">
          <ArrowLeft size={12} /> Volver a Dotación
        </Link>
        <h1 className="font-display text-2xl font-semibold text-secundario flex items-center gap-2">
          <FileBarChart size={22} className="text-flow-600" /> Reporte de consumo de dotación
        </h1>
        <p className="text-sm text-marmol-500 mt-1">Cuántas dotaciones se han entregado, para proyectar compras futuras.</p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <select name="area" defaultValue={searchParams?.area ?? ''} className={campo}>
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select name="cargo" defaultValue={searchParams?.cargo ?? ''} className={campo}>
          <option value="">Todos los cargos</option>
          {cargos.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="mes" defaultValue={searchParams?.mes ?? ''} className={campo}>
          <option value="">Todos los meses</option>
          {meses.map((m) => (
            <option key={m} value={m}>
              {etiquetaMes(m)}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-flow-500 hover:bg-flow-600 text-white text-sm font-medium px-3 py-1.5">
          Filtrar
        </button>
        {(searchParams?.area || searchParams?.cargo || searchParams?.mes) && (
          <Link href="/dotacion/reporte" className="text-sm text-marmol-400 hover:text-marmol-600 self-center">
            Limpiar
          </Link>
        )}
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-marmol-500 mb-1">Entregas</p>
          <p className="font-display text-2xl font-semibold text-secundario">{filtradas.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-marmol-500 mb-1">Unidades entregadas</p>
          <p className="font-display text-2xl font-semibold text-secundario">{totalUnidades}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <TablaAgrupada titulo="Por mes" filas={agrupar('mes').map((f) => ({ ...f, nombre: etiquetaMes(f.nombre) }))} />
        <TablaAgrupada titulo="Por área" filas={agrupar('area')} />
        <TablaAgrupada titulo="Por cargo" filas={agrupar('cargo')} />
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-semibold text-secundario text-sm">Cumplimiento de los cortes obligatorios {anioCumplimiento}</h2>
            <p className="text-xs text-marmol-400 mt-0.5">
              Colaboradores elegibles (≤ 2 SMLMV y más de 3 meses de antigüedad) frente a los que recibieron dotación en cada corte. El cálculo usa el salario actual de la ficha.
            </p>
          </div>
          <form className="flex items-center gap-2" method="get">
            {searchParams?.area && <input type="hidden" name="area" value={searchParams.area} />}
            {searchParams?.cargo && <input type="hidden" name="cargo" value={searchParams.cargo} />}
            {searchParams?.mes && <input type="hidden" name="mes" value={searchParams.mes} />}
            <input className={`${campo} w-24`} type="number" name="anio" min={2000} max={2100} defaultValue={anioCumplimiento} />
            <button type="submit" className="rounded-lg border border-marmol-200 hover:bg-marmol-50 text-marmol-700 text-sm px-3 py-1.5">
              Ver año
            </button>
          </form>
        </div>

        {!cumplimiento || cumplimiento.length === 0 ? (
          <p className="text-xs text-marmol-400">Sin datos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-marmol-400 border-b border-marmol-100">
                  <th className="font-medium pb-1.5">Corte</th>
                  <th className="font-medium pb-1.5 text-right">Elegibles</th>
                  <th className="font-medium pb-1.5 text-right">Con dotación</th>
                  <th className="font-medium pb-1.5 text-right">Uso verificado</th>
                  <th className="font-medium pb-1.5 text-right">No usó</th>
                  <th className="font-medium pb-1.5 text-right">Uso pendiente</th>
                  <th className="font-medium pb-1.5 text-right">Con excepción</th>
                </tr>
              </thead>
              <tbody>
                {cumplimiento.map((c) => (
                  <tr key={c.corte} className="border-b border-marmol-50 last:border-0">
                    <td className="py-1.5 text-marmol-700">
                      {etiquetaPeriodo(anioCumplimiento, c.corte)} <span className="text-xs text-marmol-400">· {c.fecha_corte}</span>
                    </td>
                    <td className="py-1.5 text-right">{c.elegibles}</td>
                    <td className="py-1.5 text-right">{c.entregados}</td>
                    <td className="py-1.5 text-right">{c.uso_verificado}</td>
                    <td className="py-1.5 text-right">{c.uso_no_verificado}</td>
                    <td className="py-1.5 text-right">{c.uso_pendiente}</td>
                    <td className="py-1.5 text-right">{c.con_excepcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TablaAgrupada({ titulo, filas }: { titulo: string; filas: { nombre: string; entregas: number; unidades: number }[] }) {
  return (
    <div className="card p-4">
      <h2 className="font-display font-semibold text-secundario text-sm mb-3">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="text-xs text-marmol-400">Sin datos.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-marmol-400 border-b border-marmol-100">
              <th className="font-medium pb-1.5">{titulo.replace('Por ', '')}</th>
              <th className="font-medium pb-1.5 text-right">Entregas</th>
              <th className="font-medium pb-1.5 text-right">Unidades</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.nombre} className="border-b border-marmol-50 last:border-0">
                <td className="py-1.5 text-marmol-700">{f.nombre}</td>
                <td className="py-1.5 text-right text-marmol-500">{f.entregas}</td>
                <td className="py-1.5 text-right font-medium text-marmol-800">{f.unidades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
