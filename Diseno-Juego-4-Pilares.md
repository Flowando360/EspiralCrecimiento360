# Los 4 Pilares — diseño completo

Juego breve de autoconocimiento inspirado en la charla TEDx de Emily Esfahani Smith
("Los cuatro pilares de una vida con significado") — solo el **marco conceptual**
(Pertenencia, Propósito, Trascendencia, Narración) es de ella; el contenido del
juego (escenas, preguntas) es propio, para no rayar en derechos de autor sobre
su expresión concreta (ver sección 3). Pensado para que cualquier persona con
un link pueda jugarlo, sin necesitar cuenta corporativa, y termine recibiendo
un PDF personalizado y bonito por correo.

> **Estado: implementado y en producción** (`GuiaDelFlow`, main). Este
> documento ya no es un plan — es el registro de cómo quedó construido,
> actualizado después de dos rondas de ajuste post-implementación (preguntas
> abiertas por pilar en vez de escala 1-5, y reemplazo de los ejemplos
> literales de la charla por escenarios inventados).

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

## 1. Flujo de extremo a extremo

1. Diana entra a `/panel/pilares` y crea **un link de campaña**, con una
   etiqueta libre (ej. "Reto 4 Pilares — Encuentro Networking Sept"). A
   diferencia de los links de Guía/Carta (uno por persona, de un solo uso),
   este es **reutilizable**: la misma URL sirve para todos los que quiera
   invitar.
2. Comparte ese único link por el canal que quiera (WhatsApp, correo, redes).
3. Quien lo abre ve una landing corta explicando el juego (3 líneas + una
   imagen), y un formulario mínimo: **nombre** y **correo**. Sin contraseña,
   sin registro corporativo.
4. Juega las 3 partes (clasificación → preguntas de autoindagación por
   pilar → narración), 8-10 minutos en total.
5. Al terminar, un loader breve ("Flowi está tejiendo tu historia…") mientras
   Claude redacta el contenido y Puppeteer arma el PDF.
6. Ve el resultado en pantalla y lo puede descargar; una copia le llega
   también por correo (mismo mecanismo que "La Carta").
7. Diana ve en su panel quién jugó con su link, cuándo, y puede abrir el PDF
   de cada quien.

---

## 2. Modelo de datos (implementado — `supabase/migrations/0010_flow_pilares.sql`)

- **`flow_pilares_links`** — el link de campaña reutilizable.
  `id`, `etiqueta`, `activo`, `creado_at`.
- **`flow_pilares_sesiones`** — cada persona que juega.
  `id`, `link_id` (FK, nullable si se juega sin link), `nombre`, `correo`,
  `clasificacion` (jsonb — id de tarjeta → pilar elegido),
  `reflexiones` (jsonb — id de pregunta → lo que escribió, ver sección 3.2),
  `historia` (jsonb — las 3 respuestas de narración),
  `resultado` (jsonb — salida completa de Claude, incluye `pilar_mas_vivo`),
  `estado` (`generando` | `listo` | `error`), `storage_path`, `error_detalle`,
  `correo_enviado_at`, `correo_error`, `creado_at`.
- Bucket de Storage privado `pilares-del-flow` (ruta: `<sesion_id>/pilares.pdf`).

No se toca ninguna tabla de la Guía del Flow completa ni sus 12 aspectos
sensibles — este juego es 100% autocontenido, cero cruce de datos. Tampoco
hay cuenta de `auth.users`: el id de la sesión es el único "token" de acceso
a su resultado (mismo modelo de confianza que un link de invitación).

*(Nota: la primera versión de este diseño tenía una tabla `tendencia_pilares`
calculada por promedio de una escala 1-5 — se descartó al cambiar el
ejercicio 2 de escala a preguntas abiertas; ver sección 4.)*

---

## 3. Contenido del juego

### 3.0 Intro (landing, antes de empezar)

> **Los 4 Pilares**
> Emily Esfahani Smith pasó cinco años estudiando qué hace que una vida se
> sienta significativa — no feliz, *significativa*. Encontró cuatro
> respuestas. Este juego te toma 8 minutos y termina en un PDF solo tuyo,
> con lo que descubriste.
>
> [Nombre] [Correo] → **Empezar**

### 3.1 Ejercicio 1 — Clasificación (tocar para asignar)

Mecánica: 12 tarjetas, una por una, la persona las asigna a uno de los 4
pilares. Feedback inmediato de una línea al acertar/fallar, para que sea
instructivo, no solo un test.

**Importante — por qué estas escenas son inventadas, no de la charla:**
la primera versión de este ejercicio parafraseaba directamente las anécdotas
de Emily (Jonathan y el vendedor de periódicos, Emika y su lesión jugando
fútbol, la cirugía de su papá, el estudio de los eucaliptos, la cita a Dan
McAdams). Diana pidió reemplazarlas (2026-09-27): "no quiero violar derechos
de autor... ya la gente no compra periódico". El marco de los 4 pilares es
una idea (no protegible); sus historias puntuales sí son su expresión
concreta. Las 12 tarjetas de abajo son escenarios cotidianos originales que
ilustran el mismo concepto, sin reproducir ninguna de sus anécdotas.

**Pertenencia**
1. *"Cada mañana antes de llegar a la oficina, Juan desayuna en el puesto de
   arepas de la esquina. No es solo comprar algo rápido: se detiene a
   preguntarle a doña Marta cómo amaneció, y ella ya sabe cómo le gusta el
   tinto."*
   → Feedback: "La pertenencia vive en esos momentos pequeños entre
   personas — es una elección, no una casualidad."
2. *"Contestar el chat de la oficina mientras tu pareja te está contando
   algo importante, o saludar de pasada a alguien conocido sin mirarlo
   realmente a los ojos."*
   → Feedback: "Son rechazos pequeños que casi nadie nota — pero le quitan
   valor al otro."
3. *"Hay grupos de amigos que solo te aceptan de verdad si opinas igual que
   ellos en todo. La pertenencia real nace de que te valoren siendo
   distinto, no de estar siempre de acuerdo."*
   → Feedback: "Vale la pena distinguir entre pertenecer y solo encajar."

**Propósito**
4. *"Una enfermera de turno de noche dice que su trabajo no es solo aplicar
   medicamentos a tiempo, sino que cada paciente sienta que alguien de
   verdad está pendiente de él."*
   → Feedback: "El propósito no depende del cargo — depende de a quién
   sirves con lo que haces."
5. *"Muchas mamás y papás dicen: 'mi propósito ahora es sacar adelante a mis
   hijos', aunque eso signifique turnos dobles y noches cortas."*
   → Feedback: "El propósito tiene menos que ver con lo que quieres, y más
   con lo que das."
6. *"Cuando alguien lleva meses buscando trabajo sin conseguirlo, no solo le
   hace falta el ingreso — también extraña sentirse útil para algo o para
   alguien."*
   → Feedback: "Sin algo valioso que hacer, las personas se desorientan."

**Trascendencia**
7. *"Un grupo de amigos sube a caminar a la montaña un domingo, y al llegar
   arriba se quedan un rato en silencio mirando el paisaje, sintiendo que
   sus problemas se ven más pequeños desde ahí."*
   → Feedback: "Basta un instante en que tu ego se achica para que algo en
   ti cambie."
8. *"A Camila se le va el tiempo sin darse cuenta cuando pinta — empieza a
   las tres de la tarde convencida de que lleva diez minutos, y de repente
   ya oscureció."*
   → Feedback: "La trascendencia no siempre es mística — a veces es solo
   perderte en lo que haces."
9. *"Para algunos la trascendencia llega bailando hasta perder la cuenta del
   tiempo; para otros, en silencio, rezando con la abuela los domingos."*
   → Feedback: "El lugar cambia de persona a persona; la sensación de
   conectarse con algo más grande, no."

**Narración**
10. *"Andrés perdió su negocio en la pandemia. Por mucho tiempo se repetía:
    'yo era alguien exitoso, y ahora no soy nadie'. Hoy dice: 'esa quiebra
    me enseñó a valorar lo que de verdad importa, y desde ahí empecé de
    nuevo siendo más honesto conmigo mismo'."*
    → Feedback: "Los hechos no cambiaron. La historia que se contó a sí
    mismo, sí."
11. *"A la abuela de Valentina la operaron de urgencia. Lo último que
    alcanzó a pensar antes de la anestesia fue el nombre de sus nietos —
    eso, dijo después, fue lo que la hizo aferrarse a despertar."*
    → Feedback: "En ese momento, esa fue su historia de para qué vivir."
12. *"Las personas que sienten que su vida tiene sentido no son las que
    nunca han sufrido — son las que aprendieron a contar lo malo como
    parte de algo que las hizo crecer."*
    → Feedback: "No se trata de que te hayan pasado cosas buenas — se
    trata de cómo las cuentas."

### 3.2 Ejercicio 2 — Preguntas de autoindagación (por escrito, no escala)

**Cambio de diseño (2026-09-27):** la primera versión de este ejercicio era
una escala 1-5 tipo Likert (3 afirmaciones por pilar, calificar
"nunca…siempre"). Diana pidió reemplazarla: quería que cada pilar invitara a
*escribir*, no solo a calificarse — "varias preguntas cortas, muy fáciles de
comprender y de responder que inviten a la persona a cuestionarse y a revisar
lo que tienen en su vida que le da verdadero significado". Quedó así: 3
preguntas cortas de respuesta libre por pilar, para Pertenencia, Propósito y
Trascendencia (Narración ya tenía su propio ejercicio de escritura, el 3.3,
así que no se repite acá).

**Pertenencia**
- ¿Con quién sientes que puedes ser tú mismo/a, sin esforzarte?
- ¿Cuándo fue la última vez que te sentiste realmente escuchado/a por
  alguien?
- ¿A qué familia, equipo o comunidad sientes que perteneces de verdad hoy?

**Propósito**
- ¿Para quién o para qué estás usando tus fortalezas en este momento de tu
  vida?
- Si dejaras de hacer lo que haces hoy, ¿qué se quedaría sin hacer?
- ¿Qué necesitarías para sentir que tu día a día tiene un "para qué" más
  claro?

**Trascendencia**
- ¿Cuándo fue la última vez que perdiste por completo la noción del tiempo
  haciendo algo?
- ¿Qué actividad, lugar o momento te hace sentir parte de algo más grande
  que tú?
- ¿Cuándo fue la última vez que de verdad bajaste el ritmo, aunque fuera un
  momento?

### 3.3 Ejercicio 3 — Tu historia (narración guiada)

Tres cajas de texto cortas (1-2 líneas cada una), para que no sea una
página en blanco intimidante:

- S1. *"Piensa en un momento difícil de tu vida. ¿Cómo lo hubieras contado
  justo después de que pasó?"*
- S2. *"¿Cómo lo cuentas hoy? ¿Qué cambió en la forma en que lo
  entiendes?"*
- S3. *"Si esa historia tuviera un título, ¿cuál sería?"*

---

## 4. Pilar más vivo (reemplaza el cálculo de tendencia por escala)

La primera versión de este diseño promediaba una escala 1-5 en 3 categorías
("en construcción / presente / fuerte") con una fórmula fija. Al pasar el
ejercicio 2 a preguntas abiertas (sección 3.2) ya no hay nada que promediar
— en su lugar, es **Claude quien decide** cuál de los 4 pilares parece más
vivo hoy en la persona, leyendo todas sus respuestas escritas y su
clasificación de tarjetas. Ese juicio queda en el campo `pilar_mas_vivo` de
la salida estructurada (sección 5) — no aparece en el PDF de la persona, es
solo para el panel de quien comparte el link (sección 8).

---

## 5. Esquema de salida para Claude (equivalente a `esquema.ts` de "La Carta")

Mismo patrón que ya usa GuiaDelFlow: un *tool* de Anthropic con forma fija,
para que la redacción sea siempre estructurable en la plantilla del PDF.

```
ESQUEMA_PILARES = {
  frase_portada: string (≤140 caracteres),
  introduccion: { parrafo_1: string, parrafo_2: string },
  pilares: [
    {
      nombre_pilar: "Pertenencia" | "Propósito" | "Trascendencia" | "Narración",
      frase_ancla: string (corta, memorable, personalizada),
      reflexion: string (~100 palabras, segunda persona, cálido),
    }
    // 4 elementos, uno por pilar, en este orden fijo
  ],
  historia_reescrita: {
    titulo: string,
    parrafo_1: string,
    parrafo_2: string,
    cierre: string,
  },
  invitacion_final: string (~60 palabras),
  pilar_mas_vivo: "Pertenencia" | "Propósito" | "Trascendencia" | "Narración",
}
```

### Prompt de sistema (como quedó implementado)

> Eres Flowi, y acabas de acompañar a una persona a jugar "Los 4 Pilares",
> un juego breve inspirado en la idea de que una vida con significado se
> sostiene en 4 pilares: Pertenencia, Propósito, Trascendencia y Narración.
> Vas a escribir su resultado personal para un PDF de 7 páginas.
>
> Recibes: (1) qué tarjetas clasificó bien o mal en cada pilar (12
> situaciones cotidianas del juego, no de ninguna charla), (2) lo que
> escribió, pregunta por pregunta, en Pertenencia/Propósito/Trascendencia
> — la reflexión de cada pilar debe citar o parafrasear específicamente lo
> que escribió, nunca ser genérica, (3) sus 3 respuestas sobre un momento
> difícil de su vida y cómo lo cuenta hoy.
>
> Para cada uno de los 4 pilares, escribe en segunda persona, con calidez y
> sin lenguaje clínico ni de autoayuda genérica — como si conocieras a esta
> persona. Nunca inventes datos que no te dieron; si dejó una pregunta sin
> responder, no la menciones ni la inventes, apóyate en las que sí
> respondió.
>
> Con sus 3 respuestas de historia, reescríbelas como una "historia
> redentora" (lo malo, resignificado como parte de un crecimiento) — sin
> inventar hechos que no dio, solo ayudándola a verla con la claridad con la
> que ya la está empezando a contar ella misma en su segunda respuesta.
>
> Cierra con una invitación breve y sin presión a seguir profundizando en
> su autoconocimiento con la Guía del Flow completa, y decide cuál de los 4
> pilares vive más fuerte hoy en esta persona (`pilar_mas_vivo`).

---

## 6. Estructura del PDF (7 páginas, mismo motor que "La Carta")

1. **Portada** — nombre de la persona + `frase_portada`.
2. **Introducción** — los 2 párrafos, situando el juego.
3. **Pertenencia** — `frase_ancla` + `reflexion` + imagen de marca.
4. **Propósito** — ídem.
5. **Trascendencia** — ídem.
6. **Narración** — ídem.
7. **Tu historia + cierre** — `historia_reescrita` completa, maquetada como
   una carta, seguida de `invitacion_final` y la firma de Flowi.

### Mapeo de imágenes (reutilizando el banco ya existente en
`public/images/flow-optimizado`, sin encargar arte nuevo para la v1)

| Pilar | Imagen |
|---|---|
| Pertenencia | `PersonajesMundo.jpg` |
| Propósito | `Flowa_Eureka.jpg` |
| Trascendencia | `Flowi_Medita.jpg` |
| Narración | `FlowiEscribiendo.jpg` |
| Portada | `FlowA_Puente.jpg` |

---

## 7. El link de campaña (nuevo tipo de link, no el de "envío" de Guía/Carta)

Los links de Guía/Carta son 1 link = 1 persona nombrada de antemano ("Juan
Pérez"), pensados para invitar a alguien específico. Este juego necesita lo
contrario: **1 link = muchas personas**, sin saber de antemano quiénes son.
Por eso es una tabla y un formulario nuevos, no una extensión del existente:

- Formulario simple: solo **etiqueta de campaña** (para que Diana identifique
  de dónde vino cada grupo de jugadores).
- Sin límite de usos ni modo "acompañado" — el resultado siempre es directo
  e inmediato (no tiene sentido revisarlo antes, es autoservicio).
- El link resultante apunta a `/pilares/[token]`, que muestra la landing
  del punto 3.0 y el formulario nombre + correo.
- Se puede activar/desactivar o eliminar desde `/panel/pilares`.

## 8. Panel para quien envía el link

`/panel/pilares`: formulario para crear el link de campaña, tabla de links
creados (con activar/desactivar/eliminar), y tabla de quién ha jugado —
nombre, correo, campaña, pilar más vivo, estado, y descarga del PDF.

---

## 9. Privacidad

- Solo se pide nombre y correo — nada de datos de empresa, cargo, ni
  ningún aspecto psicológico de los 12 sensibles de la Guía completa.
- Sin cuenta (`auth.users`): el id de la sesión es el único token de acceso
  a su resultado, igual que un link de invitación.
- Cero cruce con `flow_resultados`, con la Guía del Flow completa, ni con
  espiralcrecimiento360 (integración pendiente, ver nota al inicio).
- El PDF y los datos de la sesión pertenecen a la persona que juega; el
  panel de quien comparte el link solo ve lo agregable (nombre, correo,
  pilar más vivo), igual de discreto que lo que ya se decidió para la Guía
  del Flow completa.

---

## 10. Implementación (completa)

1. ✅ Migración `supabase/migrations/0010_flow_pilares.sql` — aplicada
   (2026-09-27) en la base compartida de GuiaDelFlow.
2. ✅ `src/lib/pdf/pilares/` (tipos, esquema, prompt, css, plantilla,
   generar) — calcado de `src/lib/pdf/carta/`.
3. ✅ `src/lib/pilares/contenido.ts` — tarjetas, preguntas y prompts fijos
   del juego.
4. ✅ `src/lib/generacion/pilares.ts` — orquestación (genera, sube a
   Storage, envía correo).
5. ✅ Ruta pública `/pilares/[token]` (landing + los 3 ejercicios, tocar
   para asignar en vez de arrastrar) y `/pilares/resultado/[sesionId]`.
6. ✅ `/api/pilares/generar` y `/api/pilares/descargar/[sesionId]`.
7. ✅ `/panel/pilares` — formulario de link de campaña + tabla de quién ha
   jugado.
8. ⏳ Integración con Espiral de Crecimiento (espiralcrecimiento360) —
   pendiente a propósito, ver nota al inicio del documento.
