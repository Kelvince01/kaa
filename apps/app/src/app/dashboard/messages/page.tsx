"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/modules/auth/use-auth";
import { MessagingContainer } from "@/modules/comms/messages";

export default function MessagesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p>Please log in to access messages.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with tenants, landlords, and property managers
        </p>
      </div>

      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full p-0">
          <MessagingContainer
            className="h-full"
            userId={user.id}
            userName={`${user.firstName} ${user.lastName}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
