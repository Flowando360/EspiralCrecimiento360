# Los 4 Pilares — diseño completo

Juego breve de autoconocimiento inspirado en la charla TEDx de Emily Esfahani Smith
("Los cuatro pilares de una vida con significado") — solo el **marco conceptual**
(Pertenencia, Propósito, Trascendencia, Narración) es de ella; el contenido del
juego (escenas, preguntas) es propio, para no rayar en derechos de autor sobre
su expresión concreta. Pensado para que cualquier persona con un link pueda
jugarlo, sin necesitar cuenta corporativa, y termine recibiendo un PDF
personalizado y bonito por correo.

> **Estado: implementado y en producción** (`GuiaDelFlow`, main). Este
> documento ya no es un plan — es el registro de cómo quedó construido.
> Pasó por tres rondas de ajuste después de la primera versión:
> 1. Preguntas abiertas por pilar en vez de escala 1-5.
> 2. Reemplazo de los ejemplos literales de la charla por escenarios inventados.
> 3. **Rediseño completo del flujo** (esta versión) siguiendo
>    `Especificacion_Juego_4_Pilares_FlowAndo.docx` (v1.0, 27/09/2026) — ese
>    documento es ahora la fuente de verdad de la experiencia; este archivo
>    documenta cómo quedó construida esa especificación en código.

**Dónde vive:** dentro del proyecto `GuiaDelFlow` (`C:\mis_apps\GuiaDelFlow`),
no dentro de `espiralcrecimiento360`. Razón: GuiaDelFlow ya tenía resuelto todo
lo que este juego necesita y que espiralcrecimiento360 no tiene — registro
abierto sin depender de una empresa, un mecanismo de "links de envío" para
compartir con quien sea, un motor de generación de PDF con imágenes
(Puppeteer + Claude con esquema forzado), envío de correo con Resend, y el
banco de ilustraciones de marca (Flowi). Este documento queda guardado aquí,
en espiralcrecimiento360, solo porque así lo pidió Diana.

**Integración con Espiral de Crecimiento (espiralcrecimiento360):** pendiente,
a propósito — Diana pidió dejarlo así por ahora (2026-09-27). Las dos apps
usan proyectos de Supabase distintos (no comparten base de datos), así que
cuando se retome, integrarlo implica un puente por API (una ruta protegida en
GuiaDelFlow que espiralcrecimiento360 consuma), no una lectura directa de
tablas — mismo tipo de puente que ya existe para la Guía del Flow completa
(`/api/guia-flow/generar-informes` en espiralcrecimiento360, alimentado por un
webhook de GuiaDelFlow).

---

## 1. Flujo de extremo a extremo (v2 — correo al final)

1. Diana entra a `/panel/pilares` y crea **un link de campaña**, con una
   etiqueta libre (ej. "Reto 4 Pilares — Encuentro Networking Sept"). Un
   link, reutilizable por muchas personas.
2. Comparte ese único link por el canal que quiera.
3. Quien lo abre ve la landing (título + duración anunciada de 10-12 min) y
   un formulario con **solo el nombre** — la sesión se crea en ese instante
   (estado `jugando`), para que si alguien abandona a mitad de camino quede
   registrado y se pueda medir en el panel.
4. Introducción visual a los 4 pilares (arquitectura).
5. **Ronda 1 — Explora**: 12 tarjetas de situaciones cotidianas, en un orden
   aleatorio fijo por sesión (nunca agrupado por pilar), una por una, con 4
   destinos táctiles. Feedback siempre educativo, nunca "correcto/incorrecto"
   ni con colores de examen. Cada 3 tarjetas aparece un micro-reconocimiento
   ("¿Y esto te pasa a ti?") solo para generar interacción, sin construir
   ningún puntaje.
6. Transición de Flowi.
7. **Ronda 2 — Mírate**: una mini-experiencia POR PILAR (Pertenencia,
   Propósito, Trascendencia — 3 preguntas abiertas cada una), con una
   pantalla de "Pilar descubierto" entre cada una. Narración no repite este
   ejercicio, tiene el suyo propio.
8. Transición de Flowi.
9. **Ronda 3 — Tu historia**: antes / hoy / título (puede ser sobre algo
   difícil, inesperado o incluso feliz — nunca se asume cuál).
10. **Integración**: se llama a Claude en este punto (con clasificación +
    reflexiones + historia — el correo NO le hace falta para nada) y se
    guarda el resultado completo.
11. **Revelación**: "Lo que más se hizo visible en tus respuestas…" — un
    pilar + una explicación corta, en lenguaje humano (nunca "tu pilar más
    fuerte" ni "tu puntuación").
12. **Correo**: se pide únicamente acá, justo antes de generar el documento
    final.
13. **Generación**: arma el PDF (ya con el `resultado` que Claude escribió en
    el paso 10 — no se le vuelve a llamar) con Puppeteer, lo sube y lo envía
    por correo. Loader con mensajes rotativos.
14. Descarga + **experimento de 24h**: una sugerencia pequeña y realizable
    (escrita por Claude) + campo opcional para anotar el propio compromiso.
15. Diana ve en su panel quién jugó, en qué etapa se quedó cada quien (si no
    terminó), y el pilar más visible de cada uno.

---

## 2. Modelo de datos (`supabase/migrations/0010_flow_pilares.sql` +
`0011_flow_pilares_estados.sql` + `0012_flow_pilares_flujo_v2.sql`)

- **`flow_pilares_links`** — el link de campaña reutilizable.
  `id`, `etiqueta`, `activo`, `creado_at`.
- **`flow_pilares_sesiones`** — cada persona que juega.
  `id`, `link_id`, `nombre` (obligatorio desde el inicio), `correo`
  (**nullable** — solo se llena al final), `clasificacion`, `reflexiones`,
  `historia` (jsonb, se completan progresivamente ronda por ronda),
  `resultado` (jsonb — salida completa de Claude, se llena en la
  "Integración", ANTES de tener correo), `estado`, `storage_path`,
  `error_detalle`, `correo_enviado_at`, `correo_error`, `compromiso_24h`
  (texto opcional del experimento de 24h), `creado_at`.
- `estado` — enum con 5 valores (los 2 primeros se agregaron en la v2):
  - `jugando` — se creó al entrar a la landing, la persona está jugando.
  - `esperando_correo` — terminó las 3 rondas, Claude ya escribió
    `resultado`, se le mostró la revelación, falta que dé su correo.
  - `generando` — ya dio el correo, se está armando/subiendo el PDF.
  - `listo` / `error`.
- Bucket de Storage privado `pilares-del-flow` (ruta: `<sesion_id>/pilares.pdf`).

Sin cuenta de `auth.users`: el id de la sesión sigue siendo el único "token"
de acceso a su resultado. Cero cruce con la Guía del Flow completa.

---

## 3. Contenido del juego

### 3.0 Landing

> **¿Qué hace que una vida tenga significado?**
> En unos 10-12 minutos vas a explorar cuatro formas de encontrar y
> construir significado en tu vida. Al final recibirás una lectura personal
> de lo que descubriste.
>
> [Tu nombre] → **Empezar mi viaje**

(El correo ya NO se pide acá — ver sección 1, paso 12.)

### 3.1 Ronda 1 — Clasificación (12 tarjetas, orden aleatorio por sesión)

Ver `src/lib/pilares/contenido.ts` (`TARJETAS`, `barajarTarjetas()`) para el
texto exacto de las 12 escenas inventadas (3 por pilar) — no se repiten acá
para no duplicar la fuente de verdad. Cada tarjeta tiene su `feedback`,
mostrado siempre con un prefijo de aprendizaje, nunca de examen:
"Sí. Aquí aparece con claridad:" si coincidió, o una variante de "Hay otra
manera de mirarlo:" si no — nunca colores rojo/verde ni "correcto/incorrecto".

Cada 3 tarjetas (posiciones 3, 6, 9, 12) aparece un micro-reconocimiento:
"¿Y esto te pasa a ti?" con 3 opciones (Mucho / A veces / Nunca lo había
pensado) — puramente de interacción, no se persiste ni se le pasa a Claude.

### 3.2 Ronda 2 — Autoindagación por pilar (mini-experiencia, no formulario largo)

3 preguntas abiertas por pilar, para Pertenencia, Propósito y Trascendencia
(Narración tiene su propio ejercicio, 3.3) — ver `PREGUNTAS_PILARES` en
`contenido.ts`. Cada pilar se muestra en SU PROPIA pantalla ("🫂 Descubre tu
pertenencia", etc.), y al completarlo aparece una pantalla corta "Pilar
descubierto" antes de pasar al siguiente — nunca las 9 preguntas juntas en
una sola pantalla larga.

### 3.3 Ronda 3 — Tu historia (narración guiada)

- *"Piensa en una situación que te haya cambiado. Puede haber sido difícil,
  inesperada, dolorosa, desafiante o incluso muy feliz. No tienes que
  contar nada que no quieras compartir. ¿Cómo la contabas justo después de
  que ocurrió?"*
- *"¿Cómo la cuentas hoy? ¿Qué cambió en la forma en que la entiendes?"*
- *"Si esta historia fuera un libro, ¿cómo se llamaría este capítulo?"*

---

## 4. Pilar más visible (decidido por Claude, no calculado)

No hay ninguna fórmula ni promedio: es Claude quien, leyendo la
clasificación + las respuestas de los 3 pilares + la historia, decide cuál
pilar se hizo más visible hoy en la persona (`pilar_mas_vivo`) y por qué
(`explicacion_pilar_mas_visible`, 1-2 frases). Este juicio se calcula en la
pantalla de "Integración" (antes de pedir el correo) y se muestra de
inmediato en "Revelación". La interfaz nunca dice "tu pilar más fuerte",
"tu puntuación", "tu nivel" ni "tú eres [pilar]" — solo describe qué se hizo
visible, citando algo concreto de lo que la persona escribió.

---

## 5. Esquema de salida para Claude (`src/lib/pdf/pilares/esquema.ts`)

```
ESQUEMA_PILARES = {
  frase_portada: string (≤140 caracteres),
  introduccion: { parrafo_1: string, parrafo_2: string },
  pilares: [
    { nombre_pilar, frase_ancla, reflexion }   // 4, orden fijo
  ],
  historia_reescrita: { titulo, parrafo_1, parrafo_2, cierre },
  invitacion_final: string,
  pilar_mas_vivo: "Pertenencia" | "Propósito" | "Trascendencia" | "Narración",
  explicacion_pilar_mas_visible: string,   // pantalla de Revelación
  experimento_24h: string,                 // pantalla final + última página del PDF
}
```

Reglas del prompt (no negociables, calcadas de la especificación): no
inventar datos, no diagnosticar, no lenguaje clínico, no rankings, no
puntuaciones, no decir que a alguien "le falta" un pilar, no cambiar los
hechos de la historia, no interpretar preguntas sin responder (se omiten
del prompt en vez de mandarse como "sin responder"), tratar el dolor con
sensibilidad sin asumir rol terapéutico. Ver `src/lib/pdf/pilares/prompt.ts`
para el texto completo.

**Cuándo se llama:** una sola vez, en la pantalla de "Integración" —
inmediatamente después de terminar la Ronda 3, ANTES de pedir el correo
(Claude nunca necesitó el correo para nada). La fase de "Generación" (tras
el correo) ya no vuelve a llamar a Claude, solo arma el PDF con lo que ya
está guardado en `resultado`.

---

## 6. Estructura del PDF (7 páginas, mismo motor que "La Carta")

1. **Portada** — nombre de la persona + `frase_portada`.
2. **Introducción** — los 2 párrafos, situando el juego.
3. **Pertenencia** — `frase_ancla` + `reflexion` + imagen de marca.
4. **Propósito** — ídem.
5. **Trascendencia** — ídem.
6. **Narración** — ídem.
7. **Tu historia + cierre + experimento 24h** — `historia_reescrita`
   completa, `invitacion_final`, y el bloque de `experimento_24h` (destacado
   en un recuadro), seguido de la firma de Flowi.

### Mapeo de imágenes (`public/images/flow-optimizado`)

| Pilar | Imagen |
|---|---|
| Pertenencia | `PersonajesMundo.jpg` |
| Propósito | `Flowa_Eureka.jpg` |
| Trascendencia | `Flowi_Medita.jpg` |
| Narración | `FlowiEscribiendo.jpg` |
| Portada | `FlowA_Puente.jpg` |

---

## 7. El link de campaña

Igual que antes: 1 link = muchas personas (a diferencia de los links de
Guía/Carta, que son 1 link = 1 persona). Formulario simple (solo etiqueta),
activar/desactivar/eliminar desde `/panel/pilares`.

## 8. Panel de administración (`/panel/pilares`)

- Formulario para crear el link de campaña.
- Tabla de links (etiqueta, estado, activar/desactivar/eliminar).
- Tabla de sesiones: nombre, correo (puede estar vacío si no ha terminado),
  campaña, **lo más visible** (antes decía "pilar dominante"), estado, y
  descarga del PDF cuando está listo.
- **Nuevo (v2):** resumen de conteos por estado arriba de la tabla
  (jugando / esperando correo / listas / con error), para medir abandono
  por etapa sin tener que contar filas a mano.

---

## 9. Experimento de 24 horas

Sugerencia pequeña y realizable, escrita por Claude (`experimento_24h`),
relacionada con lo que la persona escribió (idealmente conectada al pilar
más visible) — nunca una obligación ni un cambio de vida grande. Aparece en
dos lugares: la última página del PDF, y una pantalla final del juego con un
campo opcional para que la persona anote su propio compromiso
(`compromiso_24h`, guardado si lo escribe).

---

## 10. Privacidad

- Solo se pide nombre (al inicio) y correo (al final) — nada de datos de
  empresa, cargo, ni ningún aspecto psicológico de los 12 sensibles de la
  Guía completa.
- Sin cuenta (`auth.users`): el id de la sesión es el único token de acceso
  a su resultado.
- Cero cruce con `flow_resultados`, con la Guía del Flow completa, ni con
  espiralcrecimiento360.
- Las respuestas individuales no se muestran públicamente; el panel de
  quien comparte el link solo ve lo agregable (nombre, correo, pilar más
  visible, estado).

---

## 11. Implementación (completa)

1. ✅ Migraciones `0010` (tablas base), `0011` (nuevos estados `jugando` /
   `esperando_correo`), `0012` (correo nullable, `compromiso_24h`).
2. ✅ `src/lib/pdf/pilares/` (tipos, esquema, prompt, css, plantilla,
   generar) — con `pilar_mas_vivo`, `explicacion_pilar_mas_visible` y
   `experimento_24h`.
3. ✅ `src/lib/pilares/contenido.ts` — tarjetas, preguntas, `barajarTarjetas()`,
   micro-reconocimiento, respaldo del experimento 24h.
4. ✅ `src/lib/generacion/pilares.ts` — dividido en `analizarSesionPilares`
   (Claude, antes del correo) y `generarPdfSesionPilares` (Puppeteer +
   correo, después).
5. ✅ Ruta pública `/pilares/[token]` — landing solo con nombre, intro a los
   4 pilares, ronda 1 con micro-reconocimiento, ronda 2 dividida por pilar
   con "pilar descubierto", ronda 3, integración, revelación y pantalla de
   correo.
6. ✅ `/api/pilares/analizar` (nuevo) y `/api/pilares/generar` (ajustado
   para recibir el correo) y `/api/pilares/descargar/[sesionId]`.
7. ✅ `/pilares/resultado/[sesionId]` — descarga + experimento de 24h con
   compromiso opcional.
8. ✅ `/panel/pilares` — con resumen de estados para medir abandono.
9. ⏳ Integración con Espiral de Crecimiento (espiralcrecimiento360) —
   pendiente a propósito, ver nota al inicio del documento.
