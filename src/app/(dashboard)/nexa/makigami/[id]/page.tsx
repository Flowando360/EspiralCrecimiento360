import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { createClient } from '@/lib/supabase/server';
import { FormularioReto } from '@/components/makigami/formulario-reto';
import { TableroMakigami } from '@/components/makigami/tablero-makigami';
import type { CarrilVista, CazaVista, PasoVista, PropuestaVista, RetoVista } from '@/components/makigami/tipos';
import type { EstadoReto } from '@/lib/nexa/makigami';
import { ArrowLeft } from 'lucide-react';

export default async function RetoMakigamiPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: reto } = await supabase
    .from('nexa_makigami_retos')
    .select('id, titulo, descripcion, proceso_id, inicio_proceso, fin_proceso, estado, fecha_limite, creado_por, proceso:proceso_id(nombre, codigo)')
    .eq('id', params.id)
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();
  if (!reto) notFound();

  const [{ data: carriles }, { data: pasos }, { data: cazas }, { data: propuestas }] = await Promise.all([
    supabase.from('nexa_makigami_carriles').select('id, nombre, orden').eq('reto_id', reto.id).order('orden'),
    supabase
      .from('nexa_makigami_pasos')
      .select('id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion')
      .eq('reto_id', reto.id)
      .order('orden'),
    supabase
      .from('nexa_makigami_cazas')
      .select('id, paso_id, colaborador_id, tipo_desperdicio, comentario, created_at, colaborador:colaborador_id(nombre_completo)')
      .eq('reto_id', reto.id)
      .order('created_at'),
    supabase
      .from('nexa_makigami_propuestas')
      .select('id, paso_id, colaborador_id, accion, descripcion, ahorro_estimado_min, estado, acpm_id, colaborador:colaborador_id(nombre_completo), acpm:acpm_id(codigo), votos:nexa_makigami_votos(colaborador_id)')
      .eq('reto_id', reto.id)
      .order('created_at'),
  ]);

  const esAdminTh = perfil.rol === 'admin_th';
  const esFacilitador = esAdminTh || (perfil.rol === 'lider' && reto.creado_por === perfil.colaborador_id);

  let procesos: { id: string; nombre: string; codigo: string | null }[] = [];
  if (esFacilitador) {
    const { data } = await supabase.from('procesos_gestion').select('id, nombre, codigo').eq('empresa_id', perfil.empresa_id).order('codigo');
    procesos = data ?? [];
  }

  let diasRestantes: number | null = null;
  if (reto.fecha_limite) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    diasRestantes = Math.round((new Date(`${reto.fecha_limite}T00:00:00`).getTime() - hoy.getTime()) / 86400000);
  }

  const vistaReto: RetoVista = {
    id: reto.id,
    titulo: reto.titulo,
    descripcion: reto.descripcion,
    procesoId: reto.proceso_id,
    procesoNombre: reto.proceso ? `${reto.proceso.codigo ? `${reto.proceso.codigo} · ` : ''}${reto.proceso.nombre}` : null,
    inicioProceso: reto.inicio_proceso,
    finProceso: reto.fin_proceso,
    estado: reto.estado as EstadoReto,
    fechaLimite: reto.fecha_limite,
  };

  const vistaPasos: PasoVista[] = (pasos ?? []).map((p: any) => ({
    ...p,
    tiempo_trabajo_min: Number(p.tiempo_trabajo_min) || 0,
    tiempo_espera_min: Number(p.tiempo_espera_min) || 0,
  }));
  const vistaCazas: CazaVista[] = (cazas ?? []).map((c: any) => ({
    id: c.id,
    paso_id: c.paso_id,
    colaborador_id: c.colaborador_id,
    colaborador_nombre: c.colaborador?.nombre_completo ?? '—',
    tipo_desperdicio: c.tipo_desperdicio,
    comentario: c.comentario,
    created_at: c.created_at,
  }));
  const vistaPropuestas: PropuestaVista[] = (propuestas ?? []).map((p: any) => ({
    id: p.id,
    paso_id: p.paso_id,
    colaborador_id: p.colaborador_id,
    colaborador_nombre: p.colaborador?.nombre_completo ?? '—',
    accion: p.accion,
    descripcion: p.descripcion,
    ahorro_estimado_min: Number(p.ahorro_estimado_min) || 0,
    estado: p.estado,
    acpm_id: p.acpm_id,
    acpm_codigo: p.acpm?.codigo ?? null,
    votos: (p.votos ?? []).map((v: any) => v.colaborador_id),
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/nexa/makigami" className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-flow-600">
          <ArrowLeft size={12} /> Cacería Makigami
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-secundario">{reto.titulo}</h1>
        {reto.descripcion && <p className="mt-1 max-w-3xl text-sm text-marmol-600">{reto.descripcion}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-marmol-500">
          {vistaReto.procesoNombre && <span>📂 {vistaReto.procesoNombre}</span>}
          {reto.inicio_proceso && <span>▶ Empieza: {reto.inicio_proceso}</span>}
          {reto.fin_proceso && <span>⏹ Termina: {reto.fin_proceso}</span>}
        </div>
        {esFacilitador && (
          <div className="mt-2">
            <FormularioReto
              procesos={procesos}
              retoId={reto.id}
              datosIniciales={{
                titulo: reto.titulo,
                descripcion: reto.descripcion ?? '',
                procesoId: reto.proceso_id ?? '',
                inicioProceso: reto.inicio_proceso ?? '',
                finProceso: reto.fin_proceso ?? '',
                fechaLimite: reto.fecha_limite ?? '',
              }}
            />
          </div>
        )}
      </div>

      <TableroMakigami
        reto={vistaReto}
        carriles={(carriles ?? []) as CarrilVista[]}
        pasos={vistaPasos}
        cazas={vistaCazas}
        propuestas={vistaPropuestas}
        miColaboradorId={perfil.colaborador_id}
        esFacilitador={esFacilitador}
        esAdminTh={esAdminTh}
        puntosEntregados={reto.estado === 'cerrado'}
        diasRestantes={diasRestantes}
      />
    </div>
  );
}
