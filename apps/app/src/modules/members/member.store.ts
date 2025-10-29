import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Member } from "./member.type";

type MemberStore = {
  member: Member | null;
  selectedMembers: string[];
  isMemberModalOpen: boolean;
  setSelectedMembers: (ids: string[]) => void;
  toggleMemberSelection: (id: string) => void;
  clearSelectedMembers: () => void;
  setMemberModalOpen: (isOpen: boolean) => void;
  hasSelectedMembers: () => boolean;
  selectedCount: () => number;
  setMember: (member: Member) => void;
};

export const useMemberStore = create<MemberStore>((set, get) => ({
  member: null,
  selectedMembers: [],
  isMemberModalOpen: false,

  setSelectedMembers: (ids: string[]) => {
    set({ selectedMembers: ids });
  },

  toggleMemberSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedMembers.includes(id);
      const newSelected = isSelected
        ? state.selectedMembers.filter((i) => i !== id)
        : [...state.selectedMembers, id];
      return { selectedMembers: newSelected };
    });
  },

  clearSelectedMembers: () => {
    set({ selectedMembers: [] });
  },

  setMemberModalOpen: (isOpen: boolean) => {
    set({ isMemberModalOpen: isOpen });
  },

  hasSelectedMembers: () => get().selectedMembers.length > 0,

  selectedCount: () => get().selectedMembers.length,

  setMember: (member: Member) => {
    set({ member });
  },
}));

export const useMember_Store = () =>
  useMemberStore(useShallow((state) => state.member));

export const useSetMember_Store = () =>
  useMemberStore(useShallow((state) => state.setMember));
