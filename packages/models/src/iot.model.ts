import { model, Schema } from "mongoose";
import {
  ActionType,
  AlertActionStatus,
  AlertOperator,
  AlertPriority,
  AlertSeverity,
  AlertType,
  AutomationOperator,
  AutomationTriggerType,
  CommandPriority,
  CommunicationProtocol,
  ConnectivityType,
  DataQuality,
  DeviceCategory,
  DeviceStatus,
  DeviceType,
  type IAlertAction,
  type IAlertActionResult,
  type IAlertCondition,
  type IAlertConfig,
  type IAutomationAction,
  type IAutomationCondition,
  type IAutomationRule,
  type IAutomationTrigger,
  type IConnectivityInfo,
  type IDeviceCommand,
  type IDeviceConfig,
  type IDeviceLocation,
  type IDeviceSpecs,
  type IEnergyData,
  type IEnvironmentalData,
  type IIoTAlert,
  type IIoTDevice,
  type IPowerSavingConfig,
  type IPropertyDashboard,
  type IPropertyOverview,
  type ISchedule,
  type ISecurityStatus,
  type ISensorReading,
  PowerSavingMode,
  ScheduleType,
  SecurityLevel,
} from "./types/iot.type";

const connectivitySchema = new Schema<IConnectivityInfo>(
  {
    type: {
      type: String,
      enum: Object.values(ConnectivityType),
      required: true,
    },
    ipAddress: { type: String, required: true },
    protocol: {
      type: String,
      enum: Object.values(CommunicationProtocol),
      required: true,
    },
    networkId: { type: String },
    macAddress: { type: String },
    gateway: { type: String },
    lastHeartbeat: { type: Date, required: true },
  },
  { _id: false }
);

const deviceLocationSchema = new Schema<IDeviceLocation>(
  {
    room: { type: String, required: true },
    floor: { type: Number, required: true },
    coordinates: { type: { x: Number, y: Number, z: Number } },
    zone: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const deviceSpecsSchema = new Schema<IDeviceSpecs>(
  {
    powerConsumption: { type: Number },
    operatingVoltage: { type: String },
    dimensions: { type: { width: Number, height: Number, depth: Number } },
    weight: { type: Number },
    operatingTemp: { type: { min: Number, max: Number } },
    humidity: { type: { min: Number, max: Number } },
    ipRating: { type: String },
    certifications: { type: [String] },
  },
  { _id: false }
);

const alertConditionSchema = new Schema<IAlertCondition>(
  {
    metric: { type: String, required: true },
    operator: {
      type: String,
      enum: Object.values(AlertOperator),
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true }, // { type: Number | String | { min: Number, max: Number }, required: true },
    duration: { type: Number },
  },
  { _id: false }
);

const alertActionSchema = new Schema<IAlertAction>(
  {
    type: { type: String, enum: Object.values(ActionType), required: true },
    target: { type: String, required: true },
    message: { type: String },
    priority: {
      type: String,
      enum: Object.values(AlertPriority),
      required: true,
    },
  },
  { _id: false }
);

const alertConfigSchema = new Schema<IAlertConfig>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    condition: { type: alertConditionSchema, required: true },
    actions: { type: [alertActionSchema], required: true },
    enabled: { type: Boolean, required: true },
    cooldownPeriod: { type: Number, required: true },
  },
  { _id: false }
);

const automationTriggerSchema = new Schema<IAutomationTrigger>(
  {
    type: {
      type: String,
      enum: Object.values(AutomationTriggerType),
      required: true,
    },
    source: { type: String },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const automationActionSchema = new Schema<IAutomationAction>(
  {
    deviceId: { type: Schema.Types.ObjectId, required: true },
    command: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed },
    delay: { type: Number },
  },
  { _id: false }
);

const scheduleSchema = new Schema<ISchedule>(
  {
    type: { type: String, enum: Object.values(ScheduleType), required: true },
    time: { type: String },
    days: { type: [Number] },
    dates: { type: [Number] },
    timezone: { type: String, required: true },
  },
  { _id: false }
);

const automationConditionSchema = new Schema<IAutomationCondition>(
  {
    deviceId: { type: Schema.Types.ObjectId, required: true },
    metric: { type: String, required: true },
    operator: {
      type: String,
      enum: Object.values(AutomationOperator),
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true }, // number | string
  },
  { _id: false }
);

const automationRuleSchema = new Schema<IAutomationRule>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    trigger: { type: automationTriggerSchema, required: true },
    conditions: { type: [automationConditionSchema], required: true },
    actions: { type: [automationActionSchema], required: true },
    enabled: { type: Boolean, required: true },
    schedule: { type: scheduleSchema },
  },
  { _id: false }
);

const powerSavingSchema = new Schema<IPowerSavingConfig>(
  {
    enabled: { type: Boolean, required: true },
    mode: {
      type: String,
      enum: Object.values(PowerSavingMode),
      required: true,
    },
    sleepSchedule: { type: { start: String, end: String } },
    batterySaver: { type: Boolean },
    lowPowerThreshold: { type: Number },
  },
  { _id: false }
);

const deviceConfigSchema = new Schema<IDeviceConfig>(
  {
    samplingInterval: { type: Number },
    reportingInterval: { type: Number },
    thresholds: {
      type: { type: String, enum: Object.values(DataQuality) },
      min: { type: Number },
      max: { type: Number },
    },
    alerts: { type: [alertConfigSchema] },
    automation: { type: [automationRuleSchema] },
    calibration: { type: Schema.Types.Mixed },
    powerSaving: { type: powerSavingSchema },
  },
  { _id: false }
);

const IoTDeviceSchema = new Schema<IIoTDevice>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(DeviceType), required: true },
    category: {
      type: String,
      enum: Object.values(DeviceCategory),
      required: true,
    },
    manufacturer: { type: String, required: true },
    firmwareVersion: { type: String, required: true },
    status: { type: String, enum: Object.values(DeviceStatus), required: true },
    connectivity: { type: connectivitySchema, required: true },
    location: { type: deviceLocationSchema, required: true },
    specifications: { type: deviceSpecsSchema, required: true },
    configuration: { type: deviceConfigSchema, required: true },
    lastSeen: { type: Date, required: true },
    batteryLevel: { type: Number },
    signalStrength: { type: Number },
  },
  { timestamps: true }
);

export const IoTDevice = model<IIoTDevice>("IoTDevice", IoTDeviceSchema);

const sensorReadingSchema = new Schema<ISensorReading>({
  deviceId: { type: Schema.Types.ObjectId, ref: "IoTDevice", required: true },
  data: { type: Schema.Types.Mixed, required: true },
  quality: { type: String, required: true },
  batteryLevel: { type: Number },
  signalStrength: { type: Number },
  timestamp: { type: Date, required: true },
});

export const SensorReading = model<ISensorReading>(
  "SensorReading",
  sensorReadingSchema
);

const deviceCommandSchema = new Schema<IDeviceCommand>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: "IoTDevice", required: true },
    command: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed },
    timestamp: { type: Date, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    priority: {
      type: String,
      enum: Object.values(CommandPriority),
      required: true,
    },
  },
  { timestamps: true }
);

export const DeviceCommand = model<IDeviceCommand>(
  "DeviceCommand",
  deviceCommandSchema
);

const propertyOverviewSchema = new Schema<IPropertyOverview>(
  {
    totalDevices: { type: Number, required: true },
    onlineDevices: { type: Number, required: true },
    activeAlerts: { type: Number, required: true },
    energyUsage: { type: Number, required: true },
    waterUsage: { type: Number, required: true },
    averageTemperature: { type: Number, required: true },
    averageHumidity: { type: Number, required: true },
    securityLevel: {
      type: String,
      enum: Object.values(SecurityLevel),
      required: true,
    },
  },
  { _id: false }
);

const energyDataSchema = new Schema<IEnergyData>(
  {
    consumption: { type: [{ timestamp: Date, value: Number }], required: true },
    production: { type: [{ timestamp: Date, value: Number }], required: true },
    cost: { type: Number, required: true },
    savings: { type: Number },
    efficiency: { type: Number, required: true },
    peakHours: { type: [String], required: true },
  },
  { _id: false }
);

const environmentalDataSchema = new Schema<IEnvironmentalData>(
  {
    temperature: {
      type: { current: Number, min: Number, max: Number },
      required: true,
    },
    humidity: {
      type: { current: Number, min: Number, max: Number },
      required: true,
    },
    airQuality: { type: { current: Number, status: String }, required: true },
    noiseLevel: { type: { current: Number, status: String }, required: true },
    lightLevel: { type: { current: Number, status: String }, required: true },
  },
  { _id: false }
);

const securityStatusSchema = new Schema<ISecurityStatus>(
  {
    doors: { type: { locked: Number, unlocked: Number }, required: true },
    cameras: { type: { active: Number, inactive: Number }, required: true },
    alarms: { type: { armed: Boolean, triggered: Boolean }, required: true },
    motion: { type: Boolean, required: true },
    lastActivity: { type: Date, required: true },
  },
  { _id: false }
);

const alertActionResultSchema = new Schema<IAlertActionResult>(
  {
    type: { type: String, enum: Object.values(ActionType), required: true },
    status: {
      type: String,
      enum: Object.values(AlertActionStatus),
      required: true,
    },
    timestamp: { type: Date, required: true },
    error: { type: String },
  },
  { _id: false }
);

const iotAlertSchema = new Schema<IIoTAlert>(
  {
    id: { type: String, required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: "IoTDevice", required: true },
    type: { type: String, enum: Object.values(AlertType), required: true },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, required: true },
    acknowledged: { type: Boolean, required: true },
    resolvedAt: { type: Date },
    actions: { type: [alertActionResultSchema], required: true },
  },
  { timestamps: true }
);

export const IoTAlert = model<IIoTAlert>("IoTAlert", iotAlertSchema);

const propertyDashboardSchema = new Schema<IPropertyDashboard>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    overview: { type: propertyOverviewSchema, required: true },
    devices: { type: [IoTDeviceSchema], required: true },
    alerts: { type: [iotAlertSchema], required: true },
    energyConsumption: { type: energyDataSchema, required: true },
    environmentalData: { type: environmentalDataSchema, required: true },
    securityStatus: { type: securityStatusSchema, required: true },
    lastUpdated: { type: Date, required: true },
  },
  { timestamps: true }
);

export const PropertyDashboard = model<IPropertyDashboard>(
  "PropertyDashboard",
  propertyDashboardSchema
);
