/**
 * USSD Service for Virtual Tours
 * Handles USSD sessions for basic phone access to tour services
 */

import { EventEmitter } from "node:events";
import { formatCurrency, logger } from "@kaa/utils";

// import { mpesaService } from "../payments/mpesa/mpesa.service";
// import { airtelMoneyService } from "../payments/airtel-money.service";
// import { alternativePaymentsService } from "../payments/provider.service";

type USSDSession = {
  sessionId: string;
  phoneNumber: string;
  step: number;
  data: Record<string, any>;
  lastInteraction: Date;
  isActive: boolean;
};

type USSDConfig = {
  enabled: boolean;
  shortCode: string;
  sessionTimeout: number; // minutes
  maxSessions: number;
};

type USSDResponse = {
  response: string;
  type: "CON" | "END";
  sessionContinues: boolean;
};

type USSDMenuItem = {
  id: string;
  text: string;
  action: string;
  requiresAuth?: boolean;
  subMenu?: USSDMenuItem[];
};

class USSDService extends EventEmitter {
  private readonly config: USSDConfig;
  private readonly sessions: Map<string, USSDSession> = new Map();
  readonly menuStructure: USSDMenuItem[];

  constructor() {
    super();

    this.config = {
      enabled: process.env.USSD_ENABLED === "true",
      shortCode: process.env.USSD_SHORT_CODE || "*483*4*5#",
      sessionTimeout: 5, // 5 minutes
      maxSessions: 1000,
    };

    this.menuStructure = this.buildMenuStructure();
    this.startSessionCleanup();
  }

  /**
   * Handle incoming USSD request
   */
  async handleUSSDRequest(
    sessionId: string,
    phoneNumber: string,
    text: string,
    _networkCode?: string
  ): Promise<USSDResponse> {
    if (!this.config.enabled) {
      return {
        response:
          "END USSD service is currently unavailable. Please try again later.",
        type: "END",
        sessionContinues: false,
      };
    }

    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Get or create session
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = this.createNewSession(sessionId, formattedPhone);
      }

      // Update session activity
      session.lastInteraction = new Date();

      // Process USSD input
      const response = await this.processUSSDInput(session, text);

      // Update session
      if (response.sessionContinues) {
        session.step++;
        this.sessions.set(sessionId, session);
      } else {
        // End session
        session.isActive = false;
        this.sessions.delete(sessionId);
      }

      this.emit("ussd-interaction", {
        sessionId,
        phoneNumber: formattedPhone,
        input: text,
        response: response.response,
        step: session.step,
      });

      return response;
    } catch (error) {
      logger.error("USSD handling error:", error);

      // Clean up session on error
      this.sessions.delete(sessionId);

      return {
        response: "END An error occurred. Please try again.",
        type: "END",
        sessionContinues: false,
      };
    }
  }

  /**
   * Process USSD input based on current session state
   */
  private async processUSSDInput(
    session: USSDSession,
    text: string
  ): Promise<USSDResponse> {
    const textParts = text.split("*").filter((part) => part !== "");
    const currentLevel = textParts.length;

    // Main menu
    if (currentLevel === 0 || text === "") {
      return {
        response: `CON Welcome to Kaa Virtual Tours
1. Search Properties
2. Latest Tours
3. Popular Tours  
4. My Bookings
5. Support
6. Account Info`,
        type: "CON",
        sessionContinues: true,
      };
    }

    const choice = textParts[currentLevel - 1];

    // First level menu
    if (currentLevel === 1) {
      return this.handleFirstLevelMenu(choice || "", session);
    }

    // Second level menu
    if (currentLevel === 2) {
      return this.handleSecondLevelMenu(
        textParts[0] || "",
        choice || "",
        session
      );
    }

    // Third level menu
    if (currentLevel === 3) {
      return this.handleThirdLevelMenu(
        textParts[0] || "",
        textParts[1] || "",
        choice || "",
        session
      );
    }

    // Default end
    return await Promise.resolve({
      response: "END Thank you for using Kaa Virtual Tours!",
      type: "END",
      sessionContinues: false,
    });
  }

  /**
   * Handle first level menu choices
   */
  private async handleFirstLevelMenu(
    choice: string,
    session: USSDSession
  ): Promise<USSDResponse> {
    switch (choice) {
      case "1": // Search Properties
        return {
          response: `CON Select County:
1. Nairobi
2. Mombasa  
3. Kisumu
4. Nakuru
5. Eldoret
6. Thika
0. Back`,
          type: "CON",
          sessionContinues: true,
        };

      case "2": {
        // Latest Tours
        const latestTours = await this.getLatestTours(5);
        return {
          response: `END Latest Virtual Tours:
${latestTours.map((tour, index) => `${index + 1}. ${tour.title} - ${tour.location}`).join("\n")}

Visit app.kaa-rentals.co.ke for full tours`,
          type: "END",
          sessionContinues: false,
        };
      }

      case "3": {
        // Popular Tours
        const popularTours = await this.getPopularTours(5);
        return {
          response: `END Popular Virtual Tours:
${popularTours.map((tour, index) => `${index + 1}. ${tour.title} - ${tour.views} views`).join("\n")}

Visit app.kaa-rentals.co.ke for full tours`,
          type: "END",
          sessionContinues: false,
        };
      }

      case "4": // My Bookings
        return {
          response: `CON My Bookings:
1. View Active Bookings
2. Tour Schedule
3. Cancel Booking
0. Back`,
          type: "CON",
          sessionContinues: true,
        };

      case "5": // Support
        return {
          response: `CON Support Options:
1. Call Support: 0700000000
2. WhatsApp: 0712345678
3. Request Callback
4. FAQ
0. Back`,
          type: "CON",
          sessionContinues: true,
        };

      case "6": {
        // Account Info
        const accountInfo = await this.getUserAccountInfo(session.phoneNumber);
        return {
          response: `END Account Information:
Phone: ${session.phoneNumber}
Tours Viewed: ${accountInfo.toursViewed}
Bookings: ${accountInfo.activeBookings}
Last Activity: ${accountInfo.lastActivity}
Member Since: ${accountInfo.memberSince}`,
          type: "END",
          sessionContinues: false,
        };
      }

      default:
        return {
          response: "END Invalid option. Please try again.",
          type: "END",
          sessionContinues: false,
        };
    }
  }

  /**
   * Handle second level menu choices
   */
  private async handleSecondLevelMenu(
    firstChoice: string,
    secondChoice: string,
    session: USSDSession
  ): Promise<USSDResponse> {
    if (firstChoice === "1") {
      // Search Properties -> County Selection
      const counties = [
        "Nairobi",
        "Mombasa",
        "Kisumu",
        "Nakuru",
        "Eldoret",
        "Thika",
      ];
      const selectedCounty = counties[Number.parseInt(secondChoice, 10) - 1];

      if (selectedCounty && secondChoice !== "0") {
        session.data.selectedCounty = selectedCounty;
        const properties = await this.getPropertiesByCounty(selectedCounty);

        return {
          response: `END Properties in ${selectedCounty}:
${properties
  .map(
    (prop, index) =>
      `${index + 1}. ${prop.title} - ${formatCurrency(prop.price)}/month`
  )
  .join("\n")}

For virtual tours, visit:
app.kaa-rentals.co.ke/county/${selectedCounty.toLowerCase()}`,
          type: "END",
          sessionContinues: false,
        };
      }
      if (secondChoice === "0") {
        // Back to main menu
        return await this.processUSSDInput(session, "");
      }
    }

    if (firstChoice === "4") {
      // My Bookings
      switch (secondChoice) {
        case "1": {
          // View Active Bookings
          const bookings = await this.getUserBookings(session.phoneNumber);
          return {
            response: `END Your Active Bookings:
${
  bookings.length === 0
    ? "No active bookings"
    : bookings
        .map(
          (booking, index) =>
            `${index + 1}. ${booking.propertyName} - ${booking.date}`
        )
        .join("\n")
}

Manage bookings: app.kaa-rentals.co.ke/bookings`,
            type: "END",
            sessionContinues: false,
          };
        }

        case "2": // Tour Schedule
          return {
            response: `END Today's Virtual Tours:
9:00 AM - 2BR Apartment, Westlands
11:00 AM - 3BR House, Karen  
2:00 PM - Studio, CBD
4:00 PM - Maisonette, Kileleshwa

Join via: app.kaa-rentals.co.ke/live-tours`,
            type: "END",
            sessionContinues: false,
          };

        default:
          return {
            response: "END Invalid option.",
            type: "END",
            sessionContinues: false,
          };
      }
    }

    return {
      response: "END Invalid selection.",
      type: "END",
      sessionContinues: false,
    };
  }

  /**
   * Handle third level menu choices
   */
  private async handleThirdLevelMenu(
    _firstChoice: string,
    _secondChoice: string,
    _thirdChoice: string,
    _session: USSDSession
  ): Promise<USSDResponse> {
    // Implementation for deeper menu levels if needed
    return await Promise.resolve({
      response: "END Thank you for using Kaa Virtual Tours!",
      type: "END",
      sessionContinues: false,
    });
  }

  /**
   * Create new USSD session
   */
  private createNewSession(
    sessionId: string,
    phoneNumber: string
  ): USSDSession {
    // Check if we're at max capacity
    if (this.sessions.size >= this.config.maxSessions) {
      this.cleanupOldestSessions(10); // Remove 10 oldest sessions
    }

    const session: USSDSession = {
      sessionId,
      phoneNumber,
      step: 0,
      data: {},
      lastInteraction: new Date(),
      isActive: true,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Build menu structure
   */
  private buildMenuStructure(): USSDMenuItem[] {
    return [
      {
        id: "search",
        text: "Search Properties",
        action: "search_properties",
        subMenu: [
          { id: "nairobi", text: "Nairobi", action: "search_county_nairobi" },
          { id: "mombasa", text: "Mombasa", action: "search_county_mombasa" },
          { id: "kisumu", text: "Kisumu", action: "search_county_kisumu" },
        ],
      },
      {
        id: "latest",
        text: "Latest Tours",
        action: "show_latest_tours",
      },
      {
        id: "popular",
        text: "Popular Tours",
        action: "show_popular_tours",
      },
      {
        id: "bookings",
        text: "My Bookings",
        action: "show_bookings",
        requiresAuth: true,
      },
      {
        id: "support",
        text: "Support",
        action: "show_support_options",
      },
      {
        id: "account",
        text: "Account Info",
        action: "show_account_info",
        requiresAuth: true,
      },
    ];
  }

  /**
   * Start session cleanup process
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60_000); // Check every minute
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const minutesSinceLastInteraction =
        (now.getTime() - session.lastInteraction.getTime()) / (1000 * 60);

      if (minutesSinceLastInteraction > this.config.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.sessions.delete(sessionId);
    }

    if (expiredSessions.length > 0) {
      logger.info(`Cleaned up ${expiredSessions.length} expired USSD sessions`);
    }
  }

  /**
   * Clean up oldest sessions when at capacity
   */
  private cleanupOldestSessions(count: number): void {
    const sortedSessions = Array.from(this.sessions.entries()).sort(
      ([, a], [, b]) =>
        a.lastInteraction.getTime() - b.lastInteraction.getTime()
    );

    for (let i = 0; i < Math.min(count, sortedSessions.length); i++) {
      const [sessionId] = sortedSessions[i] || [];
      this.sessions.delete(sessionId || "");
    }
  }

  /**
   * Format phone number for Kenya
   */
  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.startsWith("254")) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith("0")) {
      return `+254${cleaned.substring(1)}`;
    }
    if (cleaned.length === 9) {
      return `+254${cleaned}`;
    }

    return phoneNumber;
  }

  /**
   * Mock data methods (would integrate with real services)
   */
  private async getLatestTours(
    limit: number
  ): Promise<Array<{ title: string; location: string }>> {
    return await Promise.resolve(
      [
        { title: "3BR Modern Apt", location: "Westlands" },
        { title: "2BR Garden Flat", location: "Karen" },
        { title: "Studio Apartment", location: "CBD" },
        { title: "4BR Maisonette", location: "Kileleshwa" },
        { title: "1BR Serviced Apt", location: "Kilimani" },
      ].slice(0, limit)
    );
  }

  private async getPopularTours(
    limit: number
  ): Promise<Array<{ title: string; views: number }>> {
    return await Promise.resolve(
      [
        { title: "3BR Luxury Apt", views: 1250 },
        { title: "2BR Modern House", views: 980 },
        { title: "Penthouse Suite", views: 875 },
        { title: "4BR Family Home", views: 760 },
        { title: "Studio Downtown", views: 650 },
      ].slice(0, limit)
    );
  }

  private async getPropertiesByCounty(
    county: string
  ): Promise<Array<{ title: string; price: number }>> {
    const properties: Record<
      string,
      Array<{ title: string; price: number }>
    > = await Promise.resolve({
      Nairobi: [
        { title: "2BR Apt, Westlands", price: 45_000 },
        { title: "3BR House, Karen", price: 80_000 },
        { title: "Studio, CBD", price: 25_000 },
        { title: "1BR, Kilimani", price: 35_000 },
      ],
      Mombasa: [
        { title: "2BR Beachfront", price: 55_000 },
        { title: "3BR Villa", price: 90_000 },
        { title: "1BR Ocean View", price: 40_000 },
      ],
      Kisumu: [
        { title: "3BR House", price: 35_000 },
        { title: "2BR Apartment", price: 25_000 },
        { title: "4BR Compound", price: 60_000 },
      ],
      Nakuru: [
        { title: "2BR Modern", price: 30_000 },
        { title: "3BR Bungalow", price: 45_000 },
      ],
    });

    return properties[county] || [];
  }

  private async getUserAccountInfo(_phoneNumber: string): Promise<{
    toursViewed: number;
    activeBookings: number;
    lastActivity: string;
    memberSince: string;
  }> {
    // This would query the actual user database
    return await Promise.resolve({
      toursViewed: 15,
      activeBookings: 2,
      lastActivity: "Today",
      memberSince: "2024-01-15",
    });
  }

  private async getUserBookings(
    _phoneNumber: string
  ): Promise<Array<{ propertyName: string; date: string }>> {
    // This would query the actual bookings database
    return await Promise.resolve([
      { propertyName: "2BR Apt, Westlands", date: "Tomorrow 2PM" },
      { propertyName: "3BR House, Karen", date: "Friday 10AM" },
    ]);
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    activeSessions: number;
    totalSessions: number;
    averageSessionDuration: number;
    popularMenuItems: string[];
  } {
    const activeSessions = Array.from(this.sessions.values()).filter(
      (s) => s.isActive
    );
    const now = new Date();

    const totalDuration = activeSessions.reduce(
      (sum, session) =>
        sum + (now.getTime() - session.lastInteraction.getTime()) || 0,
      0
    );

    const averageDuration =
      activeSessions.length > 0 ? totalDuration / activeSessions.length : 0;

    return {
      activeSessions: activeSessions.length,
      totalSessions: this.sessions.size,
      averageSessionDuration: averageDuration / 1000, // seconds
      popularMenuItems: ["Search Properties", "Latest Tours", "Account Info"],
    };
  }

  /**
   * Get service health
   */
  getHealth(): {
    isHealthy: boolean;
    activeSessions: number;
    memoryUsage: number;
    lastCleanup: Date;
  } {
    return {
      isHealthy:
        this.config.enabled && this.sessions.size < this.config.maxSessions,
      activeSessions: this.sessions.size,
      memoryUsage: process.memoryUsage().heapUsed,
      lastCleanup: new Date(),
    };
  }

  /**
   * End session manually
   */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
      this.emit("session-ended", {
        sessionId,
        phoneNumber: session.phoneNumber,
      });
      return true;
    }
    return false;
  }
}

export const ussdService = new USSDService();
