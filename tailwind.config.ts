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
        // Escala recorrida un escalón hacia el oscuro a partir del 300 (2026-09-27,
        // a pedido de Diana: "oscurece el gris de las letras, sin que dejen de ser
        // grises, que contrasten mejor con el blanco de fondo"). 50/100/200 quedan
        // igual (son casi siempre fondo/bordes claros, no letras). 300-800 toman el
        // valor que antes tenía el escalón siguiente (más oscuro), y se agrega un 900
        // nuevo, más oscuro que el anterior.
        marmol: {
          50: '#faf9f7',
          100: '#f2f0ec',
          200: '#e4e0d8',
          300: '#aca194',
          400: '#8a7f70',
          500: '#6b6153',
          600: '#524a40',
          700: '#3a352e',
          800: '#25211c',
          900: '#17140f',
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
        secundario: '#1E3A8A', // azul noche — encabezados, textos importantes
        acento: '#A3E635', // verde lima — logros, insignias, gamificación
        barra: '#0F1F52', // azul más oscuro que "secundario" — fondo de la barra de navegación superior
      },
      backgroundImage: {
        // Degradado verde → azul oscuro: hero, barras de progreso, tarjetas de logro
        crecimiento: 'linear-gradient(90deg, #16A34A, #1E3A8A)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      // Toda la escala con tamaño de letra +2px (2026-09-27, a pedido de Diana:
      // "súbele 2 puntos a cada tipo de letra en todo el aplicativo") — al
      // redefinir la escala acá, cada clase text-xs/sm/base/lg/xl/2xl/3xl del
      // proyecto entero queda más grande sin tener que tocar cada archivo. Los
      // interlineados suben la misma cantidad, para conservar la proporción.
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.125rem' }], // 14px / 18px (antes 12px / 16px)
        sm: ['1rem', { lineHeight: '1.375rem' }], // 16px / 22px (antes 14px / 20px)
        base: ['1.125rem', { lineHeight: '1.625rem' }], // 18px / 26px (antes 16px / 24px)
        lg: ['1.25rem', { lineHeight: '1.875rem' }], // 20px / 30px (antes 18px / 28px)
        xl: ['1.375rem', { lineHeight: '1.875rem' }], // 22px / 30px (antes 20px / 28px)
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }], // 26px / 34px (antes 24px / 32px)
        '3xl': ['2rem', { lineHeight: '2.375rem' }], // 32px / 38px (antes 30px / 36px)
      },
      borderRadius: {
        xl: '0.875rem',
      },
      // Micro-animaciones de gamificación (Cacería Makigami)
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.6)' },
          '60%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        entrar: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        pop: 'pop 0.45s ease-out',
        entrar: 'entrar 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
