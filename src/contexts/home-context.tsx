"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth-context";

export interface HomeRecord {
  id: string;
  name: string;
  address: string;
  router_id: string;
  nextdns_profile_id: string;
  created_at: string;
}

interface HomeState {
  homes: HomeRecord[];
  selectedHome: HomeRecord | null;
  setSelectedHome: (home: HomeRecord) => void;
  loading: boolean;
}

const HomeContext = createContext<HomeState>({
  homes: [],
  selectedHome: null,
  setSelectedHome: () => {},
  loading: true,
});

export function HomeProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth();
  const [homes, setHomes] = useState<HomeRecord[]>([]);
  const [selectedHome, setSelectedHome] = useState<HomeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHomes([]);
      setSelectedHome(null);
      setLoading(false);
      return;
    }

    async function loadHomes() {
      let homeList: HomeRecord[] = [];

      if (profile?.role === "platform_admin") {
        // Admin sees all homes
        const { data, error } = await supabase
          .from("homes")
          .select("*")
          .order("name");
        if (error) {
          console.error("Failed to load homes:", error.message);
          setLoading(false);
          return;
        }
        homeList = data ?? [];
      } else {
        // Manager sees only assigned homes
        const { data, error } = await supabase
          .from("user_homes")
          .select("homes(*)")
          .eq("user_id", user!.id);

        if (error) {
          console.error("Failed to load homes:", error.message);
          setLoading(false);
          return;
        }

        homeList = (data ?? [])
          .map((row: { homes: HomeRecord | HomeRecord[] | null }) => {
            if (Array.isArray(row.homes)) return row.homes[0];
            return row.homes;
          })
          .filter(Boolean) as HomeRecord[];
      }

      setHomes(homeList);
      if (homeList.length > 0 && !selectedHome) {
        setSelectedHome(homeList[0]);
      }
      setLoading(false);
    }

    loadHomes();
  }, [user, authLoading]);

  return (
    <HomeContext.Provider
      value={{ homes, selectedHome, setSelectedHome, loading }}
    >
      {children}
    </HomeContext.Provider>
  );
}

export function useHome() {
  return useContext(HomeContext);
}
