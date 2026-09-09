import type { Config } from 'tailwindcss';

// Sistema de diseño Flow, Nexus y Visión × FlowAndo
// Copia de demostración de Espiral de Crecimiento 360°, con marca propia:
// verde brillante + azul oscuro (en vez del violeta original). Los neutros
// cálidos ("marmol") y los colores semánticos de Ser/Saber/Hacer/Deber se
// mantienen igual: son código funcional (cada pilar tiene su color fijo),
// no identidad de marca.
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marmol: {
          50: '#faf9f7',
          100: '#f2f0ec',
          200: '#e4e0d8',
          300: '#cfc8ba',
          400: '#aca194',
          500: '#8a7f70',
          600: '#6b6153',
          700: '#524a40',
          800: '#3a352e',
          900: '#25211c',
        },
        flow: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
        },
        ser: '#7c3aed',
        saber: '#0ea5a4',
        hacer: '#d97706',
        deber: '#2563eb',
        alto: '#15803d',
        medio: '#b45309',
        bajo: '#b91c1c',
        // Paleta de marca de esta copia: verde brillante (flow-500) + azul
        // oscuro (secundario). Distinta a propósito de la paleta violeta del
        // aplicativo original — ver docs/sistema-diseno-y-lenguaje.md si se
        // vuelve a alinear con el original más adelante.
        secundario: '#1E3A8A', // azul noche — encabezados, textos importantes, nav
        acento: '#A3E635', // verde lima — logros, insignias, gamificación
      },
      backgroundImage: {
        // Degradado verde → azul oscuro: hero, barras de progreso, tarjetas de logro
        crecimiento: 'linear-gradient(90deg, #16A34A, #1E3A8A)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
};

export default config;
