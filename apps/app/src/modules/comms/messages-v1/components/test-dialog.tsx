"use client";

import { Button } from "@kaa/ui/components/button";
import { useState } from "react";
import { NewConversationDialog } from "./new-conversation-dialog";

// Simple test page to test the dialog
export default function TestDialogPage() {
  const [open, setOpen] = useState(false);

  const handleConversationCreated = (conversationId: string) => {
    console.log("New conversation created with ID:", conversationId);
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 font-bold text-2xl">Test New Conversation Dialog</h1>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>

      <NewConversationDialog
        onConversationCreated={handleConversationCreated}
        onOpenChange={setOpen}
        open={open}
      />
    </div>
  );
}
