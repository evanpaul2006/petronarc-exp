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
  TOTAL_COMPONENTS,
  TOTAL_ESTIMATED_COST,
  type IconKey,
  type SystemId,
} from "./kart-systems";
import { ENVIRONMENT_THEMES, type EnvironmentThemeId } from "./kart-environment";
import styles from "./dashboard.module.css";

interface GlyphProps {
  icon: IconKey;
  size?: number;
}

function SystemGlyph({ icon, size = 30 }: GlyphProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "brake":
      return (
        <svg {...common}>
          <circle cx="15" cy="16" r="10" />
          <circle cx="15" cy="16" r="3.5" />
          <path d="M22 8.5c4 1.8 5.6 5.2 5.6 9.2 0 3.6-1.5 6.4-4.3 8.3l-3-4.4c1.4-1 2.1-2.4 2.1-4.2 0-2-.8-3.4-2.5-4.4Z" />
          <path d="M15 6v3M15 23v3M5 16h3M11.5 12.5l-2-2M11.5 19.5l-2 2M18.5 12.5l2-2M18.5 19.5l2 2" />
        </svg>
      );
    case "chassis":
      return (
        <svg {...common}>
          <path d="m4 21 5-10 14-4 5 13-13 6Z" />
          <path d="M9 11 15 26M23 7 15 26M4 21h24M9 11l14 9M23 7 4 21" />
        </svg>
      );
    case "steering":
      return (
        <svg {...common}>
          <circle cx="16" cy="15" r="11" />
          <circle cx="16" cy="15" r="2.8" />
          <path d="m8 8 6 5M24 8l-6 5M16 18v8" />
        </svg>
      );
    case "suspension":
      return (
        <svg {...common}>
          <path d="m10 4 12 4-12 4 12 4-12 4 12 4-12 4" />
          <path d="M8 3h16M8 29h16M16 4v-2M16 30v-2" />
        </svg>
      );
    case "wheels":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="12" />
          <circle cx="16" cy="16" r="7.5" />
          <circle cx="16" cy="16" r="2" />
          <path d="m16 8 1.4 6.2 5.9-2.2-4.8 4 4.8 4-5.9-2.2L16 24l-1.4-6.2L8.7 20l4.8-4-4.8-4 5.9 2.2Z" />
        </svg>
      );
    case "electrical":
      return (
        <svg {...common}>
          <path d="M18.5 2 7 18h8l-1.5 12L25 13h-8Z" />
        </svg>
      );
    case "engine":
      return (
        <svg {...common}>
          <path d="M5 12h4l3-4h9l3 4h3v12H9l-4-4Z" />
          <path d="M2 15v6M30 14v7M14 8V5h7M13 15h8v6h-8z" />
        </svg>
      );
    case "seat":
      return (
        <svg {...common}>
          <path d="M12 4c4 0 6 2 6 6v7l5 3v7H8v-4l4-5Z" />
          <path d="M12 18h6M9 27l-2 3M22 27l2 3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="m5 26 9-9M18 13l9-9M22 3l7 7M4 20l8 8" />
          <path d="M13 7a6 6 0 0 0 8 8l-6 6-8-8 6-6Z" />
        </svg>
      );
  }
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function PanelLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

function PanelRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M8 11h.01M12 11h4" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18-5h-3a2 2 0 0 0-2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 14h6v6m10-10h-6V4M4 10h6V4m10 10h-6v6" />
    </svg>
  );
}

function CyberIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
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
      {!compact && <small>EXPENSE INTELLIGENCE</small>}
    </div>
  );
}

export default function PetronarcDashboard() {
  const [selectedId, setSelectedId] = useState<SystemId>("brake");
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
  const [query, setQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);
  const [isDetailPanelClosed, setIsDetailPanelClosed] = useState(false);
  const [isFocusedBadgeClosed, setIsFocusedBadgeClosed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [environmentTheme, setEnvironmentTheme] = useState<EnvironmentThemeId>("cyber");

  const searchRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("petronarc_env_theme") as EnvironmentThemeId;
      if (saved === "cyber" || saved === "studio") {
        setEnvironmentTheme(saved);
      }
    } catch {}
  }, []);

  function handleThemeChange(theme: EnvironmentThemeId) {
    setEnvironmentTheme(theme);
    try {
      localStorage.setItem("petronarc_env_theme", theme);
    } catch {}
  }

  const selected = getSystemById(selectedId);
  const selectedShare = (selected.estimatedCostInr / TOTAL_ESTIMATED_COST) * 100;

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return KART_SYSTEMS;
    return KART_SYSTEMS.filter((system) =>
      [system.name, system.shortName, ...system.aliases]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

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
      if (!alertsRef.current?.contains(target)) setIsAlertsOpen(false);
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
      setIsAlertsOpen(false);
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

  function selectSystem(id: SystemId, options?: { closeSearch?: boolean }) {
    setSelectedId(id);
    setFocusRequest((prev) => ({
      id,
      sequence: (prev?.sequence ?? 0) + 1,
    }));
    setIsDrawerOpen(false);
    setIsFocusedBadgeClosed(false);
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
      selectSystem(searchResults[activeResult].id, { closeSearch: true });
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
                  {system.componentCount} components
                  <i aria-hidden="true">•</i>
                  {formatInr(system.estimatedCostInr)}
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
        <span className={styles.liveDot} />
        <span>
          <strong>BUILD DATA ONLINE</strong>
          <small>Demo estimates · v1.0</small>
        </span>
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
        <div className={styles.routeLabel}>
          <span>GARAGE</span>
          <i>/</i>
          <strong>EXPENSE SHOWCASE</strong>
        </div>

        {/* Unified View Control Dock on Main Header */}
        <div
          className={styles.topbarControlDock}
          role="toolbar"
          aria-label="Layout and View Controls"
        >
          <button
            type="button"
            className={`${styles.dockButton} ${!isSidebarClosed ? styles.dockActive : ""}`}
            onClick={() => setIsSidebarClosed((prev) => !prev)}
            title={isSidebarClosed ? "Show Left Sidebar" : "Hide Left Sidebar"}
            aria-label="Toggle Left Sidebar"
            aria-pressed={!isSidebarClosed}
          >
            <PanelLeftIcon />
            <span>Sidebar</span>
          </button>

          <button
            type="button"
            className={`${styles.dockButton} ${!isDetailPanelClosed ? styles.dockActive : ""}`}
            onClick={() => setIsDetailPanelClosed((prev) => !prev)}
            title={isDetailPanelClosed ? "Show Details Panel" : "Hide Details Panel"}
            aria-label="Toggle Details Panel"
            aria-pressed={!isDetailPanelClosed}
          >
            <PanelRightIcon />
            <span>Details</span>
          </button>

          <button
            type="button"
            className={`${styles.dockButton} ${!isFocusedBadgeClosed ? styles.dockActive : ""}`}
            onClick={() => setIsFocusedBadgeClosed((prev) => !prev)}
            title={isFocusedBadgeClosed ? "Show Focused System Badge" : "Hide Focused System Badge"}
            aria-label="Toggle Focused System Badge"
            aria-pressed={!isFocusedBadgeClosed}
          >
            <BadgeIcon />
            <span>Badge</span>
          </button>

          <span className={styles.dockDivider} aria-hidden="true" />

          <button
            type="button"
            className={`${styles.dockButton} ${environmentTheme === "studio" ? styles.dockActive : ""}`}
            onClick={() => handleThemeChange(environmentTheme === "cyber" ? "studio" : "cyber")}
            title={`Switch to ${environmentTheme === "cyber" ? "Clean Studio" : "Cyber Paddock"} Environment`}
            aria-label="Toggle Canvas Environment Theme"
            aria-pressed={environmentTheme === "studio"}
          >
            {environmentTheme === "studio" ? <StudioIcon /> : <CyberIcon />}
            <span>{environmentTheme === "studio" ? "Studio" : "Cyber"}</span>
          </button>

          <span className={styles.dockDivider} aria-hidden="true" />

          <button
            type="button"
            className={`${styles.dockButton} ${isFullscreen ? styles.dockActive : ""}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter 3D Fullscreen"}
            aria-label="Toggle 3D Fullscreen"
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>

        <div className={styles.topbarActions}>
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
              placeholder="Search systems or components..."
              aria-label="Search systems or components"
              aria-controls="system-search-results"
              aria-expanded={isSearchActive}
              role="combobox"
              autoComplete="off"
            />
            <kbd>⌘ K</kbd>
            {isSearchActive && (
              <div
                className={styles.searchResults}
                id="system-search-results"
                role="listbox"
              >
                {searchResults.length ? (
                  searchResults.map((system, index) => (
                    <button
                      type="button"
                      key={system.id}
                      role="option"
                      aria-selected={index === activeResult}
                      className={index === activeResult ? styles.searchResultActive : ""}
                      onMouseEnter={() => setActiveResult(index)}
                      onClick={() => selectSystem(system.id, { closeSearch: true })}
                    >
                      <span className={styles.searchResultIcon}>
                        <SystemGlyph icon={system.icon} size={22} />
                      </span>
                      <span>
                        <strong>{system.name}</strong>
                        <small>{system.aliases.slice(0, 3).join(" · ")}</small>
                      </span>
                      <b>{formatInr(system.estimatedCostInr)}</b>
                    </button>
                  ))
                ) : (
                  <div className={styles.emptySearch}>
                    <SearchIcon />
                    <span>
                      <strong>No matching system</strong>
                      <small>Try “caliper”, “radiator” or “wiring”.</small>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.alertWrap} ref={alertsRef}>
            <button
              type="button"
              className={styles.alertButton}
              onClick={() => setIsAlertsOpen((open) => !open)}
              aria-label="Open budget alerts"
              aria-expanded={isAlertsOpen}
            >
              <BellIcon />
              <span />
            </button>
            {isAlertsOpen && (
              <div className={styles.alertPopover}>
                <div className={styles.popoverHead}>
                  <span>
                    <small>BUILD WATCH</small>
                    <strong>Budget alerts</strong>
                  </span>
                  <b>02</b>
                </div>
                <div className={styles.alertItem}>
                  <i className={styles.alertWarning}>!</i>
                  <span>
                    <strong>Suspension estimate revised</strong>
                    <small>Damper quote is 8% above the working target.</small>
                  </span>
                </div>
                <div className={styles.alertItem}>
                  <i className={styles.alertInfo}>i</i>
                  <span>
                    <strong>Engine quote pending</strong>
                    <small>Vendor confirmation is due this week.</small>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section
        className={`${styles.workspace} ${
          isDetailPanelClosed ? styles.workspaceDetailClosed : ""
        }`}
        aria-label="Go-kart expense showcase"
      >
        <div className={styles.primaryColumn}>
          <section className={styles.overviewPanel} aria-label="Build expense summary">
            <div className={styles.overviewIntro}>
              <span className={styles.eyebrow}>PROJECT OVERVIEW</span>
              <h1>BUILD INVESTMENT</h1>
              <p>Live architecture · illustrative expense data</p>
            </div>
            <div className={styles.totalMetric}>
              <span>Total estimated cost</span>
              <strong>{formatInr(TOTAL_ESTIMATED_COST)}</strong>
              <small>
                <i /> Demo estimate
              </small>
            </div>
            <div className={styles.metricDivider} />
            <div className={styles.smallMetric}>
              <span>Systems</span>
              <strong>{KART_SYSTEMS.length.toString().padStart(2, "0")}</strong>
              <small>Mapped</small>
            </div>
            <div className={styles.smallMetric}>
              <span>Components</span>
              <strong>{TOTAL_COMPONENTS}</strong>
              <small>Tracked</small>
            </div>
          </section>

          <section className={styles.explorerPanel}>
            <div className={styles.explorerHead}>
              <div>
                <span className={styles.sectionRule} />
                <span>
                  <small>INTERACTIVE OVERVIEW</small>
                  <strong>EXPLORE YOUR KART</strong>
                </span>
              </div>
              <p>
                <span className={styles.pointerIcon} aria-hidden="true" />
                Drag to orbit · scroll to zoom · select a marker
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
                  environmentTheme={environmentTheme}
                />
              </div>

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
                <b>{formatInr(selected.estimatedCostInr)}</b>
              </div>
            </div>
          </section>
        </div>

        <aside
          className={`${styles.detailPanel} ${
            isDetailPanelClosed ? styles.detailPanelClosed : ""
          }`}
          aria-live="polite"
          aria-hidden={isDetailPanelClosed}
        >
          <div className={styles.detailCorners} aria-hidden="true" />
          <div className={styles.detailHeader}>
            <span>
              <small>SELECTED SYSTEM</small>
              <i>SYS-{(KART_SYSTEMS.indexOf(selected) + 1).toString().padStart(2, "0")}</i>
            </span>
            <div className={styles.detailIdentity}>
              <span className={styles.detailGlyph}>
                <SystemGlyph icon={selected.icon} size={44} />
              </span>
              <span>
                <h2 id="focused-system-heading" tabIndex={-1}>
                  {selected.name}
                </h2>
                <p>{selected.description}</p>
              </span>
            </div>
          </div>

          <div className={styles.detailCost}>
            <span>
              <small>ESTIMATED SYSTEM COST</small>
              <strong>{formatInr(selected.estimatedCostInr)}</strong>
            </span>
            <div className={styles.costDonut} style={{ "--share": `${selectedShare * 3.6}deg` } as CSSProperties}>
              <span>{selectedShare.toFixed(1)}%</span>
            </div>
          </div>

          <div className={styles.componentList}>
            <div className={styles.detailSectionTitle}>
              <span>KEY COMPONENTS</span>
              <small>QTY</small>
            </div>
            <ul>
              {selected.keyComponents.map((component) => (
                <li key={component.name}>
                  <span>
                    <i />
                    {component.name}
                  </span>
                  <b>{component.quantity.toString().padStart(2, "0")}</b>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.blueprintCard}>
            <span className={styles.blueprintGrid} />
            <span className={styles.blueprintOrbit} />
            <span className={styles.blueprintAxisX} />
            <span className={styles.blueprintAxisY} />
            <span className={styles.blueprintGlyph}>
              <SystemGlyph icon={selected.icon} size={100} />
            </span>
            <span className={styles.blueprintLabel}>
              <small>ASSEMBLY PREVIEW</small>
              <b>{selected.componentCount} PARTS</b>
            </span>
          </div>

          <div className={styles.detailFoot}>
            <span>
              <i />
              Estimates are illustrative
            </span>
            <b>DATASET / V1</b>
          </div>
        </aside>
      </section>
    </main>
  );
}
