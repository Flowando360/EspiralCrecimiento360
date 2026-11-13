# Guía de pruebas paso a paso — Espiral de Crecimiento 360°

Sin claves ni datos reales (el repositorio es público). Se prueba solo en **CONVERGIA**; todo registro que crees lleva el prefijo **PRU**. Última revisión: 2026-11-13.

**Cómo leerla.** Cada prueba trae: *Dónde*, *Pasos*, *Debe pasar* y *Estado* (✅ probado en producción · ⏳ pendiente · ➖ aplazado a propósito). Cuando una prueba responde a una observación de Luisa, aparece como **«Luisa x.y»**: es el número de sección de su *Informe de Pruebas y Anotaciones*.

**Antes de empezar.** Necesitas cuatro sesiones (inicias sesión tú, nunca se escriben claves en el chat ni en archivos): Talento Humano (`admin_th`), líder, colaborador y, si quieres, Gerencia. La de Luisa tiene el rol personalizado «Talento Humano (manual)».

---

## 1. Inicio y Mi Perfil (sesión TH)
1. **Tarjetas del Inicio.** Entra a Inicio. *Debe pasar:* los indicadores críticos se ven más grandes o con color de alerta, y cada índice trae una explicación al pasar el cursor. ✅ (Luisa 2.1 y 2.2)
2. **Recorrido de bienvenida y Gino.** En el primer ingreso aparece el recorrido; el botón redondo de Gino (abajo a la derecha) abre su panel con preguntas sugeridas. Pregúntale «¿qué es la Guía del Flow?». *Debe pasar:* responde con la explicación, no con «No obtuve una respuesta». ✅ (Luisa 2.3 y 4.21)
3. **Alertas.** En el módulo de alertas filtra por categoría; pulsa «Ver todas» y comprueba el botón «Volver al inicio». ✅ (Luisa 2.4)
4. **Nombre convencional.** En el menú, «Encuentro de Crecimiento» muestra al lado «(evaluación de desempeño)». ✅ (Luisa 2.5)
5. **Vincular tu usuario a tu ficha.** Mi Perfil → «Vincular a mi ficha» (sin pedir ayuda a otro administrador). ✅ (Luisa 3.3)
6. **Avatar y gamificación.** ➖ Aplazado (Luisa 3.2).

## 2. Espiral 360° › Colaboradores
1. **Lista.** Filtra por nombre, cargo y «Solo líderes de área». ✅ La exportación a Excel funciona (`/api/colaboradores/exportar`). (Luisa 4.1)
2. **Ficha.** Abre una persona. Las tarjetas traen botón visible («Diligenciar / editar», «Abrir →»). ✅ (Luisa 4.6)
3. **Editar.** Editar → debe ofrecer el campo **Sede**. ✅ (se corrigió el 13-nov)
4. **Hoja de vida.** Diligenciar / editar → agrega estudio y experiencia. «Leer con IA» con un PDF ficticio. ✅ lo manual · ⏳ «Leer con IA» (falta PDF de prueba) (Luisa 4.2: lo cargado en selección ya viaja a la ficha; los **certificados de selección** siguen pendientes)
5. **Periodo de prueba.** Un ingreso reciente debe mostrar la alerta «Evaluar período de prueba antes de confirmar» (la genera el cron diario). ⏳ En Mármoles puede crear varias alertas la primera vez: probar antes solo en CONVERGIA. (Luisa 4.4)
6. **Cargue masivo, tipos de contrato y afiliaciones.** ✅ Las plantillas Excel de colaboradores y de incapacidades descargan; el formulario ofrece «Empleado en misión», «Contrato de aprendizaje», etapas lectiva y productiva y «Pasantía». ADRES/FOSYGA y ASEC ➖ aplazados. (Luisa 4.3, 4.4, 4.5, 4.11)
7. **Dotación desde la ficha.** Abrir → no debe rebotar al Inicio. ✅ (Luisa 4.12)
8. **Exámenes médicos.** Ficha → Exámenes médicos → registra uno periódico. *Debe pasar:* aparece en la lista y se genera la alerta «Renovar examen médico periódico». ✅ El soporte adjunto: ⏳. El líder **no** debe verlos: ⏳ (sesión líder). (Luisa 4.10.3)
9. **Sede y organigrama matricial.** Administración → Organigrama → agrega un líder funcional. *Debe pasar:* la ficha muestra «También reporta a». ✅ (Luisa 4.16)

## 3. El Ser (Guía del Flow) — regla de oro
TH y el líder **nunca** ven la Guía ni la carta: ven un **esquema** sin nota.
1. Ficha → tarjeta Ser → «Ver / completar». *Debe pasar:* 6 grupos de aspectos con descripción, «Cómo aprovecharlo» y «Cómo acompañarle»; solo TH edita. ✅ (Luisa 4.7)
2. Completa un aspecto a mano y guarda. ✅
3. Genera una invitación (enlace) para la persona. ✅
4. **Registro real en la Guía del Flow** con un correo que tenga bandeja: la persona recibe su Guía y carta; a Espiral solo llega el esquema (~22 s). ⏳
5. **Líder:** abre la ficha de su colaborador → ve el esquema en solo lectura, sin botón de editar. ⏳ (sesión líder)
6. **Colaborador:** ve lo mismo que su empresa más su síntesis. ⏳ (sesión colaborador)
7. **Relleno de Guías ya migradas:** primero solo simula; luego `--aplicar --empresa=<uuid> --limite=2` en CONVERGIA. Mármoles **solo con permiso de Diana**. ⏳

## 4. Evaluación (Hacer y Deber)
1. **Ciclos.** Crear ciclo, generar encuentros por equipo, valoración con «Guardar avance» y «Enviar». ✅
2. **Escala 1–5.** Cada nivel trae su descriptor. ✅ (Luisa 4.7)
3. **Competencias por nivel del cargo.** ❌ **Sigue pasando:** el cargo «Auxiliar de Servicios Generales» exige Liderazgo y Capacidad de supervisión, y salen en la oferta, el Saber y la evaluación. Hay que corregir los datos del cargo o filtrar por nivel. (Luisa 4.9)
4. **Cliente interno.** Valoraciones → «Invitar a un cliente interno». *Debe pasar:* queda en el registro de envíos. ✅ (el botón tarda ~10 s sin aviso)
5. **Reabrir valoración** (con motivo) tras un envío. ⏳ (falta una valoración enviada)
6. **Brief.** Abre el Brief: tarjetas, borrador automático, «Mejorar con IA» (10–40 s). ✅
7. **Objetivos concertados.** TH propone → la persona acepta → se cierra. ✅ proponer · ⏳ aceptar y cerrar (lo hace la persona)
8. **Saber.** Compara nivel de formación: una persona sobrecalificada aparece como «supera el requisito». ✅ (Luisa 4.8)
9. **PDI.** Lista y Kanban con filtros por área, líder y estado; exportar a Excel. ✅ (Luisa 4.15)

## 5. Inducción y Formación
1. **Asignar el plan de inducción** a una persona ya creada: botón «Asignar la inducción de su cargo». ✅
2. **La persona confirma** propósito, funciones y riesgos SST (no los marca TH) y responde un quiz. ⏳ (sesión colaborador) (Luisa 4.10.1–4.10.2)
3. **Cursos.** Crear curso, pegar un enlace de YouTube y guardar → aparece «Enlace guardado.». ✅ Subir archivo propio (video o PDF): ⏳ (Luisa 4.18.3)
4. **Cursos encadenados** (curso previo) y **certificado PDF**. ✅ la lógica · ⏳ verlo como colaborador. (Luisa 4.18.2)

## 6. Reclutamiento
1. **Vacante nueva.** Cargo → «Redactar la oferta» con IA o sin ella. ✅ (Luisa 5.1)
2. **Campos** de modalidad, ciudad, horario y beneficios. ✅ (Luisa 5.2.3)
3. **Difusión.** Descarga imagen cuadrada, imagen vertical y QR (deben abrir el formulario público). ✅ (Luisa 5.2.1 y 5.2.2)
4. **Mover candidatos** de etapa con el selector «Mover a…». ✅
5. **WhatsApp** ➖ aplazado (Luisa 5.3).

## 7. Informes
Abre cada uno y prueba los filtros de **área, líder, cargo y antigüedad** (el de ciclo no se hizo a propósito). ✅ (Luisa 6.1)
- **PDI**, **Brechas** (lista «7 de 8 con Guía»), **Formación**, **SST** («Seguimiento…» con cadena de evidencias), **Cultura** (brecha cultural), **Consolidado** (rotación, ausentismo, headcount con período de prueba, barras, PDF y Excel), **Histórico** (línea), **Revisión por la Dirección** (fuente y enlace de cada bloque; eficacia ACPM con denominadores), **Equidad** (mínimo de 5 personas) e **Índice integral**. ✅ (Luisa 6.2–6.9)
- **Áreas duplicadas:** ✅ el selector de área ya no trae variantes de mayúsculas (viene del cargo). Queda una cercana: «Talento Humano» y «Talento Humano y SG-SST». (Luisa 6.4)

## 8. Clima y Cultura
1. **Clima.** Ronda abierta → responde → resultados por dimensión y por área, líder o sede. *Debe pasar:* con menos de 5 respuestas dice «menos de 5 respuestas»; los comentarios los ve solo TH. ✅ (Luisa 4.20)
2. **Ronda completa** (3 afirmaciones por dimensión) con varias personas para ver el alfa por dimensión. ⏳ (hacen falta varios usuarios)
3. **Brecha cultural.** Agrega un comportamiento, abre la encuesta, respóndela («ocurre hoy» / «debería ocurrir»). ✅ (Luisa 6.6)

## 9. Movilidad, Sedes y Equidad
1. **Movilidad interna.** Elige un cargo → «Ver candidatos». ✅
2. **Sedes.** Crear una y asignarla a una persona. ✅ (Luisa 6.6, sedes)
3. **Equidad.** Respeta el mínimo de 5 personas. ✅

## 10. Administración y roles
1. **Roles.** Administración → Roles y permisos: crea o revisa «Talento Humano (manual)». En esa sesión, abrir `/nexa/feed` o `/procesos-gestion` debe devolver al Inicio **si el rol no tiene ese módulo**. Hoy el de Luisa conserva Nexa y Procesos, por eso los ve. ⏳ **Decisión de Diana** (Luisa 7.1–7.4).
2. **Registro de cambios de permisos** (log de auditoría): ➖ no hecho (Luisa 7.4).
3. **Prueba con sesión de líder y de colaborador.** ⏳ (Luisa 7.2 y 7.4: «prueba de experiencia con un perfil base»).

## 11. Nexa, Procesos y Gino
1. **Feed.** Publica un anuncio con «Avisar por correo»; el correo debe llegar. ⏳ (cuidado con el tope diario de Resend gratuito) (Luisa 8.1)
2. **Ludo, Mi cuaderno, Directorio de aliados** (con calificación por aliado). Abrir y revisar. ✅ abren sin error (Luisa 8.2–8.4)
3. **Procesos y Cumplimiento.** ✅ Simulacro con acta, hallazgos y evidencias; «Crear acción en ACPM» creó ACPM-007 vinculado. FODA con «Priorizar con IA» y estrategias FO/FA/DO/DA. Plan de trabajo, Matriz legal e importar desde Excel abren sin error. (Luisa 9.1–9.4)

## 12. Lo que sigue pendiente de decidir
Roles de Luisa · si las 18 afirmaciones del clima se quedan · el Ser en movilidad interna · clientes internos externos con enlace · «Talento único» visible · dónde guardar `CLAUDE.local.md` · borrar `_t.ts` de la raíz · limpieza de los registros PRU (sede, líder funcional, examen, inducción de PRU Laura, curso, encuesta de cultura, objetivo, aspecto «PRU Constancia y criterio propio», invitación de cliente interno).

## 13. Orden recomendado para la próxima sesión
1. Sesión **líder** (punto 3.5, exámenes médicos, objetivos). 2. Sesión **colaborador** (3.6, inducción, curso, aceptar objetivo). 3. Registro real en la Guía con un correo con bandeja. 4. Ronda de clima completa con varios usuarios. 5. Procesos (punto 11.3). 6. Pasada final de ayuda y de la guía pública `/guia-lider-th`.

## 14. Recorrido completo como Talento Humano (2026-11-13, noche)
Secuencia que sigue un líder de TH, hecha de punta a punta en CONVERGIA con una persona PRU:
1. **Vacante** con «Redactar desde el perfil del cargo» → creada (con modalidad, ciudad, horario y contrato). ⚠️ El borrador copia el manual de funciones tal cual al aviso público, incluida una frase que no debería publicarse («debe solicitar ayuda de un hombre de la planta…») y las competencias de liderazgo. Conviene resumir el objetivo del cargo en la oferta.
2. **Postulación pública** (formulario con autorizaciones) → la candidata aparece en «Postulados».
3. **Tablero:** Postulados → Filtrados → «Enviar al líder» (queda «En evaluación del líder») → En entrevista → Contratar. El panel «Evaluación por el líder» se actualiza a los pocos segundos.
4. **Contratación** crea el colaborador con los datos del candidato y le asigna 77 puntos de inducción.
5. **Ficha:** hoja de vida (formación y certificación), Saber (un título profesional frente a «Bachillerato» sale como «supera el requisito», no incumplimiento ✅ Luisa 4.8), incapacidad, fecha especial, examen médico, salario, afiliaciones y certificado laboral PDF (200) ✅.
6. **Guía del Flow:** invitación generada ✅ (el registro real sigue pendiente de un correo con bandeja).
7. **Ciclo:** «Un colaborador» generó el Encuentro de Crecimiento ✅. El resultado muestra «Resultado incompleto» y un índice de 1.33 «Bajo» solo con el Saber: confunde para alguien recién contratado; conviene no etiquetarlo «Bajo» sin Hacer ni Deber.
8. **Informes:** Brechas, Consolidado (corregido: el total de activos ahora dice cuántos más están en período de prueba ✅ Luisa 4.13 y 6.7.2) y los 14 Excel responden.
9. **Salida:** entrevista de salida guardada ✅.
10. **Procesos:** simulacro → hallazgo → ACPM-007 ✅; FODA con IA ✅.
Esta tanda no incluye lo que solo hacen otras personas (autoevaluación, valoración de líder y pares, aceptar objetivos, quiz de inducción) ni las vistas de líder y colaborador.
