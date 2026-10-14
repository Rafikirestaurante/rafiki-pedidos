import { lazyConReintento } from "../shared/utils/lazyConReintento.js";

export const InicioRafiki = lazyConReintento(
  () =>
    import("../modules/admin/components/auth/InicioAdmin").then((modulo) => ({
      default: modulo.InicioRafiki,
    })),
  "InicioRafiki",
);

export const AdminLogin = lazyConReintento(
  () =>
    import("../modules/admin/components/auth/InicioAdmin").then((modulo) => ({
      default: modulo.AdminLogin,
    })),
  "AdminLogin",
);

export const AdminHeaderTabs = lazyConReintento(
  () => import("../modules/admin/components/layout/AdminHeaderTabs"),
  "AdminHeaderTabs",
);
export const AdminPedidosSection = lazyConReintento(
  () => import("../modules/admin/components/pedidos/AdminPedidosSection"),
  "AdminPedidosSection",
);
export const MenuDiarioTab = lazyConReintento(
  () => import("../modules/admin/tabs/MenuDiarioTab"),
  "MenuDiarioTab",
);
export const PedidoCliente = lazyConReintento(
  () => import("../modules/cliente/components/PedidoCliente"),
  "PedidoCliente",
);
export const ConfirmacionPedidoCliente = lazyConReintento(
  () => import("../modules/cliente/components/ConfirmacionPedidoCliente"),
  "ConfirmacionPedidoCliente",
);
export const SolicitudProductos = lazyConReintento(
  () => import("../modules/catalogo/components/SolicitudProductos"),
  "SolicitudProductos",
);
export const GeneradorMenu = lazyConReintento(
  () => import("../modules/catalogo/components/GeneradorMenu"),
  "GeneradorMenu",
);
export const PanelMesasPOS = lazyConReintento(
  () => import("../modules/mesas/components/PanelMesas"),
  "PanelMesas",
);
export const PanelMesasBeta = lazyConReintento(
  () => import("../modules/mesas/components/PanelMesasBeta"),
  "PanelMesasBeta",
);
export const PanelClienteBeta = lazyConReintento(
  () => import("../modules/cliente/components/PanelClienteBeta"),
  "PanelClienteBeta",
);
export const PanelRafaPrivado = lazyConReintento(
  () => import("../modules/dashboard/components/PanelRafaPrivado"),
  "PanelRafaPrivado",
);
export const CatalogoRafa = lazyConReintento(
  () => import("../modules/catalogo/components/CatalogoRafa"),
  "CatalogoRafa",
);
export const InventarioAdmin = lazyConReintento(
  () => import("../modules/inventario/components/InventarioAdmin"),
  "InventarioAdmin",
);
export const CajaAdmin = lazyConReintento(
  () => import("../modules/caja/components/CajaAdmin"),
  "CajaAdmin",
);
export const GerenciaPanel = lazyConReintento(
  () => import("../modules/gerencia/components/GerenciaPanel"),
  "GerenciaPanel",
);
