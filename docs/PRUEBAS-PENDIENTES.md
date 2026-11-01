# Pruebas exhaustivas — estado y pendientes

Reglas: se prueba solo en **CONVERGIA**; todo registro de prueba lleva el prefijo **PRU**; Mármoles recibirá datos reales después de comprobar que todo está OK.

## Módulos
| Módulo | Estado |
|---|---|
| Espiral 360° (ficha, hoja de vida, Saber, Ser, ciclos, evaluaciones, PDI, organigrama, indicadores) | Probado y corregido (publicado en `main`) |
| Reclutamiento | Probado y corregido (publicado en `main`) |
| Nexa, Procesos y Cumplimiento, Informes, Administración, Dotación, Proveedor | Pendiente |

## Decisiones tuyas pendientes (dejar así por ahora)
1. **Registros PRU** creados en CONVERGIA (siguen en la base): cargo "PRU Analista de Nómina", colaboradores "PRU Laura Gómez", "PRU Líder Área Administrativa" y "PRU Carlos Pérez" (inactivo), ciclo "PRU 2026 - Semestre 2", PDI, historial, incapacidad y fecha especial de Laura. Usuarios de acceso: pru.admin, pru.lider, pru.colaborador, pru.gerencia, pru.auditor, pru.proveedor (contraseña de pruebas en la sesión). Mientras existan, la autoevaluación de Laura (notas altas) cuenta en los indicadores de CONVERGIA.
2. **Texto de Mármoles dentro de CONVERGIA:** 2 puntos de inducción (`induccion_items`) mencionan "piedra natural".
3. **Habilidades duplicadas:** el cargo no impide repetir una habilidad con el mismo nombre (mejora opcional).
4. **Migración 0107** (índice único de `respuestas_evaluacion`): ya aplicada en Supabase.

## Registros PRU adicionales (Reclutamiento)
Vacante "PRU Analista de Nómina — convocatoria" (cubierta), candidatos "PRU Ana Candidata" y "PRU Pedro Candidato" (ambos contratados y ya creados como colaboradores), entrevista, referencia "PRU Jefe Anterior" y una solicitud de supresión de datos (marcada atendida).

## Decisión tuya pendiente (Reclutamiento)
- **Supresión de datos del titular:** hoy "Marcar atendida" solo registra la respuesta; **no borra** los datos del candidato. Define si debe suprimirse automáticamente o seguir siendo un paso manual de TH.

## Hallazgos corregidos en Reclutamiento
- Evaluadores: solo líderes con usuario de acceso (antes se ofrecía a cualquiera, que luego no veía al candidato).
- Aviso dentro del aplicativo al líder cuando se le envía un candidato.
- Selector "Mover a…" en cada tarjeta (el arrastre fallaba entre 7 columnas y en celular); no se puede pasar a "En evaluación del líder" sin asignar líder.
- Contratación: el alta del colaborador trae el documento y la hoja de vida del candidato.
- Enlace público: ya no queda en caché cuando la vacante se cubre o se cierra.
- Roles sin permiso vuelven al inicio en vez de ver una pantalla en blanco.

## Hallazgos corregidos en Espiral 360°
- Crear cargo desde cero; manual de funciones visible en la ficha.
- Guardado de evaluaciones (índice parcial) y aviso de errores.
- Índices/semáforo/brecha leídos como objeto (salían "Sin datos").
- Checklist de Saber generado desde cargo + hoja de vida.
- PDI manual con brechas sugeridas.
- Ingreso en historial e inducción asignada al dar de alta; la colaboradora ve a su líder.

## Cómo se prueba (para repetirlo)
Servidor local con puente a Supabase (el proxy de la nube no deja salir al servidor Next), Playwright con usuarios PRU por rol. Variables de entorno de Supabase configuradas en el entorno de la sesión.
