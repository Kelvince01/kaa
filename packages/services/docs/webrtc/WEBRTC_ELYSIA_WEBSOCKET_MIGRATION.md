# 🔄 WebRTC Engine - Elysia WebSocket Migration Guide

## 📊 Current Situation

### **Problem**
The WebRTC engine currently uses the `ws` library (Node.js WebSocket) which is incompatible with Elysia's built-in WebSocket implementation.

**Current Setup:**
```typescript
// apps/api/src/app.ts
import { WebSocketServer } from "ws";

const wsServer = new WebSocketServer({ port: 8080 });
videoCallingService.initialize(wsServer);
```

**Issues:**
1. ❌ Running on separate port (8080) instead of main app
2. ❌ Different WebSocket API than Elysia
3. ❌ No integration with Elysia's middleware/auth
4. ❌ Separate connection management
5. ❌ Type incompatibility

---

## 🎯 Solution: Migrate to Elysia WebSocket

### **Elysia WebSocket API**

Elysia has a different WebSocket API:

```typescript
// Elysia WebSocket
app.ws("/path", {
  open(ws) {
    // Connection opened
    ws.data // Access to derived data (auth, etc.)
    ws.subscribe("room") // Subscribe to topics
  },
  message(ws, message) {
    // Message received
    ws.send(data) // Send to this client
    ws.publish("room", data) // Broadcast to room
  },
  close(ws) {
    // Connection closed
  },
})
```

**vs Node.js `ws` library:**

```typescript
// Node.js ws
ws.on("message", (data) => {})
ws.on("close", () => {})
ws.on("error", (error) => {})
ws.send(data)
```

---

## 🔧 Migration Strategy

### **Option 1: Adapter Pattern (Recommended)**

Create an adapter that wraps Elysia WebSocket to match the `ws` interface.

**Benefits:**
- ✅ Minimal changes to WebRTC engine
- ✅ Keeps engine portable
- ✅ Easy to test
- ✅ Can support both if needed

**Implementation:**

```typescript
// packages/services/src/engines/webrtc/adapters/elysia-ws-adapter.ts

import type { ServerWebSocket } from "bun";

/**
 * Adapter to make Elysia WebSocket compatible with ws library interface
 */
export class ElysiaWebSocketAdapter {
  private eventHandlers: Map<string, Function[]> = new Map();
  
  constructor(private ws: ServerWebSocket<any>) {}

  // Mimic ws library's event emitter interface
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  // Emit events (called by Elysia handlers)
  emit(event: string, ...args: any[]) {
    const handlers = this.eventHandlers.get(event) || [];
    for (const handler of handlers) {
      handler(...args);
    }
  }

  // Send message
  send(data: string | Buffer) {
    this.ws.send(data);
  }

  // Check if connection is open
  get readyState() {
    return this.ws.readyState;
  }

  get OPEN() {
    return 1; // WebSocket.OPEN
  }

  // Close connection
  close() {
    this.ws.close();
  }
}
```

---

### **Option 2: Refactor Engine (More Work)**

Refactor the WebRTC engine to use a generic WebSocket interface.

**Benefits:**
- ✅ Cleaner architecture
- ✅ Framework agnostic
- ✅ Better type safety

**Implementation:**

```typescript
// packages/services/src/engines/webrtc/types/websocket.interface.ts

export interface IWebSocket {
  send(data: string | Buffer): void;
  close(): void;
  on(event: "message", handler: (data: Buffer) => void): void;
  on(event: "close", handler: () => void): void;
  on(event: "error", handler: (error: Error) => void): void;
  readyState: number;
  OPEN: number;
}

export interface IWebSocketServer {
  handleConnection(ws: IWebSocket, userId: string): void;
}
```

Then update the engine to use this interface instead of `ws` types.

---

## 📝 Step-by-Step Migration (Option 1 - Recommended)

### **Step 1: Create Adapter**

```typescript
// packages/services/src/engines/webrtc/adapters/elysia-ws-adapter.ts

import type { ServerWebSocket } from "bun";

export class ElysiaWebSocketAdapter {
  private messageHandler?: (data: Buffer) => void;
  private closeHandler?: () => void;
  private errorHandler?: (error: Error) => void;

  constructor(private ws: ServerWebSocket<any>) {}

  on(event: "message", handler: (data: Buffer) => void): void;
  on(event: "close", handler: () => void): void;
  on(event: "error", handler: (error: Error) => void): void;
  on(event: string, handler: Function): void {
    switch (event) {
      case "message":
        this.messageHandler = handler as (data: Buffer) => void;
        break;
      case "close":
        this.closeHandler = handler as () => void;
        break;
      case "error":
        this.errorHandler = handler as (error: Error) => void;
        break;
    }
  }

  // Called by Elysia message handler
  handleMessage(data: string | Buffer) {
    const buffer = typeof data === "string" ? Buffer.from(data) : data;
    this.messageHandler?.(buffer);
  }

  // Called by Elysia close handler
  handleClose() {
    this.closeHandler?.();
  }

  // Called by Elysia error handler
  handleError(error: Error) {
    this.errorHandler?.(error);
  }

  send(data: string | Buffer) {
    this.ws.send(data);
  }

  get readyState() {
    return this.ws.readyState;
  }

  get OPEN() {
    return 1;
  }

  close() {
    this.ws.close();
  }
}
```

---

### **Step 2: Create WebSocket Route**

```typescript
// apps/api/src/features/comms/video-calling/video-calling-ws.controller.ts

import { Elysia } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { videoCallingService } from "./video-calling-webrtc.service";
import { ElysiaWebSocketAdapter } from "@kaa/services/engines/webrtc/adapters/elysia-ws-adapter";

export const videoCallingWSController = new Elysia({ prefix: "/video-calls" })
  .use(authPlugin)
  .ws("/ws", {
    open(ws) {
      const userId = ws.data.user?.id;
      
      if (!userId) {
        ws.close();
        return;
      }

      console.log(`📹 Video call WS connected: ${userId}`);

      // Create adapter
      const adapter = new ElysiaWebSocketAdapter(ws);
      
      // Store adapter in ws.data for later use
      ws.data.adapter = adapter;

      // Initialize WebRTC connection
      videoCallingService.handleWebSocketConnection(adapter, userId);
    },

    message(ws, message) {
      const adapter = ws.data.adapter as ElysiaWebSocketAdapter;
      
      if (adapter) {
        // Convert message to Buffer if needed
        const data = typeof message === "string" 
          ? Buffer.from(message) 
          : message;
        
        adapter.handleMessage(data);
      }
    },

    close(ws) {
      const userId = ws.data.user?.id;
      const adapter = ws.data.adapter as ElysiaWebSocketAdapter;
      
      console.log(`❌ Video call WS disconnected: ${userId}`);
      
      if (adapter) {
        adapter.handleClose();
      }
    },
  });
```

---

### **Step 3: Update Service**

```typescript
// apps/api/src/features/comms/video-calling/video-calling-webrtc.service.ts

class VideoCallingWebRTCService {
  private engine: VideoCallingWebRTCEngine | null = null;

  // Remove WebSocketServer dependency
  initialize() {
    if (this.engine) {
      return;
    }

    const config = createDefaultWebRTCConfig();
    this.engine = new VideoCallingWebRTCEngine(config);
  }

  // New method for handling individual WebSocket connections
  handleWebSocketConnection(ws: any, userId: string) {
    if (!this.engine) {
      this.initialize();
    }

    this.engine?.handleWebSocketConnection(ws, userId);
  }

  // ... rest of methods
}
```

---

### **Step 4: Update App Initialization**

```typescript
// apps/api/src/app.ts

// Remove this:
// import { WebSocketServer } from "ws";
// const wsServer = new WebSocketServer({ port: 8080 });
// videoCallingService.initialize(wsServer);

// Just initialize the engine
videoCallingService.initialize();
```

---

### **Step 5: Register WebSocket Route**

```typescript
// apps/api/src/app.routes.ts

import { videoCallingWSController } from "./features/comms/video-calling/video-calling-ws.controller";

export const AppRoutes = new Elysia()
  .use(videoCallingController)
  .use(videoCallingWSController) // Add WebSocket routes
  // ... other routes
```

---

## 🎯 Benefits of Migration

### **Before (ws library)**
- ❌ Separate port (8080)
- ❌ No Elysia middleware integration
- ❌ Manual auth handling
- ❌ Different connection management
- ❌ Type incompatibility

### **After (Elysia WebSocket)**
- ✅ Same port as main app
- ✅ Full Elysia middleware support
- ✅ Automatic auth via authPlugin
- ✅ Unified connection management
- ✅ Type-safe with Elysia
- ✅ Better error handling
- ✅ Pub/sub support for rooms

---

## 📊 Architecture Comparison

### **Current (ws library)**
```
Client → ws://localhost:8080
         ↓
    WebSocketServer (ws)
         ↓
    VideoCallingService
         ↓
    WebRTC Engine
```

### **After (Elysia)**
```
Client → ws://localhost:3000/video-calls/ws
         ↓
    Elysia WebSocket
         ↓
    ElysiaWebSocketAdapter
         ↓
    VideoCallingService
         ↓
    WebRTC Engine
```

---

## 🔐 Security Benefits

### **With Elysia WebSocket**

```typescript
.ws("/video-calls/ws", {
  open(ws) {
    // Automatic auth via authPlugin
    const user = ws.data.user;
    
    if (!user) {
      ws.close();
      return;
    }

    // User is authenticated!
    // Access user.id, user.role, etc.
  }
})
```

**Benefits:**
- ✅ Reuse existing auth middleware
- ✅ JWT validation
- ✅ Role-based access
- ✅ Session management
- ✅ Rate limiting

---

## 🧪 Testing

### **Test WebSocket Connection**

```typescript
// Test with wscat
wscat -c "ws://localhost:3000/video-calls/ws" \
  -H "Authorization: Bearer YOUR_TOKEN"

// Send signaling message
> {"type":"join","callId":"call_123","fromParticipant":"user_456"}

// Receive response
< {"type":"joined","callId":"call_123","participants":[...]}
```

---

## 📝 Migration Checklist

### **Phase 1: Preparation**
- [ ] Create ElysiaWebSocketAdapter
- [ ] Create video-calling-ws.controller.ts
- [ ] Update service to remove WebSocketServer dependency
- [ ] Add handleWebSocketConnection method

### **Phase 2: Implementation**
- [ ] Register WebSocket route in app.routes.ts
- [ ] Remove ws library initialization from app.ts
- [ ] Test WebSocket connection
- [ ] Test signaling messages

### **Phase 3: Testing**
- [ ] Test call creation
- [ ] Test joining calls
- [ ] Test WebRTC signaling
- [ ] Test with multiple participants
- [ ] Test reconnection
- [ ] Test error handling

### **Phase 4: Cleanup**
- [ ] Remove ws library dependency
- [ ] Update documentation
- [ ] Remove port 8080 configuration
- [ ] Update environment variables

---

## 🚀 Next Steps

1. **Create the adapter** - Start with ElysiaWebSocketAdapter
2. **Create WS controller** - Add video-calling-ws.controller.ts
3. **Update service** - Remove WebSocketServer dependency
4. **Test thoroughly** - Ensure signaling works
5. **Deploy** - Single port, unified architecture

---

## 💡 Alternative: Pub/Sub Pattern

Elysia WebSocket has built-in pub/sub which can simplify room management:

```typescript
.ws("/video-calls/ws", {
  open(ws) {
    const callId = ws.data.callId;
    
    // Subscribe to call room
    ws.subscribe(`call:${callId}`);
  },
  
  message(ws, message) {
    const callId = ws.data.callId;
    
    // Broadcast to all in room
    ws.publish(`call:${callId}`, message);
  }
})
```

This could replace the custom room management in WebRTCSignalingEngine.

---

## 📚 Resources

- [Elysia WebSocket Docs](https://elysiajs.com/patterns/websocket.html)
- [Bun WebSocket API](https://bun.sh/docs/api/websockets)
- [WebRTC Signaling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)

---

**Recommendation:** Use Option 1 (Adapter Pattern) for quickest migration with minimal risk.

The adapter keeps the WebRTC engine unchanged while making it compatible with Elysia's WebSocket API.
