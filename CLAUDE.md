# Espiral de Crecimiento 360° — memoria del proyecto para Claude

Lee este archivo completo al empezar cualquier sesión (nube o PowerShell). Si algo de aquí contradice lo que te pide Diana ahora, manda lo que ella diga.

@docs/CONTEXTO-APLICATIVO.md
@docs/PRUEBAS-PENDIENTES.md

## Con quién hablas y cómo
- La usuaria es **Diana**, dueña del producto en FlowAndo. Es tu compañera de trabajo: **tutéala siempre** y responde en **español**.
- Explica en lenguaje claro, sin jerga, con pasos concretos de dónde pulsar. Si dudas, resume primero lo que vas a hacer.
- No pidas permiso para lo que ya está autorizado abajo. Sí pregunta antes de acciones destructivas o que toquen datos reales de Mármoles.

## Qué es el aplicativo (en una frase)
Plataforma multiempresa de Talento Humano: ficha 360° de cada persona (Ser · Saber · Hacer · Deber), reclutamiento, evaluación de desempeño, planes de desarrollo, Nexa (cultura y formación), procesos y cumplimiento, informes y administración.

## Reglas que no se rompen
1. **El repositorio es PÚBLICO.** Nunca guardes en él claves, tokens, contraseñas, correos personales ni datos reales de personas. Los archivos temporales con identificadores (`scripts/migracion-circulo/f3_*.json`) están ignorados: no los subas.
2. **CONVERGIA es la empresa de pruebas** (datos ficticios). Ahí se prueba todo. Lo que funcione en CONVERGIA debe funcionar para cualquier empresa nueva.
3. **Mármoles y Servicios es la empresa real.** No muestres sus datos personales en el chat. No crees cuentas ni registros de prueba en Mármoles sin permiso expreso de Diana.
4. **Registros de prueba que crees tú llevan el prefijo "PRU"** (nombres, cargos, vacantes, ciclos…). Las personas humanas que prueban en CONVERGIA no necesitan prefijo.
5. **Aislamiento multiempresa:** nada de una empresa debe verse en otra. Toda carga de datos va a una sola empresa (`empresa_id`).
6. **Sin planes de pago por ahora:** Supabase gratuito y Vercel Hobby, mientras se afina el producto y se vende. Hazlo notar si algo choca con esos límites (60 s por función, sin respaldos).
7. **Nunca** pegues claves en el chat ni las escribas en archivos del repositorio. Se leen de variables de entorno.

## Cómo se trabaja y se publica
- Rama de trabajo de la sesión + **commits en español**. No abras pull requests si Diana no lo pide.
- Se publica **fusionando a `main`** (Vercel despliega solo desde `main`). Antes: `npx tsc --noEmit` limpio y `npm run build` correcto.
- Prueba como lo haría una persona: Playwright, entrando con cada rol, pantalla por pantalla. Arregla lo que encuentres en el mismo turno, con commit.
- Cuando cambies una función, **actualiza también el manual en línea** (`src/content/ayuda/*`) y, si aplica, la guía pública (`public/guia-lider-th/`).
- Escribir en el almacén de secretos de Vercel o crear cuentas con privilegios requiere que Diana lo autorice con palabras explícitas en el chat; si el sistema de permisos lo bloquea, detente y pídeselo.
- Cada sesión nueva arranca de `main`: lo que no esté en `main` no existe para ella. **Antes de terminar, deja subido a `main` lo que deba recordarse** (notas en `docs/`).

## Qué hacer al terminar una tarea importante
Actualiza `docs/PRUEBAS-PENDIENTES.md` (estado, decisiones, pendientes) y, si cambió la arquitectura, `docs/CONTEXTO-APLICATIVO.md`. Así la próxima sesión, en la nube o en PowerShell, sabe dónde quedamos.

## Si estás en PowerShell (computador de Diana)
```powershell
git clone https://github.com/Flowando360/EspiralCrecimiento360
cd EspiralCrecimiento360
npm ci
# Crea el archivo .env.local (NO se sube) con las variables de docs/CONTEXTO-APLICATIVO.md → "Variables de entorno"
npm run dev        # http://localhost:3000
claude             # abre Claude Code en esta carpeta: leerá este archivo solo
```
En el computador de Diana el servidor habla directo con Supabase (no hace falta el "puente" que se usó en la nube).
