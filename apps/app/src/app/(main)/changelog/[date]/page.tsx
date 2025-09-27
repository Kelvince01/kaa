import type { Metadata } from "next";

import { notFound } from "next/navigation";
import ChangelogPost from "@/components/changelog/changelog-post";
import HoverLink from "@/components/ui/hover-link";
import { getChangelogDates, getChangelogEntry } from "@/lib/changelog";

export function generateStaticParams() {
  const dates = getChangelogDates();

  return dates.map((date) => ({
    date,
  }));
}

type Props = {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const date = (await params).date;

  if (!date) {
    return {
      title: "Changelog entry not found",
      description: "The requested changelog entry could not be found.",
    };
  }

  const entry = await getChangelogEntry(date);

  if (!entry) {
    return {
      title: "Changelog entry not found",
      description: `No changelog entry found for ${date}.`,
    };
  }

  return {
    title: `Kaa • ${entry.title}`,
    description: entry.excerpt,
  };
}

export default async function ChangelogEntryPage({ params }: Props) {
  const date = (await params).date;

  const renderHeader = () => {
    return (
      <div className="mb-8 flex items-center justify-between sm:flex">
        <HoverLink
          arrowDirection="back"
          href="/changelog"
          title="Back to Changelog"
        />
        <HoverLink
          arrowDirection="forward"
          href={"/properties"}
          title="Browse properties"
        />
      </div>
    );
  };

  if (!date) {
    console.error("No date parameter provided");
    notFound();
  }

  try {
    const entry = await getChangelogEntry(date);

    if (!entry) {
      console.error(`No changelog entry found for ${date}`);
      notFound();
    }

    return (
      <div className="flex min-h-screen flex-col items-center bg-background p-10">
        <div className="mx-auto max-w-xl space-y-8">
          {renderHeader()}
          <ChangelogPost entry={entry} />
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Error rendering changelog for ${date}:`, error);
    notFound();
  }
}
