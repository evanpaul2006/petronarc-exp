"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import KartModel, { type FocusRequest } from "./kart-model";
import {
  formatInr,
  getSystemById,
  KART_SYSTEMS,
  type ExpenseItem,
  type SystemId,
} from "./kart-systems";
import { ENVIRONMENT_THEMES, type EnvironmentThemeId } from "./kart-environment";
import { useKartExpenses } from "./kart-expense-store";
import { SystemGlyph } from "./components/system-glyph";
import SystemLedgerView from "./components/system-ledger-view";
import ExpenseModal from "./components/expense-modal";
import ImageLightbox from "./components/image-lightbox";
import styles from "./dashboard.module.css";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function PanelLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

function PanelRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M8 11h.01M12 11h4" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18-5h-3a2 2 0 0 0-2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14h6v6m10-10h-6V4M4 10h6V4m10 10h-6v6" />
    </svg>
  );
}

function CyberIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function LedgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="13" y2="15" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function PetronarcMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? styles.brandCompact : styles.brand} aria-label="Petronarc">
      <span className={styles.officialMark} aria-hidden="true">
        <Image
          className={styles.officialLogoImage}
          src="/petronarc-logo-mark.png"
          alt=""
          fill
          sizes={compact ? "31px" : "44px"}
          priority
        />
      </span>
      {!compact && (
        <span className={styles.officialWordmark} aria-hidden="true">
          <Image
            className={styles.officialLogoImage}
            src="/petronarc-logo-wordmark.png"
            alt=""
            fill
            sizes="190px"
            priority
          />
        </span>
      )}
      {!compact && <small>EXPENSE TRACKER & LEDGER</small>}
    </div>
  );
}

export default function PetronarcDashboard() {
  const [selectedId, setSelectedId] = useState<SystemId>("brake");
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
  const [viewMode, setViewMode] = useState<"3d" | "ledger">("3d");
  const [query, setQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);
  const [isDetailPanelClosed, setIsDetailPanelClosed] = useState(false);
  const [isFocusedBadgeClosed, setIsFocusedBadgeClosed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [environmentTheme, setEnvironmentTheme] = useState<EnvironmentThemeId>("cyber");

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [modalEditingItem, setModalEditingItem] = useState<ExpenseItem | null>(null);
  const [lightboxItem, setLightboxItem] = useState<ExpenseItem | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  // Expense Store
  const {
    expenses,
    systemSummaries,
    systemCosts,
    systemItemCounts,
    grandTotal,
    totalComponents,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useKartExpenses();

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("petronarc_env_theme") as EnvironmentThemeId;
        if (saved === "cyber" || saved === "studio") {
          setEnvironmentTheme(saved);
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  function handleThemeChange(theme: EnvironmentThemeId) {
    setEnvironmentTheme(theme);
    try {
      localStorage.setItem("petronarc_env_theme", theme);
    } catch {}
  }

  const selected = getSystemById(selectedId);
  const selectedSummary = systemSummaries[selectedId] || {
    totalCostInr: 0,
    componentCount: 0,
    items: [],
  };
  const selectedCost = selectedSummary.totalCostInr;
  const selectedShare = grandTotal > 0 ? (selectedCost / grandTotal) * 100 : 0;

  // Search through systems AND specific component expenses
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return KART_SYSTEMS.map((s) => ({
        type: "system" as const,
        system: s,
        cost: systemCosts[s.id] || 0,
        count: systemItemCounts[s.id] || 0,
      }));
    }

    const matchedSystems = KART_SYSTEMS.filter((system) =>
      [system.name, system.shortName, ...system.aliases]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    ).map((s) => ({
      type: "system" as const,
      system: s,
      cost: systemCosts[s.id] || 0,
      count: systemItemCounts[s.id] || 0,
    }));

    const matchedExpenses = expenses
      .filter(
        (exp) =>
          exp.name.toLowerCase().includes(normalized) ||
          (exp.description && exp.description.toLowerCase().includes(normalized)) ||
          (exp.vendor && exp.vendor.toLowerCase().includes(normalized)),
      )
      .slice(0, 8)
      .map((exp) => ({
        type: "expense" as const,
        expense: exp,
        system: getSystemById(exp.systemId),
      }));

    return [...matchedSystems, ...matchedExpenses];
  }, [query, systemCosts, systemItemCounts, expenses]);

  function toggleFullscreen() {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (stageContainerRef.current?.requestFullscreen) {
        stageContainerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  useEffect(() => {
    function closeFloatingPanels(event: globalThis.PointerEvent) {
      const target = event.target as Node;
      if (!searchRef.current?.contains(target)) setIsSearchActive(false);
    }

    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (isFullscreen) {
        setIsFullscreen(false);
        return;
      }
      setIsSearchActive(false);
      setIsDrawerOpen(false);
    }

    document.addEventListener("pointerdown", closeFloatingPanels);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFloatingPanels);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFullscreen]);

  function selectSystem(id: SystemId, options?: { closeSearch?: boolean; openLedger?: boolean }) {
    setSelectedId(id);
    setFocusRequest((prev) => ({
      id,
      sequence: (prev?.sequence ?? 0) + 1,
    }));
    setIsDrawerOpen(false);
    setIsFocusedBadgeClosed(false);
    if (options?.openLedger) {
      setViewMode("ledger");
    }
    if (options?.closeSearch) {
      setQuery("");
      setIsSearchActive(false);
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsSearchActive(true);
      setActiveResult((current) =>
        searchResults.length ? (current + 1) % searchResults.length : 0,
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsSearchActive(true);
      setActiveResult((current) =>
        searchResults.length
          ? (current - 1 + searchResults.length) % searchResults.length
          : 0,
      );
    }
    if (event.key === "Enter" && isSearchActive && searchResults[activeResult]) {
      event.preventDefault();
      const item = searchResults[activeResult];
      if (item.type === "system") {
        selectSystem(item.system.id, { closeSearch: true });
      } else {
        selectSystem(item.expense.systemId, { closeSearch: true, openLedger: true });
      }
    }
  }

  const sidebarContent = (
    <>
      <div className={styles.sidebarTop}>
        <PetronarcMark />
        <button
          type="button"
          className={styles.drawerClose}
          onClick={() => setIsDrawerOpen(false)}
          aria-label="Close systems menu"
        >
          <CloseIcon />
        </button>
      </div>
      <div className={styles.systemsHeading}>
        <span />
        <p>SYSTEMS</p>
        <small>{KART_SYSTEMS.length.toString().padStart(2, "0")}</small>
      </div>
      <nav className={styles.systemNav} aria-label="Go-kart systems">
        {KART_SYSTEMS.map((system, index) => {
          const isActive = selectedId === system.id;
          const cost = systemCosts[system.id] || 0;
          const count = systemItemCounts[system.id] || 0;
          return (
            <button
              type="button"
              key={system.id}
              data-system-card={system.id}
              className={`${styles.systemCard} ${isActive ? styles.systemCardActive : ""}`}
              onClick={() => selectSystem(system.id)}
              aria-pressed={isActive}
              style={{ "--enter-delay": `${index * 35}ms` } as CSSProperties}
            >
              <span className={styles.systemIcon}>
                <SystemGlyph icon={system.icon} />
              </span>
              <span className={styles.systemCopy}>
                <strong>{system.shortName}</strong>
                <small>
                  {count} {count === 1 ? "part" : "parts"}
                  <i aria-hidden="true">•</i>
                  {formatInr(cost)}
                </small>
              </span>
              <span className={styles.cardChevron}>
                <ChevronIcon />
              </span>
            </button>
          );
        })}
      </nav>
      <div className={styles.sidebarFoot}>
        <div className={styles.sidebarBuildStatus}>
          <span className={styles.liveDot} />
          <span>
            <strong>REALTIME BUILD LEDGER</strong>
            <small>{expenses.length} entries tracked</small>
          </span>
        </div>
      </div>
    </>
  );

  return (
    <main
      className={`${styles.dashboard} ${
        isSidebarClosed ? styles.dashboardSidebarClosed : ""
      }`}
    >
      <aside
        className={`${styles.sidebar} ${isDrawerOpen ? styles.sidebarOpen : ""} ${
          isSidebarClosed ? styles.sidebarClosed : ""
        }`}
      >
        {sidebarContent}
      </aside>

      {isDrawerOpen && (
        <button
          type="button"
          className={styles.drawerScrim}
          onClick={() => setIsDrawerOpen(false)}
          aria-label="Close systems menu"
        />
      )}
      <header className={styles.topbar}>
        {/* Left Side: Mobile Menu Trigger & View Mode Switcher */}
        <div className={styles.topbarLeft}>
          <div className={styles.mobileBrandGroup}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open systems menu"
              aria-expanded={isDrawerOpen}
            >
              <MenuIcon />
            </button>
            <PetronarcMark compact />
          </div>

          {/* View Mode Switcher */}
          <div className={styles.viewModeSwitcher} role="tablist" aria-label="Dashboard View Mode">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "3d"}
              className={`${styles.viewModePill} ${viewMode === "3d" ? styles.viewModePillActive : ""}`}
              onClick={() => setViewMode("3d")}
              title="Interactive 3D Go-Kart Model View"
            >
              <CubeIcon />
              <span>3D Explorer</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "ledger"}
              className={`${styles.viewModePill} ${viewMode === "ledger" ? styles.viewModePillActive : ""}`}
              onClick={() => setViewMode("ledger")}
              title={`Expense Ledger (${selected.shortName})`}
            >
              <LedgerIcon />
              <span>System Ledger</span>
              {viewMode === "ledger" && (
                <span className={styles.activeSystemBadge}>
                  {selected.shortName}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Center: Precision Layout and Canvas Controls (visible in 3D mode) */}
        {viewMode === "3d" && (
          <div
            className={styles.topbarControlDock}
            role="toolbar"
            aria-label="View and Canvas Controls"
          >
            <div className={styles.dockButtonGroup} aria-label="Panels">
              <button
                type="button"
                className={`${styles.dockButton} ${!isSidebarClosed ? styles.dockActive : ""}`}
                onClick={() => setIsSidebarClosed((prev) => !prev)}
                title={isSidebarClosed ? "Show Left Sidebar (Systems)" : "Hide Left Sidebar"}
                aria-label="Toggle Left Sidebar"
                aria-pressed={!isSidebarClosed}
              >
                <PanelLeftIcon />
                <span className={styles.dockLabel}>Sidebar</span>
              </button>

              <button
                type="button"
                className={`${styles.dockButton} ${!isDetailPanelClosed ? styles.dockActive : ""}`}
                onClick={() => setIsDetailPanelClosed((prev) => !prev)}
                title={isDetailPanelClosed ? "Show System Details Panel" : "Hide System Details Panel"}
                aria-label="Toggle Details Panel"
                aria-pressed={!isDetailPanelClosed}
              >
                <PanelRightIcon />
                <span className={styles.dockLabel}>Details</span>
              </button>

              <button
                type="button"
                className={`${styles.dockButton} ${!isFocusedBadgeClosed ? styles.dockActive : ""}`}
                onClick={() => setIsFocusedBadgeClosed((prev) => !prev)}
                title={isFocusedBadgeClosed ? "Show 3D System Tag Badge" : "Hide 3D System Tag Badge"}
                aria-label="Toggle Focused System Badge"
                aria-pressed={!isFocusedBadgeClosed}
              >
                <BadgeIcon />
                <span className={styles.dockLabel}>Badge</span>
              </button>
            </div>

            <span className={styles.dockDivider} aria-hidden="true" />

            <button
              type="button"
              className={`${styles.dockButton} ${environmentTheme === "studio" ? styles.dockThemeStudio : styles.dockThemeCyber}`}
              onClick={() => handleThemeChange(environmentTheme === "cyber" ? "studio" : "cyber")}
              title={`Switch environment to ${environmentTheme === "cyber" ? "Clean Studio" : "Cyber Paddock"}`}
              aria-label={`Switch canvas theme from ${environmentTheme}`}
              aria-pressed={environmentTheme === "studio"}
            >
              {environmentTheme === "studio" ? <StudioIcon /> : <CyberIcon />}
              <span className={styles.dockLabel}>{environmentTheme === "studio" ? "Studio" : "Cyber"}</span>
            </button>

            <span className={styles.dockDivider} aria-hidden="true" />

            <button
              type="button"
              className={`${styles.dockButton} ${isFullscreen ? styles.dockActive : ""}`}
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Full Canvas View (Fullscreen)"}
              aria-label="Toggle Fullscreen"
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
              <span className={styles.dockLabel}>{isFullscreen ? "Exit" : "Full"}</span>
            </button>
          </div>
        )}

        {/* Right Side: Universal Search & Data Management */}
        <div className={styles.topbarRight}>
          {/* Omni Search */}
          <div className={styles.searchWrap} ref={searchRef}>
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveResult(0);
                setIsSearchActive(true);
              }}
              onFocus={() => setIsSearchActive(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search parts, receipts..."
              aria-label="Search systems, components, receipts"
              aria-controls="system-search-results"
              aria-expanded={isSearchActive}
              role="combobox"
              autoComplete="off"
            />
            <kbd>⌘K</kbd>
            {isSearchActive && (
              <div
                className={styles.searchResults}
                id="system-search-results"
                role="listbox"
              >
                {searchResults.length ? (
                  searchResults.map((res, index) => {
                    const isSelected = index === activeResult;
                    if (res.type === "system") {
                      return (
                        <button
                          type="button"
                          key={`sys_${res.system.id}`}
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.searchResultItem} ${isSelected ? styles.searchResultActive : ""}`}
                          onMouseEnter={() => setActiveResult(index)}
                          onClick={() => selectSystem(res.system.id, { closeSearch: true })}
                        >
                          <span className={styles.searchResultIcon}>
                            <SystemGlyph icon={res.system.icon} size={22} />
                          </span>
                          <span>
                            <strong>{res.system.name}</strong>
                            <small>{res.count} items recorded</small>
                          </span>
                          <b>{formatInr(res.cost)}</b>
                        </button>
                      );
                    } else {
                      return (
                        <button
                          type="button"
                          key={`exp_${res.expense.id}`}
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.searchResultItem} ${isSelected ? styles.searchResultActive : ""}`}
                          onMouseEnter={() => setActiveResult(index)}
                          onClick={() => selectSystem(res.expense.systemId, { closeSearch: true, openLedger: true })}
                        >
                          <span className={styles.searchResultIcon}>
                            <SystemGlyph icon={res.system.icon} size={22} />
                          </span>
                          <span>
                            <strong>{res.expense.name}</strong>
                            <small>{res.system.shortName}</small>
                          </span>
                          <b>{formatInr(res.expense.totalPriceInr)}</b>
                        </button>
                      );
                    }
                  })
                ) : (
                  <div className={styles.emptySearch}>
                    <SearchIcon />
                    <span>
                      <strong>No matching results</strong>
                      <small>Try &ldquo;caliper&rdquo;, &ldquo;chassis&rdquo;, or &ldquo;radiator&rdquo;.</small>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Area: Either 3D Explorer View OR System Ledger View */}
      {viewMode === "ledger" ? (
        <SystemLedgerView
          systemId={selectedId}
          onSwitchTo3D={() => setViewMode("3d")}
          expenses={expenses}
          grandTotal={grandTotal}
          totalComponents={totalComponents}
          onAddExpense={addExpense}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
        />
      ) : (
        <section
          className={`${styles.workspace} ${
            isDetailPanelClosed ? styles.workspaceDetailClosed : ""
          }`}
          aria-label="Go-kart expense tracker"
        >
          <div className={styles.primaryColumn}>
            {/* Overview Metric Panel */}
            <section className={styles.overviewPanel} aria-label="Build expense summary">
              <div className={styles.overviewIntro}>
                <span className={styles.eyebrow}>PROJECT LEDGER</span>
                <h1>BUILD INVESTMENT</h1>
                <p>Tracked component expenses across all {KART_SYSTEMS.length} systems</p>
              </div>
              <div className={styles.totalMetric}>
                <span>Total build investment</span>
                <strong>{formatInr(grandTotal)}</strong>
                <small>
                  <i /> {expenses.length} logged line items
                </small>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.smallMetric}>
                <span>Systems</span>
                <strong>{KART_SYSTEMS.length.toString().padStart(2, "0")}</strong>
                <small>Active</small>
              </div>
              <div className={styles.smallMetric}>
                <span>Components</span>
                <strong>{totalComponents}</strong>
                <small>Tracked</small>
              </div>
            </section>

            {/* 3D Explorer Canvas Stage */}
            <section className={styles.explorerPanel}>
              <div className={styles.explorerHead}>
                <div>
                  <span className={styles.sectionRule} />
                  <span>
                    <small>INTERACTIVE 3D LEDGER</small>
                    <strong>EXPLORE YOUR KART</strong>
                  </span>
                </div>
                <p>
                  <span className={styles.pointerIcon} aria-hidden="true" />
                  Drag to orbit · click marker to focus system expenses
                </p>
              </div>

              <div
                ref={stageContainerRef}
                className={`${styles.kartStage} ${
                  isFullscreen ? styles.kartStageFullscreen : ""
                } ${
                  environmentTheme === "studio" ? styles.kartStageStudio : ""
                }`}
              >
                <div
                  className={styles.stageEnvironmentDock}
                  role="radiogroup"
                  aria-label="3D Canvas Environment Theme"
                >
                  <button
                    type="button"
                    className={`${styles.stageEnvButton} ${
                      environmentTheme === "cyber" ? styles.stageEnvButtonActive : ""
                    }`}
                    onClick={() => handleThemeChange("cyber")}
                    role="radio"
                    aria-checked={environmentTheme === "cyber"}
                    title="Cyber Paddock (High-Tech Dark Grid Stage)"
                  >
                    <CyberIcon />
                    <span>CYBER PADDOCK</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.stageEnvButton} ${
                      environmentTheme === "studio" ? styles.stageEnvButtonActive : ""
                    }`}
                    onClick={() => handleThemeChange("studio")}
                    role="radio"
                    aria-checked={environmentTheme === "studio"}
                    title="Clean Studio (Pristine Showroom Stage)"
                  >
                    <StudioIcon />
                    <span>CLEAN STUDIO</span>
                  </button>
                </div>

                {isFullscreen && (
                  <button
                    type="button"
                    className={styles.stageFullscreenExit}
                    onClick={toggleFullscreen}
                    title="Exit Fullscreen (Esc)"
                    aria-label="Exit Fullscreen"
                  >
                    <MinimizeIcon />
                    <span>Exit Fullscreen</span>
                  </button>
                )}

                <div
                  className={`${styles.stageAtmosphere} ${
                    environmentTheme === "studio" ? styles.stageAtmosphereStudio : ""
                  }`}
                />
                <div
                  className={`${styles.stageGrid} ${
                    environmentTheme === "studio" ? styles.stageGridStudio : ""
                  }`}
                />
                <div
                  className={`${styles.orbitRingOne} ${
                    environmentTheme === "studio" ? styles.orbitRingStudio : ""
                  }`}
                />
                <div
                  className={`${styles.orbitRingTwo} ${
                    environmentTheme === "studio" ? styles.orbitRingStudio : ""
                  }`}
                />
                <div
                  className={`${styles.axisReadout} ${
                    environmentTheme === "studio" ? styles.axisReadoutStudio : ""
                  }`}
                  aria-hidden="true"
                >
                  <span>REALTIME 3D</span>
                  <b>{ENVIRONMENT_THEMES[environmentTheme].badgeLabel}</b>
                </div>

                <div className={styles.motionLayer}>
                  <KartModel
                    selectedId={selectedId}
                    focusRequest={focusRequest}
                    onSelectSystem={selectSystem}
                    systemCosts={systemCosts}
                    environmentTheme={environmentTheme}
                  />
                </div>

                {/* Focused System Floating Badge */}
                <div
                  className={`${styles.selectedTag} ${
                    isFocusedBadgeClosed ? styles.selectedTagClosed : ""
                  } ${
                    environmentTheme === "studio" ? styles.selectedTagStudio : ""
                  }`}
                >
                  <span className={styles.selectedTagGlyph}>
                    <SystemGlyph icon={selected.icon} size={20} />
                  </span>
                  <span>
                    <small>FOCUSED SYSTEM</small>
                    <strong>{selected.name}</strong>
                  </span>
                  <b>{formatInr(selectedCost)}</b>
                  <button
                    type="button"
                    className={styles.selectedTagLedgerBtn}
                    onClick={() => setViewMode("ledger")}
                    title={`Open ${selected.name} Full Ledger`}
                  >
                    Ledger →
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Detail / System Inspector Panel */}
          <aside
            className={`${styles.detailPanel} ${
              isDetailPanelClosed ? styles.detailPanelClosed : ""
            }`}
            aria-live="polite"
            aria-hidden={isDetailPanelClosed}
            inert={isDetailPanelClosed}
          >
            <header className={styles.detailHeader}>
              <div className={styles.detailIdentity}>
                <span className={styles.detailGlyph}>
                  <SystemGlyph icon={selected.icon} size={22} />
                </span>
                <h2 id="focused-system-heading" tabIndex={-1}>
                  {selected.name}
                </h2>
              </div>
              <p className={styles.detailDescription} title={selected.description}>
                {selected.description}
              </p>
            </header>

            <div className={styles.detailCost}>
              <span className={styles.detailCostLabel}>Spend</span>
              <span className={styles.detailShareValue}>{selectedShare.toFixed(1)}%</span>
              <strong className={styles.detailCostValue}>{formatInr(selectedCost)}</strong>
              <small className={styles.detailShareNote}>of build</small>
              <div
                className={styles.shareTrack}
                role="img"
                aria-label={`${selected.shortName} is ${selectedShare.toFixed(1)} percent of the ${formatInr(grandTotal)} build total`}
              >
                <i style={{ width: `${Math.min(100, selectedShare)}%` }} />
              </div>
            </div>

            {/* Components & Expense List for Selected System */}
            <div className={styles.componentList}>
              <div className={styles.detailSectionTitle}>
                <span>
                  Components
                  <small>{selectedSummary.items.length}</small>
                </span>
                <button
                  type="button"
                  className={styles.detailAddSmallBtn}
                  onClick={() => {
                    setModalEditingItem(null);
                    setIsExpenseModalOpen(true);
                  }}
                  title={`Add a component to ${selected.shortName}`}
                >
                  <PlusIcon />
                  Add
                </button>
              </div>

              {selectedSummary.items.length === 0 ? (
                <div className={styles.detailEmptyState}>
                  <p>Nothing logged yet</p>
                  <small>Add the first {selected.shortName} part to start tracking spend.</small>
                  <button
                    type="button"
                    className={styles.btnSecondarySmall}
                    onClick={() => {
                      setModalEditingItem(null);
                      setIsExpenseModalOpen(true);
                    }}
                  >
                    <PlusIcon />
                    Add first component
                  </button>
                </div>
              ) : (
                <ul className={styles.detailItemsList}>
                  {selectedSummary.items.map((item) => (
                    <li key={item.id} className={styles.detailItemRow}>
                      {item.images && item.images.length > 0 ? (
                        <button
                          type="button"
                          className={styles.detailThumbBtn}
                          onClick={() => setLightboxItem(item)}
                          title={`View bills attached to ${item.name}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.images[0].url} alt="" className={styles.detailThumbImg} />
                        </button>
                      ) : (
                        <span className={styles.detailItemQty} aria-hidden="true">
                          {item.quantity}
                          <i>x</i>
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.detailItemBody}
                        onClick={() => {
                          setModalEditingItem(item);
                          setIsExpenseModalOpen(true);
                        }}
                        aria-label={`Edit ${item.name}`}
                      >
                        <span className={styles.detailItemName}>{item.name}</span>
                        <span className={styles.detailItemSub}>
                          {item.quantity} × {formatInr(item.unitPriceInr)}
                          {item.vendor ? ` · ${item.vendor}` : ""}
                        </span>
                      </button>
                      <b className={styles.detailItemPrice}>{formatInr(item.totalPriceInr)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Open Full System Ledger Page Button */}
            <button
              type="button"
              className={styles.btnOpenFullLedger}
              onClick={() => setViewMode("ledger")}
            >
              <LedgerIcon />
              <span>Full ledger</span>
              <ChevronIcon />
            </button>
          </aside>
        </section>
      )}

      {/* Universal Add / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <ExpenseModal
          key={modalEditingItem?.id ?? `new-${selectedId}`}
          isOpen
          onClose={() => {
            setIsExpenseModalOpen(false);
            setModalEditingItem(null);
          }}
          defaultSystemId={selectedId}
          editingItem={modalEditingItem}
          onSave={(data) => {
            if (modalEditingItem) {
              updateExpense(modalEditingItem.id, data);
            } else {
              addExpense(data);
            }
          }}
        />
      )}

      {/* Image Lightbox Modal */}
      <ImageLightbox key={lightboxItem?.id} item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </main>
  );
}
