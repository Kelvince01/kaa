import { create } from "zustand";

type BookingStore = {
  isCreateBookingOpen: boolean;
  setIsCreateBookingOpen: (isCreateBookingOpen: boolean) => void;
};

export const useBookingStore = create<BookingStore>((set) => ({
  isCreateBookingOpen: false,
  setIsCreateBookingOpen: (isCreateBookingOpen) => set({ isCreateBookingOpen }),
}));
