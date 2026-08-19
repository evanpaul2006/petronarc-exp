"use client";

import { useEffect, useState } from "react";
import { formatInr, type ExpenseItem } from "../kart-systems";
import styles from "../dashboard.module.css";

interface ImageLightboxProps {
  item: ExpenseItem | null;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export default function ImageLightbox({ item, onClose }: ImageLightboxProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [index, setIndex] = useState(0);

  const images = item?.images ?? [];
  const total = images.length;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (total > 1 && e.key === "ArrowRight") setIndex((i) => (i + 1) % total);
      if (total > 1 && e.key === "ArrowLeft") setIndex((i) => (i - 1 + total) % total);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, total]);

  if (!item || total === 0) return null;

  const current = images[Math.min(index, total - 1)];

  function handleDownload() {
    if (!item) return;
    const a = document.createElement("a");
    a.href = current.url;
    a.download = current.name || `${item.name.toLowerCase().replace(/\s+/g, "-")}-bill-${item.date || "receipt"}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className={styles.lightboxOverlay} role="dialog" aria-modal="true" aria-label="Receipt / Image Viewer">
      <button
        type="button"
        className={styles.lightboxScrim}
        onClick={onClose}
        aria-label="Close image viewer"
      />

      <div className={styles.lightboxContainer}>
        <header className={styles.lightboxHeader}>
          <div className={styles.lightboxInfo}>
            <span className={styles.lightboxBadge}>
              {total > 1 ? `BILL ${index + 1} OF ${total}` : "ATTACHED BILL / RECEIPT"}
            </span>
            <h3 className={styles.lightboxTitle}>{item.name}</h3>
            <p className={styles.lightboxMeta}>
              <span>{formatInr(item.totalPriceInr)}</span>
              <i>•</i>
              <span>{item.date}</span>
              {item.vendor && (
                <>
                  <i>•</i>
                  <span>Vendor: {item.vendor}</span>
                </>
              )}
            </p>
          </div>

          <div className={styles.lightboxActions}>
            <button
              type="button"
              className={styles.lightboxBtn}
              onClick={() => setZoomLevel((z) => Math.min(z + 0.3, 2.5))}
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomInIcon />
            </button>
            <button
              type="button"
              className={styles.lightboxBtn}
              onClick={() => setZoomLevel((z) => Math.max(z - 0.3, 0.7))}
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOutIcon />
            </button>
            <button
              type="button"
              className={styles.lightboxBtn}
              onClick={handleDownload}
              title="Download Image"
              aria-label="Download image"
            >
              <DownloadIcon />
            </button>
            <button
              type="button"
              className={`${styles.lightboxBtn} ${styles.lightboxCloseBtn}`}
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className={styles.lightboxViewport}>
          <div
            className={styles.lightboxImageWrapper}
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.name || item.name}
              className={styles.lightboxImage}
            />
          </div>
        </div>

        {total > 1 && (
          <div className={styles.lightboxThumbs} role="tablist" aria-label="Attached bills">
            {images.map((img, i) => (
              <button
                key={`${img.name ?? "bill"}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`${styles.lightboxThumb} ${i === index ? styles.lightboxThumbActive : ""}`}
                onClick={() => {
                  setIndex(i);
                  setZoomLevel(1);
                }}
                title={img.name || `Bill ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.name || `Bill ${i + 1}`} />
              </button>
            ))}
          </div>
        )}

        {item.description && (
          <footer className={styles.lightboxFooter}>
            <small>NOTE / SPECS:</small>
            <p>{item.description}</p>
          </footer>
        )}
      </div>
    </div>
  );
}
