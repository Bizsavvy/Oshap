"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";

interface TableSession {
  id: string;
  table_id: string;
  pin: string;
  status: string;
  created_at: string;
}

interface SessionContextType {
  session: TableSession | null;
  customerName: string;
  setCustomerName: (name: string) => void;
  startSession: (tableId: string) => Promise<TableSession>;
  joinSession: (pin: string, tableId: string) => Promise<TableSession | null>;
  clearSession: () => void;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TableSession | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const searchParams = useSearchParams();

  // On mount, load from localStorage
  useEffect(() => {
    const savedSession = sessionStorage.getItem("table_session");
    const savedName = sessionStorage.getItem("customer_name");
    
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      const currentTableId = searchParams.get("table") || "T1";
      if (parsed.table_id === currentTableId) {
        setSession(parsed);
      } else {
        sessionStorage.removeItem("table_session");
      }
    }
    if (savedName) {
      setCustomerName(savedName);
    }
    setIsHydrated(true);
  }, [searchParams]);

  // Sync to sessionStorage
  useEffect(() => {
    if (session) {
      sessionStorage.setItem("table_session", JSON.stringify(session));
    } else {
      sessionStorage.removeItem("table_session");
    }
  }, [session]);

  useEffect(() => {
    if (customerName) {
      sessionStorage.setItem("customer_name", customerName);
    } else {
      sessionStorage.removeItem("customer_name");
    }
  }, [customerName]);

  const getUnclaimedOrderIds = (tableId: string): string[] => {
    try {
      return JSON.parse(
        sessionStorage.getItem(`oshap-my-order-ids-${tableId}`) || "[]"
      );
    } catch {
      return [];
    }
  };

  const startSession = async (tableId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const unclaimed_order_ids = getUnclaimedOrderIds(tableId);
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          action: "START",
          unclaimed_order_ids,
          customer_name: customerName,
        }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      setSession(data.session);
      return data.session;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async (pin: string, tableId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const unclaimed_order_ids = getUnclaimedOrderIds(tableId);
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          pin,
          action: "JOIN",
          unclaimed_order_ids,
          customer_name: customerName,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to join session");
      }
      const data = await res.json();
      setSession(data.session);
      return data.session;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    setSession(null);
    setCustomerName("");
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        customerName,
        setCustomerName,
        startSession,
        joinSession,
        clearSession,
        isLoading,
        error,
        isHydrated,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
