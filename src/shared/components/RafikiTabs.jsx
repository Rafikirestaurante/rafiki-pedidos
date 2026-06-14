import React from "react";

export default function RafikiTabs({ tabs = [], activeTab, onChange, className = "", ariaLabel = "Secciones" }) {
  const tabsVisibles = tabs.filter(Boolean);
  if (tabsVisibles.length === 0) return null;

  return (
    <div className={["rafiki-tabs", className].filter(Boolean).join(" ")} role="tablist" aria-label={ariaLabel}>
      {tabsVisibles.map((tab) => {
        const activo = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activo}
            className={`rafiki-tab ${activo ? "active" : ""}`}
            onClick={() => onChange?.(tab.id)}
          >
            {tab.icon ? <span aria-hidden="true">{tab.icon}</span> : null}
            <strong>{tab.label}</strong>
            {tab.count !== undefined && tab.count !== null ? <small>{tab.count}</small> : null}
          </button>
        );
      })}
    </div>
  );
}
