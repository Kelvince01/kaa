import { config } from "@kaa/config";
import { useTranslations } from "next-intl";
import { memo, useRef, useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useNavigationStore } from "@/shared/stores/navigation.store";
// import type { UserMenuItem } from "../me/types";

export const MenuSheet = memo(() => {
  const t = useTranslations();

  const { user } = useAuthStore();

  // const menu = useNavigationStore((state) => state.menu);
  const keepOpenPreference = useNavigationStore(
    (state) => state.keepOpenPreference
  );
  const hideSubmenu = useNavigationStore((state) => state.hideSubmenu);
  const setNavSheetOpen = useNavigationStore((state) => state.setNavSheetOpen);
  const toggleHideSubmenu = useNavigationStore(
    (state) => state.toggleHideSubmenu
  );
  const toggleKeepOpenPreference = useNavigationStore(
    (state) => state.toggleKeepOpenPreference
  );

  const [searchTerm, setSearchTerm] = useState<string>("");
  // const [searchResults, setSearchResults] = useState<UserMenuItem[]>([]);

  const scrollViewportRef = useRef(null);
  const pwaEnabled = config.has.pwa;

  // const searchResultsListItems = useCallback(() => {
  // 	return searchResults.length > 0
  // 		? searchResults.map((item: UserMenuItem) => (
  // 				<MenuSheetItem key={item.id} searchResults item={item} />
  // 			))
  // 		: [];
  // }, [searchResults]);

  return (
    <div>
      <h1>Menu Sheet</h1>
    </div>
  );
});
