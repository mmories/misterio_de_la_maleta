# El misterio de la maleta marrón

Demo de aventura gráfica point-and-click. Bilbao, octubre de 1994. Idea y personajes de Mario.

## Jugar

La carpeta `dist/` es la versión completa lista para publicar; no necesita compilación, servidor de aplicación, base de datos ni servicios externos.

Con Python 3:

```bash
python -m http.server 8080 --directory dist
```

Abrir `http://localhost:8080`.

Para desarrollo con recarga automática, con Node.js 22 o superior:

```bash
npm ci
npm run dev
```

No abrir `index.html` directamente mediante `file://`: los módulos JavaScript requieren un servidor HTTP.

## Contenido

- Pantalla de título, créditos y ayuda.
- Cinemática en plano fijo: Passat Variant gris detenido, motor que se apaga y aparición de Julito con su maleta.
- Recepción basada en el último fondo aportado, con periódicos adaptados.
- Pedro, diálogo ramificado, llave 310 y pista de la maleta.
- Prim, pastor alemán residente en recepción: mirar, hablar, acariciar (`USAR Prim`) y mostrar la maleta.
- Veinticinco zonas interactivas y seis verbos contextuales. `USAR` abre, cierra o activa cada objeto según corresponda.
- Periódicos independientes: El Correo, El Mundo, ABC y Marca.
- Inventario y combinaciones de objetos con personajes o escenario.
- Felpudo interactivo con una carta de Empi para la habitación 310, conservada en el inventario como pista para el misterio.
- Conversación opcional con Pedro sobre los motes de los nuevos, incluido «Topo».
- Introducción de misión y medidor de exploración por carteles, usos, diálogos y objetos.
- Ascensor bloqueado narrativamente hasta conseguir la llave y encontrar el paquete de tabaco.
- Menú de escenas con contraseña progresiva; la siguiente escena se desbloquea con `POTELE`.
- Julito con aceleración y frenado progresivos, perspectiva por profundidad, ocho fases laterales coherentes, balance corporal y maleta estable en la misma mano.
- Pedro y Prim con ciclos de reposo de duración irregular, respiración, miradas y reacciones menos mecánicas.
- Créditos animados con desplazamiento, profundidad y acabado VGA.
- Música sintética original y efectos generados con Web Audio: tres ambientes, progresiones de ocho compases, cuatro variaciones de frase y una fanfarria futbolera original cuando aparece el gag del Logroñés.

La duración depende de la exploración y lectura. El recorrido mínimo es corto; leer las conversaciones y examinar el vestíbulo está pensado para unos 5–10 minutos.

## Controles

- El inventario se abre en una pantalla independiente desde **ABRIR MOCHILA** o con la tecla **I**. En móvil ocupa toda la pantalla para que los objetos sean fáciles de tocar.

Seleccionar verbo y objeto. El personaje camina antes de actuar. Pulsar sobre el suelo para caminar; doble clic acelera el movimiento. Espacio o el botón Objetos muestra las zonas interactivas. Pulsar el diálogo revela el texto; pulsar de nuevo avanza. Enter también avanza. Esc salta la introducción, cierra una portada o abandona las opciones de conversación. `USAR` o `DAR` + objeto de inventario + destino forma una combinación. Los periódicos pueden devolverse usando el periódico del inventario con la mesa de periódicos.

El clic inicial desbloquea audio. Música y efectos tienen controles independientes. No hay voces grabadas. La contraseña de escena obtenida al final puede reutilizarse desde el menú `ESCENAS`.

## Arquitectura

- `dist/index.html`: estructura y controles accesibles.
- `dist/style.css`: presentación, consola y adaptación a pantallas pequeñas.
- `dist/game.js`: dirección de escenas, composición, diálogo e interacciones.
- `dist/animation.js`: perspectiva, aceleración, selección de fotogramas y movimiento secundario.
- `dist/content.js`: objetivos, métricas de misión y metadatos de contenido.
- `dist/data.js`: verbos, hotspots, diálogos, estado inicial y navegación mediante grafo de visibilidad.
- `dist/audio.js`: secuenciador dinámico, fanfarria original y efectos.
- `dist/assets/`: todos los gráficos locales.
- `vite.config.js`: servidor de desarrollo; no interviene en la versión publicada.

El lienzo usa coordenadas 960 × 600 y escalado sin suavizado. La composición de escena más consola aproxima el formato clásico 4:3. Los fondos de alta resolución conservan el pixel art suministrado; no se aplica una conversión destructiva a 320 × 200. Las hojas de sprites se recortan y se elimina el fondo claro por relleno desde los bordes en tiempo de carga, preservando los contornos de los personajes.

Los hotspots declaran rectángulo visible y punto de aproximación. El grafo de visibilidad comprueba segmentos dentro de una zona caminable para evitar muebles. Para cambiar de fondo, revisar los rectángulos, puntos y zona caminable de `data.js` y las máscaras del mostrador de `game.js`.

## Publicar gratis

La salida es compatible con cualquier alojamiento estático. Una opción sencilla es GitHub Pages:

1. Crear un repositorio propio.
2. Subir **el contenido de `dist/`** a la raíz de la rama principal.
3. En Settings → Pages, elegir desplegar desde esa rama y carpeta raíz.
4. Abrir la dirección que GitHub indique.

No se necesitan secretos ni configuración del juego. Todos los enlaces de recursos son relativos, de modo que también funciona alojado bajo un subdirectorio. En otros proveedores estáticos, usar `dist` como directorio de publicación y dejar vacío el comando de build.

La publicación de esta entrega en Sites se realiza por separado. Su acceso inicial es privado; para enviar la demo a otras personas debe ampliarse el acceso o publicarse `dist/` en un alojamiento propio.

## Assets

| Archivo | Procedencia / uso |
|---|---|
| exterior.png | Fondo del edificio aportado por Mario |
| reception.png | Última recepción aportada por Mario; edición limitada a cuatro periódicos |
| julito-walk.png | Hoja `sprite julito 1.png`, aportada por Mario; apoyo frontal y trasero |
| julito-walk-v3.png | Hoja de ocho fases laterales, recortada con alfa y usada para el movimiento fluido |
| julito-actions.png | Hoja `sprites julito 2.png`, aportada por Mario; gestos y objetos |
| pedro-actions.png | Hoja `sprite pedro 1.png`, aportada por Mario; recepción, conversación y llaves |
| pedro-walk.png | Hoja `sprties pedro 2.png`, aportada por Mario; conservada para ampliaciones |
| passat.png | Sprite creado para la demo: Passat Variant B3 gris |
| prim.png | Sprite original de Prim en reposo y alerta |
| prim-idle-v2.png | Hoja animada de ocho fotogramas para respiración y reacción de Prim |
| pedro-idle-v2.png | Hoja animada de ocho fotogramas para respiración, parpadeo, llaves y cambios de peso |

El gag de «La Fábrica» sigue el guion solicitado. No se emplea música ni arte extraído de Monkey Island. La fanfarria del Logroñés es una composición procedural original y no una copia de una grabación o melodía comercial.

## Siguiente episodio

1. Tercera planta, pasillo y habitación 310.
2. Ampliar el puzle de la maleta a partir de la pista de Prim en recepción.
3. Otros colegiales, tablón de actividades y comedor.
4. Opciones de velocidad de texto y nuevas ranuras de guardado.
5. Más fotogramas de puertas, coche y acciones de mobiliario.
6. Comprobar manualmente Firefox, Edge, Safari y dispositivos táctiles reales.

## Recepción revisada

- Partida automática versionada en el navegador: inventario, mote, conversaciones, exploración y pistas. `CONTINUAR` devuelve a recepción incluso después del final. Una nueva partida pide confirmación antes de sustituir el progreso al llegar a recepción.
- `PISTAS` ofrece tres niveles por objetivo y, después, orienta hacia lo pendiente del 100%. No penaliza al jugador.
- Acariciar a Prim permite seguir su interés por el felpudo. La carta sigue siendo accesible sin esa ayuda.
- Pedro reconoce la maleta al presentarse. El final retoma ese detalle; completar el 100% desbloquea una confidencia adicional. `SEGUIR EXPLORANDO` permite completar lo pendiente sin reiniciar.
- Las poses de recogida tienen una pausa visible; el fondo actualizado se carga junto al resto de recursos y comunica los fallos de carga.
- `dist/` es la única implementación activa. El `index.html` de la raíz redirige a `dist/index.html`; los antiguos módulos de la raíz se han retirado. Los originales de `assets/` se conservan como material fuente.

El guardado es local a este navegador y origen: no se comparte entre dispositivos. Si el navegador impide guardar, el juego avisa y permite seguir jugando en la pestaña.

## Versión unificada

`feature/mote-jugador` integra los cambios de esa rama y de `feat/mejoras-recepcion-v2`. El juego tiene una sola entrada (`dist/index.html`), un único estado y un guardado versionado.

- Pedro permite cambiar el mote durante la conversación, con tres opciones o texto libre de hasta 18 caracteres. Aplicar o cancelar conserva el menú y el progreso.
- Los retoques de María, Fortuna y Raúl están integrados en los diálogos originales antes de la animación de texto. Ya no se sustituyen textos con temporizadores.
- El 100% entrega la llave maestra, visible y examinable en la mochila. La entrega espera a que termine la interacción y no caduca. Además, Pedro cuenta su confidencia al subir. La llave queda reservada para las próximas escenas y no evita los requisitos del ascensor.
- El botón CONTINUAR se habilita al terminar de cargar los recursos.
- Se recuperan los guardados de ambas ramas en el mismo navegador y origen. Se conservan mote libre, objetos, conversaciones y pistas. El guardado unificado tiene prioridad; si no existe, se recupera el guardado anterior válido más reciente cuando hay fecha. No se borran los originales al migrar. Las partidas guardadas en GitHub Pages y Sites pertenecen a orígenes distintos y no se transfieren entre ellos.

`npm test` incluye las regresiones del mote, las dos migraciones y el premio pendiente tras una lectura prolongada.
