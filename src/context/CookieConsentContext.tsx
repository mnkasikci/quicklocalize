'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'ql_consent';
const NOTICE_TTL_MS = 5000;

export type ConsentLevel = 'all' | 'required';
export type ConsentFeature = 'recentFiles' | 'apiKey' | 'language';

interface ConsentRecord {
  level: ConsentLevel;
  features: Partial<Record<ConsentFeature, boolean>>;
  timestamp: number;
}

interface CookieConsentContextValue {
  consentGiven: boolean;
  isAllowed: (feature: ConsentFeature) => boolean;
  grantAll: () => void;
  grantRequired: () => void;
  grantFeatureConsent: (feature: ConsentFeature) => void;
  activeNotice: ConsentFeature | null;
  dismissNotice: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function load(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentRecord;
  } catch {
    return null;
  }
}

function persist(record: ConsentRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [activeNotice, setActiveNotice] = useState<ConsentFeature | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecord(load());
    setHydrated(true);
  }, []);

  const showNotice = useCallback((feature: ConsentFeature) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setActiveNotice(feature);
    noticeTimer.current = setTimeout(() => setActiveNotice(null), NOTICE_TTL_MS);
  }, []);

  const dismissNotice = useCallback(() => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setActiveNotice(null);
  }, []);

  const grantAll = useCallback(() => {
    const r: ConsentRecord = {
      level: 'all',
      features: { recentFiles: true, apiKey: true, language: true },
      timestamp: Date.now(),
    };
    persist(r);
    setRecord(r);
  }, []);

  const grantRequired = useCallback(() => {
    const r: ConsentRecord = {
      level: 'required',
      features: {},
      timestamp: Date.now(),
    };
    persist(r);
    setRecord(r);
  }, []);

  const grantFeatureConsent = useCallback(
    (feature: ConsentFeature) => {
      setRecord((prev) => {
        if (!prev) return prev;
        const updated: ConsentRecord = {
          ...prev,
          features: { ...prev.features, [feature]: true },
        };
        persist(updated);
        return updated;
      });
      showNotice(feature);
    },
    [showNotice]
  );

  const isAllowed = useCallback(
    (feature: ConsentFeature): boolean => {
      if (!record) return false;
      if (record.level === 'all') return true;
      return record.features[feature] === true;
    },
    [record]
  );

  // Prevent rendering children until we've read localStorage — avoids hydration flash
  if (!hydrated) return null;

  return (
    <CookieConsentContext.Provider
      value={{
        consentGiven: record !== null,
        isAllowed,
        grantAll,
        grantRequired,
        grantFeatureConsent,
        activeNotice,
        dismissNotice,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used inside CookieConsentProvider');
  return ctx;
}
