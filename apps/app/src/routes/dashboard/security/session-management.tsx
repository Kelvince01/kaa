"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  Loader2,
  LogOut,
  MapPin,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import {
  useSessions,
  useTerminateAllSessions,
  useTerminateSession,
} from "@/modules/auth/session/session.queries";
import type { Session } from "@/modules/auth/session/session.type";

const SessionManagement = () => {
  const { data: sessionsData, isLoading, error, refetch } = useSessions();
  const terminateSessionMutation = useTerminateSession();
  const terminateAllSessionsMutation = useTerminateAllSessions();

  const sessions = sessionsData?.sessions || [];
  const currentSessionId = sessionsData?.currentSessionId;

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await terminateSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    try {
      await terminateAllSessionsMutation.mutateAsync();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const getDeviceIcon = (deviceType: string, _userAgent: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      // case "desktop":
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatLocation = (session: Session) => {
    if (!session.location) return "Unknown location";

    const parts: string[] = [];
    if (session.location.city) parts.push(session.location.city);
    if (session.location.region) parts.push(session.location.region);
    if (session.location.country) parts.push(session.location.country);

    return parts.join(", ") || "Unknown location";
  };

  const getDeviceName = (session: Session) => {
    if (session.deviceInfo.device) {
      return session.deviceInfo.device;
    }

    const userAgent = session.deviceInfo.userAgent;
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Android")) return "Android device";
    if (userAgent.includes("Mac")) return "Mac";
    if (userAgent.includes("Windows")) return "Windows PC";
    if (userAgent.includes("Linux")) return "Linux";
    return "Unknown device";
  };

  const getBrowserName = (session: Session) => {
    if (session.deviceInfo.browser) {
      return session.deviceInfo.browser;
    }

    const userAgent = session.deviceInfo.userAgent;
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
      return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "Safari";
    if (userAgent.includes("Edg")) return "Edge";
    if (userAgent.includes("MSIE") || userAgent.includes("Trident"))
      return "Internet Explorer";
    return "Unknown browser";
  };

  const getSessionStatusColor = (session: Session) => {
    if (!session.valid || session.isRevoked) return "text-red-600";
    return "text-green-600";
  };

  const getSessionStatusText = (session: Session) => {
    if (session.isRevoked) return "Revoked";
    if (!session.valid) return "Invalid";
    return "Active";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Active Sessions
          </h3>
          <p className="text-gray-600 text-sm">
            Manage devices signed into your account
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          For security reasons, we keep track of browsers and devices that are
          logged in to your account. If you don't recognize a session, terminate
          it immediately.
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load sessions. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Your Sessions ({sessions.length})
              </CardTitle>
              <CardDescription>
                Active sessions across all your devices
              </CardDescription>
            </div>
            <Button
              disabled={isLoading}
              onClick={() => refetch()}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="mb-2 font-medium text-gray-900 text-lg">
                No Active Sessions
              </h4>
              <p className="text-gray-600 text-sm">
                No active sessions found for your account.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session) => {
                  const isCurrentSession = session.id === currentSessionId;
                  const isTerminating = terminateSessionMutation.isPending;

                  return (
                    <div
                      className={`rounded-lg border p-4 transition-colors ${
                        isCurrentSession
                          ? "border-primary/30 bg-primary/5"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      key={session.id}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              isCurrentSession ? "bg-primary/10" : "bg-gray-100"
                            }`}
                          >
                            {getDeviceIcon(
                              session.deviceInfo.deviceType,
                              session.deviceInfo.userAgent
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {getDeviceName(session)} •{" "}
                                {getBrowserName(session)}
                              </h4>
                              {isCurrentSession && (
                                <Badge
                                  className="border-primary/20 bg-primary/10 text-primary text-xs"
                                  variant="outline"
                                >
                                  Current Session
                                </Badge>
                              )}
                              <Badge
                                className={`text-xs ${
                                  session.valid && !session.isRevoked
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                                }`}
                                variant="outline"
                              >
                                {getSessionStatusText(session)}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-gray-500 text-xs">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {formatLocation(session)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last active:{" "}
                                {formatDistanceToNow(
                                  new Date(session.lastActive)
                                )}{" "}
                                ago
                              </div>
                              <div className="flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                IP: {session.deviceInfo.ip || "Unknown"} •
                                Started:{" "}
                                {format(
                                  new Date(session.createdAt),
                                  "MMM d, yyyy HH:mm"
                                )}
                              </div>
                              {session.deviceInfo.os && (
                                <div className="flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  OS: {session.deviceInfo.os} • Auth:{" "}
                                  {session.authStrategy}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          {!isCurrentSession &&
                            session.valid &&
                            !session.isRevoked && (
                              <Button
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={isTerminating}
                                onClick={() =>
                                  handleTerminateSession(session.id)
                                }
                                size="sm"
                                variant="outline"
                              >
                                {isTerminating ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Terminating...
                                  </>
                                ) : (
                                  <>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Terminate
                                  </>
                                )}
                              </Button>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sessions.filter(
                (s) => s.id !== currentSessionId && s.valid && !s.isRevoked
              ).length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        Terminate All Other Sessions
                      </h4>
                      <p className="text-gray-600 text-xs">
                        This will sign you out of all other devices except this
                        one.
                      </p>
                    </div>
                    <Button
                      disabled={terminateAllSessionsMutation.isPending}
                      onClick={handleTerminateAllOtherSessions}
                      size="sm"
                      variant="destructive"
                    >
                      {terminateAllSessionsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Terminating...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Terminate All Others
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4" />
            Session Security Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Info className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Device Tracking</h4>
                <p className="text-gray-600 text-sm">
                  We track device type, browser, and location for security
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Session Expiry</h4>
                <p className="text-gray-600 text-sm">
                  Sessions automatically expire after period of inactivity
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <LogOut className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Remote Termination
                </h4>
                <p className="text-gray-600 text-sm">
                  Instantly revoke access from any device remotely
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Suspicious Activity
                </h4>
                <p className="text-gray-600 text-sm">
                  Monitor for unusual login patterns and locations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionManagement;
