'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DatoMes {
  mes: string;
  salidas: number;
  salidasVoluntarias: number;
}

export function RotacionTendenciaChart({ datos }: { datos: DatoMes[] }) {
  if (datos.length === 0) {
    return <p className="text-sm text-marmol-400">Aún no hay salidas registradas en los últimos 12 meses.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={datos} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b6153' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b6153' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="salidas" name="Salidas totales" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="salidasVoluntarias" name="Renuncias voluntarias" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
