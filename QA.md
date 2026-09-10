# Validación de la demo

## Comprobado

- JavaScript: comprobación sintáctica de los cinco módulos publicados.
- Pruebas de integración ejecutando las funciones reales del juego con adaptadores de DOM/audio: 150 combinaciones de los seis verbos y veinticinco hotspots; todas completan su respuesta o abren las opciones de diálogo previstas.
- Navegación: 625 pares de destinos alcanzables dentro de la zona caminable, evitando mobiliario y el espacio de Prim.
- El ascensor permanece bloqueado hasta conseguir la llave, el paquete de tabaco, la carta de Empi escondida bajo el felpudo y el reglamento de convivencia que lanza Pedro.
- Secuencia: ascensor sin llave y sin tabaco bloqueado; bienvenida; habitación asignada; entrega única de llave; sofá y paquete de tabaco; coger Marca sin duplicarlo; devolverlo; combinación de maleta con Prim; final con ambos requisitos.
- Carta de Empi: el felpudo es alcanzable, la carta se recoge una sola vez, entra en el inventario y puede releerse.
- Chrome, mediante interacción real: carga de recursos, pantalla inicial, cinemática hasta recepción, salto de intro, caminar, doble clic, bienvenida, opciones, entrega de llave, portada de Marca, inventario, acariciar a Prim, ascensor bloqueado y desbloqueado, pantalla de final y botones de música/sonido.
- Revisión visual de título, recepción, sprites recortados, interfaz, portada y final.
- Perspectiva comprobada: Julito crece de forma monotónica al acercarse a cámara y los índices permanecen dentro del ciclo de ocho fases.
- Audio procedural comprobado con un contexto simulado: tres temas, efectos, controles y fanfarria original del Logroñés se programan sin errores.

## Límites de las pruebas

No se ha verificado en navegadores reales Firefox, Edge ni Safari, ni en una tablet física. El diseño tiene reglas responsivas y controles táctiles, pero esa compatibilidad requiere validación adicional. Los tests con adaptadores no sustituyen las pruebas de sonido percibido ni la inspección visual; verifican secuencias y terminación de acciones.

## Repetir

```bash
npm run check
node tests/game-flow.mjs
node tests/audio-engine.mjs
```

## Validación de la revisión de recepción

Ejecutadas en esta revisión las pruebas de `game-flow.mjs`, `save-hints.mjs` y `audio-engine.mjs`, además de comprobación sintáctica:

- 150 combinaciones de verbos y objetos y 625 pares de navegación.
- Recuperación real del estado del juego después del final, conservando objetos, mote y conversaciones.
- Pista de Prim sin recoger automáticamente la carta; recogida y guardado posterior.
- Recompensa del 100% y persistencia de su desbloqueo.
- Guardados corruptos, versión desconocida, campos de tipo incorrecto, almacenamiento bloqueado y cuota agotada.
- Tres niveles de pistas, cambio de objetivo y persistencia de las ayudas pedidas.

La revisión actual no se ha validado visualmente en un navegador: la descarga del navegador de pruebas no estuvo disponible. Las comprobaciones anteriores de Chrome descritas arriba corresponden a la versión anterior. Queda pendiente verificar el encuadre de los nuevos botones y las pausas de animación en escritorio y móvil.

## Integración de las ramas

Comprobados mediante funciones reales con adaptadores DOM/audio:

- Cambiar y cancelar un mote desde Pedro, seguir conversando y conservar la llave 310.
- Insertar el mote antes de empezar a escribir un diálogo.
- Mantener pendiente la recompensa tras 30 segundos de diálogo y mientras la mochila está abierta; entregar después la llave una sola vez y recuperarla al continuar.
- Reconocer una partida al terminar la carga, sin depender de los antiguos plazos de 300/1200 ms.
- Migrar ambas claves de guardado anteriores y recuperar pistas, nombres personalizados, llave maestra y progreso; prioridad del guardado unificado.
- Editor real de mote con adaptador DOM: aceptar, cancelar con Escape, opciones predefinidas, entrada vacía y texto con comillas sin interpolarlo en HTML.

No se ha realizado una nueva verificación visual en navegador.


## Julito: movimiento natural

- Base: develop 18a5d6e; cambios restringidos a navegación, animación y composición de Julito.
- PASS: 150 combinaciones verbo/hotspot y 625 pares de aproximación; guardado, motes, recompensas y final.
- PASS: 653 destinos adicionales de suelo, colisión de cada segmento, orientación estable, esquinas sin pausa, doble clic, llegada y pasos equivalentes a 30/144 Hz.
- PASS: renderizado con las funciones reales del juego y Canvas en seis posiciones: suelo central, conserjería/Prim, planta, ascensor, mesa y agachado. Inspección visual de escala, ancla y ocultación.
- Pendiente: prueba manual de entrada táctil y reproducción de animaciones en navegadores reales. El entorno no dispone de Chromium y su descarga no estuvo disponible; la comprobación Canvas no sustituye esta prueba.
- Arte: reutilizado. Ocho orientaciones lógicas no equivalen a ocho vistas dibujadas. No se han generado hojas isométricas nuevas.

## Puesta en escena de intro y Maria

Titulo superpuesto al exterior y fundido breve a la llegada del coche; pausas revisadas y cancelacion protegida antes de toda aparicion de Julito. Maria tiene punto de aproximacion propio (714,382), orientacion final de Julito hacia ella, inclinacion de atencion y gesto de habla. Su nombre aparece en conversaciones posteriores; el progreso se registra tras terminar la presentacion. Sin cambios en textos de dialogos ni en puzles.

PASS: 9 puntos de cancelacion de intro, punto final de Maria, liberacion de interaccion, 150 combinaciones verbo/objeto, 625 pares de hotspots y 657 destinos de suelo. Pendiente prueba manual de transiciones y conversacion en navegador real.
