import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Location {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  nablNumber?: string;
  gstNumber?: string;
  labName?: string;
  reportPrefix?: string;
  isHQ: boolean;
  isActive: boolean;
}

interface LocationState {
  locations: Location[];
  currentLocationId: number | null;
  currentLocationName: string;
  isHQ: boolean;
  setLocations: (locations: Location[]) => void;
  setCurrentLocation: (id: number | null, name: string) => void;
  setIsHQ: (isHQ: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      locations: [],
      currentLocationId: null,
      currentLocationName: 'All Locations',
      isHQ: false,
      setLocations: (locations) => set({ locations }),
      setCurrentLocation: (id, name) => set({ currentLocationId: id, currentLocationName: name }),
      setIsHQ: (isHQ) => set({ isHQ }),
    }),
    { name: 'lims-location' }
  )
);
