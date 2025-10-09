import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export type IIoTDevice = BaseDocument & {
  propertyId: mongoose.Types.ObjectId;
  name: string;
  type: IotDeviceType;
  category: DeviceCategory;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  status: DeviceStatus;
  connectivity: IConnectivityInfo;
  location: IDeviceLocation;
  specifications: IDeviceSpecs;
  configuration: IDeviceConfig;
  lastSeen: Date;
  batteryLevel?: number;
  signalStrength?: number;
  createdAt: Date;
  updatedAt: Date;
};

export enum IotDeviceType {
  // Environmental Sensors
  TEMPERATURE_SENSOR = "temperature_sensor",
  HUMIDITY_SENSOR = "humidity_sensor",
  AIR_QUALITY_SENSOR = "air_quality_sensor",
  NOISE_LEVEL_SENSOR = "noise_level_sensor",
  LIGHT_SENSOR = "light_sensor",

  // Security & Safety
  DOOR_LOCK = "door_lock",
  SECURITY_CAMERA = "security_camera",
  MOTION_DETECTOR = "motion_detector",
  SMOKE_DETECTOR = "smoke_detector",
  GAS_DETECTOR = "gas_detector",
  FLOOD_SENSOR = "flood_sensor",
  PANIC_BUTTON = "panic_button",

  // Utility Management
  WATER_METER = "water_meter",
  ELECTRICITY_METER = "electricity_meter",
  GAS_METER = "gas_meter",
  SOLAR_PANEL = "solar_panel",
  INVERTER = "inverter",
  GENERATOR = "generator",

  // Comfort & Control
  SMART_SWITCH = "smart_switch",
  SMART_OUTLET = "smart_outlet",
  THERMOSTAT = "thermostat",
  FAN_CONTROLLER = "fan_controller",
  WATER_HEATER = "water_heater",

  // Access Control
  GATE_CONTROLLER = "gate_controller",
  INTERCOM = "intercom",
  KEYPAD = "keypad",
  RFID_READER = "rfid_reader",
}

export enum DeviceCategory {
  SENSOR = "sensor",
  ACTUATOR = "actuator",
  CONTROLLER = "controller",
  METER = "meter",
  SECURITY = "security",
  UTILITY = "utility",
}

export enum DeviceStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  ERROR = "error",
  MAINTENANCE = "maintenance",
  UPDATING = "updating",
  UNKNOWN = "unknown",
}

export type IConnectivityInfo = {
  type: ConnectivityType;
  protocol: CommunicationProtocol;
  networkId?: string;
  ipAddress?: string;
  macAddress?: string;
  gateway?: string;
  lastHeartbeat: Date;
};

export enum ConnectivityType {
  WIFI = "wifi",
  ETHERNET = "ethernet",
  CELLULAR_2G = "cellular_2g",
  CELLULAR_3G = "cellular_3g",
  CELLULAR_4G = "cellular_4g",
  LORA = "lora",
  ZIGBEE = "zigbee",
  BLUETOOTH = "bluetooth",
}

export enum CommunicationProtocol {
  HTTP = "http",
  HTTPS = "https",
  MQTT = "mqtt",
  WEBSOCKET = "websocket",
  MODBUS = "modbus",
  ZIGBEE = "zigbee",
  LORA = "lora",
}

export type IDeviceLocation = {
  room: string;
  floor: number;
  coordinates?: { x: number; y: number; z?: number };
  zone?: string;
  description?: string;
};

export type IDeviceSpecs = {
  powerConsumption?: number; // watts
  operatingVoltage?: string;
  dimensions?: { width: number; height: number; depth: number };
  weight?: number; // grams
  operatingTemp?: { min: number; max: number };
  humidity?: { min: number; max: number };
  ipRating?: string; // IP65, IP67, etc.
  certifications?: string[];
};

export type IDeviceConfig = {
  samplingInterval?: number; // seconds
  reportingInterval?: number; // seconds
  thresholds?: Record<string, { min?: number; max?: number }>;
  alerts?: IAlertConfig[];
  automation?: IAutomationRule[];
  calibration?: Record<string, number>;
  powerSaving?: IPowerSavingConfig;
};

export type IAlertConfig = {
  id: string;
  name: string;
  condition: IAlertCondition;
  actions: IAlertAction[];
  enabled: boolean;
  cooldownPeriod: number; // seconds
};

export enum AlertOperator {
  EQUAL = "eq",
  NOT_EQUAL = "neq",
  GREATER_THAN = "gt",
  LESS_THAN = "lt",
  GREATER_THAN_OR_EQUAL = "gte",
  LESS_THAN_OR_EQUAL = "lte",
  RANGE = "range",
}

export type IAlertCondition = {
  metric: string;
  operator: AlertOperator;
  value: number | string | { min: number; max: number };
  duration?: number; // seconds - condition must persist
};

export type IAlertAction = {
  type: ActionType;
  target: string;
  message?: string;
  priority: AlertPriority;
};

export enum ActionType {
  NOTIFICATION = "notification",
  SMS = "sms",
  EMAIL = "email",
  WHATSAPP = "whatsapp",
  WEBHOOK = "webhook",
  DEVICE_CONTROL = "device_control",
  AUTOMATION = "automation",
}

export enum AlertPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export type IAutomationRule = {
  id: string;
  name: string;
  trigger: IAutomationTrigger;
  conditions: IAutomationCondition[];
  actions: IAutomationAction[];
  enabled: boolean;
  schedule?: ISchedule;
};

export enum AutomationTriggerType {
  SENSOR_VALUE = "sensor_value",
  TIME = "time",
  EVENT = "event",
  DEVICE_STATUS = "device_status",
}

export type IAutomationTrigger = {
  type: AutomationTriggerType;
  source?: string; // device ID or event name
  value?: any;
};

export enum AutomationOperator {
  EQUAL = "eq",
  NOT_EQUAL = "neq",
  GREATER_THAN = "gt",
  LESS_THAN = "lt",
  GREATER_THAN_OR_EQUAL = "gte",
  LESS_THAN_OR_EQUAL = "lte",
}

export type IAutomationCondition = {
  deviceId: mongoose.Types.ObjectId;
  metric: string;
  operator: AutomationOperator;
  value: number | string;
};

export type IAutomationAction = {
  deviceId: mongoose.Types.ObjectId;
  command: string;
  parameters?: Record<string, any>;
  delay?: number; // seconds
};

export enum ScheduleType {
  ONCE = "once",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

export type ISchedule = {
  type: ScheduleType;
  time?: string; // HH:MM
  days?: number[]; // 0-6 (Sunday-Saturday)
  dates?: number[]; // 1-31
  timezone: string;
};

export enum PowerSavingMode {
  ECO = "eco",
  BALANCED = "balanced",
  PERFORMANCE = "performance",
}

export type IPowerSavingConfig = {
  enabled: boolean;
  mode: PowerSavingMode;
  sleepSchedule?: { start: string; end: string }; // HH:MM
  batterySaver?: boolean;
  lowPowerThreshold?: number; // percentage
};

export type ISensorReading = {
  deviceId: mongoose.Types.ObjectId;
  timestamp: Date;
  data: Record<string, number | string | boolean>;
  quality: DataQuality;
  batteryLevel?: number;
  signalStrength?: number;
};

export enum DataQuality {
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
  UNRELIABLE = "unreliable",
}

export type IDeviceCommand = {
  deviceId: mongoose.Types.ObjectId;
  command: string;
  parameters?: Record<string, any>;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  priority: CommandPriority;
};

export enum CommandPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export type IPropertyDashboard = {
  propertyId: mongoose.Types.ObjectId;
  overview: IPropertyOverview;
  //   devices: DeviceStatus[];
  devices: IIoTDevice[];
  alerts: IIoTAlert[];
  energyConsumption: IEnergyData;
  environmentalData: IEnvironmentalData;
  securityStatus: ISecurityStatus;
  lastUpdated: Date;
};

export enum IoTPropertyStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  ERROR = "error",
  MAINTENANCE = "maintenance",
  UPDATING = "updating",
  UNKNOWN = "unknown",
}

export enum SecurityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export type IPropertyOverview = {
  totalDevices: number;
  onlineDevices: number;
  activeAlerts: number;
  energyUsage: number; // kWh today
  waterUsage: number; // liters today
  averageTemperature: number;
  averageHumidity: number;
  securityLevel: SecurityLevel;
};

export type IEnergyData = {
  consumption: { timestamp: Date; value: number }[];
  production?: { timestamp: Date; value: number }[]; // solar
  cost: number;
  savings?: number;
  efficiency: number;
  peakHours: string[];
};

export type IEnvironmentalData = {
  temperature: { current: number; min: number; max: number };
  humidity: { current: number; min: number; max: number };
  airQuality: { current: number; status: string };
  noiseLevel: { current: number; status: string };
  lightLevel: { current: number; status: string };
};

export type ISecurityStatus = {
  doors: { locked: number; unlocked: number };
  cameras: { active: number; inactive: number };
  alarms: { armed: boolean; triggered: boolean };
  motion: boolean;
  lastActivity: Date;
};

export type IIoTAlert = {
  id: string;
  deviceId: mongoose.Types.ObjectId;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  actions: IAlertActionResult[];
};

export enum AlertType {
  SENSOR_THRESHOLD = "sensor_threshold",
  DEVICE_OFFLINE = "device_offline",
  LOW_BATTERY = "low_battery",
  SECURITY_BREACH = "security_breach",
  SYSTEM_ERROR = "system_error",
  MAINTENANCE_DUE = "maintenance_due",
  HIGH_CONSUMPTION = "high_consumption",
}

export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  CRITICAL = "critical",
  EMERGENCY = "emergency",
}

export enum AlertActionStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  PENDING = "pending",
}

export type IAlertActionResult = {
  type: ActionType;
  status: AlertActionStatus;
  timestamp: Date;
  error?: string;
};

// Kenya-specific IoT constants
export const IOT_CONSTANTS = {
  POWER_GRID: {
    STANDARD_VOLTAGE: 240, // Volts
    STANDARD_FREQUENCY: 50, // Hz
    POWER_OUTAGE_THRESHOLD: 30, // seconds
    GENERATOR_STARTUP_DELAY: 60, // seconds
  },

  NETWORK_OPERATORS: [
    { name: "Safaricom", apn: "internet", bands: ["2G", "3G", "4G"] },
    { name: "Airtel", apn: "internet", bands: ["2G", "3G", "4G"] },
    { name: "Telkom", apn: "telkom", bands: ["2G", "3G", "4G"] },
  ],

  ENVIRONMENTAL_STANDARDS: {
    TEMPERATURE: { min: 18, max: 28, unit: "celsius" }, // Comfortable range
    HUMIDITY: { min: 40, max: 70, unit: "percentage" }, // Optimal range
    AIR_QUALITY: { good: 50, moderate: 100, unhealthy: 150 }, // AQI levels
    NOISE_LEVEL: { quiet: 40, moderate: 55, loud: 70 }, // dB levels
    WATER_PRESSURE: { min: 2, normal: 4, max: 6 }, // bar
  },

  SECURITY_ZONES: {
    PERIMETER: ["gate", "fence", "boundary"],
    ENTRANCE: ["main_door", "back_door", "garage"],
    INTERIOR: ["living_room", "bedroom", "kitchen"],
    EXTERIOR: ["garden", "parking", "balcony"],
  },

  UTILITY_RATES: {
    ELECTRICITY: {
      DOMESTIC: [
        { from: 0, to: 50, rate: 2.5 }, // KES per kWh
        { from: 51, to: 1500, rate: 9.0 },
        { from: 1501, to: Number.POSITIVE_INFINITY, rate: 19.0 },
      ],
      PEAK_HOURS: ["18:00-22:00"], // Evening peak
      OFF_PEAK_HOURS: ["23:00-05:00"],
    },
    WATER: {
      DOMESTIC: 53.0, // KES per cubic meter
      SEWERAGE: 75.0, // Percentage of water bill
    },
  },
};
