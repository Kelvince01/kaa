import type mongoose from "mongoose";
import type { Document } from "mongoose";
import type { BaseDocument } from "./base.type";

// Security enums
export enum AuthenticationMethod {
  PASSWORD = "password",
  BIOMETRIC = "biometric",
  SMS_OTP = "sms_otp",
  EMAIL_OTP = "email_otp",
  TOTP = "totp",
  HARDWARE_KEY = "hardware_key",
  SOCIAL_LOGIN = "social_login",
  MAGIC_LINK = "magic_link",
}

export enum BiometricType {
  FINGERPRINT = "fingerprint",
  FACE_ID = "face_id",
  VOICE_PRINT = "voice_print",
  IRIS_SCAN = "iris_scan",
  PALM_PRINT = "palm_print",
}

export enum ThreatLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum SecurityEventType {
  LOGIN_ATTEMPT = "login_attempt",
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  EMAIL_CHANGE = "email_change",
  PHONE_CHANGE = "phone_change",
  FAILED_LOGIN = "failed_login",
  ACCOUNT_LOCKED = "account_locked",
  MFA_ENABLED = "mfa_enabled",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  DATA_EXPORT = "data_export",
  PERMISSION_CHANGE = "permission_change",
  PASSWORD_CHANGE = "password_change",
  ACCOUNT_LOCKOUT = "account_lockout",
  DATA_BREACH_ATTEMPT = "data_breach_attempt",
  FRAUD_ATTEMPT = "fraud_attempt",
  MALWARE_DETECTED = "malware_detected",
  PHISHING_ATTEMPT = "phishing_attempt",
  API_ABUSE = "api_abuse",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  UNAUTHORIZED_ACCESS = "unauthorized_access",
  PRIVILEGE_ESCALATION = "privilege_escalation",
  DATA_EXFILTRATION = "data_exfiltration",
}

export enum ComplianceFramework {
  GDPR = "gdpr",
  KENYA_DPA = "kenya_dpa",
  PCI_DSS = "pci_dss",
  ISO_27001 = "iso_27001",
  SOC2 = "soc2",
  NIST = "nist",
}

export enum RiskScore {
  VERY_LOW = 0,
  LOW = 25,
  MEDIUM = 50,
  HIGH = 75,
  VERY_HIGH = 100,
}

export enum DeviceType {
  MOBILE = "mobile",
  DESKTOP = "desktop",
  TABLET = "tablet",
  SMART_TV = "smart_tv",
  IOT_DEVICE = "iot_device",
  UNKNOWN = "unknown",
}

export enum EncryptionAlgorithm {
  AES_256_GCM = "aes_256_gcm",
  AES_256_CBC = "aes_256_cbc",
  CHACHA20_POLY1305 = "chacha20_poly1305",
  RSA_4096 = "rsa_4096",
  ECDSA_P256 = "ecdsa_p256",
}

// Core interfaces
export type SecurityConfiguration = {
  authentication: AuthenticationConfig;
  encryption: EncryptionConfig;
  compliance: ComplianceConfig;
  threatDetection: ThreatDetectionConfig;
  biometrics: BiometricConfig;
  kenyanCompliance: KenyanComplianceConfig;
};

export type AuthenticationConfig = {
  enabledMethods: AuthenticationMethod[];
  mfaRequired: boolean;
  mfaGracePeriod: number; // hours
  passwordPolicy: PasswordPolicy;
  sessionConfig: SessionConfig;
  biometricConfig: BiometricAuthConfig;
  rateLimiting: AuthRateLimiting;
};

export type PasswordPolicy = {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventPersonalInfo: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords
  lockoutThreshold: number;
  lockoutDuration: number; // minutes
};

export type SessionConfig = {
  maxDuration: number; // hours
  idleTimeout: number; // minutes
  concurrentSessions: number;
  refreshTokenRotation: boolean;
  sessionBinding: boolean; // bind to IP/device
  secureOnly: boolean;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none";
};

export type BiometricAuthConfig = {
  enabledTypes: BiometricType[];
  confidenceThreshold: number; // 0-100
  maxAttempts: number;
  enableLiveness: boolean; // anti-spoofing
  storeTemplatesEncrypted: boolean;
  allowFallback: boolean;
};

export type AuthRateLimiting = {
  maxAttempts: number;
  timeWindow: number; // minutes
  lockoutDuration: number; // minutes
  progressiveLockout: boolean;
  whitelistEnabled: boolean;
  geoBlocking: boolean;
};

export type EncryptionConfig = {
  defaultAlgorithm: EncryptionAlgorithm;
  keyRotationInterval: number; // days
  enableHSM: boolean; // Hardware Security Module
  enableE2E: boolean; // End-to-end encryption
  dataAtRest: DataAtRestConfig;
  dataInTransit: DataInTransitConfig;
};

export type DataAtRestConfig = {
  enabled: true;
  algorithm: EncryptionAlgorithm;
  keyManagement: "aws_kms" | "azure_key_vault" | "hashicorp_vault" | "local";
  databaseEncryption: boolean;
  fileSystemEncryption: boolean;
  backupEncryption: boolean;
};

export type DataInTransitConfig = {
  tlsVersion: "1.2" | "1.3";
  cipherSuites: string[];
  certificatePinning: boolean;
  hsts: boolean;
  perfectForwardSecrecy: boolean;
};

export type ComplianceConfig = {
  frameworks: ComplianceFramework[];
  dataRetention: DataRetentionConfig;
  auditLogging: AuditLoggingConfig;
  privacyControls: PrivacyControlsConfig;
  reporting: ComplianceReportingConfig;
};

export type DataRetentionConfig = {
  defaultRetention: number; // days
  categories: {
    [category: string]: {
      retention: number;
      autoDelete: boolean;
      anonymize: boolean;
    };
  };
  legalHold: boolean;
  backupRetention: number;
};

export type AuditLoggingConfig = {
  enabled: boolean;
  logLevel: "basic" | "detailed" | "verbose";
  realTimeMonitoring: boolean;
  logRetention: number; // days
  integrations: string[];
  sensitiveDataMasking: boolean;
};

export type PrivacyControlsConfig = {
  consentManagement: boolean;
  dataMinimization: boolean;
  rightToBeForgetton: boolean;
  dataPortability: boolean;
  consentWithdrawal: boolean;
  privacyByDesign: boolean;
};

export type ComplianceReportingConfig = {
  automated: boolean;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  recipients: string[];
  formats: ("pdf" | "json" | "csv")[];
  dashboardAccess: boolean;
};

export type ThreatDetectionConfig = {
  aiEnabled: boolean;
  realTimeScanning: boolean;
  behavioralAnalysis: boolean;
  anomalyDetection: boolean;
  threatIntelligence: ThreatIntelligenceConfig;
  responseActions: ThreatResponseConfig;
  kenyanThreats: KenyanThreatConfig;
};

export type ThreatIntelligenceConfig = {
  feeds: string[];
  updateFrequency: number; // hours
  confidenceThreshold: number;
  enableSharing: boolean;
  localSources: string[];
};

export type ThreatResponseConfig = {
  automaticBlocking: boolean;
  quarantineThreshold: ThreatLevel;
  alerting: AlertConfig;
  incidentResponse: IncidentResponseConfig;
};

export type AlertConfig = {
  channels: ("email" | "sms" | "webhook" | "slack")[];
  escalation: boolean;
  suppressionRules: boolean;
  severity: ThreatLevel;
};

export type IncidentResponseConfig = {
  automaticResponse: boolean;
  playbookEnabled: boolean;
  teamNotification: boolean;
  evidenceCollection: boolean;
  forensicsEnabled: boolean;
};

export type BiometricConfig = {
  storageEncrypted: boolean;
  templateHashing: boolean;
  livenessDetection: boolean;
  multiModalAuth: boolean;
  privacyMode: boolean; // store hashes only
  kenyanSupport: BiometricKenyanSupport;
};

export type BiometricKenyanSupport = {
  fingerprintSupport: boolean;
  faceIdSupport: boolean;
  voiceSupport: boolean; // for local languages
  hudumaNumberIntegration: boolean;
  offlineCapability: boolean;
  lowDataMode: boolean;
};

export type KenyanComplianceConfig = {
  dataProtectionAct: boolean;
  centralBankRegulations: boolean;
  communicationsAuthority: boolean;
  kenyaTaxCompliance: boolean;
  antiMoneyLaundering: boolean;
  consumerProtection: boolean;
};

export type KenyanThreatConfig = {
  mobileMoneyFraud: boolean;
  simSwapDetection: boolean;
  mpesaFraudPrevention: boolean;
  socialEngineeringDetection: boolean;
  identityTheftPrevention: boolean;
  cyberSecurityAgencyIntegration: boolean;
};

// Data models
export type SecurityEvent = {
  id: string;
  type: SecurityEventType;
  severity: ThreatLevel;
  userId?: string;
  sessionId?: string;
  deviceInfo: DeviceInfo;
  location: LocationInfo;
  metadata: SecurityEventMetadata;
  riskScore: number;
  blocked: boolean;
  resolved: boolean;
  timestamp: Date;
  investigationNotes?: string;
};

export type DeviceInfo = {
  id: string;
  type: DeviceType;
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  userAgent: string;
  fingerprint: string;
  screenResolution?: string;
  timezone: string;
  language: string;
  trustedDevice: boolean;
};

export type LocationInfo = {
  ip: string;
  country: string;
  region: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
  isp: string;
  asn: string;
};

export type SecurityEventMetadata = {
  userAgent: string;
  referer?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  requestSize?: number;
  responseSize?: number;
  headers: Record<string, string>;
  payload?: any;
  riskFactors: string[];
};

export type BiometricTemplate = {
  id: string;
  userId: string;
  type: BiometricType;
  template: string; // encrypted hash
  metadata: BiometricMetadata;
  quality: number;
  createdAt: Date;
  lastUsed: Date;
  verified: boolean;
};

export type BiometricMetadata = {
  deviceId: string;
  algorithm: string;
  version: string;
  confidence: number;
  livenessScore?: number;
  environmentFactors: string[];
};

export type SecuritySession = {
  id: string;
  userId: string;
  deviceId: string;
  authMethods: AuthenticationMethod[];
  mfaCompleted: boolean;
  riskScore: number;
  location: LocationInfo;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  metadata: SessionMetadata;
};

export type SessionMetadata = {
  loginMethod: AuthenticationMethod;
  deviceTrusted: boolean;
  locationTrusted: boolean;
  behaviorScore: number;
  anomalies: string[];
  flags: string[];
};

export type ThreatIntelligence = {
  id: string;
  type: "ip" | "domain" | "hash" | "pattern" | "behavior";
  value: string;
  severity: ThreatLevel;
  confidence: number;
  source: string;
  description: string;
  tags: string[];
  activeUntil?: Date;
  firstSeen: Date;
  lastSeen: Date;
  reportCount: number;
};

export type ComplianceAudit = {
  id: string;
  framework: ComplianceFramework;
  status: "pending" | "in_progress" | "completed" | "failed";
  score: number;
  findings: ComplianceFinding[];
  recommendations: string[];
  auditor?: string;
  scheduledDate: Date;
  completedDate?: Date;
  nextAuditDate?: Date;
  evidenceCollected: string[];
};

export type ComplianceFinding = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  requirement: string;
  description: string;
  evidence?: string[];
  remediation: string;
  owner: string;
  dueDate?: Date;
  status: "open" | "in_progress" | "resolved" | "accepted_risk";
};

// =========================== //

export enum SecurityEventStatus {
  DETECTED = "detected",
  INVESTIGATING = "investigating",
  RESOLVED = "resolved",
  FALSE_POSITIVE = "false_positive",
}

// Security events
export interface ISecurityEvent extends Document {
  memberId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type: SecurityEventType;
  severity: ThreatLevel;
  details: {
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: [number, number];
    };
    description?: string;
    metadata?: Record<string, any>;
  };
  status: SecurityEventStatus;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface IDataRetentionPolicy extends BaseDocument {
  memberId: mongoose.Types.ObjectId;
  dataType: "user_data" | "analytics" | "logs" | "files" | "backups";
  retentionPeriod: number; // in days
  isActive: boolean;
  lastExecuted?: Date;
  createdBy: mongoose.Types.ObjectId;
}

export interface IComplianceReport extends Document {
  memberId: mongoose.Types.ObjectId;
  type: "gdpr" | "ccpa" | "hipaa" | "sox" | "custom";
  status: "pending" | "generating" | "completed" | "failed";
  reportData?: {
    userCount: number;
    dataProcessingActivities: any[];
    securityMeasures: any[];
    dataBreaches: any[];
    userRequests: any[];
  };
  generatedBy: mongoose.Types.ObjectId;
  completedAt?: Date;
  downloadUrl?: string;
  createdAt: Date;
}
