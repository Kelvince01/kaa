"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Button } from "@kaa/ui/components/button";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { ChevronLeft, Info, Paperclip } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/modules/auth";
import type { ProcessedConversation } from "../conversation.type";
import type { Message } from "../message.type";

type MessageListProps = {
  conversation: ProcessedConversation | null;
  messages: Message[];
  isLoading?: boolean;
  onBackToList?: () => void;
  showBackButton?: boolean;
};

export function MessageList({
  conversation,
  messages,
  isLoading = false,
  onBackToList,
  showBackButton = false,
}: MessageListProps) {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-1/3" />
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {[...new Array(5)].map((_, i) => (
              <div
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                key={i.toString()}
              >
                <Skeleton
                  className={`h-16 w-48 rounded-lg ${i % 2 === 0 ? "" : "bg-primary/10"}`}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Empty state
  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <Info className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-medium text-lg">No conversation selected</h3>
        <p className="text-muted-foreground text-sm">
          Select a conversation from the list or start a new one
        </p>
      </div>
    );
  }

  const otherParticipant = conversation.otherParticipant;

  // Group messages by date
  const groupedMessages =
    messages?.reduce(
      (groups: { [key: string]: Message[] }, message: Message) => {
        const date = new Date(message.createdAt).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
        return groups;
      },
      {}
    ) || {};

  return (
    <div className="flex h-full flex-col">
      {/* Conversation header */}
      <div className="flex items-center border-b p-4">
        {showBackButton && onBackToList && (
          <Button
            className="mr-2 md:hidden"
            onClick={onBackToList}
            size="icon"
            variant="ghost"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Avatar */}
        <Avatar className="mr-3 h-10 w-10">
          {otherParticipant?.avatar && (
            <AvatarImage src={otherParticipant.avatar} />
          )}
          <AvatarFallback>
            {otherParticipant
              ? `${otherParticipant.firstName[0]}${otherParticipant.lastName[0]}`
              : "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="font-medium text-lg">
            {otherParticipant
              ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
              : conversation.title || "Conversation"}
          </h2>

          {/* Property information */}
          {conversation.property &&
            typeof conversation.property === "object" && (
              <Link
                className="text-primary text-xs hover:underline"
                href={`/properties/${conversation.property._id}`}
              >
                {conversation.property.title}
              </Link>
            )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="my-4 flex justify-center">
                <div className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-xs">
                  {format(new Date(date), "MMMM d, yyyy")}
                </div>
              </div>

              {/* Day's messages */}
              <div className="space-y-4">
                {dayMessages.map((message) => {
                  const isCurrentUser = message.sender === user?.id;

                  return (
                    <div
                      className={cn(
                        "flex",
                        isCurrentUser ? "justify-end" : "justify-start"
                      )}
                      key={message._id}
                    >
                      {/* Message bubble */}
                      <div
                        className={cn(
                          "max-w-xs rounded-lg px-4 py-2 md:max-w-md",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {/* Message content */}
                        <p className="wrap-break-word whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>

                        {/* Attachments */}
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.url}>
                                  {attachment.type?.startsWith("image/") ? (
                                    <div className="relative">
                                      <Image
                                        alt={
                                          attachment.filename || "Attachment"
                                        }
                                        className="max-w-full rounded-md"
                                        height={64}
                                        onClick={() =>
                                          window.open(attachment.url, "_blank")
                                        }
                                        src={attachment.url}
                                        width={64}
                                      />
                                    </div>
                                  ) : (
                                    <a
                                      className={cn(
                                        "flex items-center rounded-md p-2",
                                        isCurrentUser
                                          ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                                          : "bg-background hover:bg-muted-foreground/10"
                                      )}
                                      href={attachment.url}
                                      rel="noopener noreferrer"
                                      target="_blank"
                                    >
                                      <Paperclip className="mr-2 h-4 w-4" />
                                      <span className="truncate text-xs">
                                        {attachment.filename ||
                                          attachment.name ||
                                          "Attachment"}
                                      </span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Timestamp */}
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            isCurrentUser
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {format(new Date(message.createdAt), "h:mm a")}
                          {message.isRead && isCurrentUser && " • Read"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
