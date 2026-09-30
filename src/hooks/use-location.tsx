import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type ServiceArea = {
  id: string;
  state_code: string;
  name: string;
  zip_codes: string[];
  cities: string[];
  active: boolean;
};

/** Active service areas, data-driven so new states appear here automatically. */
export function useServiceAreas() {
  return useQuery({
    queryKey: ["service-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_areas")
        .select("id,state_code,name,zip_codes,cities,active")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as ServiceArea[];
    },
  });
}

type LocationValue = {
  stateCode: string;
  setStateCode: (code: string) => void;
  areas: ServiceArea[];
  currentArea: ServiceArea | undefined;
};

const LocationContext = createContext<LocationValue>({
  stateCode: "MI",
  setStateCode: () => {},
  areas: [],
  currentArea: undefined,
});

const STORAGE_KEY = "airground.state";

export function LocationProvider({ children }: { children: ReactNode }) {
  const { data: areas } = useServiceAreas();
  const [stateCode, setStateCode] = useState("MI");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setStateCode(saved);
  }, []);

  const update = (code: string) => {
    setStateCode(code);
    window.localStorage.setItem(STORAGE_KEY, code);
  };

  const list = areas ?? [];
  return (
    <LocationContext.Provider
      value={{
        stateCode,
        setStateCode: update,
        areas: list,
        currentArea: list.find((a) => a.state_code === stateCode) ?? list[0],
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocationArea = () => useContext(LocationContext);

/** Does this ZIP fall inside an active service area? */
export function zipCovered(areas: ServiceArea[], zip: string) {
  const clean = zip.trim().slice(0, 5);
  if (clean.length < 5) return null;
  return areas.some((a) => a.zip_codes.includes(clean));
}
