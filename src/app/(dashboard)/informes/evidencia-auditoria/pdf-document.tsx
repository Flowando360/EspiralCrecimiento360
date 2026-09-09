import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { EvidenciaAuditoria, TipoPaqueteAuditoria } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  seccion: { marginTop: 14 },
  seccionTitulo: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 4 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celda1: { width: '30%' },
  celda2: { width: '30%' },
  celda3: { width: '20%' },
  celda4: { width: '20%' },
  vacio: { color: '#9ca3af' },
});

const ETIQUETA_PAQUETE: Record<TipoPaqueteAuditoria, string> = {
  todos: 'Paquete completo (SST + ISO 9001 + SARLAFT/SAGRILAFT + PTEE)',
  sst: 'SST',
  iso_9001: 'ISO 9001',
  sarlaft_sagrilaft: 'SARLAFT/SAGRILAFT',
  ptee: 'PTEE',
};

export function EvidenciaAuditoriaDocument({ evidencia, tipo }: { evidencia: EvidenciaAuditoria; tipo: TipoPaqueteAuditoria }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Evidencia de auditoría — {ETIQUETA_PAQUETE[tipo]}</Text>
        <Text style={styles.subtitulo}>Generado el {formatearFecha(new Date())}</Text>

        {evidencia.certificacionesSST.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Certificaciones SST</Text>
            <View style={[styles.fila, styles.filaEncabezado]}>
              <Text style={styles.celda1}>Colaborador</Text>
              <Text style={styles.celda2}>Certificación</Text>
              <Text style={styles.celda3}>Vencimiento</Text>
              <Text style={styles.celda4}>Verificado</Text>
            </View>
            {evidencia.certificacionesSST.map((c, i) => (
              <View key={i} style={styles.fila} wrap={false}>
                <Text style={styles.celda1}>{c.colaborador_nombre}</Text>
                <Text style={styles.celda2}>{c.titulo}</Text>
                <Text style={styles.celda3}>{c.fecha_vencimiento ? formatearFecha(c.fecha_vencimiento) : '—'}</Text>
                <Text style={styles.celda4}>{c.verificado ? 'Sí' : 'No'}</Text>
              </View>
            ))}
          </View>
        )}

        {evidencia.checklist.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Checklist de cumplimiento</Text>
            <View style={[styles.fila, styles.filaEncabezado]}>
              <Text style={styles.celda1}>Marco normativo</Text>
              <Text style={styles.celda2}>Ítem</Text>
              <Text style={styles.celda3}>Estado</Text>
              <Text style={styles.celda4}>Evidencia</Text>
            </View>
            {evidencia.checklist.map((c, i) => (
              <View key={i} style={styles.fila} wrap={false}>
                <Text style={styles.celda1}>{c.marco_normativo}</Text>
                <Text style={styles.celda2}>{c.item}</Text>
                <Text style={styles.celda3}>{c.estado}</Text>
                <Text style={styles.celda4}>{c.evidencia_url ? 'Adjunta en el ZIP' : 'Sin evidencia'}</Text>
              </View>
            ))}
          </View>
        )}

        {evidencia.riesgos.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Matriz de riesgos y controles</Text>
            <View style={[styles.fila, styles.filaEncabezado]}>
              <Text style={styles.celda1}>Marco normativo</Text>
              <Text style={styles.celda2}>Riesgo</Text>
              <Text style={styles.celda3}>Impacto</Text>
              <Text style={styles.celda4}>Control</Text>
            </View>
            {evidencia.riesgos.map((r, i) => (
              <View key={i} style={styles.fila} wrap={false}>
                <Text style={styles.celda1}>{r.marco_normativo}</Text>
                <Text style={styles.celda2}>{r.riesgo}</Text>
                <Text style={styles.celda3}>{r.impacto ?? '—'}</Text>
                <Text style={styles.celda4}>{r.control ?? '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {evidencia.procesos.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Procesos documentados</Text>
            <View style={[styles.fila, styles.filaEncabezado]}>
              <Text style={styles.celda1}>Área / proceso</Text>
              <Text style={styles.celda2}>Nombre</Text>
              <Text style={styles.celda3}>Versión</Text>
            </View>
            {evidencia.procesos.map((p, i) => (
              <View key={i} style={styles.fila} wrap={false}>
                <Text style={styles.celda1}>{p.area_proceso}</Text>
                <Text style={styles.celda2}>{p.nombre}</Text>
                <Text style={styles.celda3}>{p.version ?? '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {evidencia.certificacionesSST.length === 0 &&
          evidencia.checklist.length === 0 &&
          evidencia.riesgos.length === 0 &&
          evidencia.procesos.length === 0 && <Text style={styles.vacio}>Sin datos registrados para este paquete todavía.</Text>}
      </Page>
    </Document>
  );
}
