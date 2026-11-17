# 12horas · tienda online de demostración

Tienda de relojes y joyas programada desde cero. La portada abre con un reloj automático en 3D que se desmonta pieza a pieza al hacer scroll y se vuelve a montar. Después montas tu propio reloj (caja, esfera, correa y tamaño) y lo ves cambiar en directo marcando la hora real; le das la vuelta para grabar un mensaje en la tapa trasera y el precio se recalcula al momento. Incluye un medidor de talla de anillo que funciona con un hilo o con la propia pantalla.

**Verla publicada:** https://12horas.dania360.com/

## Cómo está hecha
- HTML, CSS y JavaScript propios, sin framework
- Portada con un reloj automático en 3D hecho con [three.js](https://threejs.org/) y construido por código pieza a pieza (`js/despiece.js`), sin modelos descargados: cristal, bisel, agujas, esfera, disco de fecha, caja, platina, tren de rodaje, volante con espiral, puentes con rubíes, masa oscilante y tapa
- El scroll separa las piezas en capas, con su nombre sobre cada una, y las vuelve a montar; mientras, el mecanismo sigue en marcha y las agujas dan la hora real
- En móvil el despiece se ordena en vertical; si el dispositivo no admite 3D, se muestra el reloj dibujado en SVG
- El reloj del configurador es un modelo 3D construido por código (`js/reloj3d.js`): cada una de las 120 combinaciones se monta al momento, con caja torneada, cristal abombado, esfera con índices aplicados y correas de cuero cosido, malla de acero o caucho con su textura y relieve
- Se arrastra para girarlo y al darle la vuelta se ve la tapa con el grabado, que se escribe mientras tecleas
- Las miniaturas del carrito y del catálogo se dibujan en SVG (`js/reloj.js`), que también sirve de respaldo si el dispositivo no admite 3D
- Las agujas marcan la hora real del visitante y la ventana de la fecha muestra el día de hoy
- Giro en 3D con CSS para ver la tapa trasera con el grabado, que se escribe mientras tecleas
- El reloj se inclina siguiendo el ratón
- Medidor de talla de anillo: con un hilo, o calibrando la pantalla con una moneda de 1 € y midiendo un anillo
- Tienda de una sola página con rutas `#/`, catálogo, favoritos y buscador
- Carrito con miniatura del reloj tal y como se diseñó y pago de demostración en tres pasos
- Código de descuento BIENVENIDA10 en el carrito y sugerencia del estuche de viaje
- Preguntas frecuentes desplegables en la portada
- Respeta a quien pide menos animación en su dispositivo
- Alojada en Vercel

## Verla en local
```
python -m http.server 8000
```
y abre http://localhost:8000/

## Sobre esta tienda
Diseño y desarrollo de [Dania360](https://dania360.com). Es una tienda de ejemplo: la marca y los productos son inventados, las fotos se crearon para la marca, el pago no cobra nada y la web no se indexa en buscadores (`noindex`). El código se publica para enseñar cómo está hecha; no tiene licencia de uso.

Más tiendas en el portafolio: https://tiendas.dania360.com
