"use client";

import { Button } from "@kaa/ui/components/button";
import { cn } from "@kaa/ui/lib/utils";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useConversationMessages,
  useConversations,
  useMarkConversationAsRead,
  useSendMessage,
} from "../conversation.queries";
import { useCurrentMessageStore } from "../message.store";
import type { CreateMessageInput } from "../message.type";
import { ConversationList } from "./conversation-list";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { NewConversationDialog } from "./new-conversation-dialog";

type MessagingContainerProps = {
  className?: string;
  conversationId?: string;
};

export default function MessagingContainer({
  className,
  conversationId: initialConversationId,
}: MessagingContainerProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(initialConversationId || null);
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showList, setShowList] = useState(true);

  // Store
  const {
    currentConversation,
    setCurrentConversation,
    conversations: storeConversations,
    setConversations,
  } = useCurrentMessageStore();

  // Queries
  const { data: conversationsData, isLoading: conversationsLoading } =
    useConversations();
  const { data: messagesData, isLoading: messagesLoading } =
    useConversationMessages(selectedConversationId || "", {
      page: 1,
      limit: 50,
    });
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkConversationAsRead();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update store when conversations data changes
  useEffect(() => {
    if (conversationsData?.data) {
      setConversations(conversationsData.data);
    }
  }, [conversationsData, setConversations]);

  // Update current conversation when selection changes
  useEffect(() => {
    if (selectedConversationId && conversationsData?.data) {
      const conversation = conversationsData.data.find(
        (c) => c._id === selectedConversationId
      );
      if (conversation) {
        setCurrentConversation(conversation);
        // Mark as read when opening conversation
        markAsReadMutation.mutate(selectedConversationId);
      }
    } else {
      setCurrentConversation(null);
    }
  }, [
    selectedConversationId,
    conversationsData,
    setCurrentConversation,
    markAsReadMutation,
  ]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (isMobile) {
      setShowList(false);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowList(true);
      setSelectedConversationId(null);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!selectedConversationId) return;

    const messageData: CreateMessageInput = {
      content,
      attachments,
    };

    await sendMessageMutation.mutateAsync({
      conversationId: selectedConversationId,
      data: messageData,
    });
  };

  const conversations = conversationsData?.data || storeConversations || [];
  const messages = messagesData?.items || [];

  return (
    <>
      <div className={cn("flex h-full overflow-hidden", className)}>
        {/* Conversation list */}
        <div
          className={cn(
            "w-full border-r md:w-80 lg:w-96",
            isMobile && !showList && "hidden"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header with new conversation button */}
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold text-lg">Messages</h2>
              <Button
                onClick={() => setShowNewConversationDialog(true)}
                size="icon"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-hidden">
              <ConversationList
                activeConversationId={selectedConversationId || undefined}
                conversations={conversations}
                isLoading={conversationsLoading}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </div>
        </div>

        {/* Message area */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            isMobile && showList && "hidden"
          )}
        >
          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <MessageList
              conversation={currentConversation}
              isLoading={messagesLoading}
              messages={messages}
              onBackToList={handleBackToList}
              showBackButton={isMobile}
            />
          </div>

          {/* Message input */}
          {currentConversation && (
            <MessageInput
              disabled={sendMessageMutation.isPending}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>
      </div>

      {/* New conversation dialog */}
      <NewConversationDialog
        onConversationCreated={(conversationId) => {
          handleSelectConversation(conversationId);
          setShowNewConversationDialog(false);
        }}
        onOpenChange={setShowNewConversationDialog}
        open={showNewConversationDialog}
      />
    </>
  );
}
