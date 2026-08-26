import React, { useState, useEffect, useCallback, useRef, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';

/**
 * Custom hook to automatically persist and restore form state in sessionStorage.
 * Prevents data loss on unexpected page refreshes or tab switches.
 *
 * @param formKey Unique identifier for the form in sessionStorage
 * @param initialData Default initial state of the form
 * @returns [formData, setFormData, handleInputChange, clearSavedData, hasRestoredData]
 */
export function useAutoSaveForm<T extends Record<string, any>>(
  formKey: string,
  initialData: T
): [
  T,
  Dispatch<SetStateAction<T>>,
  (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void,
  () => void,
  boolean
] {
  const storageKey = `mahash_form_autosave_${formKey}`;
  const [hasRestoredData, setHasRestoredData] = useState(false);

  // Initialize from sessionStorage if available, otherwise initialData
  const [formData, setFormData] = useState<T>(() => {
    if (typeof window === 'undefined') return initialData;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialData, ...parsed };
      }
    } catch (e) {
      console.warn(`[useAutoSaveForm] Failed to load data from sessionStorage for ${formKey}:`, e);
    }
    return initialData;
  });

  const isInitialMount = useRef(true);

  // Check if restored on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasCustomValues = Object.keys(parsed).some(
          (k) => parsed[k] !== undefined && parsed[k] !== '' && parsed[k] !== initialData[k]
        );
        if (hasCustomValues) {
          setHasRestoredData(true);
        }
      }
    } catch {}
  }, [storageKey, initialData]);

  // Debounced auto-save to sessionStorage whenever formData changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (e) {
        console.warn(`[useAutoSaveForm] Failed to save to sessionStorage for ${formKey}:`, e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData, storageKey, formKey]);

  // Generic input change handler for text/select/textarea
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    },
    []
  );

  // Clear saved data upon successful submission or manual reset
  const clearSavedData = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      setHasRestoredData(false);
      setFormData(initialData);
    } catch (e) {
      console.warn(`[useAutoSaveForm] Failed to clear sessionStorage for ${formKey}:`, e);
    }
  }, [storageKey, initialData, formKey]);

  return [formData, setFormData, handleInputChange, clearSavedData, hasRestoredData];
}
