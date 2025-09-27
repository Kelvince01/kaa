"use client";

import { Button } from "@kaa/ui/components/button";
import { Check, Link2 } from "lucide-react";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MDXContent from "@/components/changelog/mdx-content";
import Separator from "@/components/common/separator";
import type { ChangelogEntry } from "@/lib/changelog";
import { copyToClipboard } from "@/lib/copy";

type ChangelogPostProps = {
  entry: ChangelogEntry;
};

export default function ChangelogPost({ entry }: ChangelogPostProps) {
  const [copying, setCopying] = useState(false);
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(
    null
  );

  useEffect(() => {
    const parseMdx = async () => {
      try {
        if (entry.content) {
          const mdxSource = await serialize(entry.content);
          setMdxSource(mdxSource);
        }
      } catch (error) {
        console.error("Error parsing MDX:", error);
      }
    };

    parseMdx();
  }, [entry.content]);

  const date = new Date(entry.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleCopy = () => {
    copyToClipboard(`${window.location.origin}/changelog/${entry.date}`, {
      onCopyStart: () => setCopying(true),
      onCopyComplete: () => setCopying(false),
      toastMessage: "Article URL copied to clipboard!",
      toast,
    });
  };

  const renderShareButton = () => {
    return (
      <Button
        disabled={copying}
        onClick={handleCopy}
        size="iconSm"
        variant="dashed"
      >
        {copying ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
      </Button>
    );
  };

  const renderHeader = () => {
    return (
      <div className="mb-4 flex items-center justify-between space-x-8 font-sans">
        <div className="flex w-full flex-col space-y-2 sm:w-auto">
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-3xl">
              {entry.title}
              <span className="ml-2 hidden sm:inline">
                {renderShareButton()}
              </span>
            </h1>
          </div>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            {entry.type}
          </p>
          <div className="flex justify-between sm:hidden">
            <p className="text-lg">{formattedDate}</p>
            {renderShareButton()}
          </div>
        </div>
        <p className="hidden text-right text-3xl sm:block">{formattedDate}</p>
      </div>
    );
  };

  const renderContent = () => {
    if (!mdxSource) {
      return (
        <div className="font-serif text-gray-600 dark:text-gray-400">
          Loading content...
        </div>
      );
    }

    return (
      <div className="mdx-content">
        <MDXContent mdxSource={mdxSource} />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderHeader()}
      <Separator />
      {renderContent()}
    </div>
  );
}
