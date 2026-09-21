import { renderToBuffer } from '@react-pdf/renderer';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { createAdminClient } from '@/lib/supabase/server';
import { obtenerEvidenciaAuditoria, type TipoPaqueteAuditoria, type EvidenciaAuditoria } from '@/app/(dashboard)/informes/evidencia-auditoria/data';
import { EvidenciaAuditoriaDocument } from '@/app/(dashboard)/informes/evidencia-auditoria/pdf-document';
import { formatearFecha } from '@/lib/utils';
import { calcularValoracionInherente, calcularValoracionResidual, evaluarNivel, ETIQUETA_EVALUACION, ETIQUETA_CATEGORIA, type CategoriaRiesgo, type TipoRiesgo } from '@/lib/calculos/matriz-riesgos';

async function construirExcel(evidencia: EvidenciaAuditoria) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espiral de Crecimiento';
  workbook.created = new Date();

  if (evidencia.certificacionesSST.length > 0) {
    const hoja = workbook.addWorksheet('Certificaciones SST');
    hoja.columns = [
      { header: 'Colaborador', key: 'colaborador', width: 26 },
      { header: 'Certificación', key: 'titulo', width: 32 },
      { header: 'Vencimiento', key: 'vencimiento', width: 14 },
      { header: 'Verificado', key: 'verificado', width: 12 },
      { header: 'Link evidencia', key: 'link', width: 40 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const c of evidencia.certificacionesSST) {
      hoja.addRow({
        colaborador: c.colaborador_nombre,
        titulo: c.titulo,
        vencimiento: c.fecha_vencimiento ? formatearFecha(c.fecha_vencimiento) : '',
        verificado: c.verificado ? 'Sí' : 'No',
        link: c.documento_url ?? '',
      });
    }
  }

  if (evidencia.checklist.length > 0) {
    const hoja = workbook.addWorksheet('Checklist cumplimiento');
    hoja.columns = [
      { header: 'Marco normativo', key: 'marco', width: 20 },
      { header: 'Ítem', key: 'item', width: 40 },
      { header: 'Estado', key: 'estado', width: 16 },
      { header: 'Evidencia', key: 'evidencia', width: 20 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const c of evidencia.checklist) {
      hoja.addRow({ marco: c.marco_normativo, item: c.item, estado: c.estado, evidencia: c.evidencia_url ? 'Adjunta en el ZIP' : 'Sin evidencia' });
    }
  }

  if (evidencia.riesgos.length > 0) {
    const hoja = workbook.addWorksheet('Matriz de riesgos');
    hoja.columns = [
      { header: 'Marco normativo', key: 'marco', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Categoría', key: 'categoria', width: 14 },
      { header: 'Riesgo / oportunidad', key: 'riesgo', width: 40 },
      { header: 'Inherente', key: 'inherente', width: 12 },
      { header: 'Control', key: 'control', width: 32 },
      { header: 'Residual', key: 'residual', width: 12 },
      { header: 'Frecuencia revisión', key: 'frecuencia', width: 16 },
      { header: 'Última revisión', key: 'ultimaRevision', width: 14 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const r of evidencia.riesgos) {
      const tipo = r.tipo as TipoRiesgo;
      const inherente = calcularValoracionInherente(r.grado_impacto, r.grado_probabilidad);
      const residual = tipo === 'riesgo' ? calcularValoracionResidual(inherente, r.grado_efectividad_control) : inherente;
      hoja.addRow({
        marco: r.marco_normativo,
        tipo: tipo === 'oportunidad' ? 'Oportunidad' : 'Riesgo',
        categoria: ETIQUETA_CATEGORIA[r.categoria as CategoriaRiesgo] ?? r.categoria,
        riesgo: r.riesgo,
        inherente: `${ETIQUETA_EVALUACION[evaluarNivel(inherente, tipo)]} (${inherente})`,
        control: r.control ?? '',
        residual: `${ETIQUETA_EVALUACION[evaluarNivel(residual, tipo)]} (${residual})`,
        frecuencia: r.frecuencia_revision ?? '',
        ultimaRevision: r.fecha_ultima_revision ? formatearFecha(r.fecha_ultima_revision) : '',
      });
    }
  }

  if (evidencia.auditorias.length > 0) {
    const hoja = workbook.addWorksheet('Auditorías internas');
    hoja.columns = [
      { header: 'Código', key: 'codigo', width: 12 },
      { header: 'Objetivo', key: 'objetivo', width: 40 },
      { header: 'Marco normativo', key: 'marco', width: 18 },
      { header: 'Estado', key: 'estado', width: 14 },
      { header: 'Fecha ejecutada', key: 'fecha', width: 14 },
      { header: 'Hallazgos abiertos', key: 'abiertos', width: 16 },
      { header: 'Hallazgos cerrados', key: 'cerrados', width: 16 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const a of evidencia.auditorias) {
      hoja.addRow({
        codigo: a.codigo ?? '',
        objetivo: a.objetivo ?? '',
        marco: a.marco_normativo ?? '',
        estado: a.estado,
        fecha: a.fecha_ejecutada ? formatearFecha(a.fecha_ejecutada) : '',
        abiertos: a.hallazgos_abiertos,
        cerrados: a.hallazgos_cerrados,
      });
    }
  }

  if (evidencia.acpm.length > 0) {
    const hoja = workbook.addWorksheet('ACPM');
    hoja.columns = [
      { header: 'Código', key: 'codigo', width: 12 },
      { header: 'Tipo de acción', key: 'tipo', width: 14 },
      { header: 'Descripción', key: 'descripcion', width: 45 },
      { header: 'Estado', key: 'estado', width: 18 },
      { header: 'Eficaz', key: 'eficaz', width: 10 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const a of evidencia.acpm) {
      hoja.addRow({ codigo: a.codigo ?? '', tipo: a.tipo_accion, descripcion: a.descripcion, estado: a.estado, eficaz: a.eficaz === null ? '' : a.eficaz ? 'Sí' : 'No' });
    }
    if (evidencia.tasaEficaciaAcpm !== null) {
      hoja.addRow({});
      hoja.addRow({ codigo: 'Tasa de eficacia:', tipo: `${evidencia.tasaEficaciaAcpm}%` });
    }
  }

  if (evidencia.cambios.length > 0) {
    const hoja = workbook.addWorksheet('Gestión de cambio');
    hoja.columns = [
      { header: 'Código', key: 'codigo', width: 14 },
      { header: 'Título', key: 'titulo', width: 40 },
      { header: 'Tipo de cambio', key: 'tipo', width: 16 },
      { header: 'Impacto', key: 'impacto', width: 12 },
      { header: 'Estado', key: 'estado', width: 14 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const c of evidencia.cambios) {
      hoja.addRow({ codigo: c.codigo ?? '', titulo: c.titulo, tipo: c.tipo_cambio, impacto: c.impacto ?? '', estado: c.estado });
    }
  }

  if (evidencia.procesos.length > 0) {
    const hoja = workbook.addWorksheet('Procesos documentados');
    hoja.columns = [
      { header: 'Área / proceso', key: 'area', width: 24 },
      { header: 'Nombre', key: 'nombre', width: 32 },
      { header: 'Versión', key: 'version', width: 12 },
    ];
    hoja.getRow(1).font = { bold: true };
    for (const p of evidencia.procesos) {
      hoja.addRow({ area: p.area_proceso, nombre: p.nombre, version: p.version ?? '' });
    }
  }

  return workbook.xlsx.writeBuffer();
}

/**
 * Arma el ZIP de Evidencia de auditoría (portada PDF + detalle Excel +
 * archivos adjuntos al checklist) a partir de una evidencia ya cargada.
 * Compartido entre la descarga autenticada (api/informes/evidencia-auditoria)
 * y el enlace público temporal (api/auditoria/[token]), para no mantener la
 * lógica del ZIP dos veces.
 */
export async function generarZipEvidencia(tipo: TipoPaqueteAuditoria, evidencia: EvidenciaAuditoria): Promise<Buffer> {
  const zip = new JSZip();

  const pdfBuffer = await renderToBuffer(<EvidenciaAuditoriaDocument evidencia={evidencia} tipo={tipo} />);
  zip.file('resumen.pdf', pdfBuffer);

  const excelBuffer = await construirExcel(evidencia);
  zip.file('detalle.xlsx', excelBuffer);

  const admin = createAdminClient();
  const carpetaEvidencia = zip.folder('evidencia-checklist');
  let contadorArchivo = 0;
  for (const item of evidencia.checklist) {
    if (!item.evidencia_url) continue;
    const { data, error } = await admin.storage.from('evidencia-procesos').download(item.evidencia_url);
    if (error || !data) continue;
    contadorArchivo++;
    const nombreArchivo = item.evidencia_url.split('/').pop() || `evidencia-${contadorArchivo}`;
    const buffer = Buffer.from(await data.arrayBuffer());
    carpetaEvidencia?.file(`${contadorArchivo}-${nombreArchivo}`, buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return zipBuffer;
}

export { obtenerEvidenciaAuditoria };
export type { TipoPaqueteAuditoria };
