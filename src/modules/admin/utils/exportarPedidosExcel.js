import { cargarPedidosRango } from '../../../services/pedidosService';
import { formatearFechaHora, obtenerCodigoPedido, obtenerEstadoPedido } from '../../../shared/utils/pedidos';

export function limitesExportacionPedidos(desde, hasta) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde || '') || !/^\d{4}-\d{2}-\d{2}$/.test(hasta || '') || desde > hasta) {
    throw new Error('Selecciona un rango válido: Desde debe ser anterior o igual a Hasta.');
  }
  const inicio = new Date(`${desde}T00:00:00-05:00`);
  const fin = new Date(`${hasta}T00:00:00-05:00`);
  if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime())) throw new Error('Fechas no válidas.');
  fin.setTime(fin.getTime() + 86400000);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

export function filaPedidoExcel(pedido) {
  return {
    numero: String(obtenerCodigoPedido(pedido)),
    fecha: formatearFechaHora(pedido.created_at),
    cliente: String(pedido.cliente_nombre || pedido.cliente || ''),
    telefono: String(pedido.telefono || ''),
    ubicacion: String(pedido.ubicacion || ''),
    mesa: String(pedido.mesa || ''),
    mesero: String(pedido.mesero || ''),
    detalle: String(pedido.pedido_texto || ''),
    pago: String(pedido.tipo_pago || ''),
    estado: obtenerEstadoPedido(pedido),
    observaciones: String(pedido.observaciones || ''),
    total: Number(pedido.total || 0),
  };
}

export async function crearExcelPedidos(pedidos, desde, hasta) {
  const { default: ExcelJS } = await import('exceljs');
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Pedidos');
  hoja.columns = [
    ['Pedido', 'numero', 15], ['Fecha y hora (Colombia)', 'fecha', 25],
    ['Cliente', 'cliente', 30], ['Teléfono', 'telefono', 20], ['Ubicación', 'ubicacion', 30],
    ['Mesa', 'mesa', 12], ['Mesero', 'mesero', 20], ['Detalle del pedido', 'detalle', 55],
    ['Tipo de pago', 'pago', 20], ['Estado', 'estado', 18], ['Observaciones', 'observaciones', 35], ['Total', 'total', 18],
  ].map(([header, key, width]) => ({ header, key, width }));
  const filas = pedidos.map(filaPedidoExcel);
  hoja.addRows(filas);
  hoja.views = [{ state: 'frozen', ySplit: 1 }];
  hoja.autoFilter = { from: 'A1', to: `L${filas.length + 1}` };
  hoja.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  hoja.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF25734B' } };
  hoja.getColumn('telefono').numFmt = '@';
  hoja.getColumn('mesa').numFmt = '@';
  hoja.getColumn('total').numFmt = '"$" #,##0';
  hoja.getColumn('detalle').alignment = { vertical: 'top', wrapText: true };
  const resumen = libro.addWorksheet('Resumen');
  resumen.addRows([['Desde', desde], ['Hasta', hasta], ['Zona horaria', 'Colombia (UTC−5)'],
    ['Pedidos', filas.length], ['Valor total', filas.reduce((s, f) => s + f.total, 0)],
    ['Alcance', 'Todos los pedidos del rango, excepto borrados, anulados y cancelados.']]);
  resumen.columns = [{ width: 22 }, { width: 75 }];
  return libro.xlsx.writeBuffer();
}

export async function exportarPedidosExcel(desde, hasta) {
  const { inicio, fin } = limitesExportacionPedidos(desde, hasta);
  const resultado = await cargarPedidosRango(inicio, fin, { ascendente: true, paginar: true });
  if (resultado.error) throw resultado.error;
  if (resultado.completo === false) throw new Error('El rango tiene demasiados pedidos. Reduce las fechas para exportar el archivo completo.');
  const pedidos = (resultado.data || []).filter((p) => !['borrado', 'anulado', 'cancelado'].includes(String(p.estado || '').trim().toLowerCase()));
  if (!pedidos.length) throw new Error('No hay pedidos para exportar en ese rango.');
  const buffer = await crearExcelPedidos(pedidos, desde, hasta);
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `pedidos-${desde}-a-${hasta}.xlsx`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return pedidos.length;
}
