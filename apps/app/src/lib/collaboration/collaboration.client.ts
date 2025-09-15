/**
 * Real-time Collaboration Client for Virtual Tours (Frontend)
 * Handles WebSocket connections and WebRTC for real-time collaboration
 */

import { EventEmitter } from "node:events";

type CollaborationSession = {
  sessionId: string;
  tourId: string;
  role: "host" | "viewer" | "editor";
  participants: Participant[];
  isConnected: boolean;
  ws: WebSocket | null;
};

type Participant = {
  id: string;
  userId: string;
  role: "host" | "viewer" | "editor";
  joinedAt: Date;
  isActive: boolean;
};

type ChatMessage = {
  id: string;
  userId: string;
  message: string;
  timestamp: Date;
  type: "text" | "system" | "annotation";
};

type LiveAnnotation = {
  id: string;
  userId: string;
  sceneId: string;
  position: { x: number; y: number };
  content: string;
  timestamp: Date;
  type: "note" | "question" | "issue";
};

type WebRTCConnection = {
  participantId: string;
  peerConnection: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  dataChannel?: RTCDataChannel;
};

class CollaborationClient extends EventEmitter {
  private session: CollaborationSession | null = null;
  private ws: WebSocket | null = null;
  private readonly webrtcConnections: Map<string, WebRTCConnection> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  /**
   * Join a collaboration session
   */
  joinSession(
    sessionId: string,
    tourId: string,
    role: "host" | "viewer" | "editor" = "viewer"
  ): Promise<boolean> {
    try {
      // Get auth token
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Construct WebSocket URL
      const wsUrl = this.buildWebSocketURL(sessionId, role, token);

      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl);

      // Setup event handlers
      this.setupWebSocketHandlers();

      // Initialize session
      this.session = {
        sessionId,
        tourId,
        role,
        participants: [],
        isConnected: false,
        ws: this.ws,
      };

      // Wait for connection
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10_000);

        this.once("connected", () => {
          clearTimeout(timeout);
          resolve(true);
        });

        this.once("connection-failed", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Failed to join collaboration session:", error);
      return Promise.resolve(false);
    }
  }

  /**
   * Leave collaboration session
   */
  leaveSession(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Close all WebRTC connections
    for (const connection of this.webrtcConnections.values()) {
      connection.peerConnection.close();
    }
    this.webrtcConnections.clear();

    if (this.session) {
      this.session.isConnected = false;
      this.emit("session-left", this.session.sessionId);
    }

    this.session = null;
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string): void {
    if (!(this.session?.isConnected && this.ws)) return;

    this.ws.send(
      JSON.stringify({
        type: "chat-message",
        data: { message },
      })
    );
  }

  /**
   * Send tour change
   */
  sendTourChange(change: any): void {
    if (!(this.session?.isConnected && this.ws)) return;

    this.ws.send(
      JSON.stringify({
        type: "tour-change",
        data: change,
      })
    );
  }

  /**
   * Add live annotation
   */
  addAnnotation(
    sceneId: string,
    position: { x: number; y: number },
    content: string,
    type: "note" | "question" | "issue" = "note"
  ): void {
    if (!(this.session?.isConnected && this.ws)) return;

    this.ws.send(
      JSON.stringify({
        type: "annotation-add",
        data: {
          sceneId,
          position,
          content,
          type,
        },
      })
    );
  }

  /**
   * Send cursor movement
   */
  sendCursorMove(x: number, y: number, sceneId: string): void {
    if (!(this.session?.isConnected && this.ws)) return;

    // Throttle cursor movements
    if (!this.cursorThrottle) {
      this.cursorThrottle = setTimeout(() => {
        this.ws?.send(
          JSON.stringify({
            type: "cursor-move",
            data: { x, y, sceneId },
          })
        );
        this.cursorThrottle = null;
      }, 50); // 20fps max
    }
  }

  private cursorThrottle: NodeJS.Timeout | null = null;

  /**
   * Start WebRTC connection with participant
   */
  async startWebRTC(
    participantId: string,
    isInitiator = false
  ): Promise<boolean> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Get local media stream
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Add tracks to peer connection
      for (const track of localStream.getTracks()) {
        peerConnection.addTrack(track, localStream);
      }

      // Setup event handlers
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.ws) {
          this.ws.send(
            JSON.stringify({
              type: "webrtc-ice-candidate",
              data: {
                candidate: event.candidate,
                targetId: participantId,
              },
            })
          );
        }
      };

      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        this.emit("remote-stream", { participantId, stream: remoteStream });
      };

      // Store connection
      const connection: WebRTCConnection = {
        participantId,
        peerConnection,
        localStream,
      };

      this.webrtcConnections.set(participantId, connection);

      // Create offer if initiator
      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        this.ws?.send(
          JSON.stringify({
            type: "webrtc-offer",
            data: {
              offer,
              targetId: participantId,
            },
          })
        );
      }

      this.emit("webrtc-connection-started", { participantId, isInitiator });
      return true;
    } catch (error) {
      console.error("WebRTC connection failed:", error);
      return false;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("Collaboration WebSocket connected");
      if (this.session) {
        this.session.isConnected = true;
      }
      this.reconnectAttempts = 0;
      this.emit("connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = (event) => {
      console.log("Collaboration WebSocket closed:", event.code);
      if (this.session) {
        this.session.isConnected = false;
      }
      this.emit("disconnected", event.code);

      // Attempt reconnection if not intentional
      if (
        event.code !== 1000 &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (event) => {
      console.error("Collaboration WebSocket error:", event);
      this.emit("connection-failed", event);
    };
  }

  /**
   * Handle messages from server
   */
  private handleServerMessage(data: any): void {
    switch (data.type) {
      case "session-state":
        this.handleSessionState(data);
        break;
      case "participant-joined":
        this.handleParticipantJoined(data.participant);
        break;
      case "participant-left":
        this.handleParticipantLeft(data.participant);
        break;
      case "chat-message":
        this.handleChatMessage(data.message);
        break;
      case "tour-change":
        this.handleTourChange(data.change);
        break;
      case "annotation-added":
        this.handleAnnotationAdded(data.annotation);
        break;
      case "cursor-moved":
        this.handleCursorMoved(data);
        break;
      case "webrtc-offer":
        this.handleWebRTCOffer(data);
        break;
      case "webrtc-answer":
        this.handleWebRTCAnswer(data);
        break;
      case "webrtc-ice-candidate":
        this.handleWebRTCICECandidate(data);
        break;
      case "error":
        this.emit("error", data.message);
        break;
      default:
        break;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;

    setTimeout(
      () => {
        if (this.session && !this.session.isConnected) {
          console.log(
            `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );
          this.joinSession(
            this.session.sessionId,
            this.session.tourId,
            this.session.role
          );
        }
      },
      this.reconnectDelay * 2 ** this.reconnectAttempts
    ); // Exponential backoff
  }

  // Private helper methods
  private getAuthToken(): string | null {
    // Get auth token from localStorage or cookies
    return localStorage.getItem("auth-token") || null;
  }

  private buildWebSocketURL(
    sessionId: string,
    role: string,
    token: string
  ): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL || "localhost:3000";
    return `${protocol}//${host}/api/virtual-tours/collaboration/${sessionId}?role=${role}&token=${token}`;
  }

  // Message handlers
  private handleSessionState(data: any): void {
    if (this.session) {
      this.session.participants = data.session.participants || [];
      this.emit("session-state-updated", data.session);
    }
  }

  private handleParticipantJoined(participant: Participant): void {
    if (this.session) {
      this.session.participants.push(participant);
      this.emit("participant-joined", participant);
    }
  }

  private handleParticipantLeft(participant: Participant): void {
    if (this.session) {
      this.session.participants = this.session.participants.filter(
        (p) => p.id !== participant.id
      );
      this.emit("participant-left", participant);

      // Close WebRTC connection if exists
      const webrtcConnection = this.webrtcConnections.get(participant.id);
      if (webrtcConnection) {
        webrtcConnection.peerConnection.close();
        this.webrtcConnections.delete(participant.id);
      }
    }
  }

  private handleChatMessage(message: ChatMessage): void {
    this.emit("chat-message", message);
  }

  private handleTourChange(change: any): void {
    this.emit("tour-change", change);
  }

  private handleAnnotationAdded(annotation: LiveAnnotation): void {
    this.emit("annotation-added", annotation);
  }

  private handleCursorMoved(data: any): void {
    this.emit("cursor-moved", data);
  }

  private async handleWebRTCOffer(data: any): Promise<void> {
    try {
      const connection = this.webrtcConnections.get(data.senderId);
      if (!connection) return;

      await connection.peerConnection.setRemoteDescription(data.offer);
      const answer = await connection.peerConnection.createAnswer();
      await connection.peerConnection.setLocalDescription(answer);

      this.ws?.send(
        JSON.stringify({
          type: "webrtc-answer",
          data: {
            answer,
            targetId: data.senderId,
          },
        })
      );
    } catch (error) {
      console.error("WebRTC offer handling error:", error);
    }
  }

  private async handleWebRTCAnswer(data: any): Promise<void> {
    try {
      const connection = this.webrtcConnections.get(data.senderId);
      if (connection) {
        await connection.peerConnection.setRemoteDescription(data.answer);
      }
    } catch (error) {
      console.error("WebRTC answer handling error:", error);
    }
  }

  private async handleWebRTCICECandidate(data: any): Promise<void> {
    try {
      const connection = this.webrtcConnections.get(data.senderId);
      if (connection) {
        await connection.peerConnection.addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error("WebRTC ICE candidate handling error:", error);
    }
  }

  /**
   * Public API methods
   */
  isConnected(): boolean {
    return this.session?.isConnected ?? false;
  }

  getCurrentSession(): CollaborationSession | null {
    return this.session;
  }

  getParticipants(): Participant[] {
    return this.session?.participants || [];
  }

  startVideoCall(participantId: string): Promise<boolean> {
    return this.startWebRTC(participantId, true);
  }

  getConnectionHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    connected: boolean;
    participants: number;
    webrtcConnections: number;
  } {
    return {
      status: this.isConnected() ? "healthy" : "unhealthy",
      connected: this.isConnected(),
      participants: this.getParticipants().length,
      webrtcConnections: this.webrtcConnections.size,
    };
  }
}

export default new CollaborationClient();
