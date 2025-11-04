import type { Metadata } from "next";
import Favourites from "@/routes/account/favorites";

export const metadata: Metadata = {
  title: "Favorites | Account",
  description:
    "Discover and revisit your favorite properties. Easily access homes you've liked and keep track of your top real estate picks in one place!",
};

export default function FavouritesPage() {
  return <Favourites />;
}
