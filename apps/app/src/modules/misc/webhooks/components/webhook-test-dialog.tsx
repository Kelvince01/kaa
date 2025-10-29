"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import type { WebhookTestResult } from "../webhook.type";

type WebhookTestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string;
  webhookName: string;
  onTest: (webhookId: string) => Promise<WebhookTestResult>;
};

export const WebhookTestDialog = ({
  open,
  onOpenChange,
  webhookId,
  webhookName,
  onTest,
}: WebhookTestDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WebhookTestResult | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const testResult = await onTest(webhookId);
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test Webhook</DialogTitle>
          <DialogDescription>
            Send a test payload to {webhookName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.success ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>Webhook test successful!</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Webhook test failed: {result.error}
                  </AlertDescription>
                </Alert>
              )}

              {result.statusCode && (
                <div className="rounded-lg border p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-sm">Status Code</p>
                      <p className="font-bold text-2xl">{result.statusCode}</p>
                    </div>
                    {result.responseTime && (
                      <div>
                        <p className="font-medium text-sm">Response Time</p>
                        <p className="font-bold text-2xl">
                          {result.responseTime}ms
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.response && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Response:</p>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-4 text-xs">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {isLoading || result ? null : (
            <p className="text-muted-foreground text-sm">
              This will send a test event to your webhook endpoint. You can use
              this to verify that your endpoint is configured correctly and can
              receive webhook events.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
          {!result && (
            <Button disabled={isLoading} onClick={handleTest}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Test Event
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
