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
        .nav .rafiki-clear-cache-button, .rafiki-clear-cache-button { border: 1px solid #fdba74; background: #fff7ed; color: #9a3412; font-weight: 900; border-radius: 14px; white-space: nowrap; box-shadow: none; }
        .nav .rafiki-clear-cache-button:hover, .rafiki-clear-cache-button:hover { background: #ffedd5; }
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
        .admin-actions-stack.horizontal { align-items: center; }
        .admin-realtime-pending { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-color: #f59e0b; background: linear-gradient(135deg, #fff7ed, #fffbeb); }
        .admin-realtime-pending strong { color: #9a3412; font-family: 'Fraunces', serif; font-size: 20px; }
        .admin-realtime-pending p { margin: 6px 0 0; }
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
        .mesas-panel-layout { padding-top: 58px; }
        .mesa-step-nav { position: fixed; top: 6px; left: 50%; transform: translateX(-50%); width: min(760px, calc(100vw - 24px)); z-index: 9999; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 0; padding: 7px; background: rgba(255,255,255,0.98); border: 1px solid #fed7aa; border-radius: 18px; box-shadow: 0 8px 22px rgba(15,23,42,0.14); backdrop-filter: blur(8px); }
        .mesa-step-nav button { border: 0; min-height: 34px; border-radius: 999px; background: #fff7ed; color: #9a3412; font-size: 13px; font-weight: 900; box-shadow: none; }
        .mesa-step-nav button:hover { background: #ffedd5; }
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
        .filtros-rango-fechas { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 8px 0 14px; padding: 10px; border: 1px dashed #fed7aa; border-radius: 18px; background: #fff7ed; }
        .filtros-rango-fechas .calendario-filtro { background: #fff; }
        .pedido-seccion { margin-bottom: 26px; }
        .section-heading { display: flex; justify-content: space-between; align-items: center; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 22px; padding: 16px 18px; margin-bottom: 14px; }
        .section-heading h3 { margin: 0; color: #c2410c; font-family: 'Fraunces', serif; }
        .section-heading span { background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; min-width: 34px; height: 34px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 10px rgba(249,115,22,0.3); }
        .section-heading-actions { display: inline-flex; align-items: center; gap: 8px; }
        .section-heading-actions .mini-btn { width: auto; margin-bottom: 0; white-space: nowrap; padding: 8px 10px; }
        .section-heading-actions .mini-btn.active { background: #fed7aa; border-color: #fdba74; color: #7c2d12; box-shadow: inset 0 0 0 1px rgba(124,45,18,0.08); }
        .pedidos-orden-actions { flex-wrap: wrap; justify-content: flex-end; }
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
        .pedidos-tabla-compacta tr.fila-finalizada { background: #f0fdf4; opacity: 1; }
        .pedidos-tabla-compacta tr.fila-borrada { background: #fef2f2; opacity: 0.78; }
        .mini-estado-borrado { display: inline-flex; align-items: center; justify-content: center; width: 100%; border-radius: 999px; background: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 900; padding: 8px 10px; margin-bottom: 6px; }
        .td-codigo strong { display: block; color: #c2410c; font-size: 13px; }
        .td-codigo span { display: inline-block; margin-top: 3px; background: #f79e1c; color: white; border-radius: 999px; padding: 2px 6px; font-size: 10px; font-weight: 900; }
        .pedidos-tabla-compacta td small { display: block; color: #78716c; margin-top: 2px; font-size: 11px; }
        .td-pedido { max-width: 360px; font-weight: 700; }
        .td-obs { max-width: 190px; color: #7c2d12; }
        .td-total { color: #16a34a; font-weight: 900; white-space: nowrap; }
        .pedidos-tabla-compacta select { width: 118px; border: 1px solid #e7e5e4; border-radius: 10px; padding: 7px 8px; background: #fafaf9; font-size: 12px; font-weight: 800; }
        .pago-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 5px 8px; background: #f5f5f4; color: #57534e; font-size: 11px; font-weight: 900; white-space: nowrap; }
        .pago-badge.pago-credito { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
        .cartera-correccion-resumen { border: 1px dashed #fdba74; border-radius: 14px; padding: 12px; background: #fff7ed; color: #7c2d12; font-size: 13px; }
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
        @media (max-width: 720px) { .section-heading-pedidos-unificados { align-items: flex-start; flex-direction: column; gap: 10px; } .section-heading-pedidos-unificados .section-heading-actions { width: 100%; justify-content: flex-start; } .section-heading-pedidos-unificados .mini-btn { flex: 0 0 auto; } }


        .admin-mesas-hoy-card { margin: 14px 0 18px; border: 1px solid #fed7aa; background: linear-gradient(135deg, #fff7ed, #fffbeb); border-radius: 24px; padding: 14px; box-shadow: 0 8px 22px rgba(124,45,18,0.06); }
        .admin-mesas-hoy-title { margin: 0 0 12px !important; align-items: center; justify-content: space-between; gap: 10px; }
        .admin-mesas-hoy-title h4 { margin: 0; color: #7c2d12; font-size: 18px; }
        .admin-mesas-hoy-title p { margin: 2px 0 0; }
        .admin-mesas-toggle { margin-left: auto; padding: 8px 10px; border-radius: 999px; font-size: 11px; white-space: nowrap; }
        .admin-mesas-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; max-width: 860px; margin: 0 auto; }
        .admin-mesa-card { display: flex; flex-direction: column; gap: 9px; min-height: 172px; border: 1px solid #fed7aa; background: #fff; border-radius: 20px; padding: 12px; }
        .admin-mesa-card.mesa-sola { grid-column: 1 / -1; max-width: 420px; width: 100%; margin: 0 auto; }
        .admin-mesa-card.con-pedidos { box-shadow: inset 0 0 0 2px #ffedd5; }
        .admin-mesa-card.sin-pedidos { opacity: 0.72; }
        .admin-mesa-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .admin-mesa-card-head strong { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border-radius: 15px; background: linear-gradient(135deg, #f97316, #f59e0b); color: #fff; font-size: 18px; font-weight: 900; }
        .admin-mesa-card-head span { border: 1px solid #fed7aa; background: #fff7ed; color: #9a3412; border-radius: 999px; padding: 6px 9px; font-size: 11px; font-weight: 900; }
        .admin-mesa-ultimos { display: grid; gap: 7px; flex: 1; }
        .admin-mesa-pedido-mini { border: 1px solid #f5f5f4; background: #fafaf9; border-radius: 14px; padding: 8px; }
        .admin-mesa-pedido-mini div { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px; }
        .admin-mesa-pedido-mini strong { color: #c2410c; font-size: 12px; }
        .admin-mesa-pedido-mini span { color: #78716c; font-size: 10px; font-weight: 800; text-align: right; }
        .admin-mesa-pedido-mini p { margin: 0; color: #44403c; font-size: 11px; font-weight: 800; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .admin-mesa-pedido-mini b { display: block; margin-top: 4px; color: #16a34a; font-size: 12px; }
        .admin-mesa-vacia { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 86px; border: 1px dashed #fed7aa; border-radius: 16px; background: #fff7ed; color: #9a3412; font-size: 12px; font-weight: 900; text-align: center; }
        .admin-mesa-ver { width: 100%; padding: 10px 12px; border-radius: 14px; font-size: 12px; }
        .admin-mesa-ver:disabled { opacity: 0.42; cursor: not-allowed; }
        .admin-mesa-total { display: flex; align-items: center; justify-content: space-between; gap: 8px; border-top: 1px dashed #fed7aa; padding-top: 7px; }
        .admin-mesa-total span { color: #78716c; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .admin-mesa-total strong { color: #16a34a; font-size: 14px; }
        .admin-mesa-modal-backdrop { position: fixed; inset: 0; z-index: 80; background: rgba(28,25,23,0.58); display: flex; align-items: center; justify-content: center; padding: 14px; }
        .admin-mesa-modal { width: min(860px, 100%); max-height: 92vh; overflow: hidden; border-radius: 24px; background: #fff7ed; border: 1px solid #fed7aa; box-shadow: 0 24px 70px rgba(0,0,0,0.28); display: flex; flex-direction: column; }
        .admin-mesa-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; background: linear-gradient(135deg, #fff, #fffbeb); border-bottom: 1px solid #fed7aa; }
        .admin-mesa-modal-head span { color: #ea580c; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
        .admin-mesa-modal-head h3 { margin: 1px 0; color: #7c2d12; font-size: 26px; font-family: 'Fraunces', serif; }
        .admin-mesa-modal-head p { margin: 0; color: #78716c; font-weight: 800; font-size: 13px; }
        .admin-mesa-modal-body { padding: 14px; overflow-y: auto; }

        .editar-pedido-modal { width: min(760px, 100%); }
        .editar-pedido-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .editar-pedido-form label { display: grid; gap: 6px; color: #7c2d12; font-size: 12px; font-weight: 900; }
        .editar-pedido-form input,
        .editar-pedido-form select,
        .editar-pedido-form textarea { width: 100%; border: 1.5px solid #fed7aa; border-radius: 14px; padding: 11px 12px; background: #fff; color: #1c1917; font-size: 14px; font-weight: 800; outline: none; }
        .editar-pedido-form input:focus,
        .editar-pedido-form select:focus,
        .editar-pedido-form textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.14); }
        .editar-pedido-form-full { grid-column: 1 / -1; }
        .editar-pedido-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px 16px; border-top: 1px solid #fed7aa; background: #fff7ed; }
        @media (max-width: 620px) { .editar-pedido-form { grid-template-columns: 1fr; } .editar-pedido-actions { flex-direction: column; } .editar-pedido-actions .button { width: 100%; } }
        @media (max-width: 620px) { .admin-mesas-hoy-card { padding: 10px; border-radius: 20px; } .admin-mesas-hoy-title { align-items: flex-start; } .admin-mesas-toggle { padding: 7px 8px; font-size: 10px; } .admin-mesas-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .admin-mesa-card { min-height: auto; padding: 9px; border-radius: 16px; } .admin-mesa-card-head strong { width: 38px; height: 38px; border-radius: 13px; font-size: 16px; } .admin-mesa-card-head span { padding: 5px 7px; font-size: 10px; } .admin-mesa-pedido-mini { padding: 7px; } .admin-mesa-ver { padding: 8px 9px; font-size: 11px; } .admin-mesa-total { flex-direction: column; align-items: flex-start; gap: 2px; } .admin-mesa-card.mesa-sola { max-width: none; } .admin-mesa-modal-backdrop { align-items: stretch; padding: 8px; } .admin-mesa-modal { max-height: 96vh; border-radius: 20px; } .admin-mesa-modal-head { align-items: flex-start; flex-direction: column; } .admin-mesa-modal-head .button { width: 100%; } }
        @media (max-width: 390px) { .admin-mesas-grid { grid-template-columns: 1fr; } .admin-mesa-card.mesa-sola { grid-column: auto; } }


        .pedido-cocina { border: 1px solid #fed7aa; background: #fff; border-radius: 26px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); overflow: hidden; animation: fadeInUp 0.25s ease; }
        .pedido-sin-revisar { border: 3px solid #f79e1c; box-shadow: 0 12px 34px rgba(247,158,28,0.22); }
        .pedido-finalizado { opacity: 1; }
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
        .pedido-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 14px; }
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


        .rafiki-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(28, 25, 23, 0.58);
          backdrop-filter: blur(6px);
        }
        .rafiki-modal-card {
          width: min(440px, 100%);
          background: #fffaf3;
          border: 1px solid #fed7aa;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 26px 60px rgba(28, 25, 23, 0.28);
          text-align: center;
          color: #292524;
          animation: rafikiModalIn .16s ease-out;
        }
        .rafiki-modal-icon {
          width: 62px;
          height: 62px;
          margin: 0 auto 12px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          background: #ffedd5;
          border: 1px solid #fdba74;
          font-size: 30px;
        }
        .rafiki-modal-card h3 {
          margin: 0 0 10px;
          font-family: 'Fraunces', serif;
          font-size: 25px;
          line-height: 1.1;
          color: #1c1917;
        }
        .rafiki-modal-message {
          margin: 0 auto 18px;
          color: #57534e;
          font-weight: 750;
          line-height: 1.45;
          white-space: normal;
        }
        .rafiki-modal-message p { margin: 0 0 5px; }
        .rafiki-modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .rafiki-modal-actions .button { margin: 0; width: 100%; }
        .rafiki-modal-confirm.rafiki-modal-eliminar,
        .rafiki-modal-confirm.rafiki-modal-irreversible {
          background: #b91c1c;
          color: #fff;
          box-shadow: 0 10px 24px rgba(185, 28, 28, 0.24);
        }
        .rafiki-modal-confirm.rafiki-modal-advertencia {
          background: #f97316;
          color: #fff;
          box-shadow: 0 10px 24px rgba(249, 115, 22, 0.24);
        }
        .rafiki-modal-card.rafiki-modal-eliminar .rafiki-modal-icon,
        .rafiki-modal-card.rafiki-modal-irreversible .rafiki-modal-icon {
          background: #fee2e2;
          border-color: #fecaca;
        }
        .rafiki-modal-card.rafiki-modal-advertencia .rafiki-modal-icon {
          background: #ffedd5;
          border-color: #fdba74;
        }
        @keyframes rafikiModalIn {
          from { transform: translateY(10px) scale(.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        
.caja-gasto-detalle-sub {
  padding: 6px 0 6px 14px;
  margin-left: 8px;
  font-size: 12px;
  border-bottom: 1px dashed #f1f5f9;
}

.caja-gasto-detalle-sub > div > strong,
.caja-gasto-detalle-sub > strong {
  font-size: 12px;
}

.caja-gasto-detalle-sub span {
  font-size: 11px;
}

.caja-informe-title-row {
  align-items: flex-start;
}

.caja-informe-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}

.caja-detalle-compacto,
.caja-ajustes-compacto,
.caja-historial-resumen {
  border: 1px solid #f1f5f9;
  border-radius: 18px;
  padding: 12px;
  background: #ffffff;
}

.caja-detalle-compacto .btn,
.caja-historial-resumen .btn,
.caja-ajustes-actions .btn {
  justify-self: start;
}

.caja-ajustes-resumen {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.caja-ajustes-resumen span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  border: 1px solid #ffedd5;
  background: #fff7ed;
  color: #57534e;
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 850;
}

.caja-ajustes-resumen strong {
  color: #9a3412;
}

.caja-resultado-final {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1.5px solid #fed7aa;
  border-radius: 18px;
  padding: 0 12px;
  background: #fffbeb;
}

.caja-resultado-final .caja-informe-row {
  flex: 1;
  border: 0;
}

.caja-arqueo-historial-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  border-bottom: 1px dashed #f1f5f9;
  padding: 8px 0 8px 14px;
  margin-left: 8px;
  font-size: 12px;
}

.caja-arqueo-historial-row > div {
  display: grid;
  gap: 2px;
}

.caja-arqueo-historial-row > div > strong,
.caja-arqueo-historial-row > strong {
  color: #111827;
  font-size: 12px;
}

.caja-arqueo-historial-row span {
  color: #57534e;
  font-size: 11px;
  font-weight: 700;
}


.module-error-card {
  border-color: #fecaca;
  background: linear-gradient(135deg, #ffffff, #fff7ed);
}

.module-error-card-compact {
  padding: 18px;
}

.module-error-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.module-error-icon {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #ffedd5;
  color: #9a3412;
  font-size: 24px;
  flex: 0 0 auto;
}

.module-error-header h2 {
  margin-bottom: 6px;
  color: #9a3412;
  font-family: 'Fraunces', serif;
}

.module-error-details {
  margin: 16px 0;
  border: 1px dashed #fed7aa;
  background: #fff7ed;
  border-radius: 18px;
  padding: 12px 14px;
}

.module-error-details summary {
  font-weight: 900;
  color: #9a3412;
  cursor: pointer;
}

.module-error-details pre {
  margin: 12px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  background: #fef2f2;
  color: #7f1d1d;
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  max-height: 220px;
  overflow: auto;
}

.module-error-actions {
  justify-content: flex-start;
}

@media (max-width: 900px) {
          .topbar, .layout, .grid-2, .pedido-top, .pedido-actions, .bottom-summary, .admin-top-row, .admin-actions-stack, .contador-sin-revisar, .alerta-pedido-nuevo, .admin-stats, .rafiki-modal-actions { grid-template-columns: 1fr; display: grid; }
          .topbar { display: block; }
          .topbar h1 { font-size: clamp(28px, 9vw, 40px); }
          .nav { margin-top: 16px; width: 100%; overflow-x: auto; justify-content: flex-start; -webkit-overflow-scrolling: touch; }
          .nav-wrap { flex-wrap: nowrap; }
          .nav button { flex: 0 0 auto; padding: 11px 14px; font-size: 13px; }
          .mesa-pos-header { align-items: flex-start; flex-direction: column; }
          .mesa-step-strip { top: 4px; grid-template-columns: 1fr; }
          .mesas-panel-layout { padding-top: 54px; }
          .mesa-step-nav { top: 4px; width: calc(100vw - 16px); grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 6px; border-radius: 16px; }
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
/* Fase 19A1: cabecera compacta de Pedidos de hoy */
.admin-top-row-compact {
  align-items: center;
  margin-bottom: 10px;
}

.admin-title-compact h2 {
  margin-bottom: 4px;
}

.admin-title-compact p {
  margin-bottom: 0;
}

.admin-actions-line {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-action-button {
  min-height: 38px;
  padding: 9px 12px;
  border-radius: 13px;
  white-space: nowrap;
}

.realtime-dot {
  width: 12px;
  height: 12px;
  display: inline-flex;
  flex: 0 0 12px;
  border-radius: 999px;
  border: 2px solid #ffffff;
  background: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.35);
}

.realtime-conectado {
  background: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.26);
}

.realtime-conectando,
.realtime-reconectando {
  background: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.28);
}

.realtime-inactivo,
.realtime-error {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.24);
}

@media (max-width: 720px) {
  .admin-actions-line {
    width: 100%;
    justify-content: flex-start;
  }

  .admin-actions-line .admin-action-button {
    flex: 1 1 130px;
  }
}

/* Fase 21E2: Catálogo con tarjetas seleccionables tipo /cliente */
.catalogo-selector-tarjetas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.catalogo-selector-card {
  width: 100%;
  border: 1.5px solid #e7e5e4;
  background: #ffffff;
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  color: #292524;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.catalogo-selector-card:hover {
  transform: translateY(-1px);
  border-color: #fdba74;
  box-shadow: 0 12px 26px rgba(249, 115, 22, 0.12);
}

.catalogo-selector-card.active {
  border-color: #f97316;
  background: linear-gradient(135deg, #fff7ed, #ffffff);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12), 0 14px 28px rgba(249, 115, 22, 0.14);
}

.catalogo-selector-icono {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  font-size: 22px;
  flex: 0 0 auto;
}

.catalogo-selector-card strong,
.catalogo-selector-card small {
  display: block;
}

.catalogo-selector-card strong {
  font-size: 16px;
  font-weight: 950;
}

.catalogo-selector-card small {
  margin-top: 3px;
  color: #78716c;
  font-weight: 800;
}

.catalogo-busqueda-field {
  background: #ffffff;
  border: 1.5px solid #e7e5e4;
  border-radius: 18px;
  padding: 12px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

/* Fase 19A10: Catálogo optimizado para celular */
.catalogo-busqueda {
  min-width: 240px;
}

.catalogo-cards-mobile {
  display: none;
}

.catalogo-precio-rapido {
  width: 110px;
  min-width: 90px;
  border: 1.5px solid #fed7aa;
  border-radius: 12px;
  padding: 7px 8px;
  font-weight: 800;
  background: #fffaf5;
}

@media (max-width: 720px) {
  .catalogo-rafa {
    padding: 12px !important;
    border-radius: 16px !important;
  }

  .catalogo-rafa .admin-top-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .catalogo-rafa .admin-top-row .button {
    width: 100%;
  }

  .catalogo-selector-tarjetas {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .catalogo-selector-card {
    padding: 13px;
    border-radius: 16px;
  }

  .catalogo-busqueda {
    min-width: 0;
    width: 100%;
  }

  .catalogo-tabla-desktop {
    display: none;
  }

  .catalogo-cards-mobile {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-top: 12px;
  }

  .catalogo-card {
    background: #fff;
    border: 1px solid #fed7aa;
    border-radius: 14px;
    padding: 10px;
    box-shadow: 0 8px 18px rgba(0,0,0,0.04);
  }

  .catalogo-card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }

  .catalogo-card-head strong {
    line-height: 1.25;
    min-width: 0;
    flex: 1 1 auto;
  }

  .catalogo-card-head .badge {
    flex: 0 0 auto;
    padding: 4px 8px;
    font-size: 11.5px;
  }

  .catalogo-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .catalogo-card-meta span {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 999px;
    padding: 5px 8px;
    font-size: 12px;
    color: #7c2d12;
  }

  .catalogo-card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .catalogo-card-actions .button {
    width: auto;
    min-height: 32px;
    padding: 6px 9px;
    font-size: 12px;
    line-height: 1.1;
    flex: 0 0 auto;
  }

  .catalogo-precio-rapido {
    width: 100%;
  }
}

.catalogo-tabla-desktop .badge,
.catalogo-card .badge {
  color: #111827 !important;
}

.catalogo-tabla-desktop .badge-finalizado,
.catalogo-card .badge-finalizado {
  background: #dcfce7;
  border-color: #86efac;
}

.catalogo-tabla-desktop .badge-pendiente,
.catalogo-card .badge-pendiente {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #111827 !important;
}



.catalogo-resumen-mini {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.catalogo-resumen-mini span {
  border: 1px solid #bbf7d0;
  background: #ffffff;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12.5px;
  color: #166534;
}

.catalogo-filtros-avanzados {
  display: grid;
  grid-template-columns: minmax(220px, 1.7fr) minmax(150px, 1fr) minmax(150px, 0.9fr) minmax(150px, 0.9fr) auto;
  gap: 10px;
  align-items: end;
}

.catalogo-filtros-avanzados .field,
.catalogo-filtros-avanzados .field-label {
  margin: 0;
}

.catalogo-limpiar-filtros {
  min-height: 42px;
  white-space: nowrap;
}

@media (max-width: 820px) {
  .catalogo-filtros-avanzados {
    grid-template-columns: 1fr;
  }

  .catalogo-limpiar-filtros {
    width: 100%;
  }
}

.caja-admin {
  display: grid;
  gap: 16px;
}

.caja-header h2,
.caja-intro h2,
.caja-cuadre-card h2 {
  margin-top: 0;
}

.caja-tabs {
  margin-bottom: 0;
}

.caja-formulario {
  display: grid;
  gap: 16px;
}

.caja-resumen-visual {
  display: grid;
  grid-template-columns: repeat(6, minmax(145px, 1fr));
  gap: 10px;
}

.caja-resumen-card {
  display: grid;
  gap: 4px;
  min-height: 104px;
  align-content: center;
  border-color: #ffedd5;
  background: linear-gradient(180deg, #ffffff, #fffaf3);
}

.caja-resumen-card span {
  color: #78716c;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.caja-resumen-card strong {
  color: #1c1917;
  font-size: 18px;
  line-height: 1.15;
}

.caja-resumen-card small {
  color: #78716c;
  font-weight: 800;
  line-height: 1.25;
}

.caja-resumen-ingreso strong,
.caja-movimiento-ingreso strong {
  color: #15803d;
}

.caja-resumen-egreso strong,
.caja-movimiento-egreso strong {
  color: #b91c1c;
}

.caja-resumen-diferencia {
  border-width: 1.5px;
}

.caja-resumen {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.caja-grid-principal {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.caja-bloque h3 {
  margin: 0 0 4px;
}

.caja-section-title {
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 12px;
}

.caja-total-bloque {
  display: inline-flex;
  justify-content: center;
  min-width: 120px;
  border: 1px solid #fed7aa;
  background: #fff7ed;
  color: #c2410c;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 15px;
}

.caja-denominaciones {
  display: grid;
  gap: 8px;
}

.caja-denominacion-row {
  display: grid;
  grid-template-columns: minmax(88px, 0.8fr) minmax(70px, 0.65fr) auto minmax(110px, 1fr);
  gap: 8px;
  align-items: center;
  border: 1px solid #e7e5e4;
  background: #fff;
  border-radius: 14px;
  padding: 8px;
}

.caja-denominacion-row span {
  color: #57534e;
  font-weight: 900;
  font-size: 13px;
}

.caja-denominacion-row input,
.caja-cuentas-grid input {
  width: 100%;
  border: 1.5px solid #e7e5e4;
  background: #fafaf9;
  border-radius: 12px;
  padding: 10px 11px;
  outline: none;
  font-family: inherit;
  font-weight: 900;
}

.caja-denominacion-row input:focus,
.caja-cuentas-grid input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
  background: #fff;
}

.caja-denominacion-row strong {
  text-align: right;
  color: #111827;
}

.caja-moneditas-row {
  border-color: #fed7aa;
  background: #fffbeb;
}

.caja-cuentas-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.caja-metodos-lista {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.caja-metodo-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border: 1px solid #e7e5e4;
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px;
}

.caja-metodo-row span {
  font-weight: 800;
  color: #57534e;
}

.caja-metodo-row strong {
  color: #111827;
}

.caja-estado-ok {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.caja-estado-warning {
  border-color: #fde68a;
  background: #fffbeb;
}

.caja-estado-danger {
  border-color: #fecaca;
  background: #fef2f2;
}


.caja-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.caja-fecha-field {
  min-width: 170px;
}

.caja-fecha-field input {
  border: 1.5px solid #fed7aa;
  border-radius: 12px;
  padding: 10px 12px;
  font-family: inherit;
  font-weight: 900;
}

.caja-informe-lista,
.caja-informe-bloque {
  display: grid;
  gap: 8px;
}

.caja-informe-row,
.caja-gasto-detalle-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding: 10px 0;
}

.caja-informe-row span,
.caja-gasto-detalle-row span {
  color: #57534e;
  font-weight: 800;
}

.caja-informe-row.fuerte {
  border-top: 1.5px solid #fed7aa;
  border-bottom: 1.5px solid #fed7aa;
  margin-top: 4px;
  padding: 12px 0;
}

.caja-saldos-detalle {
  display: grid;
  gap: 2px;
  padding: 0 0 4px 12px;
}

.caja-informe-row.detalle {
  border-bottom: 0;
  padding: 3px 0;
  gap: 10px;
}

.caja-informe-row.detalle span,
.caja-informe-row.detalle strong {
  color: #78716c;
  font-size: 12px;
  font-weight: 750;
}

.caja-informe-row.detalle span::before {
  content: "+ ";
  color: #fb923c;
  font-weight: 900;
}

.caja-ultimo-arqueo-saldos .caja-informe-row.detalle span,
.caja-ultimo-arqueo-saldos .caja-informe-row.detalle strong {
  font-size: 11.5px;
}

.caja-informe-row strong,
.caja-gasto-detalle-row strong {
  color: #111827;
  white-space: nowrap;
}

.caja-gasto-detalle-row > div {
  display: grid;
  gap: 2px;
}

.caja-gasto-detalle-row > div > strong {
  white-space: normal;
}

.caja-gasto-detalle-row span {
  font-size: 12px;
  font-weight: 700;
}

.caja-informe-ok strong {
  color: #15803d;
}

.caja-informe-warning strong {
  color: #b45309;
}

.caja-informe-danger strong {
  color: #b91c1c;
}

.caja-formula,
.caja-sin-movimientos {
  margin: 10px 0 0;
}


.caja-gasto-detalle-sub {
  padding: 6px 0 6px 14px;
  margin-left: 8px;
  font-size: 12px;
  border-bottom: 1px dashed #f1f5f9;
}

.caja-gasto-detalle-sub > div > strong,
.caja-gasto-detalle-sub > strong {
  font-size: 12px;
}

.caja-gasto-detalle-sub span {
  font-size: 11px;
}

.caja-informe-title-row {
  align-items: flex-start;
}

.caja-informe-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}

.caja-arqueo-historial-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  border-bottom: 1px dashed #f1f5f9;
  padding: 8px 0 8px 14px;
  margin-left: 8px;
  font-size: 12px;
}

.caja-arqueo-historial-row > div {
  display: grid;
  gap: 2px;
}

.caja-arqueo-historial-row > div > strong,
.caja-arqueo-historial-row > strong {
  color: #111827;
  font-size: 12px;
}

.caja-arqueo-historial-row span {
  color: #57534e;
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .caja-resumen-visual {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .caja-informe-actions {
    width: 100%;
    justify-content: stretch;
  }

  .caja-informe-actions .btn {
    flex: 1;
  }

  .caja-header {
    flex-direction: column;
  }

  .caja-fecha-field {
    width: 100%;
  }

  .caja-grid-principal,
  .caja-cuentas-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .caja-resumen-visual {
    grid-template-columns: 1fr;
  }

  .caja-denominacion-row {
    grid-template-columns: minmax(76px, 0.9fr) minmax(58px, 0.7fr) auto minmax(90px, 1fr);
    gap: 6px;
    padding: 7px;
  }

  .caja-denominacion-row span,
  .caja-denominacion-row strong {
    font-size: 12px;
  }

  .caja-total-bloque {
    width: 100%;
  }

  .caja-resultado-final {
    align-items: stretch;
    flex-direction: column;
    padding: 8px 12px 12px;
  }
}


.pedidos-carga-resumen {
  display: grid;
  gap: 6px;
  margin: 10px 0 16px;
  padding: 12px 14px;
  border: 1px solid #fed7aa;
  border-radius: 18px;
  background: #fffaf0;
}

.pedidos-carga-resumen p {
  margin: 0;
}

.pedidos-carga-aviso {
  color: #9a3412;
  font-weight: 900;
}

.pedidos-cargar-mas-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 16px 0 20px;
  padding: 16px;
  border: 1px solid #fed7aa;
  border-radius: 22px;
  background: linear-gradient(135deg, #fff7ed, #fffbeb);
}

.pedidos-cargar-mas-box strong {
  display: block;
  color: #9a3412;
  font-family: 'Fraunces', serif;
  font-size: 18px;
  margin-bottom: 4px;
}

.pedidos-cargar-mas-box p {
  margin: 0;
}

@media (max-width: 640px) {
  .pedidos-cargar-mas-box {
    align-items: stretch;
    flex-direction: column;
  }

  .pedidos-cargar-mas-box .button {
    width: 100%;
  }
}


/* Fase 31E - Pedidos Hoy más limpio */
.pedidos-hoy-tabs { margin-top: 8px; margin-bottom: 18px; }
.pedidos-filtros-card { margin-bottom: 10px; }
.pedidos-filtros-resumen-colapsado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 0 12px;
  padding: 10px 12px;
  border: 1px dashed #fdba74;
  border-radius: 16px;
  background: #fffaf0;
  color: #9a3412;
  font-size: 12px;
  font-weight: 900;
}
.pedidos-filtros-resumen-colapsado .mini-btn { width: auto; margin-bottom: 0; }
.td-codigo .rafiki-badge { margin-top: 5px; }
.td-acciones-compactas { min-width: 124px; position: relative; }
.td-acciones-compactas .accion-principal-pedido { margin-bottom: 6px; }
.td-acciones-compactas .rafiki-action-menu,
.td-acciones-compactas .rafiki-action-menu-trigger { width: 100%; }
.td-acciones-compactas .rafiki-action-menu-trigger { margin-bottom: 0; }
.td-acciones-compactas .rafiki-action-menu-list { min-width: 196px; }

@media (max-width: 640px) {
  .pedidos-filtros-resumen-colapsado { align-items: stretch; flex-direction: column; }
  .pedidos-filtros-resumen-colapsado .mini-btn { width: 100%; }
}


/* Fase 31A - Componentes visuales reutilizables Rafiki */
.rafiki-tabs {
  display: flex;
  gap: 8px;
  align-items: stretch;
  overflow-x: auto;
  padding: 6px;
  margin: 10px 0 14px;
  border: 1px solid #fed7aa;
  border-radius: 22px;
  background: rgba(255, 247, 237, 0.88);
}

.rafiki-tab {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 16px;
  padding: 10px 14px;
  background: transparent;
  color: #7c2d12;
  font-weight: 900;
  white-space: nowrap;
  box-shadow: none;
}

.rafiki-tab strong { font-size: 14px; }
.rafiki-tab small {
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #ffedd5;
  color: #9a3412;
  font-size: 11px;
  padding: 0 7px;
}

.rafiki-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #f97316, #f59e0b);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.22);
}

.rafiki-tab.active small { background: rgba(255,255,255,.24); color: #fff; }

.rafiki-ui-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10020;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(28, 25, 23, 0.56);
  backdrop-filter: blur(6px);
}

.rafiki-ui-modal-card {
  width: min(560px, 100%);
  max-height: min(86vh, 760px);
  display: flex;
  flex-direction: column;
  background: #fffaf3;
  border: 1px solid #fed7aa;
  border-radius: 28px;
  box-shadow: 0 26px 70px rgba(28, 25, 23, 0.3);
  overflow: hidden;
  animation: rafikiModalIn .16s ease-out;
}

.rafiki-ui-modal-lg { width: min(860px, 100%); }
.rafiki-ui-modal-sm { width: min(440px, 100%); }

.rafiki-ui-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 20px 22px 14px;
  border-bottom: 1px solid #fed7aa;
  background: linear-gradient(135deg, #fff7ed, #fffbeb);
}

.rafiki-ui-modal-header h3 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: 24px;
  color: #1c1917;
}

.rafiki-ui-modal-header p {
  margin: 6px 0 0;
  color: #57534e;
  font-weight: 800;
  line-height: 1.35;
}

.rafiki-ui-modal-close {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid #fed7aa;
  border-radius: 999px;
  background: #fff;
  color: #9a3412;
  font-size: 26px;
  font-weight: 900;
  box-shadow: none;
}

.rafiki-ui-modal-body {
  padding: 18px 22px;
  overflow: auto;
}

.rafiki-ui-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px 20px;
  border-top: 1px solid #fed7aa;
  background: #fffaf3;
}

.rafiki-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  line-height: 1;
  font-weight: 900;
  text-transform: capitalize;
  white-space: nowrap;
  border: 1px solid transparent;
}

.rafiki-badge-success { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
.rafiki-badge-warning { background: #ffedd5; color: #9a3412; border-color: #fed7aa; }
.rafiki-badge-danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
.rafiki-badge-info { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
.rafiki-badge-neutral { background: #f5f5f4; color: #57534e; border-color: #e7e5e4; }

.rafiki-action-menu { position: relative; display: inline-flex; }
.rafiki-action-menu-trigger { min-width: 94px; }

.rafiki-action-menu-list {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 60;
  min-width: 178px;
  display: grid;
  gap: 4px;
  padding: 7px;
  border: 1px solid #fed7aa;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 16px 34px rgba(28, 25, 23, 0.18);
}

.rafiki-action-menu-list.align-left { left: 0; right: auto; }

.rafiki-action-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #44403c;
  padding: 9px 10px;
  text-align: left;
  font-weight: 900;
  box-shadow: none;
}

.rafiki-action-menu-item:hover:not(:disabled) { background: #fff7ed; color: #9a3412; }
.rafiki-action-menu-item.is-success { color: #166534; }
.rafiki-action-menu-item.is-danger { color: #991b1b; }
.rafiki-action-menu-item.is-info { color: #1d4ed8; }

.rafiki-empty-state {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 140px;
  padding: 24px;
  border: 1px dashed #fed7aa;
  border-radius: 20px;
  background: #fffaf0;
  text-align: center;
  color: #57534e;
}

.rafiki-empty-state-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: #ffedd5;
  font-size: 28px;
}

.rafiki-empty-state strong {
  color: #9a3412;
  font-family: 'Fraunces', serif;
  font-size: 19px;
}

.rafiki-empty-state p { max-width: 420px; margin: 0; font-weight: 800; }
.rafiki-empty-state-action { margin-top: 6px; }

@media (max-width: 640px) {
  .rafiki-tabs { margin-left: -2px; margin-right: -2px; }
  .rafiki-tab { padding: 9px 11px; }
  .rafiki-ui-modal-backdrop { align-items: flex-end; padding: 10px; }
  .rafiki-ui-modal-card { max-height: 92vh; border-radius: 24px; }
  .rafiki-ui-modal-header, .rafiki-ui-modal-body, .rafiki-ui-modal-footer { padding-left: 16px; padding-right: 16px; }
  .rafiki-ui-modal-footer { flex-direction: column-reverse; }
  .rafiki-ui-modal-footer .button, .rafiki-ui-modal-footer .mini-btn { width: 100% !important; }
}

`;
