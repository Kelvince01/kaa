"use client";

import { H1, P } from "@/components/common/typography";
import HoverLink from "@/components/ui/hover-link";

export default function ChangelogNotFound() {
  return (
    <div className="flex h-full flex-col items-center bg-background p-10">
      <div className="mx-auto max-w-xl space-y-8">
        <H1 className="font-sans text-3xl">Changelog entry not found 🥵</H1>
        <P className="mb-8 text-gray-600 text-lg">
          The changelog entry you&apos;re looking for could not be found.
        </P>
        <HoverLink
          arrowDirection="back"
          href="/changelog"
          title="Back to Changelog"
        />
      </div>
    </div>
  );
}
