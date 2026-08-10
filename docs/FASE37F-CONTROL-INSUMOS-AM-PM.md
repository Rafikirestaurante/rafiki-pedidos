# Fase 37F — Control de solicitudes de insumos por jornada

Versión: `127.18-FASE37F-CONTROL-INSUMOS-AM-PM-2026-08-05`

## Objetivo

Permitir que un mismo insumo pueda solicitarse máximo dos veces en el día: una vez durante la jornada AM y otra vez durante la jornada PM, evitando duplicados accidentales dentro de la misma jornada.

## Comportamiento

- Si el insumo ya fue solicitado en la jornada actual, Rafiki muestra una alerta modal de una sola acción, lo excluye de la nueva solicitud y continúa con los productos no repetidos.
- Si el insumo fue solicitado en la jornada contraria, Rafiki muestra una confirmación con **Continuar** y **Cancelar**. Al continuar, se permite la segunda solicitud del día.
- Si todos los productos seleccionados ya estaban registrados en la jornada actual, no se crea un registro vacío ni se abre WhatsApp.
- El mensaje de WhatsApp y el registro de Supabase se reconstruyen únicamente con los productos permitidos.

La validación consulta las solicitudes del día guardadas en Supabase y utiliza los metadatos `jornadaSolicitud` y `horaSolicitud` existentes dentro del JSON `insumos`. No requiere migración SQL.
