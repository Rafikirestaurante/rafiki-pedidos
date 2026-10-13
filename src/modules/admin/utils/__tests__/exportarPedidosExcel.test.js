import { describe, expect, it, vi } from 'vitest';
vi.mock('../../../../services/pedidosService', () => ({ cargarPedidosRango: vi.fn() }));
import ExcelJS from 'exceljs';
import { crearExcelPedidos, limitesExportacionPedidos } from '../exportarPedidosExcel';

describe('Excel de pedidos', () => {
  it('incluye ambos días completos en horario Colombia', () => {
    expect(limitesExportacionPedidos('2026-10-12', '2026-10-13')).toEqual({
      inicio: '2026-10-12T05:00:00.000Z', fin: '2026-10-14T05:00:00.000Z',
    });
    expect(() => limitesExportacionPedidos('2026-10-13', '2026-10-12')).toThrow();
    expect(() => limitesExportacionPedidos('', '2026-10-12')).toThrow();
  });
  it('genera XLSX real con mesa, mesero y datos del cliente separados', async () => {
    const buffer = await crearExcelPedidos([{ numero_pedido: 123, created_at: '2026-10-12T18:00:00Z',
      cliente_nombre: '=Cliente', telefono: '003001234567', ubicacion: 'Oficina 707', mesa: '1A', mesero: 'Rafa',
      pedido_texto: '2 almuerzos', tipo_pago: 'Crédito', estado: 'Finalizado', total: 32000 }], '2026-10-12', '2026-10-12');
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(buffer);
    const hoja = libro.getWorksheet('Pedidos');
    expect(hoja.getRow(1).values.slice(1)).toContain('Mesa');
    expect(hoja.getCell('C2').value).toBe('=Cliente');
    expect(hoja.getCell('C2').type).toBe(ExcelJS.ValueType.String);
    expect(hoja.getCell('D2').value).toBe('003001234567');
    expect(hoja.getCell('E2').value).toBe('Oficina 707');
    expect(hoja.getCell('F2').value).toBe('1A');
    expect(hoja.getCell('G2').value).toBe('Rafa');
    expect(hoja.getCell('L2').value).toBe(32000);
    expect(libro.getWorksheet('Resumen').getCell('B5').value).toBe(32000);
  });
});
