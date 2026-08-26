import { useEffect, useState } from "react";

const STORAGE_KEY = "tropikit_checklist_v1";

/**
 * Anonymous-user checklist persistence via localStorage.
 *
 * This directly fixes a verified bug in the original prototype: its checklist state was
 * plain in-memory React state with no persistence at all, despite UI copy claiming
 * "Progress is saved this session." Here it survives refresh and tab close for anonymous
 * users; authenticated users additionally sync to the backend via tripApi (see
 * useTripChecklistSync).
 */
export function useLocalChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // localStorage unavailable (private browsing, quota) — degrade to in-memory only.
    }
  }, [checked]);

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function reset() {
    setChecked({});
  }

  function getCheckedKeys(): string[] {
    return Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }

  function setFromKeys(keys: string[]) {
    setChecked(Object.fromEntries(keys.map((k) => [k, true])));
  }

  return { checked, toggle, reset, getCheckedKeys, setFromKeys };
}
