"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  formatInr,
  getSystemById,
  KART_SYSTEMS,
  TOTAL_COMPONENTS,
  TOTAL_ESTIMATED_COST,
  type IconKey,
  type SystemId,
} from "./kart-systems";
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
    case "safety":
      return (
        <svg {...common}>
          <path d="M16 3 27 7v8c0 7-4.6 11.6-11 14-6.4-2.4-11-7-11-14V7Z" />
          <path d="m10 16 4 4 8-9" />
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
  const [query, setQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, current: 0 });
  const dragXRef = useRef(0);

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

  useEffect(() => {
    function closeFloatingPanels(event: globalThis.PointerEvent) {
      const target = event.target as Node;
      if (!searchRef.current?.contains(target)) setIsSearchActive(false);
      if (!alertsRef.current?.contains(target)) setIsAlertsOpen(false);
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsSearchActive(false);
      setIsAlertsOpen(false);
      setIsDrawerOpen(false);
    }

    document.addEventListener("pointerdown", closeFloatingPanels);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFloatingPanels);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function selectSystem(id: SystemId, options?: { closeSearch?: boolean }) {
    setSelectedId(id);
    setIsDrawerOpen(false);
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

  function setMotionVariable(name: string, value: string) {
    motionRef.current?.style.setProperty(name, value);
  }

  function handleStagePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!stageRef.current) return;
    const bounds = stageRef.current.getBoundingClientRect();

    if (isDraggingRef.current) {
      const next = Math.max(
        -34,
        Math.min(34, dragStartRef.current.current + event.clientX - dragStartRef.current.x),
      );
      dragXRef.current = next;
      setMotionVariable("--drag-x", `${next}px`);
      setMotionVariable("--tilt-y", `${next * 0.055}deg`);
      return;
    }

    if (event.pointerType !== "mouse") return;
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;
    setMotionVariable("--parallax-x", `${relativeX * 12}px`);
    setMotionVariable("--parallax-y", `${relativeY * 9}px`);
    setMotionVariable("--tilt-x", `${relativeY * -1.4}deg`);
    setMotionVariable("--tilt-y", `${relativeX * 1.9}deg`);
  }

  function handleStagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: event.clientX, current: dragXRef.current };
    stageRef.current?.setPointerCapture(event.pointerId);
    stageRef.current?.classList.add(styles.isDragging);
  }

  function handleStagePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    isDraggingRef.current = false;
    stageRef.current?.classList.remove(styles.isDragging);
    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }
  }

  function resetPointerParallax() {
    if (isDraggingRef.current) return;
    setMotionVariable("--parallax-x", "0px");
    setMotionVariable("--parallax-y", "0px");
    setMotionVariable("--tilt-x", "0deg");
    setMotionVariable("--tilt-y", `${dragXRef.current * 0.055}deg`);
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
                  <i aria-hidden="true">â€¢</i>
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
          <small>Demo estimates Â· v1.0</small>
        </span>
      </div>
    </>
  );

  return (
    <main className={styles.dashboard}>
      <aside
        className={`${styles.sidebar} ${isDrawerOpen ? styles.sidebarOpen : ""}`}
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
            <kbd>âŒ˜ K</kbd>
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
                        <small>{system.aliases.slice(0, 3).join(" Â· ")}</small>
                      </span>
                      <b>{formatInr(system.estimatedCostInr)}</b>
                    </button>
                  ))
                ) : (
                  <div className={styles.emptySearch}>
                    <SearchIcon />
                    <span>
                      <strong>No matching system</strong>
                      <small>Try â€œcaliperâ€, â€œradiatorâ€ or â€œwiringâ€.</small>
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

      <section className={styles.workspace} aria-label="Go-kart expense showcase">
        <div className={styles.primaryColumn}>
          <section className={styles.overviewPanel} aria-label="Build expense summary">
            <div className={styles.overviewIntro}>
              <span className={styles.eyebrow}>PROJECT OVERVIEW</span>
              <h1>BUILD INVESTMENT</h1>
              <p>Live architecture Â· illustrative expense data</p>
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
                Drag to inspect Â· select a marker
              </p>
            </div>

            <div
              className={styles.kartStage}
              ref={stageRef}
              onPointerMove={handleStagePointerMove}
              onPointerDown={handleStagePointerDown}
              onPointerUp={handleStagePointerUp}
              onPointerCancel={handleStagePointerUp}
              onPointerLeave={resetPointerParallax}
            >
              <div className={styles.stageAtmosphere} />
              <div className={styles.stageGrid} />
              <div className={styles.orbitRingOne} />
              <div className={styles.orbitRingTwo} />
              <div className={styles.axisReadout} aria-hidden="true">
                <span>AXIS 03</span>
                <b>34.77Â°</b>
              </div>

              <div className={styles.motionLayer} ref={motionRef}>
                <Image
                  className={styles.kartImage}
                  src="/petronarc-kart-stage-v2.jpg"
                  alt="Three-quarter view of an open-wheel collegiate racing kart"
                  fill
                  priority
                  sizes="(max-width: 720px) 100vw, (max-width: 1259px) 92vw, 58vw"
                  draggable={false}
                />
                <div className={styles.imageVignette} />
                {KART_SYSTEMS.map((system) => {
                  const isActive = system.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={system.id}
                      className={`${styles.hotspot} ${
                        system.hotspot.align === "left" ? styles.hotspotLeft : ""
                      } ${isActive ? styles.hotspotActive : ""}`}
                      style={{
                        left: `${system.hotspot.x}%`,
                        top: `${system.hotspot.y}%`,
                      }}
                      onClick={() => selectSystem(system.id)}
                      aria-label={`Select ${system.name}`}
                      aria-pressed={isActive}
                    >
                      <span className={styles.hotspotDot}>
                        <i />
                      </span>
                      <span className={styles.hotspotLine} />
                      <span className={styles.hotspotLabel}>{system.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.selectedTag}>
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

          <section className={styles.costPanel} aria-label="Build cost distribution">
            <div className={styles.costPanelHead}>
              <span>
                <small>COST DISTRIBUTION</small>
                <strong>System allocation</strong>
              </span>
              <span className={styles.selectedAllocation}>
                <b>{selectedShare.toFixed(1)}%</b>
                <small>{selected.shortName} share</small>
              </span>
            </div>
            <div className={styles.segmentedBar}>
              {KART_SYSTEMS.map((system) => (
                <button
                  type="button"
                  key={system.id}
                  className={system.id === selectedId ? styles.segmentActive : ""}
                  style={
                    {
                      "--segment-share": `${
                        (system.estimatedCostInr / TOTAL_ESTIMATED_COST) * 100
                      }%`,
                    } as CSSProperties
                  }
                  onClick={() => selectSystem(system.id)}
                  aria-label={`${system.name}: ${formatInr(system.estimatedCostInr)}`}
                  title={`${system.name} Â· ${formatInr(system.estimatedCostInr)}`}
                />
              ))}
            </div>
            <div className={styles.costLegend}>
              <span>â‚¹0</span>
              <p>
                <i /> Selected: {selected.name}
              </p>
              <span>{formatInr(TOTAL_ESTIMATED_COST)}</span>
            </div>
          </section>
        </div>

        <aside className={styles.detailPanel} aria-live="polite">
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
                <h2>{selected.name}</h2>
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
