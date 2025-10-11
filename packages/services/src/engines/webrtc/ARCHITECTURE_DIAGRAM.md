# WebRTC Recording System - Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   React Web  │  │ React Native │  │  Mobile App  │              │
│  │              │  │              │  │              │              │
│  │ • Recording  │  │ • Recording  │  │ • Recording  │              │
│  │   Controls   │  │   Controls   │  │   Controls   │              │
│  │ • Status UI  │  │ • Status UI  │  │ • Status UI  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
└─────────┼──────────────────┼──────────────────┼───────────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    HTTP/WebSocket
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                       API GATEWAY LAYER                               │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           video-calling.controller.ts                         │   │
│  │                                                                │   │
│  │  POST   /recording/start        → startRecording()           │   │
│  │  POST   /recording/stop         → stopRecording()            │   │
│  │  GET    /recording/:id          → getRecordingStatus()       │   │
│  │  DELETE /recording/:id          → deleteRecording()          │   │
│  │                                                                │   │
│  │  • Request validation                                         │   │
│  │  • Authentication                                             │   │
│  │  • Error handling                                             │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                      SERVICE LAYER                                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │        video-calling-webrtc.service.ts                        │   │
│  │                                                                │   │
│  │  • Permission checks (host-only)                              │   │
│  │  • Business logic                                             │   │
│  │  • Database operations                                        │   │
│  │  • User authentication                                        │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                       ENGINE LAYER                                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         video-calling-webrtc.engine.ts                        │   │
│  │                                                                │   │
│  │  • Call management                                            │   │
│  │  • Recording coordination                                     │   │
│  │  • Event handling                                             │   │
│  │  • Status management                                          │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                    MEDIA SERVER LAYER                                 │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         webrtc-media-server.engine.ts                         │   │
│  │                                                                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │   Room      │  │ Participant │  │   Track     │          │   │
│  │  │ Management  │  │ Management  │  │  Capture    │          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│  │                                                                │   │
│  │  • WebRTC connections                                         │   │
│  │  • SFU (Selective Forwarding Unit)                            │   │
│  │  • Recording orchestration                                    │   │
│  │  • Event emission                                             │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                    RECORDING ENGINE LAYER                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │          webrtc-recording.engine.ts                           │   │
│  │                                                                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │   Chunk     │  │   Media     │  │  Storage    │          │   │
│  │  │ Management  │  │ Processing  │  │  Handler    │          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│  │                                                                │   │
│  │  • Chunk buffering                                            │   │
│  │  • Stream mixing                                              │   │
│  │  • Format conversion                                          │   │
│  │  • Metadata generation                                        │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                       STORAGE LAYER                                   │
│                                                                        │
│  ┌──────────────────┐              ┌──────────────────┐             │
│  │  Local Storage   │              │  Cloud Storage   │             │
│  │                  │              │                  │             │
│  │  • File system   │              │  • AWS S3        │             │
│  │  • ./recordings  │              │  • Google Cloud  │             │
│  │                  │              │  • Azure Blob    │             │
│  └──────────────────┘              └──────────────────┘             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Recording Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. POST /recording/start
       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Controller                              │
│  • Validate request                                          │
│  • Check authentication                                      │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 2. startRecording(callId, userId)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service                                │
│  • Verify user is host                                       │
│  • Check permissions                                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 3. startRecording(callId)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                       Engine                                 │
│  • Update call status                                        │
│  • Save to database                                          │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 4. startRecording(roomId)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Media Server                              │
│  • Create recording session                                  │
│  • Setup track capture                                       │
│  • Start capturing from participants                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 5. startRecording(roomId)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Recording Engine                            │
│  • Initialize recording session                              │
│  • Create output directory                                   │
│  • Setup chunk buffers                                       │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 6. Recording ID
       │
       ▼
┌─────────────┐
│   Client    │
│  Receives   │
│ Recording ID│
└─────────────┘

       ⋮
    (Recording in progress)
       ⋮

┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 7. POST /recording/stop
       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Controller                              │
│  • Validate request                                          │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 8. stopRecording(callId, userId)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service                                │
│  • Verify user is host                                       │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 9. stopRecording(callId)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Media Server                              │
│  • Stop track capture                                        │
│  • Clear capture intervals                                   │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 10. stopRecording(recordingId)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Recording Engine                            │
│  • Stop accepting chunks                                     │
│  • Process all buffered chunks                               │
│  • Mix participant streams                                   │
│  • Generate output file                                      │
│  • Create metadata                                           │
│  • Upload to storage (if cloud)                              │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ 11. Recording complete event
       │
       ▼
┌─────────────┐
│   Client    │
│  Notified   │
│  Complete   │
└─────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Participant Streams                        │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ User 1   │  │ User 2   │  │ User 3   │  │ User N   │    │
│  │          │  │          │  │          │  │          │    │
│  │ Audio ━━━┼──┼──Audio ━━┼──┼──Audio ━━┼──┼──Audio   │    │
│  │ Video ━━━┼──┼──Video ━━┼──┼──Video ━━┼──┼──Video   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│       │             │             │             │            │
└───────┼─────────────┼─────────────┼─────────────┼────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │    Track Capture System     │
        │                             │
        │  • Capture every 1 second   │
        │  • Split into chunks        │
        │  • Buffer in memory         │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │     Chunk Management        │
        │                             │
        │  User 1: [chunk1, chunk2]   │
        │  User 2: [chunk1, chunk2]   │
        │  User 3: [chunk1, chunk2]   │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │    Media Processing         │
        │                             │
        │  • Combine chunks           │
        │  • Mix streams              │
        │  • Encode video             │
        │  • Normalize audio          │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │    Output Generation        │
        │                             │
        │  • Create final file        │
        │  • Generate metadata        │
        │  • Create thumbnail         │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │       Storage               │
        │                             │
        │  • Save to disk/cloud       │
        │  • Update database          │
        │  • Emit completion event    │
        └─────────────────────────────┘
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │  Controller  │────────▶│   Service    │                    │
│  │              │         │              │                    │
│  │ • Endpoints  │         │ • Permissions│                    │
│  │ • Validation │         │ • Business   │                    │
│  └──────────────┘         └──────┬───────┘                    │
│                                   │                            │
│                                   ▼                            │
│                          ┌──────────────┐                     │
│                          │    Engine    │                     │
│                          │              │                     │
│                          │ • Coordination                     │
│                          │ • Events     │                     │
│                          └──────┬───────┘                     │
│                                 │                              │
│         ┌───────────────────────┼───────────────────────┐    │
│         │                       │                       │    │
│         ▼                       ▼                       ▼    │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  │   Media     │        │  Recording  │        │  Database   │
│  │   Server    │───────▶│   Engine    │        │             │
│  │             │        │             │        │ • Calls     │
│  │ • Rooms     │        │ • Chunks    │        │ • Recordings│
│  │ • Tracks    │        │ • Processing│        │ • Status    │
│  └─────────────┘        └──────┬──────┘        └─────────────┘
│                                 │                              │
│                                 ▼                              │
│                         ┌──────────────┐                      │
│                         │   Storage    │                      │
│                         │              │                      │
│                         │ • Local      │                      │
│                         │ • Cloud      │                      │
│                         └──────────────┘                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Event Timeline                            │
│                                                                  │
│  Recording Start                                                 │
│  ═══════════════                                                 │
│                                                                  │
│  Client ──────▶ Controller ──────▶ Service ──────▶ Engine       │
│                                                      │           │
│                                                      ▼           │
│                                              Media Server        │
│                                                      │           │
│                                                      ▼           │
│                                            Recording Engine      │
│                                                      │           │
│                                                      │           │
│  ◀────────────────────────────────────────────────── │           │
│  Event: recordingstarted                                         │
│  { roomId, recordingId }                                         │
│                                                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                  │
│  Recording in Progress                                           │
│  ═════════════════════                                           │
│                                                                  │
│  Participants ──────▶ Media Server ──────▶ Recording Engine     │
│  (Audio/Video)        (Track Capture)      (Chunk Storage)      │
│                                                                  │
│  Every 1 second:                                                 │
│  • Capture chunk                                                 │
│  • Buffer in memory                                              │
│  • Update status                                                 │
│                                                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                  │
│  Recording Stop                                                  │
│  ══════════════                                                  │
│                                                                  │
│  Client ──────▶ Controller ──────▶ Service ──────▶ Engine       │
│                                                      │           │
│                                                      ▼           │
│                                              Media Server        │
│                                                      │           │
│                                                      ▼           │
│                                            Recording Engine      │
│                                                      │           │
│  ◀────────────────────────────────────────────────── │           │
│  Event: recordingstopped                                         │
│  { roomId, recordingId, duration }                               │
│                                                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                  │
│  Processing                                                      │
│  ══════════                                                      │
│                                                                  │
│  Recording Engine:                                               │
│  1. Combine chunks per participant                               │
│  2. Mix all streams                                              │
│  3. Encode to output format                                      │
│  4. Generate metadata                                            │
│  5. Save to storage                                              │
│                                                                  │
│  ◀────────────────────────────────────────────────────────────  │
│  Event: recordingcompleted                                       │
│  { recordingId, outputPath, size, duration }                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Options                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Local Storage                           │  │
│  │                                                            │  │
│  │  ./recordings/                                            │  │
│  │  ├── rec_room123_1234567890/                             │  │
│  │  │   ├── output.webm              (Final recording)      │  │
│  │  │   ├── metadata.json            (Recording info)       │  │
│  │  │   ├── thumbnail.jpg            (Preview image)        │  │
│  │  │   └── chunks/                  (Temporary)            │  │
│  │  │       ├── user1_audio_*.webm                          │  │
│  │  │       ├── user1_video_*.webm                          │  │
│  │  │       ├── user2_audio_*.webm                          │  │
│  │  │       └── user2_video_*.webm                          │  │
│  │  └── rec_room456_9876543210/                             │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Cloud Storage                           │  │
│  │                                                            │  │
│  │  AWS S3 / Google Cloud / Azure Blob                       │  │
│  │                                                            │  │
│  │  my-recordings-bucket/                                    │  │
│  │  ├── 2025/10/10/                                          │  │
│  │  │   ├── rec_room123_1234567890.webm                     │  │
│  │  │   ├── rec_room123_1234567890.json                     │  │
│  │  │   └── rec_room123_1234567890.jpg                      │  │
│  │  └── 2025/10/11/                                          │  │
│  │                                                            │  │
│  │  Features:                                                 │  │
│  │  • Automatic backup                                       │  │
│  │  • CDN integration                                        │  │
│  │  • Lifecycle policies                                     │  │
│  │  • Access control                                         │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

These diagrams provide a visual understanding of how the recording system works at different levels of abstraction.
