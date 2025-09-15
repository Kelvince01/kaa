/**
 * Accessibility Service for Virtual Tours (Frontend)
 * Provides comprehensive accessibility features for inclusive virtual tour experiences
 */

import { EventEmitter } from "node:events";

type AccessibilitySettings = {
  visualImpairment: {
    screenReaderSupport: boolean;
    highContrast: boolean;
    textToSpeech: boolean;
    audioDescriptions: AudioDescription[];
    magnification: number;
    colorBlindSupport: boolean;
  };
  motorImpairment: {
    voiceControls: boolean;
    dwellTimeNavigation: boolean;
    keyboardNavigation: boolean;
    customControls: ControlMapping[];
    autoAdvance: boolean;
  };
  cognitiveSupport: {
    simplifiedInterface: boolean;
    guidedTour: boolean;
    pauseControls: boolean;
    progressIndicator: boolean;
    skipOptions: boolean;
  };
  language: {
    primary: string;
    fallback: string;
    rtlSupport: boolean;
    fontSize: number;
    fontFamily: string;
  };
};

type AudioDescription = {
  sceneId: string;
  description: string;
  duration: number;
  language: string;
  voice: string;
};

type ControlMapping = {
  action: string;
  key: string;
  modifier?: string;
  description: string;
};

type VoiceOptions = {
  voice: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
};

type KeyboardShortcut = {
  key: string;
  modifiers: ("ctrl" | "alt" | "shift" | "meta")[];
  action: string;
  description: string;
  context: "global" | "scene" | "hotspot" | "menu";
};

type ColorBlindnessFilter = {
  type: "protanopia" | "deuteranopia" | "tritanopia" | "monochrome";
  severity: "mild" | "moderate" | "severe";
  matrix: number[][];
};

class AccessibilityService extends EventEmitter {
  private settings: AccessibilitySettings;
  private readonly speechSynthesis: SpeechSynthesis | null = null;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: false positive
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private readonly keyboardShortcuts: Map<string, KeyboardShortcut> = new Map();
  private screenReaderActive = false;
  // private readonly currentFocus: HTMLElement | null = null;
  private readonly colorBlindnessFilters: Map<string, ColorBlindnessFilter> =
    new Map();
  private isInitialized = false;

  constructor() {
    super();

    this.settings = this.getDefaultSettings();

    // Initialize browser-specific features only if in browser
    if (typeof window !== "undefined") {
      this.speechSynthesis = window.speechSynthesis;
      this.initializeColorBlindnessFilters();
      this.setupKeyboardShortcuts();
      this.detectAssistiveTechnology();
    }
  }

  /**
   * Initialize accessibility service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      // Setup event listeners
      this.setupEventListeners();

      // Initialize screen reader support
      this.initializeScreenReaderSupport();

      // Setup keyboard navigation
      this.setupKeyboardNavigation();

      // Initialize voice features
      await this.initializeVoiceFeatures();

      // Apply user preferences
      await this.loadUserPreferences();

      this.isInitialized = true;
      this.emit("accessibility-initialized");
      console.log("Accessibility service initialized");
    } catch (error) {
      console.error("Failed to initialize accessibility service:", error);
    }
  }

  /**
   * Update accessibility settings
   */
  async updateSettings(
    newSettings: Partial<AccessibilitySettings>
  ): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };

    // Apply visual impairment settings
    if (newSettings.visualImpairment) {
      await this.applyVisualImpairmentSettings(newSettings.visualImpairment);
    }

    // Apply motor impairment settings
    if (newSettings.motorImpairment) {
      await this.applyMotorImpairmentSettings(newSettings.motorImpairment);
    }

    // Apply cognitive support settings
    if (newSettings.cognitiveSupport) {
      await this.applyCognitiveSupport(newSettings.cognitiveSupport);
    }

    // Apply language settings
    if (newSettings.language) {
      await this.applyLanguageSettings(newSettings.language);
    }

    // Save preferences
    await this.saveUserPreferences();

    this.emit("settings-updated", this.settings);
  }

  /**
   * Text-to-speech functionality
   */
  speak(text: string, options?: Partial<VoiceOptions>): void {
    if (!(this.settings.visualImpairment.textToSpeech && this.speechSynthesis))
      return;

    try {
      // Stop current speech
      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply voice options
      if (options?.voice) {
        utterance.voice = options.voice;
      } else {
        // Select appropriate voice based on language
        const voices = this.speechSynthesis.getVoices();
        const preferredVoice = voices.find((voice) =>
          voice.lang.startsWith(this.settings.language.primary)
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;
      utterance.lang = this.settings.language.primary;

      // Event handlers
      utterance.onstart = () => this.emit("speech-started", text);
      utterance.onend = () => this.emit("speech-ended", text);
      utterance.onerror = (event) => this.emit("speech-error", event);

      this.currentUtterance = utterance;
      this.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Text-to-speech error:", error);
      this.emit("speech-error", error);
    }
  }

  /**
   * Stop current speech
   */
  stopSpeaking(): void {
    if (this.speechSynthesis?.speaking) {
      this.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Apply high contrast mode
   */
  applyHighContrast(enabled: boolean): void {
    if (typeof document === "undefined") return;

    const body = document.body;

    if (enabled) {
      body.classList.add("high-contrast");
      this.injectHighContrastCSS();
    } else {
      body.classList.remove("high-contrast");
      this.removeHighContrastCSS();
    }

    this.emit("high-contrast-applied", enabled);
  }

  /**
   * Apply magnification
   */
  applyMagnification(level: number): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty("--magnification-level", level.toString());

    // Apply CSS transform for magnification
    const tourContainer = document.querySelector(".virtual-tour-container");
    if (tourContainer) {
      (tourContainer as HTMLElement).style.transform = `scale(${level})`;
      (tourContainer as HTMLElement).style.transformOrigin = "top left";
    }

    this.emit("magnification-applied", level);
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("keydown", (event) => {
      this.handleKeyboardEvent(event);
    });

    document.addEventListener(
      "focus",
      (event) => {
        this.handleFocusEvent(event);
      },
      true
    );

    document.addEventListener(
      "blur",
      (event) => {
        this.handleBlurEvent(event);
      },
      true
    );
  }

  /**
   * Handle keyboard events
   */
  private handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.settings.motorImpairment.keyboardNavigation) return;

    const key = this.getKeyboardShortcutKey(event);
    const shortcut = this.keyboardShortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      this.executeKeyboardAction(shortcut.action, event);

      // Announce action to screen reader
      if (this.screenReaderActive) {
        this.announceAction(shortcut.description);
      }
    }
  }

  /**
   * Execute keyboard action
   */
  private executeKeyboardAction(action: string, _event: KeyboardEvent): void {
    switch (action) {
      case "navigate-next":
        this.navigateToNext();
        break;
      case "navigate-previous":
        this.navigateToPrevious();
        break;
      case "activate-element":
        this.activateCurrentElement();
        break;
      case "toggle-play-pause":
        this.togglePlayPause();
        break;
      case "read-current-element":
        this.readCurrentElement();
        break;
      case "skip-to-main-content":
        this.skipToMainContent();
        break;
      case "open-help":
        this.openAccessibilityHelp();
        break;
      default:
        break;
    }
  }

  /**
   * Initialize voice control
   */
  initializeVoiceControl(): void {
    if (
      !this.settings.motorImpairment.voiceControls ||
      typeof window === "undefined"
    )
      return;

    try {
      // Check for Web Speech API support
      if (
        !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
      ) {
        console.warn("Speech recognition not supported");
        return;
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = this.settings.language.primary;

      recognition.onresult = (event: any) => {
        const command = event.results.at(-1)[0].transcript.toLowerCase().trim();
        this.processVoiceCommand(command);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        this.emit("voice-recognition-error", event.error);
      };

      recognition.start();
      this.emit("voice-control-initialized");
    } catch (error) {
      console.error("Voice control initialization error:", error);
    }
  }

  /**
   * Process voice commands
   */
  private processVoiceCommand(command: string): void {
    const commandMap: Record<string, string> = {
      "next scene": "navigate-next",
      "previous scene": "navigate-previous",
      "go back": "navigate-previous",
      "play tour": "toggle-play-pause",
      "pause tour": "toggle-play-pause",
      "read this": "read-current-element",
      "what is this": "read-current-element",
      help: "open-help",
    };

    const action = commandMap[command];
    if (action) {
      this.executeKeyboardAction(action, {} as KeyboardEvent);
      this.announceAction(`Voice command executed: ${command}`);
    } else {
      this.announceAction("Voice command not recognized");
    }

    this.emit("voice-command-processed", { command, action });
  }

  /**
   * Announce message to screen reader
   */
  announceToScreenReader(
    message: string,
    priority: "polite" | "assertive" = "polite"
  ): void {
    if (typeof document === "undefined") return;

    const regionId = `accessibility-announcements-${priority}`;
    let region = document.getElementById(regionId);

    if (!region) {
      region = document.createElement("div");
      region.setAttribute("aria-live", priority);
      region.setAttribute("aria-atomic", "true");
      region.className = "sr-only";
      region.id = regionId;
      document.body.appendChild(region);
    }

    region.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (region) region.textContent = "";
    }, 1000);

    this.emit("screen-reader-announcement", { message, priority });
  }

  /**
   * Check if screen reader is active
   */
  private detectAssistiveTechnology(): void {
    if (typeof window === "undefined") return;

    // Detect screen readers and other assistive technology
    const hasScreenReader = !!(
      window.navigator.userAgent.includes("NVDA") ||
      window.navigator.userAgent.includes("JAWS") ||
      window.navigator.userAgent.includes("VoiceOver") ||
      window.speechSynthesis
    );

    this.screenReaderActive = hasScreenReader;
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): AccessibilitySettings {
    return {
      visualImpairment: {
        screenReaderSupport: false,
        highContrast: false,
        textToSpeech: false,
        audioDescriptions: [],
        magnification: 1,
        colorBlindSupport: false,
      },
      motorImpairment: {
        voiceControls: false,
        dwellTimeNavigation: false,
        keyboardNavigation: true,
        customControls: [],
        autoAdvance: false,
      },
      cognitiveSupport: {
        simplifiedInterface: false,
        guidedTour: false,
        pauseControls: false,
        progressIndicator: false,
        skipOptions: false,
      },
      language: {
        primary: "en",
        fallback: "en",
        rtlSupport: false,
        fontSize: 16,
        fontFamily: "Arial, sans-serif",
      },
    };
  }

  /**
   * Initialize color blindness filters
   */
  private initializeColorBlindnessFilters(): void {
    this.colorBlindnessFilters.set("protanopia-mild", {
      type: "protanopia",
      severity: "mild",
      matrix: [
        [0.8, 0.2, 0],
        [0.258, 0.742, 0],
        [0, 0.142, 0.858],
      ],
    });

    this.colorBlindnessFilters.set("deuteranopia-mild", {
      type: "deuteranopia",
      severity: "mild",
      matrix: [
        [0.8, 0.2, 0],
        [0.325, 0.675, 0],
        [0, 0.142, 0.858],
      ],
    });

    this.colorBlindnessFilters.set("tritanopia-mild", {
      type: "tritanopia",
      severity: "mild",
      matrix: [
        [0.95, 0.05, 0],
        [0, 0.433, 0.567],
        [0, 0.475, 0.525],
      ],
    });
  }

  /**
   * Setup default keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: "ArrowRight",
        modifiers: [],
        action: "navigate-next",
        description: "Move to next scene",
        context: "global",
      },
      {
        key: "ArrowLeft",
        modifiers: [],
        action: "navigate-previous",
        description: "Move to previous scene",
        context: "global",
      },
      {
        key: "Enter",
        modifiers: [],
        action: "activate-element",
        description: "Activate focused element",
        context: "global",
      },
      {
        key: " ",
        modifiers: [],
        action: "toggle-play-pause",
        description: "Play or pause tour",
        context: "global",
      },
      {
        key: "r",
        modifiers: [],
        action: "read-current-element",
        description: "Read current element",
        context: "global",
      },
      {
        key: "h",
        modifiers: [],
        action: "open-help",
        description: "Open accessibility help",
        context: "global",
      },
    ];

    for (const shortcut of shortcuts) {
      const key = this.createShortcutKey(shortcut);
      this.keyboardShortcuts.set(key, shortcut);
    }
  }

  /**
   * Apply color blindness filter
   */
  applyColorBlindnessFilter(
    type: ColorBlindnessFilter["type"],
    severity: ColorBlindnessFilter["severity"] = "moderate"
  ): void {
    if (typeof document === "undefined") return;

    const filter = this.colorBlindnessFilters.get(`${type}-${severity}`);
    if (!filter) return;

    // Apply color matrix filter to tour container
    const tourContainer = document.querySelector(".virtual-tour-container");
    if (tourContainer) {
      const filterValue = `url(#color-blind-filter-${type}-${severity})`;
      (tourContainer as HTMLElement).style.filter = filterValue;
    }

    this.emit("color-blindness-filter-applied", { type, severity });
  }

  /**
   * Get service health (frontend-specific)
   */
  getHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    features: any;
    browserSupport: any;
  } {
    const browserSupport = {
      speechSynthesis: !!this.speechSynthesis,
      speechRecognition:
        typeof window !== "undefined" &&
        ("webkitSpeechRecognition" in window || "SpeechRecognition" in window),
      vibration: typeof navigator !== "undefined" && "vibrate" in navigator,
      screenReader: this.screenReaderActive,
    };

    return {
      status: "healthy",
      features: {
        textToSpeech: this.settings.visualImpairment.textToSpeech,
        voiceControl: this.settings.motorImpairment.voiceControls,
        keyboardNavigation: this.settings.motorImpairment.keyboardNavigation,
        highContrast: this.settings.visualImpairment.highContrast,
      },
      browserSupport,
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): any {
    return {
      settings: this.settings,
      keyboardShortcuts: this.keyboardShortcuts.size,
      colorBlindnessFilters: this.colorBlindnessFilters.size,
      screenReaderActive: this.screenReaderActive,
      isInitialized: this.isInitialized,
      uptime: this.isInitialized ? Date.now() : 0,
    };
  }

  // Helper methods (browser-specific implementations)
  private createShortcutKey(shortcut: KeyboardShortcut): string {
    const modifiers = shortcut.modifiers.sort().join("+");
    return modifiers ? `${modifiers}+${shortcut.key}` : shortcut.key;
  }

  private getKeyboardShortcutKey(event: KeyboardEvent): string {
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push("ctrl");
    if (event.altKey) modifiers.push("alt");
    if (event.shiftKey) modifiers.push("shift");
    if (event.metaKey) modifiers.push("meta");

    modifiers.sort();
    return modifiers.length ? `${modifiers.join("+")}+${event.key}` : event.key;
  }

  // Stub implementations for demonstration
  private setupEventListeners(): void {
    /* Browser-specific implementation */
  }
  private initializeScreenReaderSupport(): void {
    /* Browser-specific implementation */
  }
  private initializeVoiceFeatures(): Promise<void> {
    return Promise.resolve();
  }
  private loadUserPreferences(): Promise<void> {
    return Promise.resolve();
  }
  private saveUserPreferences(): Promise<void> {
    return Promise.resolve();
  }
  private applyVisualImpairmentSettings(_settings: any): Promise<void> {
    return Promise.resolve();
  }
  private applyMotorImpairmentSettings(_settings: any): Promise<void> {
    return Promise.resolve();
  }
  private applyCognitiveSupport(_settings: any): Promise<void> {
    return Promise.resolve();
  }
  private applyLanguageSettings(_settings: any): Promise<void> {
    return Promise.resolve();
  }
  private injectHighContrastCSS(): void {
    /* CSS injection */
  }
  private removeHighContrastCSS(): void {
    /* CSS removal */
  }
  private handleFocusEvent(_event: FocusEvent): void {
    /* Focus handling */
  }
  private handleBlurEvent(_event: FocusEvent): void {
    /* Blur handling */
  }
  private navigateToNext(): void {
    this.emit("navigate", "next");
  }
  private navigateToPrevious(): void {
    this.emit("navigate", "previous");
  }
  private activateCurrentElement(): void {
    this.emit("activate-element");
  }
  private togglePlayPause(): void {
    this.emit("toggle-play-pause");
  }
  private readCurrentElement(): void {
    this.emit("read-element");
  }
  private skipToMainContent(): void {
    this.emit("skip-to-content");
  }
  private openAccessibilityHelp(): void {
    this.emit("open-help");
  }
  private announceAction(message: string): void {
    this.announceToScreenReader(message);
  }
}

export default new AccessibilityService();
