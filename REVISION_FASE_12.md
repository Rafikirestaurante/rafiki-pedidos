# Rafiki Pedidos - Fase 12

## Objetivo
Mejorar el rendimiento inicial de la aplicación después de la fragmentación de código de la Fase 11.

## Cambios realizados
- Se implementó carga diferida con `React.lazy` para módulos pesados:
  - Panel Mesas
  - Solicitud de Insumos
  - Generador de Menú
  - Sección Rafa
- Se agregó `Suspense` con mensajes de carga claros para que la aplicación no quede en blanco mientras abre una sección.
- Se mantiene el flujo actual de cliente, mesas, administración, insumos, generador y Rafa sin cambiar lógica operativa.

## Resultado técnico
- Antes: el build generaba un archivo principal de aproximadamente 543 KB y advertencia por chunk grande.
- Después: el archivo principal bajó a aproximadamente 463 KB y los paneles pesados quedaron separados en archivos independientes.
- Build probado correctamente con `npm run build`.

## Pruebas recomendadas
1. Abrir `/` y crear un pedido cliente.
2. Abrir `/mesas` y enviar un pedido desde mesa.
3. Entrar a `/admin` y revisar:
   - Pedidos de hoy
   - Editar menú diario
   - Solicitud de insumos
   - Generador de menú
   - Rafa
4. Confirmar que las secciones cargan normalmente y que no aparece pantalla en blanco.
