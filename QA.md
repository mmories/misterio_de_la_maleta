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
