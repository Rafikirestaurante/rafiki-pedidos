export const appStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Nunito', Arial, sans-serif; background: #fff7ed; color: #292524; }
        button, input, textarea, select { font-family: inherit; }
        button { cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; }
        button:active:not(:disabled) { transform: scale(0.97); }
        button:disabled { cursor: not-allowed; opacity: 0.6; }
        .app { min-height: 100vh; background: radial-gradient(ellipse at top left, #fed7aa 0, transparent 40%), radial-gradient(ellipse at bottom right, #fde68a 0, transparent 35%), linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%); padding: 24px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
        .brand { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg,#f97316,#f59e0b); color: white; padding: 8px 16px; border-radius: 999px; font-weight: 900; margin-bottom: 10px; font-size: 15px; box-shadow: 0 4px 12px rgba(249,115,22,0.3); }
        h1 { margin: 0; font-family: 'Fraunces', serif; font-size: clamp(30px, 5vw, 52px); line-height: 1; letter-spacing: -1.5px; }
        h2, h3, h4, h5, p { margin-top: 0; }
        .muted { color: #78716c; }
        .small { font-size: 13px; }
        .nav { display: flex; gap: 6px; background: #ffffff; border: 1px solid #fed7aa; padding: 6px; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
        .nav-wrap { flex-wrap: wrap; justify-content: flex-end; }
        .nav button { border: 0; padding: 12px 18px; border-radius: 14px; font-weight: 900; background: transparent; color: #57534e; white-space: nowrap; }
        .nav button.active { background: #f97316; color: #fff; box-shadow: 0 4px 10px rgba(249,115,22,0.3); }
        .alert { white-space: pre-line; padding: 14px 18px; border-radius: 18px; margin-bottom: 18px; font-weight: 700; border: 1px solid transparent; animation: fadeInUp 0.3s ease; }
        .alert-info { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .alert-success { background: #ecfdf5; color: #166534; border-color: #bbf7d0; }
        .alert-warning { background: #fffbeb; color: #92400e; border-color: #fde68a; }
        .alert-error { background: #fef2f2; color: #991b1b; border-color: #991b1b; }
        .menu-action-message { margin-top: 14px; margin-bottom: 0; }
        .card { background: #ffffff; border: 1px solid #fed7aa; border-radius: 32px; box-shadow: 0 18px 40px rgba(0,0,0,0.08); overflow: hidden; }
        .card-pad { padding: 24px; }
        .welcome { max-width: 820px; margin: 0 auto; text-align: center; }
        .welcome-card { background: linear-gradient(145deg, #ea580c, #f97316 40%, #f59e0b); color: white; border-radius: 36px; padding: 48px 32px 40px; box-shadow: 0 32px 80px rgba(249,115,22,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset; position: relative; overflow: hidden; }
        .welcome-card::before { content: ''; position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; background: rgba(255,255,255,0.07); border-radius: 50%; }
        .welcome-card::after { content: ''; position: absolute; bottom: -60px; left: -30px; width: 260px; height: 260px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .welcome-logo { width: 135px; height: 135px; object-fit: contain; background: #ffffff; border-radius: 24px; padding: 10px; margin-bottom: 20px; box-shadow: 0 16px 36px rgba(0,0,0,0.2); position: relative; z-index: 1; }
        .welcome-card h2 { font-family: 'Fraunces', serif; font-size: clamp(36px, 7vw, 66px); margin-bottom: 12px; line-height: 0.92; position: relative; z-index: 1; }
        .welcome-card p { color: rgba(255,255,255,0.88); font-size: 17px; margin-bottom: 8px; position: relative; z-index: 1; }
        .welcome-menu-preview { background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.25); border-radius: 18px; padding: 14px 20px; margin: 20px 0 28px; display: inline-block; text-align: left; position: relative; z-index: 1; }
        .welcome-menu-preview .label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; margin-bottom: 4px; }
        .welcome-menu-preview .menu-name { font-size: 18px; font-weight: 900; }
        .welcome-menu-preview .menu-price { font-size: 13px; opacity: 0.85; margin-top: 2px; }
        .welcome-actions { position: relative; z-index: 1; display: grid; gap: 12px; justify-items: center; margin-top: 24px; }
        .welcome-button { display: inline-flex; justify-content: center; align-items: center; gap: 10px; width: min(100%, 420px); border: 0; background: #ffffff; color: #c2410c; padding: 20px 28px; border-radius: 22px; font-size: 20px; font-weight: 900; text-decoration: none; box-shadow: 0 16px 36px rgba(0,0,0,0.18); position: relative; z-index: 1; letter-spacing: -0.3px; }
        .welcome-secondary-button { display: inline-flex; justify-content: center; align-items: center; gap: 8px; width: min(100%, 360px); border: 1px solid rgba(255,255,255,0.45); background: rgba(255,255,255,0.14); color: #fff; padding: 13px 18px; border-radius: 18px; font-size: 15px; font-weight: 900; box-shadow: none; backdrop-filter: blur(4px); }
        .welcome-button:hover { transform: translateY(-2px); box-shadow: 0 22px 44px rgba(0,0,0,0.22); }
        .welcome-secondary-button:hover { background: rgba(255,255,255,0.22); }
        .admin-small { margin-top: 18px; border: 0; background: transparent; color: #78716c; font-weight: 800; text-decoration: underline; font-size: 13px; }
        .hero { background: linear-gradient(145deg, #ea580c, #f97316 50%, #f59e0b); color: white; padding: 36px 32px; position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -30px; right: -30px; width: 160px; height: 160px; background: rgba(255,255,255,0.06); border-radius: 50%; }
        .hero.green { background: linear-gradient(145deg, #16a34a, #22c55e 50%, #4ade80); }
        .hero p:first-child { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; opacity: 0.75; margin-bottom: 8px; }
        .hero h2 { font-family: 'Fraunces', serif; font-size: clamp(26px, 4vw, 40px); margin-bottom: 8px; line-height: 1.05; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
        .layout { display: grid; grid-template-columns: 1fr 400px; gap: 22px; align-items: start; }
        .admin-tabs { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 18px; background: #fff; border: 1px solid #fed7aa; border-radius: 22px; padding: 8px; }
        .admin-tabs button { width: 100%; border: 0; border-radius: 16px; padding: 14px 12px; background: transparent; font-weight: 900; color: #57534e; line-height: 1.15; min-height: 48px; }
        .admin-tabs button.active { background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; box-shadow: 0 4px 12px rgba(249,115,22,0.3); }
        .admin-tabs .admin-tab-close { border: 1px solid #e7e5e4; color: #7c2d12; }
        .admin-layout { display: grid; grid-template-columns: 1fr; gap: 22px; }
        .admin-top-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
        .admin-actions-stack { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .button.warning { background: linear-gradient(135deg, #f79e1c, #f97316); color: #fff; border: none; box-shadow: 0 8px 18px rgba(247,158,28,0.28); }
        .button.warning:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(247,158,28,0.34); }
        .alerta-pedido-nuevo { display: flex; justify-content: space-between; gap: 14px; align-items: center; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 2px solid #f79e1c; border-radius: 24px; padding: 16px 18px; margin: 12px 0 16px; box-shadow: 0 12px 30px rgba(247,158,28,0.18); animation: pulseAlert 1.2s ease-in-out infinite; }
        .alerta-pedido-nuevo strong { display: block; color: #9a3412; font-family: 'Fraunces', serif; font-size: 20px; }
        .alerta-pedido-nuevo span { display: block; color: #7c2d12; margin-top: 4px; }
        .alerta-pedido-nuevo button { border: none; border-radius: 999px; padding: 10px 14px; font-weight: 900; color: white; background: #f97316; cursor: pointer; }
        .contador-sin-revisar { display: flex; justify-content: space-between; align-items: center; gap: 14px; background: #fff; border: 1px solid #fed7aa; border-radius: 24px; padding: 14px 16px; margin-bottom: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
        .contador-sin-revisar span { display: block; color: #7c2d12; font-weight: 800; }
        .contador-sin-revisar strong { color: #f79e1c; font-size: 34px; font-family: 'Fraunces', serif; line-height: 1; }
        .badge-nuevo { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
        .admin-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 12px 0 16px; }
        .soft-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 18px; padding: 16px; }
        .simple-list { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 8px; }
        .simple-list li { display: flex; justify-content: space-between; gap: 12px; align-items: center; background: white; border: 1px solid #ffedd5; border-radius: 12px; padding: 10px 12px; }
        .section { padding: 24px; }
        .meal-card { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 28px; padding: 20px; margin-bottom: 18px; scroll-margin-top: 18px; animation: fadeInUp 0.28s ease; }
        .fade-step { animation: fadeInUp 0.25s ease; scroll-margin-top: 18px; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .row { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
        .button { border: 0; background: linear-gradient(135deg, #f97316, #fb923c); color: white; font-weight: 900; padding: 14px 18px; border-radius: 16px; box-shadow: 0 6px 16px rgba(249,115,22,0.28); letter-spacing: -0.2px; }
        .button.green { background: linear-gradient(135deg, #16a34a, #22c55e); box-shadow: 0 6px 16px rgba(34,197,94,0.25); }
        .button.light { background: #fff; color: #44403c; border: 1px solid #e7e5e4; box-shadow: none; }
        .button.full-width { width: 100%; }
        .button.danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; box-shadow: none; }
        .button.disabled { opacity: 0.6; pointer-events: auto; }
        .button.add-meal { width: 100%; margin-top: 4px; margin-bottom: 18px; }
        .mesa-panel-title { margin-bottom: 16px; padding: 14px 16px; border-radius: 22px; background: linear-gradient(135deg, #fff7ed, #fffbeb); border: 1px solid #fed7aa; text-align: center; }
        .mesa-panel-title h2 { margin: 0; font-size: 24px; color: #7c2d12; font-family: 'Fraunces', serif; }
        .mesa-datos-grid { display: grid; gap: 16px; margin-top: 10px; }
        .mesa-dato-bloque { border: 1px solid #fed7aa; background: #fffaf0; border-radius: 20px; padding: 14px; }
        .mesa-dato-bloque h4 { margin: 0 0 12px; color: #9a3412; font-size: 17px; }
        .requerido { color: #dc2626; }
        .mesa-selector-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .mesa-boton { min-height: 54px; text-align: center; font-size: 18px; display: flex; align-items: center; justify-content: center; }
        .mesa-llevar { grid-column: 1 / -1; background: #fff7ed; }
        .mesa-5b { grid-column: 2; }
        .mesa-selector-grid.llevar-activo .mesa-boton:not(.mesa-llevar) { opacity: 0.45; filter: grayscale(1); }
        .datos-llevar-grid { display: grid; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #fed7aa; }

        .mesa-pos-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; padding: 12px 14px; border-radius: 22px; background: linear-gradient(135deg, #fff7ed, #fffbeb); border: 1px solid #fed7aa; }
        .mesa-pos-header h2 { margin: 2px 0 0; font-size: 20px; color: #7c2d12; letter-spacing: -0.02em; }
        .mesa-pos-kicker { font-size: 12px; font-weight: 900; color: #ea580c; text-transform: uppercase; letter-spacing: 0.08em; }
        .mesa-pos-pill { flex-shrink: 0; background: #fff; color: #7c2d12; border: 1px solid #fed7aa; border-radius: 999px; padding: 9px 12px; font-weight: 900; box-shadow: 0 8px 18px rgba(124,45,18,0.08); }
        .mesa-step-strip { position: sticky; top: 8px; z-index: 6; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; align-items: center; margin: 0 0 16px; padding: 10px; background: rgba(255,255,255,0.96); border: 1px solid #fed7aa; border-radius: 20px; box-shadow: 0 10px 24px rgba(15,23,42,0.08); backdrop-filter: blur(8px); }
        .mesa-step-strip span, .mesa-step-strip strong { border-radius: 999px; padding: 8px 9px; text-align: center; font-size: 12px; font-weight: 900; background: #f3f4f6; color: #6b7280; }
        .mesa-step-strip span.active { background: #ffedd5; color: #9a3412; }
        .mesa-step-strip strong { grid-column: 1 / -1; background: #16a34a; color: #fff; font-size: 13px; }
        .pos-selected-dish { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .pos-next-hint { margin-top: 10px; padding: 10px 12px; border-radius: 16px; background: #ecfdf5; color: #166534; font-weight: 900; text-align: center; }
        .pos-primary-action { font-size: 17px; padding: 16px 18px; border-radius: 20px; box-shadow: 0 10px 22px rgba(22,163,74,0.22); }
        .mesas-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
        .mesas-tab { border: 2px solid #fed7aa; background: #fff7ed; color: #9a3412; border-radius: 22px; padding: 16px 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 18px rgba(249,115,22,0.08); cursor: pointer; }
        .mesas-tab.cafeteria { border-color: #fde68a; background: #fffbeb; color: #92400e; }
        .mesas-tab.active { background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; border-color: transparent; }
        .mesas-tab.cafeteria.active { background: linear-gradient(135deg, #92400e, #b45309); color: #fff; }
        .cafeteria-placeholder { padding: 8px 0 4px; }
        .cafeteria-placeholder h2 { margin-bottom: 8px; text-align: center; color: #92400e; }
        .cafeteria-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 4px; }
        .cafeteria-card { border: 1px solid #fde68a; background: #fffbeb; color: #78350f; border-radius: 16px; padding: 10px 8px; display: flex; align-items: center; justify-content: center; gap: 6px; text-align: center; min-height: 46px; font-size: 14px; }
        .cafeteria-button { cursor: pointer; font: inherit; flex-direction: column; }
        .cafeteria-button.active { background: #f59e0b; color: #fff; border-color: #f59e0b; box-shadow: 0 10px 22px rgba(245,158,11,0.22); }
        .cafeteria-panel { margin-top: 16px; border: 1px solid #fde68a; background: #fffdf5; border-radius: 22px; padding: 16px; display: grid; gap: 12px; }
        .cafeteria-panel h3 { margin: 0; color: #92400e; font-family: 'Fraunces', serif; font-size: 24px; }
        .cafeteria-panel h4 { margin: 4px 0 0; color: #57534e; }
        .cafeteria-actions { align-items: stretch; }
        .continue-button { width: 100%; margin-top: 16px; background: linear-gradient(135deg, #16a34a, #22c55e); box-shadow: 0 6px 16px rgba(34,197,94,0.25); }
        .continue-button + .field { margin-top: 14px; }
        .summary-continue { width: 100%; margin: 12px 0 6px; background: linear-gradient(135deg, #16a34a, #22c55e); box-shadow: 0 6px 16px rgba(34,197,94,0.22); }
        .small-reset { display: block; width: fit-content; margin: 8px auto 0; font-size: 12px; padding: 8px 12px; border-radius: 999px; color: #b91c1c; border-color: #fecaca; box-shadow: none; background: #fff; }
        .link-button { display: block; text-align: center; text-decoration: none; }
        .step-title { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; background: #fff; border: 1px solid #fed7aa; border-radius: 22px; padding: 16px; box-shadow: 0 8px 18px rgba(249,115,22,0.08); }
        .step-title h4 { font-size: 21px; line-height: 1.1; margin-bottom: 6px; color: #c2410c; font-family: 'Fraunces', serif; }
        .step-title p { font-size: 15px; }
        .step-number { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 999px; background: linear-gradient(135deg, #f97316, #f59e0b); color: white; font-weight: 900; font-size: 20px; flex: 0 0 auto; box-shadow: 0 8px 18px rgba(249,115,22,0.25); }
        .selected-dish { background: #ecfdf5; border: 1px solid #86efac; color: #166534; border-radius: 18px; padding: 12px 14px; margin-bottom: 16px; font-weight: 900; display: flex; align-items: center; gap: 8px; }
        .selected-dish::before { content: '✓'; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #22c55e; color: white; border-radius: 50%; font-size: 13px; flex-shrink: 0; }
        .category-block { margin-bottom: 20px; border: 1px solid #fed7aa; border-radius: 24px; padding: 16px; background: #fffaf0; }
        .category-title { font-size: 20px; margin-bottom: 12px; color: #c2410c; font-weight: 900; display: flex; align-items: center; gap: 8px; }
        .option-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .product-card .option, .cafeteria-panel .option, .product-card .chip, .cafeteria-panel .chip { min-height: 52px; font-size: 15px; }
        .product-card .option { border-width: 2px; }
        .compact-cafeteria-actions { margin-bottom: 12px; }
        .compact-cafeteria-actions .cafeteria-card strong { line-height: 1.1; }
        .cafeteria-card { transition: transform .15s ease, box-shadow .15s ease; }
        .cafeteria-card:active, .option:active, .chip:active, .mesas-tab:active { transform: scale(0.98); }
        .cafeteria-action { background: linear-gradient(135deg, #92400e, #b45309); color: #fff; border: 0; }
        .cafeteria-mini-action { background: #fffbeb; color: #92400e; border: 1.5px solid #fde68a; box-shadow: none; }
        .mesa-clean-actions { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 14px; }
        .mesa-clean-actions .button { width: 100%; min-height: 48px; font-size: 16px; }
        .mesa-resumen-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .option { text-align: left; border: 1.5px solid #e7e5e4; background: #fff; border-radius: 18px; padding: 14px; font-weight: 900; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
        .option:hover { border-color: #fdba74; background: #fff7ed; }
        .option small { display: block; margin-top: 6px; color: #ea580c; font-size: 16px; font-weight: 900; }
        .option.selected { border-color: #f97316; color: #c2410c; background: #fff7ed; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
        .option.selected::after { content: '✓'; float: right; color: #f97316; font-size: 18px; }
        .chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .chip { border: 1.5px solid #e7e5e4; background: #fff; border-radius: 999px; padding: 10px 16px; font-weight: 900; transition: all 0.15s; }
        .chip:hover:not(:disabled) { border-color: #86efac; background: #f0fdf4; }
        .chip.selected { border-color: #22c55e; background: #dcfce7; color: #15803d; box-shadow: 0 0 0 2px rgba(34,197,94,0.15); }
        .chip.blocked { background: #f5f5f4; color: #a8a29e; }
        .box { background: #fff; border: 1px solid #e7e5e4; border-radius: 18px; padding: 14px; }
        .compact-info { padding: 10px 12px; border-radius: 14px; font-size: 14px; background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
        .pedido-paso-compacto { display: grid; gap: 10px; }
        .compact-box { padding: 10px 12px; border-radius: 14px; }
        .quantity-box { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .quantity-box strong, .takeout-box strong { font-size: 14px; }
        .takeout-box { cursor: pointer; }
        .box.soft { background: #fafaf9; }
        .field { display: block; margin-bottom: 14px; }
        .field span { display: block; font-weight: 900; margin-bottom: 8px; font-size: 15px; }
        .field input, .field textarea, .field select, select.box { width: 100%; border: 1.5px solid #e7e5e4; background: #fafaf9; border-radius: 16px; padding: 13px 14px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .pedido-paso-compacto .field { margin-bottom: 0; }
        .pedido-paso-compacto .field span { font-size: 14px; margin-bottom: 6px; }
        .pedido-paso-compacto .field textarea { min-height: 58px; padding: 10px 12px; border-radius: 14px; }
        .field input:focus, .field textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); background: #fff; }
        .quantity { display: flex; align-items: center; gap: 12px; }
        .quantity button { width: 40px; height: 40px; border-radius: 999px; border: 1.5px solid #e7e5e4; background: #fff; font-size: 22px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
        .pedido-paso-compacto .quantity { gap: 8px; }
        .pedido-paso-compacto .quantity button { width: 32px; height: 32px; font-size: 18px; }
        .pedido-paso-compacto .quantity strong { min-width: 20px; text-align: center; }
        .quantity button:hover { border-color: #f97316; color: #f97316; }
        .summary-item { background: #fff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 12px; margin-bottom: 10px; font-weight: 700; }
        .summary-item-header { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
        .summary-item-header p { margin-top: 0; }
        .mini-danger { border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 900; cursor: pointer; white-space: nowrap; }
        .mini-danger:hover { background: #fee2e2; border-color: #fca5a5; }
        .total-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e7e5e4; margin-top: 14px; padding-top: 14px; font-weight: 900; }
        .total-row strong { color: #ea580c; font-size: 26px; }
        .compact-total-row { margin-top: 2px; padding-top: 10px; }
        .compact-total-row strong { font-size: 22px; }
        .mini-pending { display: inline-flex; align-items: center; gap: 8px; background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; border-radius: 999px; padding: 9px 13px; font-weight: 900; margin: 12px 0 16px; }
        .mini-pending strong { background: #f97316; color: #fff; min-width: 28px; height: 28px; border-radius: 999px; display: inline-flex; justify-content: center; align-items: center; }
        .filtros-historial { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0 6px; align-items: center; }
        .filtros-historial button { border: 1px solid #fed7aa; background: #fff; color: #c2410c; padding: 10px 14px; border-radius: 999px; font-weight: 900; }
        .filtros-historial button.active { background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; box-shadow: 0 4px 10px rgba(249,115,22,0.25); }
        .calendario-filtro { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #fed7aa; border-radius: 999px; padding: 8px 12px; color: #c2410c; font-weight: 900; }
        .calendario-filtro span { font-size: 13px; }
        .calendario-filtro input { border: 0; outline: none; background: transparent; color: #44403c; font-weight: 800; padding: 0; }
        .pedido-seccion { margin-bottom: 26px; }
        .section-heading { display: flex; justify-content: space-between; align-items: center; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 22px; padding: 16px 18px; margin-bottom: 14px; }
        .section-heading h3 { margin: 0; color: #c2410c; font-family: 'Fraunces', serif; }
        .section-heading span { background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; min-width: 34px; height: 34px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 10px rgba(249,115,22,0.3); }
        .section-heading-actions { display: inline-flex; align-items: center; gap: 8px; }
        .section-heading-actions .mini-btn { width: auto; margin-bottom: 0; white-space: nowrap; padding: 8px 10px; }
        .section-heading-danger { background: #fef2f2; border-color: #fecaca; }
        .section-heading-danger h3 { color: #991b1b; }
        .section-heading-danger span { background: linear-gradient(135deg, #dc2626, #ef4444); box-shadow: 0 4px 10px rgba(220,38,38,0.22); }
        .bottom-summary { display: grid; grid-template-columns: 1.4fr 1fr; gap: 18px; margin-top: 18px; }
        .summary-cards { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .summary-card { background: #fff; border: 1px solid #fed7aa; border-radius: 24px; padding: 18px; transition: box-shadow 0.15s; }
        .summary-card:hover { box-shadow: 0 8px 24px rgba(249,115,22,0.1); }
        .summary-card.compact { padding: 15px; }
        .summary-card span { color: #78716c; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0px; }
        .summary-card strong { display: block; color: #ea580c; font-size: 28px; margin-top: 6px; font-family: 'Fraunces', serif; }
        .productos-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .producto-solicitud { background: #fff; border: 1px solid #fed7aa; border-radius: 18px; padding: 14px; }
        .producto-solicitud strong { display: block; color: #292524; margin-bottom: 10px; }
        .producto-controls { display: grid; grid-template-columns: 1fr 120px; gap: 8px; margin-bottom: 8px; }
        .producto-controls input, .producto-controls select, .producto-solicitud textarea { width: 100%; border: 1.5px solid #e7e5e4; background: #fafaf9; border-radius: 14px; padding: 11px 12px; outline: none; font-family: inherit; }
        .producto-solicitud textarea { min-height: 42px; resize: vertical; }
        .productos-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
        .producto-chip { border: 1.5px solid #e7e5e4; background: #fff; border-radius: 999px; padding: 10px 14px; font-weight: 900; color: #44403c; box-shadow: none; }
        .producto-chip:hover { border-color: #fdba74; background: #fff7ed; }
        .producto-chip.selected { border-color: #22c55e; background: #dcfce7; color: #15803d; box-shadow: 0 0 0 2px rgba(34,197,94,0.12); }
        .producto-chip-wrap { display: inline-flex; align-items: center; gap: 4px; }
        .producto-add-row, .producto-delete-row { display: grid; grid-template-columns: minmax(180px, 1fr) 170px auto; gap: 8px; align-items: center; margin-top: 10px; }
        .producto-delete-row { grid-template-columns: minmax(220px, 1fr) auto; }
        .producto-add-row input, .producto-add-row select, .producto-delete-row select { width: 100%; border: 1.5px solid #e7e5e4; background: #fafaf9; border-radius: 14px; padding: 11px 12px; outline: none; font-family: inherit; }
        .productos-seleccionados-lista { display: grid; gap: 7px; margin: 10px 0; }
        .producto-seleccionado-row { display: grid; grid-template-columns: minmax(120px, 1.1fr) 70px 88px minmax(110px, 1fr) auto; gap: 6px; align-items: center; background: #fff; border: 1px solid #fed7aa; border-radius: 15px; padding: 7px; }
        .producto-seleccionado-row strong { color: #292524; font-size: 14px; line-height: 1.1; }
        .producto-seleccionado-row input, .producto-seleccionado-row select { width: 100%; border: 1.5px solid #e7e5e4; background: #fafaf9; border-radius: 12px; padding: 8px 9px; outline: none; font-family: inherit; font-size: 13px; }
        .producto-seleccionado-row input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); background: #fff; }
        .producto-seleccionado-row .button { padding: 8px 10px; font-size: 12px; border-radius: 12px; }
        .solicitud-preview { white-space: pre-wrap; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 18px; padding: 16px; font-size: 14px; margin-top: 14px; }

        .pedidos-tabla-wrap { width: 100%; overflow-x: auto; border: 1px solid #fed7aa; border-radius: 18px; background: #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
        .pedidos-tabla-compacta { width: 100%; border-collapse: collapse; min-width: 1080px; font-size: 12px; }
        .pedidos-tabla-compacta th { position: sticky; top: 0; z-index: 1; background: #fff7ed; color: #9a3412; text-align: left; padding: 9px 8px; border-bottom: 1px solid #fed7aa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
        .pedidos-tabla-compacta td { vertical-align: top; padding: 8px; border-bottom: 1px solid #f5f5f4; color: #44403c; line-height: 1.25; }
        .pedidos-tabla-compacta tr:last-child td { border-bottom: 0; }
        .pedidos-tabla-compacta tr.fila-nueva { background: #fff7ed; box-shadow: inset 4px 0 0 #f79e1c; }
        .pedidos-tabla-compacta tr.fila-finalizada { background: #f0fdf4; opacity: 0.82; }
        .pedidos-tabla-compacta tr.fila-borrada { background: #fef2f2; opacity: 0.78; }
        .mini-estado-borrado { display: inline-flex; align-items: center; justify-content: center; width: 100%; border-radius: 999px; background: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 900; padding: 8px 10px; margin-bottom: 6px; }
        .td-codigo strong { display: block; color: #c2410c; font-size: 13px; }
        .td-codigo span { display: inline-block; margin-top: 3px; background: #f79e1c; color: white; border-radius: 999px; padding: 2px 6px; font-size: 10px; font-weight: 900; }
        .pedidos-tabla-compacta td small { display: block; color: #78716c; margin-top: 2px; font-size: 11px; }
        .td-pedido { max-width: 360px; font-weight: 700; }
        .td-obs { max-width: 190px; color: #7c2d12; }
        .td-total { color: #16a34a; font-weight: 900; white-space: nowrap; }
        .pedidos-tabla-compacta select { width: 118px; border: 1px solid #e7e5e4; border-radius: 10px; padding: 7px 8px; background: #fafaf9; font-size: 12px; font-weight: 800; }
        .td-acciones { min-width: 94px; }
        .mini-btn { display: block; width: 100%; margin-bottom: 5px; border: 1px solid #e7e5e4; border-radius: 10px; padding: 6px 8px; background: #fff; color: #44403c; font-size: 11px; font-weight: 900; text-align: center; text-decoration: none; box-shadow: none; }
        .mini-btn.warning { background: #f79e1c; border-color: #f79e1c; color: #fff; }
        .mini-btn.green { background: #16a34a; border-color: #16a34a; color: #fff; }
        .mini-btn.print { background: #111827; border-color: #111827; color: #fff; }
        .mini-btn.danger { background: #dc2626; border-color: #dc2626; color: #fff; }
        .mini-btn.danger:disabled { opacity: 0.65; cursor: not-allowed; }
        .paginacion-pedidos { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 10px; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 14px; background: #fff7ed; color: #7c2d12; font-size: 12px; font-weight: 800; }
        .paginacion-botones { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .paginacion-botones .mini-btn { width: auto; margin-bottom: 0; padding: 7px 12px; }
        .paginacion-botones .mini-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .paginacion-botones strong { color: #9a3412; white-space: nowrap; }
        @media (max-width: 720px) { .paginacion-pedidos { align-items: stretch; flex-direction: column; } .paginacion-botones { justify-content: space-between; } }

        .pedido-cocina { border: 1px solid #fed7aa; background: #fff; border-radius: 26px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); overflow: hidden; animation: fadeInUp 0.25s ease; }
        .pedido-sin-revisar { border: 3px solid #f79e1c; box-shadow: 0 12px 34px rgba(247,158,28,0.22); }
        .pedido-finalizado { opacity: 0.7; }
        .pedido-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; }
        .pedido-header-pending { background: linear-gradient(135deg, #f97316, #fb923c); }
        .pedido-header-finalizado { background: linear-gradient(135deg, #16a34a, #22c55e); }
        .pedido-header-title { font-weight: 900; color: white; font-size: 15px; }
        .pedido-header-right { display: flex; align-items: center; gap: 8px; }
        .pedido-body { padding: 16px 18px; }
        .pedido-top { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; border-bottom: 1px solid #f5f5f4; padding-bottom: 14px; margin-bottom: 14px; }
        .pedido-linea { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .pedido-id { font-weight: 900; color: #78716c; font-size: 13px; }
        .pedido-total { text-align: right; }
        .pedido-total span { display: block; color: #78716c; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0px; }
        .pedido-total strong { color: #ea580c; font-size: 26px; font-family: 'Fraunces', serif; }
        .pedido-cliente-nombre { font-size: 20px; font-weight: 900; color: #292524; margin: 0 0 6px; font-family: 'Fraunces', serif; }
        .pedido-meta { font-size: 13px; color: #78716c; display: flex; flex-direction: column; gap: 2px; }
        .items-cocina { display: grid; gap: 12px; }
        .item-cocina { display: grid; grid-template-columns: 48px 1fr; gap: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 20px; padding: 14px; }
        .item-numero { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; border-radius: 14px; font-weight: 900; box-shadow: 0 4px 10px rgba(249,115,22,0.25); }
        .item-detalle h4 { margin-bottom: 8px; font-size: 18px; color: #c2410c; }
        .item-detalle p { margin-bottom: 5px; font-size: 14px; }
        .nota-cocina { margin-top: 12px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 16px; padding: 12px; }
        .pedido-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
        .pedido-actions select { border: 1.5px solid #e7e5e4; border-radius: 16px; padding: 13px 14px; background: #fafaf9; font-weight: 800; outline: none; }
        .pedido-text { white-space: pre-line; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 16px; padding: 12px; font-weight: 700; margin-top: 12px; }
        .badge { border: 1px solid transparent; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 900; }
        .badge-pendiente { background: rgba(254,243,199,0.6); color: #fff; border-color: rgba(253,230,138,0.4); }
        .badge-finalizado { background: rgba(220,252,231,0.6); color: #fff; border-color: rgba(134,239,172,0.4); }
        .progress-bar-wrap { display: flex; gap: 4px; margin-bottom: 18px; }
        .progress-step { flex: 1; height: 4px; background: #fed7aa; border-radius: 4px; transition: background 0.3s; }
        .progress-step.done { background: linear-gradient(90deg, #f97316, #f59e0b); }
        .progress-labels { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .progress-label { font-size: 11px; font-weight: 900; color: #a8a29e; text-transform: uppercase; letter-spacing: 0px; }
        .progress-label.done { color: #f97316; }
        .sticky-total { position: sticky; bottom: 0; background: #1c1917; border-radius: 20px 20px 0 0; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin: 20px -24px -24px; box-shadow: 0 -8px 24px rgba(0,0,0,0.15); }
        .sticky-total-label { font-size: 12px; color: #a8a29e; font-weight: 800; text-transform: uppercase; letter-spacing: 0px; }
        .sticky-total-amount { font-size: 24px; font-weight: 900; color: #fb923c; font-family: 'Fraunces', serif; }
        .finalizar-area { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; max-width: 230px; }
        .finalizar-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; border-radius: 12px; padding: 8px 10px; font-size: 12px; font-weight: 900; text-align: right; line-height: 1.2; box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .confirmacion-check { width: 72px; height: 72px; background: linear-gradient(135deg, #16a34a, #22c55e); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; margin: 0 auto 16px; box-shadow: 0 12px 28px rgba(34,197,94,0.35); animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .confirmacion-restaurante { animation: fadeInUp 0.36s ease; overflow: hidden; border: 1px solid #bbf7d0; box-shadow: 0 18px 48px rgba(22,163,74,0.16); }
        .confirmacion-restaurante .hero { padding: 34px 26px 28px; text-align: center; }
        .confirmacion-info { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
        .confirmacion-info-item { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 11px 12px; text-align: left; }
        .confirmacion-info-item span { display: block; color: #78716c; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 3px; }
        .confirmacion-info-item strong { display: block; color: #292524; font-size: 14px; word-break: break-word; }
        .confirmacion-resumen { background: #fafaf9; border: 1px dashed #d6d3d1; border-radius: 18px; padding: 14px; margin: 12px 0 16px; text-align: left; }
        .confirmacion-resumen h3 { margin: 0 0 10px; color: #9a3412; font-size: 17px; }
        .confirmacion-lineas { display: grid; gap: 7px; }
        .confirmacion-linea { background: #fff; border: 1px solid #f5f5f4; border-radius: 12px; padding: 9px 10px; font-weight: 800; line-height: 1.25; color: #44403c; }
        .confirmacion-total { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #1c1917; color: #fff; border-radius: 18px; padding: 14px 16px; margin-top: 12px; }
        .confirmacion-total span { color: #fdba74; font-weight: 900; text-transform: uppercase; font-size: 12px; }
        .confirmacion-total strong { font-family: 'Fraunces', serif; font-size: 28px; color: #fff; }
        .confirmacion-ok { text-align: center; color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 12px 14px; font-weight: 900; margin-bottom: 14px; }
        .confirmacion-actions { display: grid; gap: 10px; }
        .whatsapp-confirm-button { width: 100%; text-decoration: none; text-align: center; font-size: 16px; }
        .confirmacion-simple-mesa { animation: fadeInUp 0.32s ease; max-width: 560px; margin: 0 auto; }
        @media (max-width: 680px) { .confirmacion-info { grid-template-columns: 1fr; } .confirmacion-total strong { font-size: 24px; } }
        pre { white-space: pre-wrap; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 18px; padding: 16px; overflow: auto; font-size: 14px; }

        .mesas-pos { max-width: 980px; margin: 0 auto; display: grid; gap: 16px; }
        .mesas-hero { display: flex; justify-content: space-between; align-items: center; gap: 16px; background: linear-gradient(135deg, #1c1917, #44403c); color: #fff; border-radius: 28px; padding: 22px; box-shadow: 0 16px 36px rgba(0,0,0,0.16); }
        .mesas-hero span { display: block; color: #fdba74; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: .7px; margin-bottom: 5px; }
        .mesas-hero h2 { margin: 0; font-size: clamp(30px, 6vw, 48px); line-height: .95; }
        .mesas-hero strong { background: #f97316; color: #fff; border-radius: 999px; padding: 12px 16px; font-size: 18px; white-space: nowrap; }
        .mesas-card { background: #fff; border: 1px solid #fed7aa; border-radius: 26px; padding: 18px; box-shadow: 0 12px 28px rgba(0,0,0,0.06); }
        .mesas-section-title { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
        .mesas-section-title h3 { margin: 0; color: #c2410c; font-size: 24px; font-family: 'Fraunces', serif; }
        .mesas-category { margin-top: 14px; }
        .mesas-category:first-of-type { margin-top: 0; }
        .mesas-category h4 { margin-bottom: 10px; color: #57534e; font-size: 16px; }
        .mesas-products-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .mesa-product-btn { border: 2px solid #fed7aa; background: #fff7ed; border-radius: 20px; min-height: 86px; padding: 14px 12px; text-align: left; font-weight: 900; color: #292524; box-shadow: none; }
        .mesa-product-btn span { display: block; font-size: 18px; line-height: 1.08; }
        .mesa-product-btn small { display: block; margin-top: 8px; color: #ea580c; font-size: 15px; font-weight: 900; }
        .mesa-product-btn:hover { background: #ffedd5; border-color: #fb923c; }
        .mesas-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .mesa-chip { border: 2px solid #e7e5e4; background: #fff; border-radius: 999px; padding: 12px 16px; font-weight: 900; color: #44403c; }
        .mesa-chip.selected { border-color: #22c55e; background: #dcfce7; color: #15803d; }
        .mesa-empty { background: #fafaf9; border: 1px dashed #d6d3d1; border-radius: 18px; padding: 18px; color: #78716c; font-weight: 800; text-align: center; }
        .mesa-items-list { display: grid; gap: 10px; }
        .mesa-item-row { display: grid; grid-template-columns: 1fr auto 38px; align-items: center; gap: 10px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 18px; padding: 12px; }
        .mesa-item-row.active { border-color: #22c55e; background: #f0fdf4; }
        .mesa-item-row strong { display: block; color: #292524; font-size: 17px; }
        .mesa-item-row small { display: block; color: #57534e; font-weight: 800; margin-top: 4px; line-height: 1.25; }
        .mesa-item-row span { display: block; color: #ea580c; font-weight: 900; margin-top: 3px; }
        .mesas-wizard .progress-bar-wrap { margin-bottom: 10px; }
        .mesas-progress-labels { margin-bottom: 0; }
        .mesa-chip.blocked { opacity: .45; cursor: not-allowed; }
        .mesa-otro-almuerzo { margin-top: 14px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 20px; padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .mesa-otro-almuerzo strong { color: #92400e; font-size: 18px; }
        .mesa-otro-almuerzo .button { margin: 0; }
        .mesa-remove { width: 36px; height: 36px; border: 0; border-radius: 999px; background: #fee2e2; color: #991b1b; font-size: 22px; font-weight: 900; }
        .mesa-acomp-preview { margin-top: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 16px; padding: 12px; font-weight: 800; }
        .mesa-link-btn { border: 0; background: transparent; color: #b91c1c; font-weight: 900; text-decoration: underline; }
        .mesas-final-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .mesa-send-bar { display: flex; justify-content: space-between; align-items: center; gap: 14px; background: #1c1917; color: #fff; border-radius: 22px; padding: 14px; margin-top: 6px; }
        .mesa-send-bar span { display: block; color: #d6d3d1; font-weight: 800; font-size: 12px; text-transform: uppercase; }
        .mesa-send-bar strong { display: block; color: #fdba74; font-size: 28px; font-family: 'Fraunces', serif; }
        .mesa-send-bar .button { margin: 0; min-width: 210px; }

        @media (max-width: 900px) {
          .topbar, .layout, .grid-2, .pedido-top, .pedido-actions, .bottom-summary, .admin-top-row, .admin-actions-stack, .contador-sin-revisar, .alerta-pedido-nuevo, .admin-stats { grid-template-columns: 1fr; display: grid; }
          .topbar { display: block; }
          .topbar h1 { font-size: clamp(28px, 9vw, 40px); }
          .nav { margin-top: 16px; width: 100%; overflow-x: auto; justify-content: flex-start; -webkit-overflow-scrolling: touch; }
          .nav-wrap { flex-wrap: nowrap; }
          .nav button { flex: 0 0 auto; padding: 11px 14px; font-size: 13px; }
          .mesa-pos-header { align-items: flex-start; flex-direction: column; }
          .mesa-step-strip { top: 4px; grid-template-columns: 1fr; }
          .option-grid, .productos-grid, .producto-controls, .producto-add-row, .producto-delete-row, .producto-seleccionado-row, .mesas-products-grid, .mesas-final-grid { grid-template-columns: 1fr; }
          .mesa-send-bar { display: grid; grid-template-columns: 1fr; }
          .mesa-send-bar .button { width: 100%; min-width: 0; }
          .mesa-item-row, .mesa-otro-almuerzo { grid-template-columns: 1fr; display: grid; }
          .mesa-otro-almuerzo .button { width: 100%; }
          .app { padding: 14px; }
          .card-pad, .section { padding: 18px; }
          .welcome-card { padding: 34px 18px 28px; border-radius: 28px; }
          .welcome-logo { width: 108px; height: 108px; border-radius: 20px; }
          .welcome-button { font-size: 17px; padding: 17px 20px; border-radius: 20px; }
          .welcome-secondary-button { width: 100%; }
          .pedido-total { text-align: left; }
          .sticky-total { align-items: flex-start; gap: 12px; }
          .finalizar-area { max-width: 190px; }
          .admin-tabs { grid-template-columns: 1fr 1fr; border-radius: 18px; }
          .admin-tabs button { font-size: 12px; padding: 12px 8px; }
        }
`;
