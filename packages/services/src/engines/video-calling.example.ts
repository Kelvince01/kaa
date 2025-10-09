/**
 * Video Calling Engine Usage Examples
 *
 * This file demonstrates how to use the VideoCallingEngine with Agora integration
 */

import { CallType } from "@kaa/models/types";
import { WebSocketServer } from "ws";
import {
  createDefaultWebRTCConfig,
  createVideoConfig,
  VideoCallingEngine,
} from "./video-calling.engine";

// Initialize the engine
const wsServer = new WebSocketServer({ port: 8080 });

const engine = new VideoCallingEngine(
  wsServer,
  createDefaultWebRTCConfig(),
  createVideoConfig(),
  {
    // biome-ignore lint/style/noNonNullAssertion: ignore
    appId: process.env.AGORA_APP_ID!,
    // biome-ignore lint/style/noNonNullAssertion: ignore
    appCertificate: process.env.AGORA_APP_CERTIFICATE!,
  }
);

// Example 1: Create and join a property tour call
async function startPropertyTourCall() {
  // 1. Create the call
  const call = await engine.createCall("landlord-123", CallType.PROPERTY_TOUR, {
    title: "Virtual Tour - 2BR Apartment in Westlands",
    description: "Showing modern apartment with city views",
    propertyId: "prop-456",
    scheduledAt: new Date(),
    maxParticipants: 5,
    isRecorded: true,
    settings: {
      allowScreenShare: true,
      allowRecording: true,
      muteOnJoin: false,
      videoOnJoin: true,
      waitingRoom: false,
    },
    kenyaSpecific: {
      county: "Nairobi",
      language: "en",
    },
  });

  console.log("Call created:", call._id);

  // 2. Generate Agora token for the host
  const hostToken = await engine.generateAgoraToken(
    call._id.toString(),
    "landlord-123",
    "publisher"
  );

  console.log("Host token:", hostToken);

  // 3. Host joins the call
  await engine.joinCall(call._id.toString(), "landlord-123", {
    displayName: "John Landlord",
    avatar: "https://example.com/avatar.jpg",
  });

  // 4. Host joins Agora channel with audio/video
  await engine.joinAgoraChannel(call._id.toString(), "landlord-123", {
    audio: true,
    video: true,
  });

  // 5. Create property tour
  const tour = await engine.createPropertyTour(
    call._id.toString(),
    "prop-456",
    "landlord-123",
    [
      {
        id: "stop-1",
        name: "Living Room",
        description: "Spacious living area with natural light",
        duration: 120,
        highlights: ["Large windows", "Hardwood floors"],
        interactionPoints: [],
      },
      {
        id: "stop-2",
        name: "Master Bedroom",
        description: "Comfortable bedroom with ensuite",
        duration: 90,
        highlights: ["Walk-in closet", "City view"],
        interactionPoints: [],
      },
    ]
  );

  console.log("Property tour created:", tour._id);

  return { call, tour, hostToken };
}

// Example 2: Prospect joins the tour
async function prospectJoinsTour(callId: string) {
  // 1. Generate token for prospect
  const prospectToken = await engine.generateAgoraToken(
    callId,
    "prospect-789",
    "publisher"
  );

  // 2. Prospect joins the call
  await engine.joinCall(callId, "prospect-789", {
    displayName: "Jane Prospect",
    avatar: "https://example.com/prospect-avatar.jpg",
  });

  // 3. Prospect joins Agora channel
  await engine.joinAgoraChannel(callId, "prospect-789", {
    audio: true,
    video: true,
  });

  console.log("Prospect joined with token:", prospectToken);

  return prospectToken;
}

// Example 3: Navigate through tour stops
async function navigateTour(callId: string) {
  // Move to first stop
  await engine.navigateToStop(callId, 0);
  console.log("Navigated to Living Room");

  // Wait 2 minutes
  await new Promise((resolve) => setTimeout(resolve, 120_000));

  // Move to second stop
  await engine.navigateToStop(callId, 1);
  console.log("Navigated to Master Bedroom");
}

// Example 4: Prospect asks a question
async function askQuestion(callId: string) {
  await engine.addTourQuestion(
    callId,
    "prospect-789",
    "What is the monthly rent for this apartment?",
    "pricing"
  );

  console.log("Question added to tour");
}

// Example 5: Start recording
async function startRecording(callId: string) {
  const recording = await engine.startRecording(callId);
  console.log("Recording started:", recording._id);
  return recording;
}

// Example 6: Handle screen sharing
async function handleScreenShare(callId: string) {
  // Start screen sharing
  await engine.startAgoraScreenShare(callId);
  console.log("Screen sharing started");

  // Share for 5 minutes
  await new Promise((resolve) => setTimeout(resolve, 300_000));

  // Stop screen sharing
  await engine.stopAgoraScreenShare(callId);
  console.log("Screen sharing stopped");
}

// Example 7: Monitor call quality
async function monitorCallQuality(callId: string) {
  const stats = await engine.getAgoraStats(callId);
  console.log("Call statistics:", stats);

  const analytics = await engine.getCallAnalytics(callId);
  console.log("Call analytics:", analytics);
}

// Example 8: End the call
async function endCall(callId: string) {
  // Stop recording if active
  await engine.stopRecording(callId);

  // Leave Agora channel
  await engine.leaveAgoraChannel(callId);

  // End the call
  await engine.endCall(callId);

  console.log("Call ended");
}

// Example 9: Listen to events
function setupEventListeners() {
  // Call events
  engine.on("callCreated", ({ call }) => {
    console.log("New call created:", call._id);
  });

  engine.on("participantJoined", ({ call, participant }) => {
    console.log(`${participant.displayName} joined call ${call._id}`);
  });

  engine.on("participantLeft", ({ call, participant }) => {
    console.log(`${participant.displayName} left call ${call._id}`);
  });

  // Agora events
  engine.on("agoraUserJoined", ({ callId, userId }) => {
    console.log(`User ${userId} joined Agora channel ${callId}`);
  });

  engine.on("agoraUserLeft", ({ callId, userId }) => {
    console.log(`User ${userId} left Agora channel ${callId}`);
  });

  engine.on("networkQuality", ({ callId, uplinkQuality, downlinkQuality }) => {
    console.log(
      `Network quality for ${callId}: up=${uplinkQuality}, down=${downlinkQuality}`
    );
  });

  // Recording events
  engine.on("recordingStarted", ({ call, _recording }) => {
    console.log(`Recording started for call ${call._id}`);
  });

  engine.on("recordingStopped", ({ callId }) => {
    console.log(`Recording stopped for call ${callId}`);
  });

  // Tour events
  engine.on("tourNavigated", ({ _tour, stop }) => {
    console.log(`Tour navigated to: ${stop.name}`);
  });

  engine.on("tourQuestionAdded", ({ _tour, question }) => {
    console.log(`New question: ${question.question}`);
  });

  // Quality adaptation
  engine.on("qualityAdapted", ({ participantId, adaptation }) => {
    console.log(`Quality adapted for ${participantId}: ${adaptation}`);
  });

  // Errors
  engine.on("agoraError", ({ callId, error }) => {
    console.error(`Agora error in call ${callId}:`, error);
  });
}

// Complete workflow example
async function completePropertyTourWorkflow() {
  setupEventListeners();

  // 1. Start the tour
  const { call, tour, hostToken } = await startPropertyTourCall();
  const callId = call._id.toString();

  // 2. Prospect joins
  await prospectJoinsTour(callId);

  // 3. Start recording
  await startRecording(callId);

  // 4. Navigate through tour
  await navigateTour(callId);

  // 5. Prospect asks questions
  await askQuestion(callId);

  // 6. Host shares screen (floor plans)
  await handleScreenShare(callId);

  // 7. Monitor quality
  await monitorCallQuality(callId);

  // 8. End the call
  await endCall(callId);

  console.log("Property tour completed successfully!");
}

// Export for use in other files
export {
  startPropertyTourCall,
  prospectJoinsTour,
  navigateTour,
  askQuestion,
  startRecording,
  handleScreenShare,
  monitorCallQuality,
  endCall,
  setupEventListeners,
  completePropertyTourWorkflow,
};
