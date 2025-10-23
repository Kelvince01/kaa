import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  RefreshCw,
} from "lucide-react";
import React, { Component, type ReactNode } from "react";
import { toast } from "sonner";

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isExpanded: boolean;
  retryCount: number;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
};

class EnhancedErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  readonly retryTimer: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isExpanded: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Send error to monitoring service (mock)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Mock error logging service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem("userId"),
        sessionId: sessionStorage.getItem("sessionId"),
      };

      // In real implementation, send to error tracking service
      console.log("Error report:", errorReport);
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError);
    }
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      toast.error(`Maximum retry attempts (${maxRetries}) reached`);
      return;
    }

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    toast.success(`Retrying... (Attempt ${retryCount + 1})`);
  };

  handleReload = () => {
    window.location.reload();
  };

  copyErrorDetails = () => {
    const { error, errorInfo } = this.state;

    const errorText = `
Error: ${error?.message || "Unknown error"}

Stack Trace:
${error?.stack || "No stack trace available"}

Component Stack:
${errorInfo?.componentStack || "No component stack available"}

Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard
      .writeText(errorText)
      .then(() => toast.success("Error details copied to clipboard"))
      .catch(() => toast.error("Failed to copy error details"));
  };

  downloadErrorLog = () => {
    const { error, errorInfo } = this.state;

    const errorData = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    const blob = new Blob([JSON.stringify(errorData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `error-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Error log downloaded");
  };

  toggleExpanded = () => {
    this.setState((prevState) => ({
      isExpanded: !prevState.isExpanded,
    }));
  };

  render() {
    const { hasError, error, errorInfo, isExpanded, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  An unexpected error occurred while loading the property form.
                  Don't worry - your data is likely still saved locally.
                </AlertDescription>
              </Alert>

              {/* Error Summary */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="mb-2 font-medium text-red-800">Error Details</h4>
                <p className="font-mono text-red-700 text-sm">
                  {error?.message || "Unknown error occurred"}
                </p>

                {retryCount > 0 && (
                  <p className="mt-2 text-red-600 text-xs">
                    Retry attempts: {retryCount}/{maxRetries}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  className="w-full"
                  disabled={retryCount >= maxRetries}
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>

                <Button
                  className="w-full"
                  onClick={this.handleReload}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {/* Developer Actions */}
              <div className="border-t pt-4">
                <Button
                  className="w-full justify-between"
                  onClick={this.toggleExpanded}
                  size="sm"
                  variant="ghost"
                >
                  <span>Technical Details</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={this.copyErrorDetails}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        Copy Error
                      </Button>

                      <Button
                        className="flex-1"
                        onClick={this.downloadErrorLog}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Download Log
                      </Button>
                    </div>

                    {/* Stack Trace */}
                    <div className="max-h-40 overflow-auto rounded bg-gray-100 p-3">
                      <h5 className="mb-2 font-medium text-gray-800 text-xs">
                        Stack Trace:
                      </h5>
                      <pre className="whitespace-pre-wrap text-gray-600 text-xs">
                        {error?.stack || "No stack trace available"}
                      </pre>
                    </div>

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div className="max-h-40 overflow-auto rounded bg-gray-100 p-3">
                        <h5 className="mb-2 font-medium text-gray-800 text-xs">
                          Component Stack:
                        </h5>
                        <pre className="whitespace-pre-wrap text-gray-600 text-xs">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recovery Tips */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recovery Tips:</strong>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    <li>
                      Try refreshing the page - your progress is auto-saved
                    </li>
                    <li>Check your internet connection</li>
                    <li>Clear browser cache and try again</li>
                    <li>Contact support if the problem persists</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Hook for functional components
export function useErrorRecovery() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    console.error("Captured error:", error);
  }, []);

  React.useEffect(() => {
    if (error) {
      // Log error to service
      console.error("Error captured by hook:", error);
    }
  }, [error]);

  return {
    error,
    resetError,
    captureError,
    hasError: !!error,
  };
}

export default EnhancedErrorBoundary;
