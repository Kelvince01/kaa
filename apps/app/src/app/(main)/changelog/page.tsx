import type { Metadata } from "next";
import ChangelogList from "@/components/changelog/changelog-list";
import { FlipText } from "@/components/ui/flip-text";
import { getAllChangelogEntries } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Track our latest updates and improvements here.",
};

export default async function ChangelogPage() {
  const entries = await getAllChangelogEntries();

  const renderHero = () => (
    <div className="flex flex-col items-start justify-between space-y-8 md:flex-row md:items-center md:space-y-0">
      <div className="space-y-4">
        <FlipText
          className="font-sans text-4xl"
          postTransitionText="Updates"
          preTransitionText="Changelog"
          srOnlyText="Changelog"
        />
        <p className="font-serif text-lg">
          Track our latest updates and improvements here.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-10">
      <div className="mx-auto max-w-xl space-y-8">
        {renderHero()}
        <ChangelogList entries={entries} />
      </div>
    </div>
  );
}
