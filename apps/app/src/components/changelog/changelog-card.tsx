"use client";

import { Button } from "@kaa/ui/components/button";
import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import Separator from "@/components/common/separator";
import HoverLink from "@/components/ui/hover-link";
import type { ChangelogEntry } from "@/lib/changelog";

import { copyToClipboard } from "@/lib/copy";

type ChangelogEntryProps = {
  entry: ChangelogEntry;
  hasDetails?: boolean;
};

export default function ChangelogCard({
  entry,
  hasDetails = true,
}: ChangelogEntryProps) {
  const [copying, setCopying] = useState(false);

  const formattedDate = new Date(entry.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const renderArticleHeader = () => (
    <header className="flex items-center justify-between font-sans">
      <div className="flex flex-col space-y-2">
        <h1 className="font-semibold text-xl">{entry.title}</h1>
        <div className="flex items-center space-x-2 text-gray-600 text-xs dark:text-gray-400">
          <p>{entry.type}</p>
          <p className="block sm:hidden">|</p>
          <time className="block sm:hidden">{formattedDate}</time>
        </div>
      </div>
      <time className="hidden text-right text-xl sm:block">
        {formattedDate}
      </time>
    </header>
  );

  const renderExcerpt = () => (
    <p className="font-serif text-gray-600 dark:text-gray-400">
      {entry.excerpt}
    </p>
  );

  const handleCopy = () => {
    copyToClipboard(`${window.location.origin}/changelog/${entry.date}`, {
      onCopyStart: () => setCopying(true),
      onCopyComplete: () => setCopying(false),
      toastMessage: "Article URL copied to clipboard!",
      showToast: true,
    });
  };

  const renderLinks = () => {
    if (!hasDetails) {
      return null;
    }

    return (
      <div className="flex justify-between">
        <Button
          disabled={copying}
          onClick={handleCopy}
          size="icon"
          variant="dashed"
        >
          {copying ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </Button>
        <HoverLink href={`/changelog/${entry.date}`} title="Read more" />
      </div>
    );
  };

  return (
    <article className="space-y-4">
      {renderArticleHeader()}
      {renderExcerpt()}
      {renderLinks()}
      <div className="pt-4">
        <Separator />
      </div>
    </article>
  );
}
