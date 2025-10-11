// /**
//  * React Client Example for Native WebRTC Video Calling
//  * Complete implementation showing how to use the WebRTC engine from the client
//  */

// import { useEffect, useRef, useState } from "react";

// type VideoCallProps = {
//   callId: string;
//   userId: string;
//   displayName: string;
//   apiUrl: string;
// };

// export function VideoCall({
//   callId,
//   userId,
//   displayName,
//   apiUrl,
// }: VideoCallProps) {
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
//   const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
//     new Map()
//   );
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState<
//     "connecting" | "connected" | "disconnected"
//   >("connecting");

//   const wsRef = useRef<WebSocket | null>(null);
//   const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
//   const localVideoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     initializeCall();

//     return () => {
//       cleanup();
//     };
//   }, [callId, userId]);

//   async function initializeCall() {
//     try {
//       // 1. Join the call via API
//       const joinResponse = await fetch(`${apiUrl}/video-calls/${callId}/join`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "x-user-id": userId,
//         },
//         body: JSON.stringify({
//           displayName,
//           audio: true,
//           video: true,
//         }),
//       });

//       const { data } = await joinResponse.json();
//       const { roomId, iceServers } = data;

//       // 2. Get local media
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true,
//           autoGainControl: true,
//         },
//         video: {
//           width: { ideal: 1280 },
//           height: { ideal: 720 },
//           frameRate: { ideal: 30 },
//         },
//       });

//       setLocalStream(stream);
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       // 3. Connect to signaling server
//       const ws = new WebSocket(`${apiUrl.replace("http", "ws")}/ws/webrtc`);
//       wsRef.current = ws;

//       ws.onopen = () => {
//         setConnectionStatus("connected");
//         // Join room
//         ws.send(
//           JSON.stringify({
//             type: "join",
//             roomId: callId,
//             userId,
//             data: { displayName },
//             timestamp: Date.now(),
//           })
//         );
//       };

//       ws.onmessage = async (event) => {
//         const message = JSON.parse(event.data);
//         await handleSignalingMessage(message, stream, iceServers);
//       };

//       ws.onclose = () => {
//         setConnectionStatus("disconnected");
//       };

//       ws.onerror = (error) => {
//         console.error("WebSocket error:", error);
//         setConnectionStatus("disconnected");
//       };
//     } catch (error) {
//       console.error("Failed to initialize call:", error);
//       setConnectionStatus("disconnected");
//     }
//   }

//   async function handleSignalingMessage(
//     message: any,
//     localStream: MediaStream,
//     iceServers: RTCIceServer[]
//   ) {
//     switch (message.type) {
//       case "joined":
//         // Create peer connections for existing participants
//         for (const participantId of message.participants) {
//           await createPeerConnection(
//             participantId,
//             localStream,
//             iceServers,
//             false
//           );
//         }
//         break;

//       case "user-joined":
//         // New user joined, create peer connection (we initiate)
//         await createPeerConnection(
//           message.userId,
//           localStream,
//           iceServers,
//           true
//         );
//         break;

//       case "user-left":
//         // User left, close peer connection
//         closePeerConnection(message.userId);
//         break;

//       case "offer":
//         await handleOffer(
//           message.userId,
//           message.data,
//           localStream,
//           iceServers
//         );
//         break;

//       case "answer":
//         await handleAnswer(message.userId, message.data);
//         break;

//       case "ice-candidate":
//         await handleIceCandidate(message.userId, message.data);
//         break;

//       case "mute":
//       case "unmute":
//         // Handle remote user mute/unmute
//         console.log(`User ${message.userId} ${message.type}d`);
//         break;
//     }
//   }

//   async function createPeerConnection(
//     peerId: string,
//     localStream: MediaStream,
//     iceServers: RTCIceServer[],
//     initiator: boolean
//   ) {
//     const pc = new RTCPeerConnection({ iceServers });

//     // Add local tracks
//     localStream.getTracks().forEach((track) => {
//       pc.addTrack(track, localStream);
//     });

//     // Handle ICE candidates
//     pc.onicecandidate = (event) => {
//       if (event.candidate && wsRef.current) {
//         wsRef.current.send(
//           JSON.stringify({
//             type: "ice-candidate",
//             roomId: callId,
//             userId,
//             targetUserId: peerId,
//             data: event.candidate,
//             timestamp: Date.now(),
//           })
//         );
//       }
//     };

//     // Handle remote tracks
//     pc.ontrack = (event) => {
//       setRemoteStreams((prev) => {
//         const newMap = new Map(prev);
//         newMap.set(peerId, event.streams[0]);
//         return newMap;
//       });
//     };

//     // Handle connection state
//     pc.onconnectionstatechange = () => {
//       console.log(`Peer ${peerId} connection state:`, pc.connectionState);
//       if (pc.connectionState === "failed") {
//         // Attempt ICE restart
//         pc.restartIce();
//       }
//     };

//     peersRef.current.set(peerId, pc);

//     // Create offer if we're the initiator
//     if (initiator) {
//       const offer = await pc.createOffer();
//       await pc.setLocalDescription(offer);

//       wsRef.current?.send(
//         JSON.stringify({
//           type: "offer",
//           roomId: callId,
//           userId,
//           targetUserId: peerId,
//           data: offer,
//           timestamp: Date.now(),
//         })
//       );
//     }
//   }

//   async function handleOffer(
//     peerId: string,
//     offer: RTCSessionDescriptionInit,
//     localStream: MediaStream,
//     iceServers: RTCIceServer[]
//   ) {
//     let pc = peersRef.current.get(peerId);

//     if (!pc) {
//       await createPeerConnection(peerId, localStream, iceServers, false);
//       pc = peersRef.current.get(peerId)!;
//     }

//     await pc.setRemoteDescription(offer);
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);

//     wsRef.current?.send(
//       JSON.stringify({
//         type: "answer",
//         roomId: callId,
//         userId,
//         targetUserId: peerId,
//         data: answer,
//         timestamp: Date.now(),
//       })
//     );
//   }

//   async function handleAnswer(
//     peerId: string,
//     answer: RTCSessionDescriptionInit
//   ) {
//     const pc = peersRef.current.get(peerId);
//     if (pc) {
//       await pc.setRemoteDescription(answer);
//     }
//   }

//   async function handleIceCandidate(
//     peerId: string,
//     candidate: RTCIceCandidateInit
//   ) {
//     const pc = peersRef.current.get(peerId);
//     if (pc) {
//       await pc.addIceCandidate(candidate);
//     }
//   }

//   function closePeerConnection(peerId: string) {
//     const pc = peersRef.current.get(peerId);
//     if (pc) {
//       pc.close();
//       peersRef.current.delete(peerId);
//     }

//     setRemoteStreams((prev) => {
//       const newMap = new Map(prev);
//       newMap.delete(peerId);
//       return newMap;
//     });
//   }

//   async function toggleAudio() {
//     if (!localStream) return;

//     const enabled = !isAudioEnabled;
//     localStream.getAudioTracks().forEach((track) => {
//       track.enabled = enabled;
//     });

//     setIsAudioEnabled(enabled);

//     // Notify server
//     await fetch(`${apiUrl}/video-calls/${callId}/audio`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-user-id": userId,
//       },
//       body: JSON.stringify({ enabled }),
//     });

//     // Notify other participants
//     wsRef.current?.send(
//       JSON.stringify({
//         type: enabled ? "unmute" : "mute",
//         roomId: callId,
//         userId,
//         timestamp: Date.now(),
//       })
//     );
//   }

//   async function toggleVideo() {
//     if (!localStream) return;

//     const enabled = !isVideoEnabled;
//     localStream.getVideoTracks().forEach((track) => {
//       track.enabled = enabled;
//     });

//     setIsVideoEnabled(enabled);

//     // Notify server
//     await fetch(`${apiUrl}/video-calls/${callId}/video`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-user-id": userId,
//       },
//       body: JSON.stringify({ enabled }),
//     });
//   }

//   async function toggleScreenShare() {
//     if (isScreenSharing) {
//       // Stop screen sharing
//       if (localStream) {
//         const videoTrack = localStream.getVideoTracks()[0];
//         const newTrack = await navigator.mediaDevices
//           .getUserMedia({
//             video: { width: 1280, height: 720 },
//           })
//           .then((stream) => stream.getVideoTracks()[0]);

//         // Replace track in all peer connections
//         for (const pc of peersRef.current.values()) {
//           const sender = pc.getSenders().find((s) => s.track === videoTrack);
//           if (sender) {
//             await sender.replaceTrack(newTrack);
//           }
//         }

//         localStream.removeTrack(videoTrack);
//         localStream.addTrack(newTrack);
//         videoTrack.stop();
//       }

//       setIsScreenSharing(false);

//       await fetch(`${apiUrl}/video-calls/${callId}/screen-share/stop`, {
//         method: "POST",
//         headers: { "x-user-id": userId },
//       });
//     } else {
//       // Start screen sharing
//       const screenStream = await navigator.mediaDevices.getDisplayMedia({
//         video: { width: 1920, height: 1080 },
//       });

//       const screenTrack = screenStream.getVideoTracks()[0];

//       if (localStream) {
//         const videoTrack = localStream.getVideoTracks()[0];

//         // Replace track in all peer connections
//         for (const pc of peersRef.current.values()) {
//           const sender = pc.getSenders().find((s) => s.track === videoTrack);
//           if (sender) {
//             await sender.replaceTrack(screenTrack);
//           }
//         }

//         localStream.removeTrack(videoTrack);
//         localStream.addTrack(screenTrack);
//         videoTrack.stop();
//       }

//       // Handle screen share stop
//       screenTrack.onended = () => {
//         toggleScreenShare();
//       };

//       setIsScreenSharing(true);

//       await fetch(`${apiUrl}/video-calls/${callId}/screen-share/start`, {
//         method: "POST",
//         headers: { "x-user-id": userId },
//       });
//     }
//   }

//   async function leaveCall() {
//     await fetch(`${apiUrl}/video-calls/${callId}/leave`, {
//       method: "POST",
//       headers: { "x-user-id": userId },
//     });

//     cleanup();
//   }

//   function cleanup() {
//     // Stop local stream
//     localStream?.getTracks().forEach((track) => track.stop());

//     // Close all peer connections
//     peersRef.current.forEach((pc) => pc.close());
//     peersRef.current.clear();

//     // Close WebSocket
//     wsRef.current?.close();

//     setLocalStream(null);
//     setRemoteStreams(new Map());
//   }

//   return (
//     <div className="video-call-container">
//       {/* Connection Status */}
//       <div className="status-bar">Status: {connectionStatus}</div>

//       {/* Local Video */}
//       <div className="local-video">
//         <video
//           autoPlay
//           className="video-element"
//           muted
//           playsInline
//           ref={localVideoRef}
//         />
//         <div className="video-label">You</div>
//       </div>

//       {/* Remote Videos */}
//       <div className="remote-videos">
//         {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
//           <RemoteVideo key={peerId} peerId={peerId} stream={stream} />
//         ))}
//       </div>

//       {/* Controls */}
//       <div className="controls">
//         <button
//           className={isAudioEnabled ? "active" : "inactive"}
//           onClick={toggleAudio}
//         >
//           {isAudioEnabled ? "🎤 Mute" : "🔇 Unmute"}
//         </button>

//         <button
//           className={isVideoEnabled ? "active" : "inactive"}
//           onClick={toggleVideo}
//         >
//           {isVideoEnabled ? "📹 Stop Video" : "📷 Start Video"}
//         </button>

//         <button
//           className={isScreenSharing ? "active" : "inactive"}
//           onClick={toggleScreenShare}
//         >
//           {isScreenSharing ? "🖥️ Stop Sharing" : "🖥️ Share Screen"}
//         </button>

//         <button className="leave-button" onClick={leaveCall}>
//           📞 Leave Call
//         </button>
//       </div>
//     </div>
//   );
// }

// function RemoteVideo({
//   peerId,
//   stream,
// }: {
//   peerId: string;
//   stream: MediaStream;
// }) {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     if (videoRef.current) {
//       videoRef.current.srcObject = stream;
//     }
//   }, [stream]);

//   return (
//     <div className="remote-video">
//       <video autoPlay className="video-element" playsInline ref={videoRef} />
//       <div className="video-label">{peerId}</div>
//     </div>
//   );
// }

// // CSS (add to your stylesheet)
// const styles = `
// .video-call-container {
//     display: flex;
//     flex-direction: column;
//     height: 100vh;
//     background: #1a1a1a;
// }

// .status-bar {
//     padding: 10px;
//     background: #2a2a2a;
//     color: white;
//     text-align: center;
// }

// .local-video {
//     position: fixed;
//     bottom: 80px;
//     right: 20px;
//     width: 200px;
//     height: 150px;
//     border-radius: 8px;
//     overflow: hidden;
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
//     z-index: 10;
// }

// .remote-videos {
//     display: grid;
//     grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//     gap: 10px;
//     padding: 20px;
//     flex: 1;
//     overflow-y: auto;
// }

// .remote-video {
//     position: relative;
//     aspect-ratio: 16/9;
//     background: #000;
//     border-radius: 8px;
//     overflow: hidden;
// }

// .video-element {
//     width: 100%;
//     height: 100%;
//     object-fit: cover;
// }

// .video-label {
//     position: absolute;
//     bottom: 10px;
//     left: 10px;
//     background: rgba(0, 0, 0, 0.7);
//     color: white;
//     padding: 5px 10px;
//     border-radius: 4px;
//     font-size: 14px;
// }

// .controls {
//     display: flex;
//     justify-content: center;
//     gap: 10px;
//     padding: 20px;
//     background: #2a2a2a;
// }

// .controls button {
//     padding: 12px 24px;
//     border: none;
//     border-radius: 8px;
//     font-size: 16px;
//     cursor: pointer;
//     transition: all 0.2s;
// }

// .controls button.active {
//     background: #4CAF50;
//     color: white;
// }

// .controls button.inactive {
//     background: #f44336;
//     color: white;
// }

// .controls button.leave-button {
//     background: #ff5252;
//     color: white;
// }

// .controls button:hover {
//     opacity: 0.8;
//     transform: scale(1.05);
// }
// `;
