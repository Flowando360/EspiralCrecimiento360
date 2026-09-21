import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { ActaDifusion } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  seccion: { marginTop: 14 },
  seccionTitulo: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 4 },
  filaEncabezado: { backgroundColor: '#f3f4f6', fontWeight: 700 },
  celda1: { width: '40%' },
  celda2: { width: '30%' },
  celda3: { width: '30%' },
  resumen: { fontSize: 10, marginBottom: 3 },
  vacio: { color: '#9ca3af' },
});

export function ActaDifusionDocument({ acta }: { acta: ActaDifusion }) {
  const porcentaje = acta.totalConAcceso > 0 ? Math.round((acta.confirmaciones.length / acta.totalConAcceso) * 100) : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Acta de difusión — {acta.codigo}</Text>
        <Text style={styles.subtitulo}>
          {acta.nombre} · {acta.procesoNombre} · Generado el {formatearFecha(new Date())}
        </Text>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Resumen</Text>
          <Text style={styles.resumen}>Versión vigente: {acta.versionVigente}</Text>
          <Text style={styles.resumen}>
            Confirmaciones: {acta.confirmaciones.length} de {acta.totalConAcceso} ({porcentaje}%) — umbral de difusión completa: {acta.umbralPct}%
          </Text>
          <Text style={styles.resumen}>
            Estado de difusión: {porcentaje >= acta.umbralPct ? 'Completa' : 'En curso'}
          </Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Confirmaciones de lectura</Text>
          <View style={[styles.fila, styles.filaEncabezado]}>
            <Text style={styles.celda1}>Colaborador</Text>
            <Text style={styles.celda2}>Fecha y hora</Text>
            <Text style={styles.celda3}>Comentario</Text>
          </View>
          {acta.confirmaciones.map((c, i) => (
            <View key={i} style={styles.fila} wrap={false}>
              <Text style={styles.celda1}>{c.colaborador}</Text>
              <Text style={styles.celda2}>{formatearFecha(c.fecha)}</Text>
              <Text style={styles.celda3}>{c.comentario ?? '—'}</Text>
            </View>
          ))}
          {acta.confirmaciones.length === 0 && <Text style={styles.vacio}>Sin confirmaciones registradas todavía.</Text>}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Línea de tiempo del documento (control de versiones)</Text>
          <View style={[styles.fila, styles.filaEncabezado]}>
            <Text style={styles.celda1}>Versión</Text>
            <Text style={styles.celda2}>Fecha</Text>
            <Text style={styles.celda3}>Resumen del cambio</Text>
          </View>
          <View style={styles.fila} wrap={false}>
            <Text style={styles.celda1}>{acta.versionVigente} (vigente)</Text>
            <Text style={styles.celda2}>—</Text>
            <Text style={styles.celda3}>—</Text>
          </View>
          {acta.historial.map((h, i) => (
            <View key={i} style={styles.fila} wrap={false}>
              <Text style={styles.celda1}>{h.version} (archivada en repositorio de obsoletos)</Text>
              <Text style={styles.celda2}>{formatearFecha(h.fecha)}</Text>
              <Text style={styles.celda3}>{h.resumenCambio ?? '—'}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
