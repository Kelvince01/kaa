import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import { redisClient } from "@kaa/utils";
import axios, { type AxiosInstance } from "axios";
import type { RedisClientType } from "redis";

// WhatsApp Business API Enums
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  DOCUMENT = "document",
  AUDIO = "audio",
  VIDEO = "video",
  STICKER = "sticker",
  LOCATION = "location",
  CONTACTS = "contacts",
  TEMPLATE = "template",
  INTERACTIVE = "interactive",
  BUTTON = "button",
  LIST = "list",
}

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
  DELETED = "deleted",
}

export enum TemplateCategory {
  AUTHENTICATION = "AUTHENTICATION",
  MARKETING = "MARKETING",
  UTILITY = "UTILITY",
  OTP = "OTP",
}

export enum TemplateStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISABLED = "DISABLED",
}

export enum InteractiveType {
  BUTTON = "button",
  LIST = "list",
  PRODUCT = "product",
  PRODUCT_LIST = "product_list",
}

export enum ButtonType {
  REPLY = "reply",
  URL = "url",
  PHONE_NUMBER = "phone_number",
}

export enum MediaType {
  IMAGE = "image",
  DOCUMENT = "document",
  AUDIO = "audio",
  VIDEO = "video",
  STICKER = "sticker",
}

export enum WebhookEvent {
  MESSAGE = "messages",
  MESSAGE_STATUS = "message_status",
  TEMPLATE_STATUS = "template_status",
  PHONE_NUMBER_QUALITY = "phone_number_quality_update",
  ACCOUNT_REVIEW = "account_review_update",
  ACCOUNT_UPDATE = "account_update",
}

export enum ConversationType {
  USER_INITIATED = "user_initiated",
  BUSINESS_INITIATED = "business_initiated",
}

export enum ConversationCategory {
  SERVICE = "service",
  UTILITY = "utility",
  AUTHENTICATION = "authentication",
  MARKETING = "marketing",
}

// Core interfaces
export type WhatsAppConfig = {
  apiVersion: string;
  baseUrl: string;
  phoneNumberId: string;
  businessAccountId: string;
  appId: string;
  appSecret: string;
  accessToken: string;
  webhookToken: string;
  webhookUrl: string;
  maxRetries: number;
  retryDelay: number;
  rateLimits: {
    messagesPerSecond: number;
    templatesPerDay: number;
    bulkMessagesPerHour: number;
  };
  kenyanSettings: KenyanWhatsAppSettings;
};

export type KenyanWhatsAppSettings = {
  supportedNetworks: ("safaricom" | "airtel" | "telkom")[];
  businessHours: {
    start: string;
    end: string;
    timezone: string;
  };
  defaultLanguage: "en" | "sw";
  supportedLanguages: string[];
  mpesaIntegration: boolean;
  dataWarning: {
    enabled: boolean;
    threshold: number; // MB
  };
  complianceFeatures: {
    optOutSupport: boolean;
    dataProtection: boolean;
    privacyConsent: boolean;
  };
};

export type WhatsAppMessage = {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  content: MessageContent;
  context?: MessageContext;
  metadata: MessageMetadata;
  status: MessageStatus;
  timestamp: Date;
  deliveredAt?: Date;
  readAt?: Date;
  conversation?: ConversationInfo;
  billing?: BillingInfo;
  error?: WhatsAppError;
};

export type MessageContent = {
  text?: TextContent;
  image?: MediaContent;
  document?: MediaContent;
  audio?: MediaContent;
  video?: MediaContent;
  sticker?: MediaContent;
  location?: LocationContent;
  contacts?: ContactContent[];
  template?: TemplateContent;
  interactive?: InteractiveContent;
};

export type TextContent = {
  body: string;
  preview_url?: boolean;
};

export type MediaContent = {
  id?: string;
  link?: string;
  caption?: string;
  filename?: string;
  sha256?: string;
  mime_type?: string;
  file_size?: number;
};

export type LocationContent = {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
};

export type ContactContent = {
  name: {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
  };
  phones?: Array<{
    phone: string;
    type?: string;
    wa_id?: string;
  }>;
  emails?: Array<{
    email: string;
    type?: string;
  }>;
  addresses?: Array<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    type?: string;
  }>;
};

export type TemplateContent = {
  name: string;
  language: {
    code: string;
    policy?: "fallback" | "deterministic";
  };
  components?: TemplateComponent[];
};

export type TemplateComponent = {
  type: "header" | "body" | "footer" | "button";
  parameters?: TemplateParameter[];
  sub_type?: string;
  index?: number;
};

export type TemplateParameter = {
  type: "text" | "currency" | "date_time" | "image" | "document" | "video";
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: MediaContent;
  document?: MediaContent;
  video?: MediaContent;
};

export type InteractiveContent = {
  type: InteractiveType;
  header?: InteractiveHeader;
  body?: InteractiveBody;
  footer?: InteractiveFooter;
  action: InteractiveAction;
};

export type InteractiveHeader = {
  type: "text" | "image" | "document" | "video";
  text?: string;
  image?: MediaContent;
  document?: MediaContent;
  video?: MediaContent;
};

export type InteractiveBody = {
  text: string;
};

export type InteractiveFooter = {
  text: string;
};

export type InteractiveAction = {
  buttons?: InteractiveButton[];
  button?: string;
  sections?: InteractiveSection[];
  catalog_id?: string;
  product_retailer_id?: string;
};

export type InteractiveButton = {
  type: ButtonType;
  reply?: {
    id: string;
    title: string;
  };
  url?: string;
  phone_number?: string;
};

export type InteractiveSection = {
  title?: string;
  rows: InteractiveRow[];
};

export type InteractiveRow = {
  id: string;
  title: string;
  description?: string;
};

export type MessageContext = {
  message_id?: string;
  from?: string;
  id?: string;
  referred_product?: {
    catalog_id: string;
    product_retailer_id: string;
  };
};

export type MessageMetadata = {
  display_phone_number: string;
  phone_number_id: string;
  profile_name: string;
  wa_id: string;
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
};

export type ConversationInfo = {
  id: string;
  type: ConversationType;
  category: ConversationCategory;
  expiration_timestamp?: number;
  origin?: {
    type: string;
  };
};

export type BillingInfo = {
  billable: boolean;
  pricing_model: string;
  category: ConversationCategory;
};

export type WhatsAppError = {
  code: number;
  title: string;
  message: string;
  error_data?: {
    details: string;
  };
  href?: string;
};

export type WhatsAppBusinessTemplate = {
  id: string;
  name: string;
  status: TemplateStatus;
  category: TemplateCategory;
  language: string;
  components: WhatsAppTemplateComponent[];
  quality_score?: {
    score: string;
    reasons?: Array<{
      reason: string;
    }>;
  };
  rejected_reason?: string;
  created_at: Date;
  updated_at: Date;
  namespace?: string;
};

export type WhatsAppTemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
    header_handle?: string[];
  };
  buttons?: WhatsAppTemplateButton[];
};

export type WhatsAppTemplateButton = {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
};

export type Contact = {
  wa_id: string;
  phone_number: string;
  profile_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  opt_in_status: boolean;
  language_preference: string;
  last_interaction: Date;
  conversation_history: ConversationSummary[];
  preferences: ContactPreferences;
  segments: string[];
  created_at: Date;
  updated_at: Date;
};

export type ContactPreferences = {
  marketing_opt_in: boolean;
  service_notifications: boolean;
  promotional_messages: boolean;
  appointment_reminders: boolean;
  payment_notifications: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
};

export type ConversationSummary = {
  date: Date;
  message_count: number;
  category: ConversationCategory;
  topics: string[];
  sentiment: "positive" | "neutral" | "negative";
  resolution_status: "open" | "resolved" | "escalated";
};

export type WebhookPayload = {
  object: string;
  entry: WebhookEntry[];
};

export type WebhookEntry = {
  id: string;
  changes: WebhookChange[];
};

export type WebhookChange = {
  value: WebhookValue;
  field: string;
};

export type WebhookValue = {
  messaging_product: string;
  metadata: MessageMetadata;
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages?: WhatsAppMessage[];
  statuses?: MessageStatusUpdate[];
  errors?: WhatsAppError[];
};

export type MessageStatusUpdate = {
  id: string;
  status: MessageStatus;
  timestamp: string;
  recipient_id: string;
  conversation?: ConversationInfo;
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: WhatsAppError[];
};

// Kenya-specific interfaces
export type KenyanPropertyAlert = {
  property_id: string;
  property_type: string;
  location: string;
  price_range: string;
  bedrooms: number;
  contact_phone: string;
  agent_name: string;
  images: string[];
  amenities: string[];
  mpesa_paybill?: string;
};

export type MpesaNotification = {
  transaction_id: string;
  amount: number;
  phone_number: string;
  status: "success" | "failed" | "pending";
  reference: string;
  timestamp: Date;
  property_id?: string;
  tenant_id?: string;
};

export type PropertyTourRequest = {
  property_id: string;
  requested_dates: Date[];
  contact_info: {
    name: string;
    phone: string;
    email?: string;
  };
  message?: string;
  group_size: number;
  preferred_time: string;
};

// Main WhatsApp Business Engine
export class WhatsAppBusinessEngine extends EventEmitter {
  private readonly config: WhatsAppConfig;
  private readonly redis: RedisClientType;
  private readonly httpClient: AxiosInstance;
  private readonly contacts: Map<string, Contact>;
  private readonly templates: Map<string, WhatsAppBusinessTemplate>;
  readonly conversations: Map<string, ConversationInfo>;
  readonly messageQueue: Map<string, WhatsAppMessage[]>;

  constructor(config: WhatsAppConfig) {
    super();
    this.config = config;
    this.redis = redisClient;
    this.contacts = new Map();
    this.templates = new Map();
    this.conversations = new Map();
    this.messageQueue = new Map();

    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 30_000,
    });

    this.setupHttpInterceptors();
    this.loadTemplates();
    this.startPeriodicTasks();
  }

  // Message Sending
  async sendTextMessage(
    to: string,
    text: string,
    options: {
      preview_url?: boolean;
      context?: MessageContext;
    } = {}
  ): Promise<WhatsAppMessage> {
    const message: WhatsAppMessage = {
      id: this.generateMessageId(),
      from: this.config.phoneNumberId,
      to: this.normalizePhoneNumber(to),
      type: MessageType.TEXT,
      content: {
        text: {
          body: text,
          preview_url: options.preview_url,
        },
      },
      context: options.context,
      metadata: {
        display_phone_number: "",
        phone_number_id: this.config.phoneNumberId,
        profile_name: "",
        wa_id: to,
      },
      status: MessageStatus.SENT,
      timestamp: new Date(),
    };

    try {
      const response = await this.httpClient.post(
        `/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.to,
          type: "text",
          text: message.content.text,
          context: options.context,
        }
      );

      message.id = response.data.messages[0].id;
      await this.saveMessage(message);

      this.emit("messageSent", message);
      return message;
    } catch (error) {
      message.status = MessageStatus.FAILED;
      message.error = this.parseError(error);
      await this.saveMessage(message);

      this.emit("messageFailed", { message, error: message.error });
      throw error;
    }
  }

  async sendMediaMessage(
    to: string,
    mediaType: MediaType,
    media: MediaContent,
    caption?: string,
    context?: MessageContext
  ): Promise<WhatsAppMessage> {
    const message: WhatsAppMessage = {
      id: this.generateMessageId(),
      from: this.config.phoneNumberId,
      to: this.normalizePhoneNumber(to),
      type: MessageType.VIDEO, // TODO: better implement
      content: {
        [mediaType]: {
          ...media,
          caption,
        },
      },
      context,
      metadata: {
        display_phone_number: "",
        phone_number_id: this.config.phoneNumberId,
        profile_name: "",
        wa_id: to,
      },
      status: MessageStatus.SENT,
      timestamp: new Date(),
    };

    try {
      const payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: message.to,
        type: mediaType,
        [mediaType]: message.content[mediaType],
      };

      if (context) {
        payload.context = context;
      }

      const response = await this.httpClient.post(
        `/${this.config.phoneNumberId}/messages`,
        payload
      );

      message.id = response.data.messages[0].id;
      await this.saveMessage(message);

      this.emit("messageSent", message);
      return message;
    } catch (error) {
      message.status = MessageStatus.FAILED;
      message.error = this.parseError(error);
      await this.saveMessage(message);

      this.emit("messageFailed", { message, error: message.error });
      throw error;
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    language: string,
    components?: TemplateComponent[]
  ): Promise<WhatsAppMessage> {
    const template = this.templates.get(templateName);
    if (!template || template.status !== TemplateStatus.APPROVED) {
      throw new Error(`Template '${templateName}' not found or not approved`);
    }

    const message: WhatsAppMessage = {
      id: this.generateMessageId(),
      from: this.config.phoneNumberId,
      to: this.normalizePhoneNumber(to),
      type: MessageType.TEMPLATE,
      content: {
        template: {
          name: templateName,
          language: { code: language },
          components,
        },
      },
      metadata: {
        display_phone_number: "",
        phone_number_id: this.config.phoneNumberId,
        profile_name: "",
        wa_id: to,
      },
      status: MessageStatus.SENT,
      timestamp: new Date(),
    };

    try {
      const response = await this.httpClient.post(
        `/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.to,
          type: "template",
          template: message.content.template,
        }
      );

      message.id = response.data.messages[0].id;
      await this.saveMessage(message);

      this.emit("messageSent", message);
      return message;
    } catch (error) {
      message.status = MessageStatus.FAILED;
      message.error = this.parseError(error);
      await this.saveMessage(message);

      this.emit("messageFailed", { message, error: message.error });
      throw error;
    }
  }

  async sendInteractiveMessage(
    to: string,
    interactive: InteractiveContent
  ): Promise<WhatsAppMessage> {
    const message: WhatsAppMessage = {
      id: this.generateMessageId(),
      from: this.config.phoneNumberId,
      to: this.normalizePhoneNumber(to),
      type: MessageType.INTERACTIVE,
      content: { interactive },
      metadata: {
        display_phone_number: "",
        phone_number_id: this.config.phoneNumberId,
        profile_name: "",
        wa_id: to,
      },
      status: MessageStatus.SENT,
      timestamp: new Date(),
    };

    try {
      const response = await this.httpClient.post(
        `/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.to,
          type: "interactive",
          interactive: message.content.interactive,
        }
      );

      message.id = response.data.messages[0].id;
      await this.saveMessage(message);

      this.emit("messageSent", message);
      return message;
    } catch (error) {
      message.status = MessageStatus.FAILED;
      message.error = this.parseError(error);
      await this.saveMessage(message);

      this.emit("messageFailed", { message, error: message.error });
      throw error;
    }
  }

  // Bulk Messaging
  async sendBulkMessage(
    recipients: string[],
    templateName: string,
    language: string,
    personalizedComponents?: Map<string, TemplateComponent[]>
  ): Promise<WhatsAppMessage[]> {
    const messages: WhatsAppMessage[] = [];
    const batchSize = 100; // WhatsApp's batch limit

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(async (recipient) => {
        const components = personalizedComponents?.get(recipient);
        return await this.sendTemplate(
          recipient,
          templateName,
          language,
          components
        );
      });

      const batchMessages = await Promise.allSettled(batchPromises);
      batchMessages.forEach((result, index) => {
        if (result.status === "fulfilled") {
          messages.push(result.value);
        } else {
          console.error(`Failed to send to ${batch[index]}:`, result.reason);
        }
      });

      // Rate limiting delay
      if (i + batchSize < recipients.length) {
        await this.delay(
          (1000 / this.config.rateLimits.messagesPerSecond) * batchSize
        );
      }
    }

    this.emit("bulkMessageSent", {
      messages,
      totalRecipients: recipients.length,
    });
    return messages;
  }

  // Template Management
  async createTemplate(template: {
    name: string;
    category: TemplateCategory;
    language: string;
    components: WhatsAppTemplateComponent[];
  }): Promise<WhatsAppBusinessTemplate> {
    try {
      const response = await this.httpClient.post(
        `/${this.config.businessAccountId}/message_templates`,
        {
          name: template.name,
          category: template.category,
          language: template.language,
          components: template.components,
        }
      );

      const createdTemplate: WhatsAppBusinessTemplate = {
        id: response.data.id,
        name: template.name,
        status: TemplateStatus.PENDING,
        category: template.category,
        language: template.language,
        components: template.components,
        created_at: new Date(),
        updated_at: new Date(),
      };

      this.templates.set(template.name, createdTemplate);
      await this.saveTemplate(createdTemplate);

      this.emit("templateCreated", createdTemplate);
      return createdTemplate;
    } catch (error) {
      this.emit("templateCreationFailed", { template, error });
      throw error;
    }
  }

  getTemplate(name: string): WhatsAppBusinessTemplate | null {
    return this.templates.get(name) || null;
  }

  async listTemplates(): Promise<WhatsAppBusinessTemplate[]> {
    try {
      const response = await this.httpClient.get(
        `/${this.config.businessAccountId}/message_templates`
      );
      const templates: WhatsAppBusinessTemplate[] = response.data.data.map(
        (t: any) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          category: t.category,
          language: t.language,
          components: t.components,
          quality_score: t.quality_score,
          rejected_reason: t.rejected_reason,
          created_at: new Date(t.created_time * 1000),
          updated_at: new Date(t.updated_time * 1000),
        })
      );

      // Update local cache
      for (const template of templates) {
        this.templates.set(template.name, template);
      }

      return templates;
    } catch (error) {
      console.error("Failed to list templates:", error);
      return Array.from(this.templates.values());
    }
  }

  // Contact Management
  async addContact(contactInfo: Partial<Contact>): Promise<Contact> {
    const contact: Contact = {
      wa_id: contactInfo.wa_id || "",
      phone_number: contactInfo.phone_number || "",
      profile_name: contactInfo.profile_name,
      first_name: contactInfo.first_name,
      last_name: contactInfo.last_name,
      email: contactInfo.email,
      tags: contactInfo.tags || [],
      custom_fields: contactInfo.custom_fields || {},
      opt_in_status:
        contactInfo.opt_in_status !== undefined
          ? contactInfo.opt_in_status
          : true,
      language_preference:
        contactInfo.language_preference ||
        this.config.kenyanSettings.defaultLanguage,
      last_interaction: contactInfo.last_interaction || new Date(),
      conversation_history: contactInfo.conversation_history || [],
      preferences: contactInfo.preferences || {
        marketing_opt_in: true,
        service_notifications: true,
        promotional_messages: false,
        appointment_reminders: true,
        payment_notifications: true,
        quiet_hours: {
          enabled: false,
          start: "22:00",
          end: "08:00",
          timezone: "Africa/Nairobi",
        },
      },
      segments: contactInfo.segments || [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.contacts.set(contact.wa_id, contact);
    await this.saveContact(contact);

    this.emit("contactAdded", contact);
    return contact;
  }

  async getContact(wa_id: string): Promise<Contact | null> {
    const cached = this.contacts.get(wa_id);
    if (cached) return cached;

    const redisData = await this.redis.get(`whatsapp_contact:${wa_id}`);
    if (redisData) {
      const contact = JSON.parse(redisData) as Contact;
      this.contacts.set(wa_id, contact);
      return contact;
    }

    return null;
  }

  async updateContact(
    wa_id: string,
    updates: Partial<Contact>
  ): Promise<Contact> {
    const contact = await this.getContact(wa_id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const updatedContact: Contact = {
      ...contact,
      ...updates,
      updated_at: new Date(),
    };

    this.contacts.set(wa_id, updatedContact);
    await this.saveContact(updatedContact);

    this.emit("contactUpdated", updatedContact);
    return updatedContact;
  }

  // Webhook Handling
  verifyWebhook(signature: string, body: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", this.config.appSecret)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expectedSignature}`),
      Buffer.from(signature)
    );
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        await this.processWebhookChange(change);
      }
    }
  }

  private async processWebhookChange(change: WebhookChange): Promise<void> {
    const { value, field } = change;

    switch (field) {
      case WebhookEvent.MESSAGE:
        if (value.messages) {
          for (const message of value.messages) {
            await this.processIncomingMessage(message);
          }
        }
        break;

      case WebhookEvent.MESSAGE_STATUS:
        if (value.statuses) {
          for (const status of value.statuses) {
            await this.processMessageStatus(status);
          }
        }
        break;

      case WebhookEvent.TEMPLATE_STATUS:
        // Handle template status updates
        this.emit("templateStatusUpdate", value);
        break;

      default:
        console.log("Unhandled webhook field:", field);
        this.emit("webhookEvent", { field, value });
    }
  }

  private async processIncomingMessage(
    message: WhatsAppMessage
  ): Promise<void> {
    // Save incoming message
    await this.saveMessage(message);

    // Update contact information
    if (message.metadata.contacts) {
      for (const contact of message.metadata.contacts) {
        await this.updateContactFromMetadata(contact);
      }
    }

    // Auto-respond or route to appropriate handler
    await this.routeIncomingMessage(message);

    this.emit("messageReceived", message);
  }

  private async processMessageStatus(
    status: MessageStatusUpdate
  ): Promise<void> {
    // Update message status in database
    await this.updateMessageStatus(status.id, status.status, status);

    this.emit("messageStatusUpdate", status);
  }

  private async routeIncomingMessage(message: WhatsAppMessage): Promise<void> {
    // Implement message routing logic based on content and context
    const contact = await this.getContact(message.from);

    if (!contact) {
      // Create new contact
      await this.addContact({
        wa_id: message.from,
        phone_number: message.from,
        profile_name: message.metadata.profile_name,
      });
    }

    // Check for specific keywords or patterns
    if (message.content.text) {
      const text = message.content.text.body.toLowerCase();

      if (this.isPropertyInquiry(text)) {
        await this.handlePropertyInquiry(message);
      } else if (this.isAppointmentRequest(text)) {
        await this.handleAppointmentRequest(message);
      } else if (this.isPaymentInquiry(text)) {
        await this.handlePaymentInquiry(message);
      } else {
        await this.handleGeneralInquiry(message);
      }
    }
  }

  // Kenya-specific features
  async sendPropertyAlert(
    contact: Contact,
    property: KenyanPropertyAlert
  ): Promise<WhatsAppMessage> {
    const interactive: InteractiveContent = {
      type: InteractiveType.BUTTON,
      header: {
        type: "image",
        image: { link: property.images[0] },
      },
      body: {
        text:
          `*${property.property_type} Available in ${property.location}*\n\n` +
          `🏠 ${property.bedrooms} bedrooms\n` +
          `💰 KES ${property.price_range}\n` +
          `📍 ${property.location}\n` +
          `👤 Agent: ${property.agent_name}\n\n` +
          `Amenities: ${property.amenities.join(", ")}`,
      },
      footer: {
        text: "Powered by Kaa Rental Platform",
      },
      action: {
        buttons: [
          {
            type: ButtonType.REPLY,
            reply: {
              id: `view_property_${property.property_id}`,
              title: "View Details",
            },
          },
          {
            type: ButtonType.REPLY,
            reply: {
              id: `schedule_tour_${property.property_id}`,
              title: "Schedule Tour",
            },
          },
          {
            type: ButtonType.PHONE_NUMBER,
            phone_number: property.contact_phone,
          },
        ],
      },
    };

    return await this.sendInteractiveMessage(contact.wa_id, interactive);
  }

  async sendMpesaNotification(
    contact: Contact,
    notification: MpesaNotification
  ): Promise<WhatsAppMessage> {
    const statusEmoji = {
      success: "✅",
      failed: "❌",
      pending: "⏳",
    };

    const text =
      `${statusEmoji[notification.status]} *M-Pesa Payment ${notification.status.toUpperCase()}*\n\n` +
      `💰 Amount: KES ${notification.amount.toLocaleString()}\n` +
      `📱 Phone: ${notification.phone_number}\n` +
      `🔢 Transaction ID: ${notification.transaction_id}\n` +
      `📝 Reference: ${notification.reference}\n` +
      `🕒 Time: ${notification.timestamp.toLocaleString()}\n\n` +
      (notification.property_id
        ? `🏠 Property ID: ${notification.property_id}\n\n`
        : "") +
      "Thank you for using our services!";

    return await this.sendTextMessage(contact.wa_id, text);
  }

  async sendPropertyTourConfirmation(
    contact: Contact,
    tour: PropertyTourRequest
  ): Promise<WhatsAppMessage> {
    const text =
      "✅ *Property Tour Confirmed*\n\n" +
      `🏠 Property: ${tour.property_id}\n` +
      `👤 Name: ${tour.contact_info.name}\n` +
      `📱 Phone: ${tour.contact_info.phone}\n` +
      `📅 Date Options: ${tour.requested_dates.map((d) => d.toDateString()).join(", ")}\n` +
      `👥 Group Size: ${tour.group_size}\n` +
      `⏰ Preferred Time: ${tour.preferred_time}\n\n` +
      (tour.message ? `💬 Message: ${tour.message}\n\n` : "") +
      `We'll contact you shortly to confirm the exact time. Safe travels! 🚗`;

    return await this.sendTextMessage(contact.wa_id, text);
  }

  // Business verification and compliance
  async verifyBusinessAccount(): Promise<boolean> {
    try {
      const response = await this.httpClient.get(
        `/${this.config.businessAccountId}`
      );
      const account = response.data;

      return account.verification_status === "verified";
    } catch (error) {
      console.error("Business verification check failed:", error);
      return false;
    }
  }

  async handleOptOut(wa_id: string, reason?: string): Promise<void> {
    const contact = await this.getContact(wa_id);
    if (contact) {
      await this.updateContact(wa_id, {
        opt_in_status: false,
        preferences: {
          ...contact.preferences,
          marketing_opt_in: false,
          promotional_messages: false,
        },
      });

      // Send opt-out confirmation
      await this.sendTextMessage(
        wa_id,
        `You have been unsubscribed from our messages. Reply OPTIN to resubscribe. ${reason ? `Reason: ${reason}` : ""}`
      );

      this.emit("contactOptedOut", { wa_id, reason });
    }
  }

  async handleOptIn(wa_id: string): Promise<void> {
    const contact = await this.getContact(wa_id);
    if (contact) {
      await this.updateContact(wa_id, {
        opt_in_status: true,
        preferences: {
          ...contact.preferences,
          marketing_opt_in: true,
          service_notifications: true,
        },
      });

      await this.sendTextMessage(
        wa_id,
        `Welcome back! You're now subscribed to our updates. Reply STOP to unsubscribe anytime.`
      );

      this.emit("contactOptedIn", { wa_id });
    }
  }

  // Utility methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizePhoneNumber(phone: string): string {
    // Normalize Kenyan phone numbers
    let normalized = phone.replace(/\D/g, "");

    if (normalized.startsWith("0")) {
      normalized = `254${normalized.substring(1)}`;
    } else if (normalized.startsWith("254")) {
      // Already in international format
    } else if (normalized.length === 9) {
      normalized = `254${normalized}`;
    }

    return normalized;
  }

  private parseError(error: any): WhatsAppError {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    return {
      code: error.response?.status || 500,
      title: "Unknown Error",
      message: error.message || "An unknown error occurred",
    };
  }

  private setupHttpInterceptors(): void {
    // Request interceptor for rate limiting
    this.httpClient.interceptors.request.use((config) => {
      // Implement rate limiting logic here
      return config;
    });

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limit exceeded, implement retry logic
          const retryAfter = error.response.headers["retry-after"] || 60;
          await this.delay(retryAfter * 1000);
          return this.httpClient.request(error.config);
        }
        throw error;
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isPropertyInquiry(text: string): boolean {
    const keywords = [
      "property",
      "house",
      "apartment",
      "rent",
      "lease",
      "room",
      "bedsitter",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  }

  private isAppointmentRequest(text: string): boolean {
    const keywords = [
      "appointment",
      "viewing",
      "tour",
      "visit",
      "see",
      "schedule",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  }

  private isPaymentInquiry(text: string): boolean {
    const keywords = [
      "payment",
      "mpesa",
      "deposit",
      "pay",
      "money",
      "cost",
      "price",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  }

  private handlePropertyInquiry(message: WhatsAppMessage): void {
    // Implement property inquiry handling logic
    this.emit("propertyInquiry", message);
  }

  private handleAppointmentRequest(message: WhatsAppMessage): void {
    // Implement appointment request handling logic
    this.emit("appointmentRequest", message);
  }

  private handlePaymentInquiry(message: WhatsAppMessage): void {
    // Implement payment inquiry handling logic
    this.emit("paymentInquiry", message);
  }

  private handleGeneralInquiry(message: WhatsAppMessage): void {
    // Implement general inquiry handling logic
    this.emit("generalInquiry", message);
  }

  // Data persistence methods
  private async saveMessage(message: WhatsAppMessage): Promise<void> {
    await this.redis.setEx(
      `whatsapp_message:${message.id}`,
      86_400 * 7, // 7 days
      JSON.stringify(message)
    );
  }

  private async saveTemplate(
    template: WhatsAppBusinessTemplate
  ): Promise<void> {
    await this.redis.setEx(
      `whatsapp_template:${template.name}`,
      86_400 * 30, // 30 days
      JSON.stringify(template)
    );
  }

  private async saveContact(contact: Contact): Promise<void> {
    await this.redis.setEx(
      `whatsapp_contact:${contact.wa_id}`,
      86_400 * 90, // 90 days
      JSON.stringify(contact)
    );
  }

  private async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    statusInfo: MessageStatusUpdate
  ): Promise<void> {
    const messageData = await this.redis.get(`whatsapp_message:${messageId}`);
    if (messageData) {
      const message = JSON.parse(messageData) as WhatsAppMessage;
      message.status = status;

      if (status === MessageStatus.DELIVERED && statusInfo.timestamp) {
        message.deliveredAt = new Date(
          Number.parseInt(statusInfo.timestamp, 10) * 1000
        );
      } else if (status === MessageStatus.READ && statusInfo.timestamp) {
        message.readAt = new Date(
          Number.parseInt(statusInfo.timestamp, 10) * 1000
        );
      }

      await this.saveMessage(message);
    }
  }

  private async updateContactFromMetadata(contactMetadata: any): Promise<void> {
    const existingContact = await this.getContact(contactMetadata.wa_id);

    if (existingContact) {
      await this.updateContact(contactMetadata.wa_id, {
        profile_name: contactMetadata.profile.name,
        last_interaction: new Date(),
      });
    } else {
      await this.addContact({
        wa_id: contactMetadata.wa_id,
        phone_number: contactMetadata.wa_id,
        profile_name: contactMetadata.profile.name,
      });
    }
  }

  // Load templates on startup
  private async loadTemplates(): Promise<void> {
    try {
      const templates = await this.listTemplates();
      console.log(`Loaded ${templates.length} WhatsApp templates`);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  }

  // Periodic cleanup tasks
  private startPeriodicTasks(): void {
    // Clean up old messages every hour
    setInterval(
      async () => {
        // TODO: Implement message cleanup logic
      },
      60 * 60 * 1000
    );

    // Update template statuses every 6 hours
    setInterval(
      async () => {
        await this.listTemplates();
      },
      6 * 60 * 60 * 1000
    );

    // Health check every 30 minutes
    setInterval(
      async () => {
        const isVerified = await this.verifyBusinessAccount();
        this.emit("healthCheck", {
          verified: isVerified,
          timestamp: new Date(),
        });
      },
      30 * 60 * 1000
    );
  }

  // Public API methods
  async getMessageHistory(
    _wa_id: string,
    _limit = 50
  ): Promise<WhatsAppMessage[]> {
    // TODO: Implement message history retrieval
    return await Promise.resolve([]);
  }

  async searchContacts(
    _query: string,
    _filters?: Record<string, any>
  ): Promise<Contact[]> {
    // TODO: Implement contact search
    return await Promise.resolve([]);
  }

  async getAnalytics(_startDate: Date, _endDate: Date): Promise<any> {
    // TODO: Implement analytics aggregation
    return await Promise.resolve({});
  }
}

// Export utility functions
export function createKenyanWhatsAppConfig(
  accessToken: string
): WhatsAppConfig {
  return {
    apiVersion: "v18.0",
    baseUrl: "https://graph.facebook.com/v18.0",
    phoneNumberId: "",
    businessAccountId: "",
    appId: "",
    appSecret: "",
    accessToken,
    webhookToken: "",
    webhookUrl: "",
    maxRetries: 3,
    retryDelay: 1000,
    rateLimits: {
      messagesPerSecond: 20,
      templatesPerDay: 1000,
      bulkMessagesPerHour: 1000,
    },
    kenyanSettings: {
      supportedNetworks: ["safaricom", "airtel", "telkom"],
      businessHours: {
        start: "08:00",
        end: "18:00",
        timezone: "Africa/Nairobi",
      },
      defaultLanguage: "en",
      supportedLanguages: ["en", "sw"],
      mpesaIntegration: true,
      dataWarning: {
        enabled: true,
        threshold: 50,
      },
      complianceFeatures: {
        optOutSupport: true,
        dataProtection: true,
        privacyConsent: true,
      },
    },
  };
}

export function validateKenyanPhoneNumber(phone: string): boolean {
  // biome-ignore lint/performance/useTopLevelRegex: ignore
  const kenyanNumberRegex = /^(\+254|254|0)?([17]\d{8})$/;
  return kenyanNumberRegex.test(phone.replace(/\s+/g, ""));
}
