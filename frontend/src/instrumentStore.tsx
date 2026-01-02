import { create } from "zustand";

interface InstrumentStoreState {
  dataRedish: any[] | null;
  lastFetchedAt: number | null;
  setDataRedish: (payload: any[]) => void;
  shouldFetchRedish: () => boolean;
}

export const useInstrumentStore = create<InstrumentStoreState>((set, get) => ({
  dataRedish: null,
  lastFetchedAt: null,

  setDataRedish: (payload: any[]) =>
    set({
      dataRedish: payload,
      lastFetchedAt: Date.now(),
    }),

  shouldFetchRedish: () => {
    const { lastFetchedAt } = get();
    if (!lastFetchedAt) return true;

    const THREE_HOURS = 8 * 60 * 60 * 1000;
    return Date.now() - lastFetchedAt > THREE_HOURS;
  },
}));
