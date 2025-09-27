import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

type MJMLPreviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  mjmlContent: string;
  title?: string;
};

export function MJMLPreviewDialog({
  isOpen,
  onClose,
  mjmlContent,
  title = "MJML Preview",
}: MJMLPreviewDialogProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: useEffect
  useEffect(() => {
    if (isOpen && mjmlContent) {
      processMJML(mjmlContent);
    }
  }, [isOpen, mjmlContent]);

  const processMJML = async (content: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Dynamic import of MJML browser library
      const { default: mjml2html } = await import("mjml-browser");

      const result = mjml2html(content, {
        minify: false,
        validationLevel: "strict",
      });

      if (result.errors && result.errors.length > 0) {
        setError(result.errors.map((err: any) => err.message).join(", "));
      } else {
        setHtmlContent(result.html);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process MJML");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button
              className="mr-6 ml-2"
              onClick={() => setShowSource(!showSource)}
              size="sm"
              variant="outline"
            >
              {showSource ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Source
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Source
                </>
              )}
            </Button>
          </DialogTitle>
          <DialogDescription>
            Preview how your MJML template will render in email clients
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[80vh]">
          <div className="flex-1 overflow-hidden">
            {showSource ? (
              <div className="h-full">
                <div className="mb-4">
                  <h3 className="mb-2 font-medium text-muted-foreground text-sm">
                    MJML Source Code
                  </h3>
                </div>
                <div className="max-h-[600px] overflow-auto rounded-md bg-muted p-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {mjmlContent}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full">
                {isProcessing ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
                      <p className="text-muted-foreground">
                        Processing MJML...
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center text-destructive">
                      <p className="mb-2">❌ MJML Processing Error</p>
                      <p className="max-w-md text-muted-foreground text-sm">
                        {error}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    <div className="mb-4">
                      <h3 className="mb-2 font-medium text-muted-foreground text-sm">
                        Email Preview
                      </h3>
                    </div>
                    <div className="max-h-[600px] overflow-auto rounded-md border bg-white">
                      <iframe
                        className="min-h-[500px] w-full"
                        sandbox="allow-same-origin allow-scripts"
                        srcDoc={htmlContent}
                        title="MJML Preview"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
