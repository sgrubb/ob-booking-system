import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ipc } from "@/lib/ipc";
import type { Season } from "@shared/types/seasons";

interface SeasonContextValue {
  activeSeason: Season | null;
  setActiveSeason: (season: Season | null) => void;
  selectedSeasonId: number | null;
  setSelectedSeasonId: (id: number | null) => void;
}

const SeasonContext = createContext<SeasonContextValue | null>(null);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  useEffect(() => {
    ipc.getActiveSeason().then((season) => {
      setActiveSeason(season);
      if (season) {
        setSelectedSeasonId(season.id);
      }
    }).catch(() => {});
  }, []);

  return (
    <SeasonContext.Provider
      value={{ activeSeason, setActiveSeason, selectedSeasonId, setSelectedSeasonId }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) {
    throw new Error("useSeason must be used within SeasonProvider");
  }
  return ctx;
}
