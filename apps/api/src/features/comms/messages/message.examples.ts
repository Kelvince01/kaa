/**
 * Message API Usage Examples
 *
 * Example code showing how to use the Message API endpoints
 */

// =================================================================
// SETUP
// =================================================================

const API_BASE_URL = "http://localhost:3000/messages";
const AUTH_TOKEN = "your-auth-token-here";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

// =================================================================
// CONVERSATION EXAMPLES
// =================================================================

/**
 * Example 1: Create a conversation
 */
export async function createConversationExample() {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "property_thread",
      title: "Property Inquiry - 2BR Apartment in Westlands",
      description: "Discussion about the property at Woodvale Grove",
      participantIds: ["landlord-123", "tenant-456"],
      propertyId: "prop-789",
      settings: {
        allowFileSharing: true,
        allowImageSharing: true,
        autoTranslate: false,
        businessHoursOnly: false,
      },
      metadata: {
        county: "Nairobi",
        city: "Westlands",
        neighborhood: "Woodvale Grove",
      },
    }),
  });

  const conversation = await response.json();
  console.log("Created conversation:", conversation);
  return conversation;
}

/**
 * Example 2: List conversations with filters
 */
export async function listConversationsExample() {
  const params = new URLSearchParams({
    page: "1",
    limit: "20",
    status: "active",
    hasUnread: "true",
    sortBy: "lastActivity",
    sortOrder: "desc",
  });

  const response = await fetch(`${API_BASE_URL}/conversations?${params}`, {
    headers,
  });

  const data = await response.json();
  console.log("Conversations:", data);
  return data;
}

/**
 * Example 3: Get conversation details
 */
export async function getConversationExample(conversationId: string) {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}`,
    { headers }
  );

  const conversation = await response.json();
  console.log("Conversation details:", conversation);
  return conversation;
}

/**
 * Example 4: Update conversation
 */
export async function updateConversationExample(conversationId: string) {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        title: "Updated Property Discussion",
        status: "active",
        settings: {
          businessHoursOnly: true,
        },
      }),
    }
  );

  const updatedConversation = await response.json();
  console.log("Updated conversation:", updatedConversation);
  return updatedConversation;
}

/**
 * Example 5: Add participant to conversation
 */
export async function addParticipantExample(conversationId: string) {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/participants`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId: "agent-999",
        role: "agent",
        permissions: {
          canRead: true,
          canWrite: true,
          canAddParticipants: false,
          canRemoveParticipants: false,
          canDeleteMessages: false,
          canPinMessages: true,
        },
      }),
    }
  );

  const result = await response.json();
  console.log("Added participant:", result);
  return result;
}

/**
 * Example 6: Remove participant from conversation
 */
export async function removeParticipantExample(
  conversationId: string,
  participantId: string
) {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/participants/${participantId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  const result = await response.json();
  console.log("Removed participant:", result);
  return result;
}

// =================================================================
// MESSAGE EXAMPLES
// =================================================================

/**
 * Example 7: Send a text message
 */
export async function sendMessageExample(conversationId: string) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      conversationId,
      content:
        "Hello! I'm very interested in viewing this property. When would be a good time to schedule a visit?",
      type: "text",
      priority: "normal",
    }),
  });

  const message = await response.json();
  console.log("Sent message:", message);
  return message;
}

/**
 * Example 8: Send a message with M-Pesa reference
 */
export async function sendMpesaMessageExample(conversationId: string) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      conversationId,
      content:
        "I have sent the deposit of KSH 50,000 via M-Pesa. Transaction code: QA12BC3DEF",
      type: "payment_notification",
      priority: "high",
      metadata: {
        transactionCode: "QA12BC3DEF",
        amount: 50_000,
        currency: "KES",
        paymentMethod: "mpesa",
      },
    }),
  });

  const message = await response.json();
  console.log("Sent M-Pesa message:", message);
  return message;
}

/**
 * Example 9: Send a message in Swahili
 */
export async function sendSwahiliMessageExample(conversationId: string) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      conversationId,
      content: "Habari yako? Ningependa kujua zaidi kuhusu nyumba hii.",
      type: "text",
      priority: "normal",
      autoTranslate: true, // Will auto-translate to English for other participants
    }),
  });

  const message = await response.json();
  console.log("Sent Swahili message:", message);
  return message;
}

/**
 * Example 10: Reply to a message
 */
export async function replyToMessageExample(
  conversationId: string,
  replyToMessageId: string
) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      conversationId,
      content: "Yes, that works perfectly for me!",
      type: "text",
      replyToMessageId,
    }),
  });

  const message = await response.json();
  console.log("Sent reply:", message);
  return message;
}

/**
 * Example 11: Get messages with filters
 */
export async function getMessagesExample(conversationId: string) {
  const params = new URLSearchParams({
    page: "1",
    limit: "50",
    type: "text",
    hasAttachments: "false",
  });

  const response = await fetch(`${API_BASE_URL}/${conversationId}?${params}`, {
    headers,
  });

  const data = await response.json();
  console.log("Messages:", data);
  return data;
}

/**
 * Example 12: Search messages
 */
export async function searchMessagesExample(conversationId: string) {
  const params = new URLSearchParams({
    search: "mpesa payment",
    page: "1",
    limit: "20",
  });

  const response = await fetch(`${API_BASE_URL}/${conversationId}?${params}`, {
    headers,
  });

  const data = await response.json();
  console.log("Search results:", data);
  return data;
}

/**
 * Example 13: Mark message as read
 */
export async function markMessageAsReadExample(messageId: string) {
  const response = await fetch(`${API_BASE_URL}/${messageId}/read`, {
    method: "PUT",
    headers,
  });

  const result = await response.json();
  console.log("Marked as read:", result);
  return result;
}

/**
 * Example 14: Edit message
 */
export async function editMessageExample(messageId: string) {
  const response = await fetch(`${API_BASE_URL}/${messageId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      content: "Updated message content with corrected information",
    }),
  });

  const message = await response.json();
  console.log("Edited message:", message);
  return message;
}

/**
 * Example 15: Delete message
 */
export async function deleteMessageExample(messageId: string) {
  const response = await fetch(`${API_BASE_URL}/${messageId}`, {
    method: "DELETE",
    headers,
  });

  const result = await response.json();
  console.log("Deleted message:", result);
  return result;
}

// =================================================================
// BULK OPERATIONS EXAMPLES
// =================================================================

/**
 * Example 16: Send bulk messages
 */
export async function sendBulkMessagesExample() {
  const response = await fetch(`${API_BASE_URL}/bulk`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      conversationIds: ["conv-123", "conv-456", "conv-789"],
      content:
        "Important: Rent payment is due by the end of this month. Please ensure timely payment to avoid penalties.",
      type: "announcement",
      priority: "high",
      metadata: {
        campaign: "monthly-rent-reminder",
        month: "October",
        year: 2025,
      },
    }),
  });

  const result = await response.json();
  console.log("Bulk send result:", result);
  return result;
}

// =================================================================
// ANALYTICS EXAMPLES
// =================================================================

/**
 * Example 17: Get conversation analytics
 */
export async function getConversationAnalyticsExample(conversationId: string) {
  const params = new URLSearchParams({
    startDate: "2025-10-01",
    endDate: "2025-10-31",
  });

  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/analytics?${params}`,
    {
      headers,
    }
  );

  const analytics = await response.json();
  console.log("Conversation analytics:", analytics);
  return analytics;
}

/**
 * Example 18: Get overall analytics
 */
export async function getOverallAnalyticsExample() {
  const params = new URLSearchParams({
    startDate: "2025-10-01",
    endDate: "2025-10-31",
  });

  const response = await fetch(`${API_BASE_URL}/analytics?${params}`, {
    headers,
  });

  const analytics = await response.json();
  console.log("Overall analytics:", analytics);
  return analytics;
}

// =================================================================
// ERROR HANDLING EXAMPLE
// =================================================================

/**
 * Example 19: Proper error handling
 */
export async function withErrorHandlingExample(conversationId: string) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        conversationId,
        content: "Test message",
        type: "text",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${(error as Error).message}`);
    }

    const message = await response.json();
    return { success: true, data: message };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, error };
  }
}

// =================================================================
// COMPLETE WORKFLOW EXAMPLE
// =================================================================

/**
 * Example 20: Complete property inquiry workflow
 */
export async function completePropertyInquiryWorkflow() {
  try {
    // 1. Create conversation
    const conversation = await createConversationExample();
    const conversationId = (conversation as any).conversation._id;

    console.log("✓ Step 1: Created conversation");

    // 2. Send initial inquiry
    const inquiry = await fetch(API_BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        conversationId,
        content:
          "Hello! I saw your 2BR apartment listing in Westlands. Is it still available?",
        type: "property_inquiry",
        priority: "normal",
      }),
    });
    await inquiry.json();

    console.log("✓ Step 2: Sent initial inquiry");

    // 3. Landlord responds (simulated)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Tenant asks about viewing
    const viewingRequest = await fetch(API_BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        conversationId,
        content:
          "Great! When would be a good time to schedule a viewing? I'm available this weekend.",
        type: "text",
        priority: "normal",
      }),
    });
    await viewingRequest.json();

    console.log("✓ Step 3: Requested viewing");

    // 5. Add agent to conversation
    await addParticipantExample(conversationId);

    console.log("✓ Step 4: Added agent to conversation");

    // 6. Get conversation analytics
    const analytics = await getConversationAnalyticsExample(conversationId);

    console.log("✓ Step 5: Retrieved analytics");
    console.log("Workflow completed successfully!", {
      conversationId,
      analytics,
    });

    return { success: true, conversationId };
  } catch (error) {
    console.error("Workflow failed:", error);
    return { success: false, error };
  }
}

// =================================================================
// USAGE
// =================================================================

/*
// Run individual examples
await createConversationExample();
await listConversationsExample();
await sendMessageExample("conv-123");
await sendMpesaMessageExample("conv-123");
await sendSwahiliMessageExample("conv-123");

// Run complete workflow
await completePropertyInquiryWorkflow();
*/
