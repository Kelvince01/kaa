/**
 * Messaging Container
 *
 * Main messaging interface component that combines conversation list and message view
 */

"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { cn } from "@kaa/ui/lib/utils";
import { MessageSquare, Settings, Users } from "lucide-react";
import { useState } from "react";
import { useWebSocketMessages } from "../hooks";
import { useConversations } from "../message.queries";
import { useMessageStore } from "../message.store";
import { ConversationList } from "./conversation-list";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

type MessagingContainerProps = {
  className?: string;
  userId: string;
  userName?: string;
};

export function MessagingContainer({
  className,
  userId,
  userName,
}: MessagingContainerProps) {
  const [view, setView] = useState<"conversations" | "messages">(
    "conversations"
  );

  // Store state
  const {
    currentConversationId,
    isWebSocketConnected,
    setCurrentConversation,
  } = useMessageStore();

  // Queries
  const { data: conversationsData, isLoading: conversationsLoading } =
    useConversations({}, 1, 20, { enabled: !!userId });

  // WebSocket connection
  const {
    isConnected,
    isLoading: wsLoading,
    joinConversation,
    leaveConversation,
  } = useWebSocketMessages({
    userId,
    userName,
    enabled: !!userId,
  });

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    setCurrentConversation(conversationId);

    // Join conversation via WebSocket
    if (isConnected) {
      joinConversation(conversationId);
    }

    setView("messages");
  };

  // Handle back to conversations
  const handleBackToConversations = () => {
    if (currentConversationId && isConnected) {
      leaveConversation(currentConversationId);
    }
    setCurrentConversation(null);
    setView("conversations");
  };

  // Handle new conversation
  const handleNewConversation = () => {
    // This will be handled by the NewConversationDialog
    console.log("New conversation requested");
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          "w-full border-r bg-background transition-all duration-300 md:w-80",
          view === "messages" && "hidden md:block"
        )}
      >
        <Card className="h-full rounded-none border-0 border-r">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  className="text-xs"
                  variant={isConnected ? "default" : "secondary"}
                >
                  {isConnected ? "Live" : "Offline"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ConversationList
              conversations={conversationsData?.conversations || []}
              currentConversationId={currentConversationId}
              isLoading={conversationsLoading}
              onConversationCreated={(conversationId) => {
                handleConversationSelect(conversationId);
              }}
              onConversationSelect={handleConversationSelect}
            />
          </CardContent>
        </Card>
      </div>

      {/* Message View */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          view === "conversations" && "hidden md:flex"
        )}
      >
        {currentConversationId ? (
          <Card className="h-full rounded-none border-0">
            <CardContent className="flex h-full flex-col p-0">
              {/* Message Header */}
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <Button
                    className="md:hidden"
                    onClick={handleBackToConversations}
                    size="sm"
                    variant="ghost"
                  >
                    ← Back
                  </Button>
                  <div>
                    <h3 className="font-semibold">
                      {conversationsData?.conversations.find(
                        (c) => c.conversation._id === currentConversationId
                      )?.conversation.title || "Conversation"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {conversationsData?.conversations.find(
                        (c) => c.conversation._id === currentConversationId
                      )?.participants.length || 0}{" "}
                      participants
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <MessageList conversationId={currentConversationId} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <MessageInput
                  conversationId={currentConversationId}
                  onSendMessage={() => {
                    // Message sent, scroll to bottom could be handled here
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          // Empty state when no conversation selected
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">
                No conversation selected
              </h3>
              <p className="mb-4 text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
              <Button
                className="md:hidden"
                onClick={() => setView("conversations")}
              >
                <Users className="mr-2 h-4 w-4" />
                View Conversations
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
