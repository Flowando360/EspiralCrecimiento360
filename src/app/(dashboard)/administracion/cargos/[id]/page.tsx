import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPerfilActual } from '@/lib/supabase/get-perfil-actual';
import { redirect, notFound } from 'next/navigation';
import { formatearFecha, cn } from '@/lib/utils';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { PlanInduccionCargo } from '@/components/espiral-crecimiento/plan-induccion-cargo';

const ETIQUETA_MOMENTO: Record<string, string> = {
  ingreso: 'Ingreso',
  periodico: 'Periódico',
  retiro: 'Retiro',
};

const CLASE_NIVEL: Record<string, string> = {
  alto: 'badge-alto',
  medio: 'badge-medio',
  bajo: 'badge-bajo',
};

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-secundario mb-3">{titulo}</h2>
      {children}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-marmol-500">{etiqueta}</dt>
      <dd className="text-sm text-marmol-800">{valor ?? '—'}</dd>
    </div>
  );
}

export default async function DetalleCargoPage({ params }: { params: { id: string } }) {
  const perfil = await getPerfilActual();
  if (!perfil) return null;
  if (perfil.rol !== 'admin_th') redirect('/inicio');

  const supabase = createClient();

  const { data: cargo } = await supabase.from('cargos').select('*').eq('id', params.id).maybeSingle();
  if (!cargo || cargo.empresa_id !== perfil.empresa_id) notFound();

  const [{ data: habilidades }, { data: funciones }, { data: decisiones }, { data: riesgos }, { data: examenes }, { data: epp }, { data: induccionItems }] =
    await Promise.all([
      supabase.from('cargo_habilidades').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_funciones_principales').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_decisiones').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_factores_riesgo').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_examenes_medicos').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('cargo_epp').select('*').eq('cargo_id', params.id).order('orden'),
      supabase.from('induccion_items').select('id, categoria, titulo, descripcion').eq('cargo_id', params.id).order('orden'),
    ]);

  const habilidadesFuncionales = (habilidades ?? []).filter((h) => h.tipo === 'funcional');
  const habilidadesTecnicas = (habilidades ?? []).filter((h) => h.tipo === 'tecnica');
  const examenesPorMomento = ['ingreso', 'periodico', 'retiro'].map((momento) => ({
    momento,
    items: (examenes ?? []).filter((e) => e.momento === momento),
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/administracion/cargos"
          className="inline-flex items-center gap-1 text-xs text-marmol-400 hover:text-marmol-600 mb-2"
        >
          <ArrowLeft size={12} /> Volver a Cargos y perfiles
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-secundario">{cargo.nombre}</h1>
            <p className="text-sm text-marmol-500 mt-1">
              {cargo.proceso_area}
              {cargo.codigo_documento && ` · ${cargo.codigo_documento}`}
              {cargo.version_documento && ` v${cargo.version_documento}`}
              {cargo.fecha_documento && ` · ${formatearFecha(cargo.fecha_documento)}`}
            </p>
          </div>
          <Link
            href={`/administracion/cargos/${params.id}/items-evaluacion`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 hover:border-flow-300 text-marmol-600 text-xs font-medium px-3 py-2 transition shrink-0"
          >
            <ClipboardCheck size={14} /> Ítems a evaluar
          </Link>
        </div>
      </div>

      <Bloque titulo="Identificación del cargo">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Dato etiqueta="¿Tiene personal a cargo?" valor={cargo.tiene_personal_a_cargo ? 'Sí' : 'No'} />
          <Dato etiqueta="Tipo de área" valor={cargo.tipo_area} />
          <Dato etiqueta="Género requerido" valor={cargo.genero_requerido} />
          <Dato
            etiqueta="Edad"
            valor={cargo.edad_minima && cargo.edad_maxima ? `${cargo.edad_minima}-${cargo.edad_maxima} años` : null}
          />
          <Dato etiqueta="Salario" valor={cargo.salario} />
        </dl>
        {cargo.objetivo_cargo && (
          <p className="text-sm text-marmol-700 mt-3 pt-3 border-t border-marmol-100">{cargo.objetivo_cargo}</p>
        )}
      </Bloque>

      <Bloque titulo="Formación y competencias">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Dato etiqueta="Formación requerida" valor={cargo.formacion_nivel} />
          <Dato etiqueta="Título específico" valor={cargo.formacion_titulo_especifico} />
          <Dato
            etiqueta="Experiencia mínima"
            valor={cargo.experiencia_minima_meses ? `${cargo.experiencia_minima_meses} meses` : null}
          />
        </dl>
        {cargo.competencias_cardinales && (
          <p className="text-sm text-marmol-700 mt-3 pt-3 border-t border-marmol-100">
            <span className="text-xs text-marmol-500 block mb-1">Competencias cardinales</span>
            {cargo.competencias_cardinales}
          </p>
        )}
        {cargo.formacion_minima_induccion && (
          <p className="text-sm text-marmol-700 mt-3 pt-3 border-t border-marmol-100">
            <span className="text-xs text-marmol-500 block mb-1">Formación mínima / inducción</span>
            {cargo.formacion_minima_induccion}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-marmol-100">
          {[
            ['Física', cargo.destreza_fisica],
            ['Auditiva', cargo.destreza_auditiva],
            ['Visual', cargo.destreza_visual],
            ['Manual', cargo.destreza_manual],
            ['Coordinación motora', cargo.destreza_coordinacion_motora],
          ]
            .filter(([, marcada]) => marcada)
            .map(([etiqueta]) => (
              <span key={etiqueta as string} className="text-xs rounded-full bg-flow-50 text-flow-700 px-2.5 py-0.5 font-medium">
                {etiqueta}
              </span>
            ))}
        </div>
      </Bloque>

      {(habilidadesFuncionales.length > 0 || habilidadesTecnicas.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <Bloque titulo="Habilidades funcionales">
            <div className="space-y-1.5">
              {habilidadesFuncionales.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span className="text-marmol-700">{h.nombre}</span>
                  <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium capitalize', CLASE_NIVEL[h.nivel_esperado])}>
                    {h.nivel_esperado}
                  </span>
                </div>
              ))}
            </div>
          </Bloque>
          <Bloque titulo="Habilidades técnicas">
            <div className="space-y-1.5">
              {habilidadesTecnicas.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-marmol-700">{h.nombre}</span>
                  <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium capitalize shrink-0', CLASE_NIVEL[h.nivel_esperado])}>
                    {h.nivel_esperado}
                  </span>
                </div>
              ))}
            </div>
          </Bloque>
        </div>
      )}

      <Bloque titulo="Niveles de autoridad">
        <dl className="space-y-2">
          <Dato etiqueta="Reporta a" valor={cargo.cargos_a_los_que_reporta} />
          <Dato etiqueta="Le reportan" valor={cargo.cargos_que_le_reportan} />
          <Dato etiqueta="Manejo de dinero" valor={cargo.manejo_dinero} />
          <Dato etiqueta="Toma de decisiones organizacionales" valor={cargo.toma_decisiones_organizacionales} />
          <Dato etiqueta="Cambios documentales" valor={cargo.cambios_documentales} />
        </dl>
      </Bloque>

      <Bloque titulo="Responsabilidades">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Bienes y servicios', cargo.responsabilidad_bienes_servicios],
            ['Información', cargo.responsabilidad_informacion],
            ['Relaciones interpersonales', cargo.responsabilidad_relaciones_interpersonales],
            ['Dirección y coordinación', cargo.responsabilidad_direccion_coordinacion],
          ].map(([etiqueta, nivel]) => (
            <div key={etiqueta as string}>
              <p className="text-xs text-marmol-500 mb-1">{etiqueta}</p>
              {nivel ? (
                <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium capitalize', CLASE_NIVEL[nivel as string])}>
                  {nivel}
                </span>
              ) : (
                <span className="text-xs text-marmol-400">—</span>
              )}
            </div>
          ))}
        </div>
      </Bloque>

      {funciones && funciones.length > 0 && (
        <Bloque titulo={`Funciones principales (${funciones.length})`}>
          <div className="space-y-3">
            {funciones.map((f) => (
              <div key={f.id} className="border-b border-marmol-100 pb-2 last:border-0 text-sm">
                <p className="text-marmol-800">{f.funcion}</p>
                <p className="text-xs text-marmol-400 mt-0.5">
                  {f.tipo_phva && `${f.tipo_phva} · `}
                  {f.periodicidad}
                  {f.herramientas && ` · ${f.herramientas}`}
                </p>
              </div>
            ))}
          </div>
        </Bloque>
      )}

      {decisiones && decisiones.length > 0 && (
        <Bloque titulo={`Decisiones que puede tomar el cargo (${decisiones.length})`}>
          <div className="space-y-2">
            {decisiones.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-3 border-b border-marmol-100 pb-2 last:border-0 text-sm">
                <p className="text-marmol-700">{d.descripcion}</p>
                {d.periodicidad && <span className="text-xs text-marmol-400 shrink-0">{d.periodicidad}</span>}
              </div>
            ))}
          </div>
        </Bloque>
      )}

      {(cargo.sgsst_responsabilidades_generales ||
        cargo.sgsst_responsabilidades_campo ||
        cargo.sgsst_rendicion_cuentas ||
        cargo.sgsst_autoridad) && (
        <Bloque titulo="Responsabilidades frente al SG-SST">
          <div className="space-y-3 text-sm">
            {cargo.sgsst_responsabilidades_generales && (
              <div>
                <p className="text-xs text-marmol-500 mb-1">Generales</p>
                <p className="text-marmol-700 whitespace-pre-line">{cargo.sgsst_responsabilidades_generales}</p>
              </div>
            )}
            {cargo.sgsst_responsabilidades_campo && (
              <div>
                <p className="text-xs text-marmol-500 mb-1">De campo</p>
                <p className="text-marmol-700 whitespace-pre-line">{cargo.sgsst_responsabilidades_campo}</p>
              </div>
            )}
            {cargo.sgsst_rendicion_cuentas && (
              <div>
                <p className="text-xs text-marmol-500 mb-1">Rendición de cuentas</p>
                <p className="text-marmol-700 whitespace-pre-line">{cargo.sgsst_rendicion_cuentas}</p>
              </div>
            )}
            {cargo.sgsst_autoridad && (
              <div>
                <p className="text-xs text-marmol-500 mb-1">Autoridad</p>
                <p className="text-marmol-700 whitespace-pre-line">{cargo.sgsst_autoridad}</p>
              </div>
            )}
          </div>
        </Bloque>
      )}

      {riesgos && riesgos.length > 0 && (
        <Bloque titulo={`Factores de riesgo (${riesgos.length})`}>
          <div className="space-y-3">
            {riesgos.map((r) => (
              <div key={r.id} className="border-b border-marmol-100 pb-2 last:border-0 text-sm">
                {r.categoria && (
                  <span className="text-xs rounded-full bg-marmol-100 text-marmol-600 px-2 py-0.5 font-medium capitalize mb-1 inline-block">
                    {r.categoria.replace(/_/g, ' ')}
                  </span>
                )}
                <p className="text-marmol-700">{r.factor}</p>
                {r.efectos_posibles && <p className="text-xs text-marmol-400 mt-0.5">Efectos: {r.efectos_posibles}</p>}
              </div>
            ))}
          </div>
        </Bloque>
      )}

      {examenesPorMomento.some((g) => g.items.length > 0) && (
        <Bloque titulo="Exámenes médicos ocupacionales">
          <div className="grid sm:grid-cols-3 gap-4">
            {examenesPorMomento.map(({ momento, items }) => (
              <div key={momento}>
                <p className="text-xs font-medium text-marmol-500 mb-1.5">{ETIQUETA_MOMENTO[momento]}</p>
                <ul className="text-sm text-marmol-700 space-y-1">
                  {items.map((e) => (
                    <li key={e.id}>{e.nombre_examen}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Bloque>
      )}

      <PlanInduccionCargo cargoId={params.id} itemsIniciales={(induccionItems ?? []) as any} />

      {((epp && epp.length > 0) || cargo.recursos_seleccion) && (
        <Bloque titulo="EPP y recursos de selección">
          {epp && epp.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-marmol-500 mb-1">Elementos de protección personal</p>
              <div className="flex flex-wrap gap-1.5">
                {epp.map((item) => (
                  <span key={item.id} className="text-xs rounded-full bg-marmol-100 text-marmol-600 px-2.5 py-0.5">
                    {item.item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {cargo.recursos_seleccion && (
            <div>
              <p className="text-xs text-marmol-500 mb-1">Recursos utilizados en la selección</p>
              <p className="text-sm text-marmol-700">{cargo.recursos_seleccion}</p>
            </div>
          )}
        </Bloque>
      )}
    </div>
  );
}
