"use client";

import { useMemo, useState } from "react";
import {
  formatInr,
  getSystemById,
  KART_SYSTEMS,
  type ExpenseItem,
  type SystemId,
} from "../kart-systems";
import { SystemGlyph } from "./system-glyph";
import ImageLightbox from "./image-lightbox";
import ExpenseModal from "./expense-modal";
import styles from "../dashboard.module.css";

type SortKey = "date" | "cost" | "name";
type SortDir = "asc" | "desc";

interface SystemLedgerViewProps {
  systemId: SystemId;
  onSwitchTo3D: () => void;
  expenses: ExpenseItem[];
  grandTotal: number;
  totalComponents: number;
  onAddExpense: (item: Omit<ExpenseItem, "id" | "totalPriceInr" | "createdAt">) => void;
  onUpdateExpense: (id: string, updates: Partial<Omit<ExpenseItem, "id" | "createdAt">>) => void;
  onDeleteExpense: (id: string) => void;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** ISO date to "12 Feb 2026". Falls back to the raw string for anything unparseable. */
function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : DATE_FORMAT.format(parsed);
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
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

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function SortArrow({ dir }: { dir: SortDir }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "asc" ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
    </svg>
  );
}

export default function SystemLedgerView({
  systemId,
  onSwitchTo3D,
  expenses,
  grandTotal,
  totalComponents,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: SystemLedgerViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [lightboxItem, setLightboxItem] = useState<ExpenseItem | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const activeSystem = getSystemById(systemId);

  const systemItems = useMemo(
    () => expenses.filter((item) => item.systemId === systemId),
    [expenses, systemId],
  );

  const systemTotalCost = useMemo(
    () => systemItems.reduce((sum, item) => sum + (Number(item.totalPriceInr) || 0), 0),
    [systemItems],
  );

  const systemTotalQuantity = useMemo(
    () => systemItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [systemItems],
  );

  const systemSharePercent = grandTotal > 0 ? (systemTotalCost / grandTotal) * 100 : 0;

  const processedItems = useMemo(() => {
    let result = [...systemItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.vendor && item.vendor.toLowerCase().includes(q)),
      );
    }

    const factor = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sortKey === "cost") return factor * (a.totalPriceInr - b.totalPriceInr);
      if (sortKey === "name") return factor * a.name.localeCompare(b.name);
      // ISO dates sort lexicographically; entry order breaks ties within a day.
      const byDate = (a.date || "").localeCompare(b.date || "");
      return factor * (byDate || (a.createdAt || 0) - (b.createdAt || 0));
    });

    return result;
  }, [systemItems, searchQuery, sortKey, sortDir]);

  const visibleTotal = useMemo(
    () => processedItems.reduce((sum, item) => sum + (Number(item.totalPriceInr) || 0), 0),
    [processedItems],
  );

  const largestItem = useMemo(
    () =>
      systemItems.reduce<ExpenseItem | null>(
        (max, item) => (!max || item.totalPriceInr > max.totalPriceInr ? item : max),
        null,
      ),
    [systemItems],
  );

  const receiptCount = useMemo(
    () => systemItems.filter((item) => (item.images?.length ?? 0) > 0).length,
    [systemItems],
  );

  const systemIndex = KART_SYSTEMS.indexOf(activeSystem) + 1;
  const isSystemEmpty = systemItems.length === 0;
  const isFiltering = searchQuery.trim().length > 0;

  function openAddModal() {
    setEditingItem(null);
    setIsAddModalOpen(true);
  }

  /** Same column resorts in the opposite direction, a new column starts at its natural direction. */
  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "name" ? "asc" : "desc");
  }

  function sortState(key: SortKey) {
    if (key !== sortKey) return "none" as const;
    return sortDir === "asc" ? ("ascending" as const) : ("descending" as const);
  }

  function headerButton(key: SortKey, label: string) {
    return (
      <button
        type="button"
        className={`${styles.ledgerSortBtn} ${key === sortKey ? styles.ledgerSortBtnActive : ""}`}
        onClick={() => toggleSort(key)}
      >
        <span>{label}</span>
        {key === sortKey && <SortArrow dir={sortDir} />}
      </button>
    );
  }

  return (
    <div className={styles.ledgerViewContainer}>
      {/* Identity, primary action and the money summary */}
      <section className={styles.ledgerHeader}>
        <div className={styles.ledgerHeaderTop}>
          <div className={styles.ledgerIdentity}>
            <div className={styles.ledgerGlyph}>
              <SystemGlyph icon={activeSystem.icon} size={34} />
            </div>
            <div className={styles.ledgerHeadings}>
              <span className={styles.ledgerKicker}>
                System {systemIndex.toString().padStart(2, "0")} of{" "}
                {KART_SYSTEMS.length.toString().padStart(2, "0")}
              </span>
              <h1 className={styles.ledgerTitle}>{activeSystem.name}</h1>
              <p className={styles.ledgerDesc}>{activeSystem.description}</p>
            </div>
          </div>

          <div className={styles.ledgerHeaderActions}>
            <button type="button" className={styles.btnAddExpensePrimary} onClick={openAddModal}>
              <PlusIcon />
              <span>Add component</span>
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={onSwitchTo3D}
              title="Switch back to the 3D kart model"
            >
              <CubeIcon />
              <span>Locate on 3D model</span>
            </button>
          </div>
        </div>

        <div className={styles.ledgerSummary}>
          <div className={styles.ledgerSpend}>
            <span className={styles.ledgerSpendLabel}>System spend</span>
            <strong className={isSystemEmpty ? styles.ledgerSpendMuted : styles.ledgerSpendValue}>
              {formatInr(systemTotalCost)}
            </strong>
            <div
              className={styles.ledgerShareBar}
              role="img"
              aria-label={`${systemSharePercent.toFixed(1)} percent of the build total`}
            >
              <span style={{ width: `${Math.min(systemSharePercent, 100)}%` }} />
            </div>
            <small>
              {isSystemEmpty
                ? "Nothing logged for this system yet"
                : `${systemSharePercent.toFixed(1)}% of the ${formatInr(grandTotal)} build total`}
            </small>
          </div>

          <dl className={styles.ledgerFacts}>
            <div className={styles.ledgerFact}>
              <dt>Line items</dt>
              <dd>{systemItems.length}</dd>
              <small>{totalComponents} across the build</small>
            </div>
            <div className={styles.ledgerFact}>
              <dt>Units</dt>
              <dd>{systemTotalQuantity}</dd>
              <small>Individual parts bought</small>
            </div>
            <div className={styles.ledgerFact}>
              <dt>Bills attached</dt>
              <dd>
                {receiptCount}
                <em>/{systemItems.length}</em>
              </dd>
              <small>
                {isSystemEmpty
                  ? "No bills uploaded"
                  : receiptCount === systemItems.length
                    ? "Every item documented"
                    : `${systemItems.length - receiptCount} missing a bill`}
              </small>
            </div>
            <div className={styles.ledgerFact}>
              <dt>Largest item</dt>
              <dd>{largestItem ? formatInr(largestItem.totalPriceInr) : formatInr(0)}</dd>
              <small title={largestItem?.name}>
                {largestItem ? largestItem.name : "No components recorded"}
              </small>
            </div>
          </dl>
        </div>
      </section>

      {/* Search and mobile sort. On desktop the table headers do the sorting. */}
      {!isSystemEmpty && (
        <section className={styles.ledgerToolbar} aria-label="Filter components">
          <div className={styles.ledgerSearchWrap}>
            <SearchIcon />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeSystem.shortName} parts, vendors or notes`}
              className={styles.ledgerSearchInput}
            />
            {isFiltering && (
              <button
                type="button"
                className={styles.ledgerSearchClear}
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <div className={styles.ledgerSortWrap}>
            <label htmlFor="ledger-sort">Sort</label>
            <select
              id="ledger-sort"
              className={styles.ledgerSelect}
              value={`${sortKey}_${sortDir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split("_");
                setSortKey(key as SortKey);
                setSortDir(dir as SortDir);
              }}
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="cost_desc">Cost: high to low</option>
              <option value="cost_asc">Cost: low to high</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>

          <p className={styles.ledgerCount}>
            {isFiltering ? (
              <>
                <strong>{processedItems.length}</strong> of {systemItems.length} items match
              </>
            ) : (
              <>
                <strong>{systemItems.length}</strong> {systemItems.length === 1 ? "item" : "items"} logged
              </>
            )}
          </p>
        </section>
      )}

      <section aria-label="Component expenses">
        {processedItems.length === 0 ? (
          <div className={styles.ledgerEmptyState}>
            <div className={styles.ledgerEmptyIcon}>
              <SystemGlyph icon={activeSystem.icon} size={56} />
            </div>
            <h2>
              {isSystemEmpty
                ? `Nothing logged for ${activeSystem.name} yet`
                : "No components match this search"}
            </h2>
            <p>
              {isSystemEmpty
                ? "Record parts, vendor bills and build expenses here. Each entry rolls up into the system total and the overall build budget."
                : "Try a shorter term, or search by vendor name."}
            </p>
            {isSystemEmpty ? (
              <button type="button" className={styles.btnAddExpensePrimary} onClick={openAddModal}>
                <PlusIcon />
                <span>Add first component</span>
              </button>
            ) : (
              <button type="button" className={styles.btnGhost} onClick={() => setSearchQuery("")}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div
            className={styles.ledgerTable}
            role="table"
            aria-label={`${activeSystem.name} expense ledger`}
          >
            <div className={styles.ledgerTableHead} role="row">
              <div role="columnheader" aria-sort={sortState("name")}>
                {headerButton("name", "Component")}
              </div>
              <div role="columnheader" aria-sort={sortState("date")}>
                {headerButton("date", "Logged")}
              </div>
              <div role="columnheader">
                <span className={styles.ledgerColLabel}>Quantity</span>
              </div>
              <div role="columnheader" aria-sort={sortState("cost")} className={styles.ledgerColRight}>
                {headerButton("cost", "Total")}
              </div>
              <div role="columnheader">
                <span className={styles.srOnly}>Actions</span>
              </div>
            </div>

            {processedItems.map((item) => {
              const images = item.images ?? [];
              const hasBills = images.length > 0;
              const share = systemTotalCost > 0 ? (item.totalPriceInr / systemTotalCost) * 100 : 0;
              const isConfirming = confirmingId === item.id;

              return (
                <div key={item.id} className={styles.ledgerRow} role="row">
                  <div className={styles.ledgerCellItem} role="cell">
                    {hasBills ? (
                      <button
                        type="button"
                        className={styles.ledgerThumb}
                        onClick={() => setLightboxItem(item)}
                        title={images.length === 1 ? "View attached bill" : "View attached bills"}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={images[0].url} alt="" />
                        {images.length > 1 && (
                          <span className={styles.ledgerThumbCount}>{images.length}</span>
                        )}
                      </button>
                    ) : (
                      <span className={styles.ledgerThumbEmpty} title="No bill attached">
                        <SystemGlyph icon={activeSystem.icon} size={22} />
                      </span>
                    )}

                    <div className={styles.ledgerItemText}>
                      <h3>{item.name}</h3>
                      {item.vendor && (
                        <p className={styles.ledgerVendor}>
                          from <strong>{item.vendor}</strong>
                        </p>
                      )}
                      {item.description && <p className={styles.ledgerNote}>{item.description}</p>}
                    </div>
                  </div>

                  <div className={styles.ledgerCellDate} role="cell">
                    <span className={styles.ledgerMobileLabel}>Logged</span>
                    {formatDate(item.date)}
                  </div>

                  <div className={styles.ledgerCellQty} role="cell">
                    <span className={styles.ledgerMobileLabel}>Quantity</span>
                    {item.quantity} × {formatInr(item.unitPriceInr)}
                  </div>

                  <div className={styles.ledgerCellTotal} role="cell">
                    <span className={styles.ledgerMobileLabel}>Total</span>
                    <strong>{formatInr(item.totalPriceInr)}</strong>
                    <span
                      className={styles.ledgerRowBar}
                      title={`${share.toFixed(1)}% of this system spend`}
                    >
                      <span style={{ width: `${Math.min(share, 100)}%` }} />
                    </span>
                  </div>

                  <div className={styles.ledgerCellActions} role="cell">
                    {isConfirming ? (
                      <div className={styles.ledgerConfirm}>
                        <span>Remove?</span>
                        <button
                          type="button"
                          className={styles.ledgerConfirmYes}
                          onClick={() => {
                            onDeleteExpense(item.id);
                            setConfirmingId(null);
                          }}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          className={styles.ledgerConfirmNo}
                          onClick={() => setConfirmingId(null)}
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <>
                        {hasBills && (
                          <button
                            type="button"
                            className={styles.ledgerActionBtn}
                            onClick={() => setLightboxItem(item)}
                            title="View attached bills"
                          >
                            <ReceiptIcon />
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.ledgerActionBtn}
                          onClick={() => {
                            setEditingItem(item);
                            setIsAddModalOpen(true);
                          }}
                          title={`Edit ${item.name}`}
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          className={`${styles.ledgerActionBtn} ${styles.ledgerActionDelete}`}
                          onClick={() => setConfirmingId(item.id)}
                          title={`Remove ${item.name}`}
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <div className={styles.ledgerTableFoot} role="row">
              <span>{isFiltering ? "Matching items" : "System total"}</span>
              <strong>{formatInr(visibleTotal)}</strong>
            </div>
          </div>
        )}
      </section>

      <ImageLightbox key={lightboxItem?.id} item={lightboxItem} onClose={() => setLightboxItem(null)} />

      {isAddModalOpen && (
        <ExpenseModal
          key={editingItem?.id ?? `new-${systemId}`}
          isOpen
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
          defaultSystemId={systemId}
          editingItem={editingItem}
          onSave={(data) => {
            if (editingItem) {
              onUpdateExpense(editingItem.id, data);
            } else {
              onAddExpense(data);
            }
          }}
        />
      )}
    </div>
  );
}
