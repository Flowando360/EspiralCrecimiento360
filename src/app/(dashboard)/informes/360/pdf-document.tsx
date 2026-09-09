import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatearFecha } from '@/lib/utils';
import type { Informe360 } from './data';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2, color: '#1B2A5B' },
  subtitulo: { fontSize: 9, color: '#6b7280', marginBottom: 16 },
  seccion: { marginTop: 16 },
  seccionTitulo: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },
  filaKpi: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#6b7280' },
  valor: { fontWeight: 700 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  parrafo: { marginBottom: 6, lineHeight: 1.4 },
});

const ETIQUETA_EVALUADOR: Record<string, string> = {
  autoevaluacion: 'Autoevaluación',
  lider: 'Líder',
  par: 'Pares',
  colaborador_a_cargo: 'Colaboradores a cargo',
};

export function Informe360Document({ informe }: { informe: Informe360 }) {
  const hacer = informe.detallePorEvaluador.filter((d) => d.dimension === 'hacer');
  const deber = informe.detallePorEvaluador.filter((d) => d.dimension === 'deber');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Informe de Encuentro de Crecimiento 360° Integrado</Text>
        <Text style={styles.subtitulo}>
          {informe.colaborador.nombre_completo} · {informe.colaborador.cargo_nombre ?? '—'} ·{' '}
          {informe.ciclo_nombre ?? 'Sin ciclo con resultado'} · Generado el {formatearFecha(new Date())}
        </Text>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Resumen por dimensión</Text>
          <View style={styles.filaKpi}>
            <Text style={styles.label}>Ser</Text>
            <Text style={styles.valor}>{informe.ser ? 'Guía del Flow completada' : 'Pendiente'}</Text>
          </View>
          <View style={styles.filaKpi}>
            <Text style={styles.label}>Saber</Text>
            <Text style={styles.valor}>
              {informe.saber?.porcentaje_cumplimiento != null ? `${informe.saber.porcentaje_cumplimiento}%` : '—'}
            </Text>
          </View>
          <View style={styles.filaKpi}>
            <Text style={styles.label}>Hacer</Text>
            <Text style={styles.valor}>
              {informe.resultado?.indice_hacer ?? '—'} ({informe.resultado?.semaforo_hacer ?? 'sin datos'})
            </Text>
          </View>
          <View style={styles.filaKpi}>
            <Text style={styles.label}>Deber</Text>
            <Text style={styles.valor}>
              {informe.resultado?.indice_deber ?? '—'} ({informe.resultado?.semaforo_deber ?? 'sin datos'})
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Hacer — detalle por acompañante</Text>
          {hacer.length === 0 ? (
            <Text style={styles.label}>Sin respuestas registradas.</Text>
          ) : (
            hacer.map((d) => (
              <View key={d.tipo_evaluador} style={styles.fila}>
                <Text>{ETIQUETA_EVALUADOR[d.tipo_evaluador] ?? d.tipo_evaluador}</Text>
                <Text style={styles.valor}>{d.promedio}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Deber — detalle por acompañante</Text>
          {deber.length === 0 ? (
            <Text style={styles.label}>Sin respuestas registradas.</Text>
          ) : (
            deber.map((d) => (
              <View key={d.tipo_evaluador} style={styles.fila}>
                <Text>{ETIQUETA_EVALUADOR[d.tipo_evaluador] ?? d.tipo_evaluador}</Text>
                <Text style={styles.valor}>{d.promedio}</Text>
              </View>
            ))
          )}
        </View>

        {informe.ser && (informe.ser.proposito || informe.ser.talentos_naturales) && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Ser — Guía del Flow</Text>
            {informe.ser.proposito && <Text style={styles.parrafo}>Propósito: {informe.ser.proposito}</Text>}
            {informe.ser.talentos_naturales && (
              <Text style={styles.parrafo}>Talentos naturales: {informe.ser.talentos_naturales}</Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
