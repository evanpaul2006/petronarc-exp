"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  type ExpenseImage,
  type ExpenseItem,
  type SystemId,
  type SystemExpenseSummary,
  KART_SYSTEMS,
  SAMPLE_EXPENSES,
} from "./kart-systems";

const STORAGE_KEY = "petronarc_kart_expenses_v1";

/**
 * Fixed for the lifetime of the bundle, so the backend hook chosen from it never
 * changes between renders and the rules of hooks still hold.
 */
const IS_CONVEX_ENABLED = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type ExpenseInput = Omit<ExpenseItem, "id" | "totalPriceInr" | "createdAt">;

/** The storage-specific half of the store. Everything else is derived from `expenses`. */
interface ExpenseBackend {
  expenses: ExpenseItem[];
  isLoaded: boolean;
  addExpense: (item: ExpenseInput) => void;
  updateExpense: (id: string, updates: Partial<Omit<ExpenseItem, "id" | "createdAt">>) => void;
  deleteExpense: (id: string) => void;
  /** Single primitive behind clear, seed-samples and JSON restore. */
  replaceAll: (items: ExpenseItem[]) => void;
}

/** Accepts records from any earlier shape (single `imageUrl`, no `images`) and returns the current one. */
function normalizeExpense(raw: Record<string, unknown>): ExpenseItem {
  const legacyUrl = typeof raw.imageUrl === "string" ? raw.imageUrl : undefined;
  const images: ExpenseImage[] = Array.isArray(raw.images)
    ? (raw.images as ExpenseImage[])
        .filter((img) => img && typeof img.url === "string")
        .map((img) => ({ url: img.url, name: img.name }))
    : legacyUrl
      ? [{ url: legacyUrl, name: typeof raw.imageName === "string" ? raw.imageName : undefined }]
      : [];

  const quantity = Number(raw.quantity) || 1;
  const unitPriceInr = Number(raw.unitPriceInr) || 0;

  return {
    id: String(raw.id || "exp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7)),
    systemId: (raw.systemId as ExpenseItem["systemId"]) || "brake",
    name: String(raw.name || "Unnamed Component"),
    quantity,
    unitPriceInr,
    totalPriceInr: Number(raw.totalPriceInr) || Math.round(quantity * unitPriceInr),
    description: typeof raw.description === "string" ? raw.description : "",
    images,
    date: String(raw.date || new Date().toISOString().slice(0, 10)),
    vendor: typeof raw.vendor === "string" && raw.vendor ? raw.vendor : undefined,
    createdAt: Number(raw.createdAt) || Date.now(),
  };
}

function loadInitialExpenses(): ExpenseItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(normalizeExpense);
    return [];
  } catch (error) {
    console.error("Failed to read expenses from localStorage:", error);
    return [];
  }
}

function persistExpenses(items: ExpenseItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to persist expenses to localStorage:", error);
  }
}

function useLocalBackend(): ExpenseBackend {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setExpenses(loadInitialExpenses());
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const saveAndSetExpenses = useCallback((updater: (prev: ExpenseItem[]) => ExpenseItem[]) => {
    setExpenses((prev) => {
      const next = updater(prev);
      persistExpenses(next);
      return next;
    });
  }, []);

  const addExpense = useCallback(
    (item: Omit<ExpenseItem, "id" | "totalPriceInr" | "createdAt">) => {
      const newItem: ExpenseItem = {
        ...item,
        id: "exp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        totalPriceInr: Math.round(Number(item.quantity) * Number(item.unitPriceInr)),
        createdAt: Date.now(),
      };
      saveAndSetExpenses((prev) => [newItem, ...prev]);
      return newItem;
    },
    [saveAndSetExpenses],
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<Omit<ExpenseItem, "id" | "createdAt">>) => {
      saveAndSetExpenses((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const merged = { ...item, ...updates };
          merged.totalPriceInr = Math.round(Number(merged.quantity) * Number(merged.unitPriceInr));
          return merged;
        }),
      );
    },
    [saveAndSetExpenses],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      saveAndSetExpenses((prev) => prev.filter((item) => item.id !== id));
    },
    [saveAndSetExpenses],
  );

  const replaceAll = useCallback(
    (items: ExpenseItem[]) => {
      saveAndSetExpenses(() => items);
    },
    [saveAndSetExpenses],
  );

  return { expenses, isLoaded, addExpense, updateExpense, deleteExpense, replaceAll };
}

/** Logs rather than throws: a rejected mutation must not take the dashboard down with it. */
function reportMutationFailure(action: string) {
  return (error: unknown) => {
    console.error(`Convex ${action} failed:`, error);
  };
}

function useConvexBackend(): ExpenseBackend {
  const rows = useQuery(api.expenses.list) as Record<string, unknown>[] | undefined;
  const add = useMutation(api.expenses.add);
  const patch = useMutation(api.expenses.update);
  const remove = useMutation(api.expenses.remove);
  const bulkImport = useMutation(api.expenses.bulkImport);

  const expenses = useMemo<ExpenseItem[]>(
    () => (rows ?? []).map((row) => normalizeExpense({ ...row, id: row._id })),
    [rows],
  );

  const addExpense = useCallback(
    (item: ExpenseInput) => {
      void add({ ...item, images: item.images ?? [] }).catch(reportMutationFailure("add"));
    },
    [add],
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<Omit<ExpenseItem, "id" | "createdAt">>) => {
      const current = expenses.find((item) => item.id === id);
      if (!current) return;
      const merged = { ...current, ...updates };
      void patch({
        id: id as Id<"expenses">,
        systemId: merged.systemId,
        name: merged.name,
        quantity: merged.quantity,
        unitPriceInr: merged.unitPriceInr,
        description: merged.description,
        images: merged.images ?? [],
        date: merged.date,
        vendor: merged.vendor,
      }).catch(reportMutationFailure("update"));
    },
    [expenses, patch],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      void remove({ id: id as Id<"expenses"> }).catch(reportMutationFailure("delete"));
    },
    [remove],
  );

  const replaceAll = useCallback(
    (items: ExpenseItem[]) => {
      const rowsToWrite = items.map((item) => ({
        systemId: item.systemId,
        name: item.name,
        quantity: item.quantity,
        unitPriceInr: item.unitPriceInr,
        totalPriceInr: item.totalPriceInr,
        date: item.date,
        vendor: item.vendor,
        createdAt: item.createdAt,
        description: item.description || undefined,
        images: (item.images ?? []).map((image) => ({ url: image.url, name: image.name })),
      }));
      void bulkImport({ items: rowsToWrite }).catch(reportMutationFailure("bulk import"));
    },
    [bulkImport],
  );

  return {
    expenses,
    isLoaded: rows !== undefined,
    addExpense,
    updateExpense,
    deleteExpense,
    replaceAll,
  };
}

const useExpenseBackend = IS_CONVEX_ENABLED ? useConvexBackend : useLocalBackend;

export function useKartExpenses() {
  const { expenses, isLoaded, addExpense, updateExpense, deleteExpense, replaceAll } =
    useExpenseBackend();

  const clearAllExpenses = useCallback(() => {
    replaceAll([]);
  }, [replaceAll]);

  const loadSampleData = useCallback(() => {
    replaceAll(
      SAMPLE_EXPENSES.map((sample, idx) => ({
        ...sample,
        id: "exp_sample_" + idx + "_" + Date.now(),
        createdAt: Date.now() - idx * 86400000,
      })),
    );
  }, [replaceAll]);

  const exportToJson = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expenses, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `petronarc-kart-ledger-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [expenses]);

  const importFromJson = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed)) return false;
        replaceAll(parsed.map(normalizeExpense));
        return true;
      } catch (err) {
        console.error("Failed to parse imported JSON:", err);
        return false;
      }
    },
    [replaceAll],
  );

  // System by system summaries
  const systemSummaries = useMemo<Record<SystemId, SystemExpenseSummary>>(() => {
    const summaryMap = {} as Record<SystemId, SystemExpenseSummary>;
    KART_SYSTEMS.forEach((system) => {
      const items = expenses.filter((e) => e.systemId === system.id);
      const totalCostInr = items.reduce((sum, item) => sum + (Number(item.totalPriceInr) || 0), 0);
      const componentCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      summaryMap[system.id] = {
        systemId: system.id,
        totalCostInr,
        componentCount,
        items,
      };
    });
    return summaryMap;
  }, [expenses]);

  const systemCosts = useMemo<Record<SystemId, number>>(() => {
    const map = {} as Record<SystemId, number>;
    KART_SYSTEMS.forEach((sys) => {
      map[sys.id] = systemSummaries[sys.id]?.totalCostInr || 0;
    });
    return map;
  }, [systemSummaries]);

  const systemItemCounts = useMemo<Record<SystemId, number>>(() => {
    const map = {} as Record<SystemId, number>;
    KART_SYSTEMS.forEach((sys) => {
      map[sys.id] = systemSummaries[sys.id]?.componentCount || 0;
    });
    return map;
  }, [systemSummaries]);

  const grandTotal = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.totalPriceInr) || 0), 0);
  }, [expenses]);

  const totalComponents = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [expenses]);

  return {
    expenses,
    isLoaded,
    systemSummaries,
    systemCosts,
    systemItemCounts,
    grandTotal,
    totalComponents,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
    loadSampleData,
    exportToJson,
    importFromJson,
  };
}
