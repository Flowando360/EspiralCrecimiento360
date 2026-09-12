'use client';

import { useState, useTransition } from 'react';
import { actualizarCargo } from '@/app/(dashboard)/administracion/cargos/[id]/actions';

const NIVELES = [
  { value: '', label: '—' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
];

const FORMACION_NIVELES = [
  { value: '', label: '—' },
  { value: 'ninguno', label: 'Ninguno' },
  { value: 'bachillerato', label: 'Bachillerato' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'tecnologo', label: 'Tecnólogo' },
  { value: 'universitario', label: 'Universitario' },
  { value: 'empirico', label: 'Empírico' },
];

export interface DatosCargoIniciales {
  id: string;
  nombre: string;
  procesoArea: string;
  objetivoCargo: string;
  tienePersonalACargo: boolean;
  codigoDocumento: string;
  versionDocumento: string;
  fechaDocumento: string;
  tipoArea: string;
  generoRequerido: string;
  edadMinima: string;
  edadMaxima: string;
  salario: string;
  competenciasCardinales: string;
  formacionNivel: string;
  formacionTituloEspecifico: string;
  experienciaMinimaMeses: string;
  formacionMinimaInduccion: string;
  cargosALosQueReporta: string;
  cargosQueLeReportan: string;
  manejoDinero: string;
  tomaDecisionesOrganizacionales: string;
  cambiosDocumentales: string;
  responsabilidadBienesServicios: string;
  responsabilidadInformacion: string;
  responsabilidadRelacionesInterpersonales: string;
  responsabilidadDireccionCoordinacion: string;
  sgsstResponsabilidadesGenerales: string;
  sgsstResponsabilidadesCampo: string;
  sgsstRendicionCuentas: string;
  sgsstAutoridad: string;
  destrezaFisica: boolean;
  destrezaAuditiva: boolean;
  destrezaVisual: boolean;
  destrezaManual: boolean;
  destrezaCoordinacionMotora: boolean;
  recursosSeleccion: string;
}

export function FormularioEditarCargo({ datosIniciales: d }: { datosIniciales: DatosCargoIniciales }) {
  const [nombre, setNombre] = useState(d.nombre);
  const [procesoArea, setProcesoArea] = useState(d.procesoArea);
  const [objetivoCargo, setObjetivoCargo] = useState(d.objetivoCargo);
  const [tienePersonalACargo, setTienePersonalACargo] = useState(d.tienePersonalACargo);
  const [codigoDocumento, setCodigoDocumento] = useState(d.codigoDocumento);
  const [versionDocumento, setVersionDocumento] = useState(d.versionDocumento);
  const [fechaDocumento, setFechaDocumento] = useState(d.fechaDocumento);
  const [tipoArea, setTipoArea] = useState(d.tipoArea);
  const [generoRequerido, setGeneroRequerido] = useState(d.generoRequerido);
  const [edadMinima, setEdadMinima] = useState(d.edadMinima);
  const [edadMaxima, setEdadMaxima] = useState(d.edadMaxima);
  const [salario, setSalario] = useState(d.salario);
  const [competenciasCardinales, setCompetenciasCardinales] = useState(d.competenciasCardinales);
  const [formacionNivel, setFormacionNivel] = useState(d.formacionNivel);
  const [formacionTituloEspecifico, setFormacionTituloEspecifico] = useState(d.formacionTituloEspecifico);
  const [experienciaMinimaMeses, setExperienciaMinimaMeses] = useState(d.experienciaMinimaMeses);
  const [formacionMinimaInduccion, setFormacionMinimaInduccion] = useState(d.formacionMinimaInduccion);
  const [cargosALosQueReporta, setCargosALosQueReporta] = useState(d.cargosALosQueReporta);
  const [cargosQueLeReportan, setCargosQueLeReportan] = useState(d.cargosQueLeReportan);
  const [manejoDinero, setManejoDinero] = useState(d.manejoDinero);
  const [tomaDecisionesOrganizacionales, setTomaDecisionesOrganizacionales] = useState(d.tomaDecisionesOrganizacionales);
  const [cambiosDocumentales, setCambiosDocumentales] = useState(d.cambiosDocumentales);
  const [responsabilidadBienesServicios, setResponsabilidadBienesServicios] = useState(d.responsabilidadBienesServicios);
  const [responsabilidadInformacion, setResponsabilidadInformacion] = useState(d.responsabilidadInformacion);
  const [responsabilidadRelacionesInterpersonales, setResponsabilidadRelacionesInterpersonales] = useState(
    d.responsabilidadRelacionesInterpersonales
  );
  const [responsabilidadDireccionCoordinacion, setResponsabilidadDireccionCoordinacion] = useState(
    d.responsabilidadDireccionCoordinacion
  );
  const [sgsstResponsabilidadesGenerales, setSgsstResponsabilidadesGenerales] = useState(d.sgsstResponsabilidadesGenerales);
  const [sgsstResponsabilidadesCampo, setSgsstResponsabilidadesCampo] = useState(d.sgsstResponsabilidadesCampo);
  const [sgsstRendicionCuentas, setSgsstRendicionCuentas] = useState(d.sgsstRendicionCuentas);
  const [sgsstAutoridad, setSgsstAutoridad] = useState(d.sgsstAutoridad);
  const [destrezaFisica, setDestrezaFisica] = useState(d.destrezaFisica);
  const [destrezaAuditiva, setDestrezaAuditiva] = useState(d.destrezaAuditiva);
  const [destrezaVisual, setDestrezaVisual] = useState(d.destrezaVisual);
  const [destrezaManual, setDestrezaManual] = useState(d.destrezaManual);
  const [destrezaCoordinacionMotora, setDestrezaCoordinacionMotora] = useState(d.destrezaCoordinacionMotora);
  const [recursosSeleccion, setRecursosSeleccion] = useState(d.recursosSeleccion);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    setError(null);
    setGuardado(false);
    startTransition(async () => {
      const res = await actualizarCargo({
        cargoId: d.id,
        nombre,
        procesoArea,
        objetivoCargo,
        tienePersonalACargo,
        codigoDocumento,
        versionDocumento,
        fechaDocumento,
        tipoArea: tipoArea as 'administrativa' | 'operativa' | '',
        generoRequerido,
        edadMinima,
        edadMaxima,
        salario,
        competenciasCardinales,
        formacionNivel: formacionNivel as any,
        formacionTituloEspecifico,
        experienciaMinimaMeses,
        formacionMinimaInduccion,
        cargosALosQueReporta,
        cargosQueLeReportan,
        manejoDinero,
        tomaDecisionesOrganizacionales,
        cambiosDocumentales,
        responsabilidadBienesServicios: responsabilidadBienesServicios as any,
        responsabilidadInformacion: responsabilidadInformacion as any,
        responsabilidadRelacionesInterpersonales: responsabilidadRelacionesInterpersonales as any,
        responsabilidadDireccionCoordinacion: responsabilidadDireccionCoordinacion as any,
        sgsstResponsabilidadesGenerales,
        sgsstResponsabilidadesCampo,
        sgsstRendicionCuentas,
        sgsstAutoridad,
        destrezaFisica,
        destrezaAuditiva,
        destrezaVisual,
        destrezaManual,
        destrezaCoordinacionMotora,
        recursosSeleccion,
      });
      if (res.ok) setGuardado(true);
      else setError(res.error);
    });
  }

  const campo = 'w-full rounded-lg border border-marmol-200 px-2.5 py-1.5 text-sm';
  const label = 'block text-xs text-marmol-500 mb-1';
  const seccion = 'card p-5 space-y-4';
  const titulo = 'font-display font-semibold text-secundario text-sm';

  return (
    <div className="space-y-4 max-w-3xl">
      <div className={seccion}>
        <h2 className={titulo}>Identificación del cargo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label}>Nombre *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Proceso / área</label>
            <input value={procesoArea} onChange={(e) => setProcesoArea(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Tipo de área</label>
            <select value={tipoArea} onChange={(e) => setTipoArea(e.target.value)} className={campo}>
              <option value="">—</option>
              <option value="administrativa">Administrativa</option>
              <option value="operativa">Operativa</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Objetivo del cargo</label>
            <textarea value={objetivoCargo} onChange={(e) => setObjetivoCargo(e.target.value)} className={campo} rows={3} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-marmol-700">
            <input type="checkbox" checked={tienePersonalACargo} onChange={(e) => setTienePersonalACargo(e.target.checked)} />
            ¿Tiene personal a cargo?
          </label>
          <div>
            <label className={label}>Género requerido</label>
            <input value={generoRequerido} onChange={(e) => setGeneroRequerido(e.target.value)} className={campo} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Edad mínima</label>
              <input type="number" value={edadMinima} onChange={(e) => setEdadMinima(e.target.value)} className={campo} />
            </div>
            <div>
              <label className={label}>Edad máxima</label>
              <input type="number" value={edadMaxima} onChange={(e) => setEdadMaxima(e.target.value)} className={campo} />
            </div>
          </div>
          <div>
            <label className={label}>Salario</label>
            <input value={salario} onChange={(e) => setSalario(e.target.value)} placeholder="ej: 1.800.000 o A convenir" className={campo} />
          </div>
          <div>
            <label className={label}>Código de documento</label>
            <input value={codigoDocumento} onChange={(e) => setCodigoDocumento(e.target.value)} placeholder="ej: FORSST 61" className={campo} />
          </div>
          <div>
            <label className={label}>Versión de documento</label>
            <input value={versionDocumento} onChange={(e) => setVersionDocumento(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Fecha de documento</label>
            <input type="date" value={fechaDocumento} onChange={(e) => setFechaDocumento(e.target.value)} className={campo} />
          </div>
        </div>
      </div>

      <div className={seccion}>
        <h2 className={titulo}>Formación y competencias</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Formación requerida</label>
            <select value={formacionNivel} onChange={(e) => setFormacionNivel(e.target.value)} className={campo}>
              {FORMACION_NIVELES.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Título específico</label>
            <input value={formacionTituloEspecifico} onChange={(e) => setFormacionTituloEspecifico(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Experiencia mínima (meses)</label>
            <input type="number" value={experienciaMinimaMeses} onChange={(e) => setExperienciaMinimaMeses(e.target.value)} className={campo} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Competencias cardinales</label>
            <textarea value={competenciasCardinales} onChange={(e) => setCompetenciasCardinales(e.target.value)} className={campo} rows={2} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Formación mínima / inducción</label>
            <textarea value={formacionMinimaInduccion} onChange={(e) => setFormacionMinimaInduccion(e.target.value)} className={campo} rows={2} />
          </div>
        </div>
        <div className="pt-3 border-t border-marmol-100">
          <p className={label}>Destrezas requeridas</p>
          <div className="flex flex-wrap gap-3">
            {[
              ['Física', destrezaFisica, setDestrezaFisica],
              ['Auditiva', destrezaAuditiva, setDestrezaAuditiva],
              ['Visual', destrezaVisual, setDestrezaVisual],
              ['Manual', destrezaManual, setDestrezaManual],
              ['Coordinación motora', destrezaCoordinacionMotora, setDestrezaCoordinacionMotora],
            ].map(([etiqueta, valor, set]: any) => (
              <label key={etiqueta} className="flex items-center gap-1.5 text-sm text-marmol-700">
                <input type="checkbox" checked={valor} onChange={(e) => set(e.target.checked)} />
                {etiqueta}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className={seccion}>
        <h2 className={titulo}>Niveles de autoridad</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Reporta a</label>
            <input value={cargosALosQueReporta} onChange={(e) => setCargosALosQueReporta(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Le reportan</label>
            <input value={cargosQueLeReportan} onChange={(e) => setCargosQueLeReportan(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Manejo de dinero</label>
            <input value={manejoDinero} onChange={(e) => setManejoDinero(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={label}>Toma de decisiones organizacionales</label>
            <input value={tomaDecisionesOrganizacionales} onChange={(e) => setTomaDecisionesOrganizacionales(e.target.value)} className={campo} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Cambios documentales</label>
            <input value={cambiosDocumentales} onChange={(e) => setCambiosDocumentales(e.target.value)} className={campo} />
          </div>
        </div>
      </div>

      <div className={seccion}>
        <h2 className={titulo}>Responsabilidades</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Bienes y servicios', responsabilidadBienesServicios, setResponsabilidadBienesServicios],
            ['Información', responsabilidadInformacion, setResponsabilidadInformacion],
            ['Relaciones interpersonales', responsabilidadRelacionesInterpersonales, setResponsabilidadRelacionesInterpersonales],
            ['Dirección y coordinación', responsabilidadDireccionCoordinacion, setResponsabilidadDireccionCoordinacion],
          ].map(([etiqueta, valor, set]: any) => (
            <div key={etiqueta}>
              <label className={label}>{etiqueta}</label>
              <select value={valor} onChange={(e) => set(e.target.value)} className={campo}>
                {NIVELES.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className={seccion}>
        <h2 className={titulo}>Responsabilidades frente al SG-SST</h2>
        <div className="space-y-3">
          <div>
            <label className={label}>Generales</label>
            <textarea value={sgsstResponsabilidadesGenerales} onChange={(e) => setSgsstResponsabilidadesGenerales(e.target.value)} className={campo} rows={2} />
          </div>
          <div>
            <label className={label}>De campo</label>
            <textarea value={sgsstResponsabilidadesCampo} onChange={(e) => setSgsstResponsabilidadesCampo(e.target.value)} className={campo} rows={2} />
          </div>
          <div>
            <label className={label}>Rendición de cuentas</label>
            <textarea value={sgsstRendicionCuentas} onChange={(e) => setSgsstRendicionCuentas(e.target.value)} className={campo} rows={2} />
          </div>
          <div>
            <label className={label}>Autoridad</label>
            <textarea value={sgsstAutoridad} onChange={(e) => setSgsstAutoridad(e.target.value)} className={campo} rows={2} />
          </div>
        </div>
      </div>

      <div className={seccion}>
        <h2 className={titulo}>Recursos de selección</h2>
        <textarea
          value={recursosSeleccion}
          onChange={(e) => setRecursosSeleccion(e.target.value)}
          placeholder="ej: Examen médico, Entrevista, Hoja de vida..."
          className={campo}
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-bajo">{error}</p>}

      <button
        type="button"
        disabled={pending || !nombre.trim()}
        onClick={guardar}
        className="rounded-lg bg-flow-500 hover:bg-flow-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition"
      >
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
      {guardado && <p className="text-xs text-alto">Guardado — se refleja de inmediato en la ficha de cada colaborador con este cargo y en el organigrama.</p>}
    </div>
  );
}
