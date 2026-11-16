# 12horas · tienda online de demostración

Tienda de relojes y joyas programada desde cero. En la portada montas tu propio reloj (caja, esfera, correa y tamaño) y lo ves cambiar en directo marcando la hora real; le das la vuelta para grabar un mensaje en la tapa trasera y el precio se recalcula al momento. Incluye un medidor de talla de anillo que funciona con un hilo o con la propia pantalla.

**Verla publicada:** https://12horas.dania360.com/

## Cómo está hecha
- HTML, CSS y JavaScript propios, sin framework ni librerías externas
- El reloj está dibujado por código en SVG (`js/reloj.js`): cada una de las 120 combinaciones se genera al momento, sin fotos
- Las agujas marcan la hora real del visitante y la ventana de la fecha muestra el día de hoy
- Giro en 3D con CSS para ver la tapa trasera con el grabado, que se escribe mientras tecleas
- El reloj se inclina siguiendo el ratón
- Medidor de talla de anillo: con un hilo, o calibrando la pantalla con una moneda de 1 € y midiendo un anillo
- Tienda de una sola página con rutas `#/`, catálogo, favoritos y buscador
- Carrito con miniatura del reloj tal y como se diseñó y pago de demostración en tres pasos
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
