import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAthletes,
  useCreateAthlete,
  useDeleteAthlete,
  useCreateKick,
  useDeleteKick,
  getGetAthletesQueryKey,
  getGetKicksQueryKey,
} from "@workspace/api-client-react";
import type { Athlete, CreateKickBody } from "@workspace/api-client-react";

interface AppContextValue {
  athletes: Athlete[];
  activeAthleteId: string | null;
  setActiveAthleteId: (id: string) => void;
  isSyncing: boolean;
  isLoadingAthletes: boolean;
  addAthlete: (name: string) => Promise<void>;
  removeAthlete: (id: string) => Promise<void>;
  recordKick: (body: CreateKickBody) => Promise<void>;
  removeKick: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeAthleteId, setActiveAthleteId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: athletes = [], isLoading: isLoadingAthletes } = useGetAthletes({
    query: { queryKey: getGetAthletesQueryKey() },
  });

  useEffect(() => {
    if (athletes.length > 0 && !activeAthleteId) {
      setActiveAthleteId(athletes[0].id);
    }
  }, [athletes, activeAthleteId]);

  const createAthleteMutation = useCreateAthlete();
  const deleteAthleteMutation = useDeleteAthlete();
  const createKickMutation = useCreateKick();
  const deleteKickMutation = useDeleteKick();

  const addAthlete = useCallback(async (name: string) => {
    setIsSyncing(true);
    try {
      const athlete = await createAthleteMutation.mutateAsync({ data: { name } });
      setActiveAthleteId(athlete.id);
      queryClient.invalidateQueries({ queryKey: getGetAthletesQueryKey() });
    } finally {
      setIsSyncing(false);
    }
  }, [createAthleteMutation, queryClient]);

  const removeAthlete = useCallback(async (id: string) => {
    setIsSyncing(true);
    try {
      await deleteAthleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetAthletesQueryKey() });
      if (activeAthleteId === id) {
        const remaining = athletes.filter((a) => a.id !== id);
        setActiveAthleteId(remaining.length > 0 ? remaining[0].id : null);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [deleteAthleteMutation, queryClient, activeAthleteId, athletes]);

  const recordKick = useCallback(async (body: CreateKickBody) => {
    setIsSyncing(true);
    try {
      await createKickMutation.mutateAsync({ data: body });
      queryClient.invalidateQueries({ queryKey: getGetKicksQueryKey() });
    } finally {
      setIsSyncing(false);
    }
  }, [createKickMutation, queryClient]);

  const removeKick = useCallback(async (id: string) => {
    setIsSyncing(true);
    try {
      await deleteKickMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetKicksQueryKey() });
    } finally {
      setIsSyncing(false);
    }
  }, [deleteKickMutation, queryClient]);

  return (
    <AppContext.Provider
      value={{
        athletes,
        activeAthleteId,
        setActiveAthleteId,
        isSyncing,
        isLoadingAthletes,
        addAthlete,
        removeAthlete,
        recordKick,
        removeKick,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
