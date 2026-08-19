"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import {
  formatInr,
  getSystemById,
  KART_SYSTEMS,
  type ExpenseImage,
  type ExpenseItem,
  type SystemId,
} from "../kart-systems";
import { labelForLink, normalizeImageLink } from "../drive-link";
import styles from "../dashboard.module.css";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ExpenseItem, "id" | "totalPriceInr" | "createdAt">) => void;
  defaultSystemId?: SystemId;
  editingItem?: ExpenseItem | null;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

export default function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  defaultSystemId = "brake",
  editingItem,
}: ExpenseModalProps) {
  const [systemId, setSystemId] = useState<SystemId>(editingItem?.systemId ?? defaultSystemId);
  const [name, setName] = useState(editingItem?.name ?? "");
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1);
  const [unitPriceInr, setUnitPriceInr] = useState<number | "">(
    editingItem ? editingItem.unitPriceInr : "",
  );
  const [date, setDate] = useState(editingItem?.date || new Date().toISOString().slice(0, 10));
  const [vendor, setVendor] = useState(editingItem?.vendor ?? "");
  const [description, setDescription] = useState(editingItem?.description ?? "");
  const [images, setImages] = useState<ExpenseImage[]>(editingItem?.images ?? []);
  const [errors, setErrors] = useState<{ name?: string; unitPrice?: string }>({});
  const [linkDraft, setLinkDraft] = useState("");
  const [linkError, setLinkError] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = setTimeout(() => nameInputRef.current?.focus(), 80);
    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeSystem = getSystemById(systemId);
  const currentUnitPrice = typeof unitPriceInr === "number" ? unitPriceInr : 0;
  const computedTotal = Math.round(Number(quantity || 0) * currentUnitPrice);

  function handleAddLink() {
    const result = normalizeImageLink(linkDraft);
    if ("error" in result) {
      setLinkError(result.error);
      return;
    }
    if (images.some((img) => img.url === result.url)) {
      setLinkError("That link is already attached.");
      return;
    }
    setImages((prev) => [...prev, { url: result.url, name: labelForLink(result.url) }]);
    setLinkDraft("");
    setLinkError("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nextErrors: { name?: string; unitPrice?: string } = {};
    if (!name.trim()) nextErrors.name = "Give the component a name so it can be found later.";
    if (unitPriceInr === "" || Number(unitPriceInr) < 0) nextErrors.unitPrice = "Enter the price paid per unit (0 or more).";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      systemId,
      name: name.trim(),
      quantity: Math.max(1, Number(quantity) || 1),
      unitPriceInr: Number(unitPriceInr),
      date: date || new Date().toISOString().slice(0, 10),
      vendor: vendor.trim() || undefined,
      description: description.trim(),
      images,
    });
    onClose();
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <button type="button" className={styles.modalScrim} onClick={onClose} aria-label="Close expense form" />

      <div className={styles.modalCard}>
        <form onSubmit={handleSubmit} className={styles.modalShell}>
          <header className={styles.modalHeader}>
            <div>
              <span className={styles.modalEyebrow}>{activeSystem.name} ledger</span>
              <h2 id="expense-modal-title" className={styles.modalTitle}>
                {editingItem ? "Edit entry" : "Add expense entry"}
              </h2>
            </div>
            <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close form">
              <CloseIcon />
            </button>
          </header>

          <div className={styles.modalBody}>
            <section className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Component</h3>

              <div className={styles.formField}>
                <label htmlFor="system-select">System</label>
                <select
                  id="system-select"
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value as SystemId)}
                  className={styles.formSelect}
                >
                  {KART_SYSTEMS.map((sys) => (
                    <option key={sys.id} value={sys.id}>
                      {sys.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label htmlFor="item-name">Component or part name</label>
                <input
                  ref={nameInputRef}
                  id="item-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Front brake caliper pair"
                  className={`${styles.formInput} ${errors.name ? styles.formInputInvalid : ""}`}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "item-name-error" : undefined}
                />
                {errors.name && (
                  <p id="item-name-error" className={styles.formError}>
                    {errors.name}
                  </p>
                )}
              </div>
            </section>

            <section className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Cost</h3>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label htmlFor="item-qty">Quantity</label>
                  <input
                    id="item-qty"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="item-unit-price">Unit price (₹)</label>
                  <input
                    id="item-unit-price"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={unitPriceInr}
                    onChange={(e) => {
                      setUnitPriceInr(e.target.value === "" ? "" : Number(e.target.value));
                      if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: undefined }));
                    }}
                    placeholder="0"
                    className={`${styles.formInput} ${errors.unitPrice ? styles.formInputInvalid : ""}`}
                    aria-invalid={Boolean(errors.unitPrice)}
                    aria-describedby={errors.unitPrice ? "item-price-error" : undefined}
                  />
                </div>
              </div>

              {errors.unitPrice && (
                <p id="item-price-error" className={styles.formError}>
                  {errors.unitPrice}
                </p>
              )}

              <div className={styles.formTotalCard}>
                <div>
                  <small>Total price</small>
                  <span>
                    {quantity} × {formatInr(currentUnitPrice)}
                  </span>
                </div>
                <strong aria-live="polite">{formatInr(computedTotal)}</strong>
              </div>
            </section>

            <section className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Purchase</h3>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label htmlFor="item-date">Purchase date</label>
                  <input
                    id="item-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="item-vendor">
                    Vendor or supplier <span className={styles.formOptional}>optional</span>
                  </label>
                  <input
                    id="item-vendor"
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. Apex Hardware"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label htmlFor="item-desc">Description</label>
                <textarea
                  id="item-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specs, part numbers, invoice reference…"
                  className={styles.formTextarea}
                />
              </div>
            </section>

            <section className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                Bill &amp; image links
                {images.length > 0 && <span className={styles.formSectionCount}>{images.length} linked</span>}
              </h3>

              {images.length > 0 && (
                <ul className={styles.imageGrid}>
                  {images.map((img, index) => (
                    <li key={`${img.name ?? "image"}-${index}`} className={styles.imageTile}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.name || `Attachment ${index + 1}`} />
                      <button
                        type="button"
                        className={styles.imageTileRemove}
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                        aria-label={`Remove ${img.name || `attachment ${index + 1}`}`}
                        title="Remove"
                      >
                        <CloseIcon />
                      </button>
                      <span className={styles.imageTileName}>{img.name || `Attachment ${index + 1}`}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.linkRow}>
                <LinkIcon />
                <input
                  type="url"
                  inputMode="url"
                  value={linkDraft}
                  onChange={(e) => {
                    setLinkDraft(e.target.value);
                    if (linkError) setLinkError("");
                  }}
                  onKeyDown={(e) => {
                    // Enter inside the modal would otherwise submit the whole expense form.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                  placeholder="Paste a Google Drive share link…"
                  aria-label="Image or bill link"
                  className={styles.formInput}
                />
                <button type="button" className={styles.btnCancel} onClick={handleAddLink}>
                  Add
                </button>
              </div>
              <small className={styles.linkHint}>
                Set the Drive file to “Anyone with the link” so the preview can load. Any direct
                image URL works too.
              </small>

              {linkError && <p className={styles.formError}>{linkError}</p>}
            </section>
          </div>

          <footer className={styles.modalActions}>
            <span className={styles.modalActionsTotal}>
              Entry total <strong>{formatInr(computedTotal)}</strong>
            </span>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit}>
              {editingItem ? "Save changes" : "Add to ledger"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
