'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DatoEquipo {
  equipo: string;
  hacer: number;
  deber: number;
  saber: number;
}

export function IndicadoresEquipoChart({ datos }: { datos: DatoEquipo[] }) {
  if (datos.length === 0) {
    return <p className="text-sm text-marmol-400">Aún no hay resultados de ciclos publicados.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={datos} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" />
        <XAxis dataKey="equipo" tick={{ fontSize: 12, fill: '#6b6153' }} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#6b6153' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="hacer" name="Hacer" fill="#d97706" radius={[4, 4, 0, 0]} />
        <Bar dataKey="deber" name="Deber" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
