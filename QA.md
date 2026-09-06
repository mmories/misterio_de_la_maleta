# Validación de la demo

## Comprobado

- JavaScript: comprobación sintáctica de los tres módulos principales.
- Pruebas de integración ejecutando las funciones reales del juego con adaptadores de DOM/audio: 135 combinaciones de los nueve verbos y quince hotspots; todas completan su respuesta o abren las opciones de diálogo previstas.
- Navegación: 225 pares de destinos alcanzables dentro de la zona caminable, evitando mobiliario y el espacio de Prim.
- Secuencia: ascensor sin llave bloqueado; bienvenida; habitación asignada; entrega única de llave; relectura de estado; coger Marca sin duplicarlo; devolverlo; combinación de maleta con Prim; final con llave.
- Chrome, mediante interacción real: carga de recursos, pantalla inicial, cinemática hasta recepción, salto de intro, caminar, doble clic, bienvenida, opciones, entrega de llave, portada de Marca, inventario, acariciar a Prim, ascensor bloqueado y desbloqueado, pantalla de final y botones de música/sonido.
- Revisión visual de título, recepción, sprites recortados, interfaz, portada y final.

## Límites de las pruebas

No se ha verificado en navegadores reales Firefox, Edge ni Safari, ni en una tablet física. El diseño tiene reglas responsivas y controles táctiles, pero esa compatibilidad requiere validación adicional. Los tests con adaptadores no sustituyen las pruebas de sonido percibido ni la inspección visual; verifican secuencias y terminación de acciones.

## Repetir

```bash
npm run check
node tests/game-flow.mjs
```
