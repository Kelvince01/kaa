import { EventEmitter } from "node:events";
import { IoTAlert, IoTDevice, SensorReading } from "@kaa/models";
import {
  ActionType,
  AlertActionStatus,
  AlertPriority,
  AlertSeverity,
  AlertType,
  CommandPriority,
  CommunicationProtocol,
  DataQuality,
  DeviceStatus,
  type IAlertAction,
  type IAlertActionResult,
  type IAlertCondition,
  type IAlertConfig,
  type IAutomationAction,
  type IAutomationCondition,
  type IAutomationTrigger,
  type IDeviceCommand,
  type IDeviceConfig,
  type IEnergyData,
  type IEnvironmentalData,
  type IIoTAlert,
  type IIoTDevice,
  IOT_CONSTANTS,
  IotDeviceType,
  type IPropertyDashboard,
  type IPropertyOverview,
  type ISecurityStatus,
  type ISensorReading,
  SecurityLevel,
} from "@kaa/models/types";
import { redisClient } from "@kaa/utils";
import type { AxiosInstance } from "axios";
import axios from "axios";
import mongoose from "mongoose";
import type { MqttClient } from "mqtt";
import type { RedisClientType } from "redis";

class IoTService extends EventEmitter {
  private readonly redis: RedisClientType;
  private mqttClient: MqttClient | null = null;
  private readonly httpClients: Map<string, AxiosInstance> = new Map();
  //   private readonly wsServer: WebSocketServer;

  constructor() {
    super();
    this.redis = redisClient;

    this.httpClients = new Map();

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load existing devices and data
      await this.loadDevices();
      await this.loadAlerts();

      // Initialize communication protocols
      await this.initializeMQTT();
      //   this.initializeWebSocket();
      this.initializeHTTPClients();

      // Start background tasks
      this.startBackgroundTasks();

      console.log("IoT Service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize IoT Service:", error);
      throw error;
    }
  }

  private initializeMQTT(): void {
    if (process.env.MQTT_BROKER_URL) {
      try {
        const mqtt = require("mqtt");
        this.mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
          username: process.env.MQTT_USERNAME,
          password: process.env.MQTT_PASSWORD,
          clientId: `kaa-iot-${crypto.randomUUID()}`,
        });

        this.mqttClient?.on("connect", () => {
          console.log("Connected to MQTT broker");
          // Subscribe to device topics
          this.mqttClient?.subscribe("kaa/devices/+/data");
          this.mqttClient?.subscribe("kaa/devices/+/status");
        });

        this.mqttClient?.on("message", (topic: string, message: Buffer) => {
          this.handleMQTTMessage(topic, message);
        });
      } catch (error) {
        console.warn(
          "MQTT not available:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  //   private initializeWebSocket(): void {
  //     this.wsServer.on("connection", (ws: WebSocket, request) => {
  //       console.log("WebSocket connection established");

  //       ws.on("message", (data: Buffer) => {
  //         try {
  //           const message = JSON.parse(data.toString());
  //           this.handleWebSocketMessage(ws, message);
  //         } catch (error) {
  //           console.error("Invalid WebSocket message:", error);
  //         }
  //       });

  //       ws.on("close", () => {
  //         console.log("WebSocket connection closed");
  //       });
  //     });
  //   }

  private initializeHTTPClients(): void {
    // Initialize HTTP clients for different device manufacturers
    const manufacturers = ["generic", "samsung", "xiaomi", "tp-link"];

    for (const manufacturer of manufacturers) {
      this.httpClients.set(
        manufacturer,
        axios.create({
          timeout: 10_000,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Kaa-IoT-Service/1.0",
          },
        })
      );
    }
  }

  // Device Management
  async registerDevice(
    deviceData: Omit<IIoTDevice, "id" | "createdAt" | "updatedAt" | "lastSeen">
  ): Promise<IIoTDevice> {
    const device: IIoTDevice = {
      id: crypto.randomUUID(),
      ...deviceData,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await IoTDevice.create(device);
    await this.cacheDevice(device);

    // Initialize device readings storage
    await SensorReading.create({
      deviceId: device.id,
      timestamp: new Date(),
      data: {},
      quality: DataQuality.GOOD,
    });

    // Send welcome configuration to device
    await this.configureDevice(device.id, device.configuration);

    this.emit("device.registered", { device, timestamp: new Date() });

    return device;
  }

  async getDevice(deviceId: string): Promise<IIoTDevice | null> {
    // Check memory first
    const device = await IoTDevice.findById(deviceId);
    if (device) return device;

    // Check cache
    const cached = await this.getCachedDevice(deviceId);
    if (cached) {
      await IoTDevice.findByIdAndUpdate(deviceId, cached);
      return cached;
    }

    return null;
  }

  async updateDevice(
    deviceId: string,
    updates: Partial<IIoTDevice>
  ): Promise<IIoTDevice> {
    const device = await this.getDevice(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const updatedDevice = {
      ...device,
      ...updates,
      updatedAt: new Date(),
    };

    await IoTDevice.findByIdAndUpdate(deviceId, updatedDevice as IIoTDevice);
    await this.cacheDevice(updatedDevice as IIoTDevice);

    this.emit("device.updated", {
      device: updatedDevice,
      timestamp: new Date(),
    });

    return updatedDevice as IIoTDevice;
  }

  async deleteDevice(deviceId: string): Promise<void> {
    const device = await this.getDevice(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // Remove from storage
    await IoTDevice.findByIdAndDelete(deviceId);
    await SensorReading.findByIdAndDelete(deviceId);
    await this.redis.del(`device:${deviceId}`);
    await this.redis.del(`readings:${deviceId}`);

    this.emit("device.deleted", { deviceId, timestamp: new Date() });
  }

  // Data Collection and Processing
  async recordSensorReading(reading: ISensorReading): Promise<void> {
    const device = await this.getDevice(reading.deviceId.toString());
    if (!device) {
      console.warn(`Received reading from unknown device: ${reading.deviceId}`);
      return;
    }

    // Update device last seen
    device.lastSeen = reading.timestamp;
    device.status = DeviceStatus.ONLINE;

    if (reading.batteryLevel !== undefined) {
      device.batteryLevel = reading.batteryLevel;
    }

    if (reading.signalStrength !== undefined) {
      device.signalStrength = reading.signalStrength;
    }

    await this.updateDevice(reading.deviceId.toString(), device);

    // Store reading
    await SensorReading.findByIdAndUpdate(reading.deviceId, {
      data: reading.data,
      quality: reading.quality,
      batteryLevel: reading.batteryLevel,
      signalStrength: reading.signalStrength,
      timestamp: reading.timestamp,
    });

    // Cache reading
    await this.cacheReading(reading);

    // Process alerts
    await this.processAlerts(device, reading);

    // Execute automation rules
    await this.executeAutomation(device, reading);

    // Broadcast to connected clients
    this.broadcastReading(reading);

    this.emit("sensor.reading", { device, reading, timestamp: new Date() });
  }

  private async processAlerts(
    device: IIoTDevice,
    reading: ISensorReading
  ): Promise<void> {
    if (!device.configuration.alerts) return;

    for (const alert of device.configuration.alerts) {
      if (!alert.enabled) continue;

      const isTriggered = this.evaluateAlertCondition(alert.condition, reading);

      if (isTriggered) {
        // Check cooldown period
        const lastAlert = await this.getLastAlert(device.id, alert.id);
        if (
          lastAlert &&
          Date.now() - lastAlert.timestamp.getTime() <
            alert.cooldownPeriod * 1000
        ) {
          continue;
        }

        await this.triggerAlert(device, alert, reading);
      }
    }
  }

  private evaluateAlertCondition(
    condition: IAlertCondition,
    reading: ISensorReading
  ): boolean {
    const value = reading.data[condition.metric];
    if (value === undefined) return false;

    const numValue =
      typeof value === "number" ? value : Number.parseFloat(value as string);
    if (Number.isNaN(numValue)) return false;

    switch (condition.operator) {
      case "eq":
        return numValue === (condition.value as number);
      case "neq":
        return numValue !== (condition.value as number);
      case "gt":
        return numValue > (condition.value as number);
      case "lt":
        return numValue < (condition.value as number);
      case "gte":
        return numValue >= (condition.value as number);
      case "lte":
        return numValue <= (condition.value as number);
      case "range": {
        const range = condition.value as { min: number; max: number };
        return numValue >= range.min && numValue <= range.max;
      }
      default:
        return false;
    }
  }

  private async triggerAlert(
    device: IIoTDevice,
    alertConfig: IAlertConfig,
    reading: ISensorReading
  ): Promise<void> {
    const alert: IIoTAlert = {
      id: crypto.randomUUID(),
      deviceId: device.id,
      type: this.mapAlertType(alertConfig.condition.metric),
      severity: this.mapAlertSeverity(alertConfig),
      title: alertConfig.name,
      message: this.generateAlertMessage(device, alertConfig, reading),
      timestamp: new Date(),
      acknowledged: false,
      actions: [],
    };

    await IoTAlert.create(alert);
    await this.cacheAlert(alert);

    // Execute alert actions
    for (const action of alertConfig.actions) {
      const result = await this.executeAlertAction(action, alert, device);
      alert.actions.push(result);
    }

    // Broadcast alert to connected clients
    this.broadcastAlert(alert);

    this.emit("alert.triggered", { alert, device, timestamp: new Date() });
  }

  private async executeAlertAction(
    action: IAlertAction,
    alert: IIoTAlert,
    device: IIoTDevice
  ): Promise<IAlertActionResult> {
    const result: IAlertActionResult = {
      type: action.type,
      status: AlertActionStatus.PENDING,
      timestamp: new Date(),
    };

    try {
      switch (action.type) {
        case ActionType.NOTIFICATION:
          // Send in-app notification
          this.emit("notification", {
            title: alert.title,
            message: action.message || alert.message,
            priority: action.priority,
            deviceId: device.id,
          });
          result.status = AlertActionStatus.SENT;
          break;

        case ActionType.SMS:
          // Integrate with SMS service
          this.emit("sms.send", {
            to: action.target,
            message: action.message || alert.message,
            priority: action.priority,
          });
          result.status = AlertActionStatus.SENT;
          break;

        case ActionType.EMAIL:
          // Integrate with email service
          this.emit("email.send", {
            to: action.target,
            subject: alert.title,
            message: action.message || alert.message,
            priority: action.priority,
          });
          result.status = AlertActionStatus.SENT;
          break;

        case ActionType.DEVICE_CONTROL:
          // Send command to device
          await this.sendDeviceCommand({
            deviceId: new mongoose.Types.ObjectId(action.target),
            command: action.message || "emergency_stop",
            timestamp: new Date(),
            userId: new mongoose.Types.ObjectId("system"), // TODO: get system user id
            priority: CommandPriority.URGENT,
          });
          result.status = AlertActionStatus.SENT;
          break;

        case ActionType.WEBHOOK: {
          // Send webhook
          const webhookClient = this.httpClients.get("generic");
          if (webhookClient) {
            await webhookClient.post(action.target, {
              alert,
              device,
              timestamp: new Date(),
            });
            result.status = AlertActionStatus.DELIVERED;
          }
          break;
        }
        default:
          throw new Error(`Action type ${action.type} not supported`);
      }
    } catch (error) {
      result.status = AlertActionStatus.FAILED;
      result.error = error instanceof Error ? error.message : "Unknown error";
    }

    return result;
  }

  // Device Control
  async sendDeviceCommand(command: IDeviceCommand): Promise<void> {
    const device = await this.getDevice(command.deviceId.toString());
    if (!device) {
      throw new Error(`Device ${command.deviceId} not found`);
    }

    if (device.status === DeviceStatus.OFFLINE) {
      throw new Error(`Device ${command.deviceId} is offline`);
    }

    // Send command based on device protocol
    switch (device.connectivity.protocol) {
      case CommunicationProtocol.MQTT:
        await this.sendMQTTCommand(device, command);
        break;
      case CommunicationProtocol.HTTP:
      case CommunicationProtocol.HTTPS:
        await this.sendHTTPCommand(device, command);
        break;
      case CommunicationProtocol.WEBSOCKET:
        await this.sendWebSocketCommand(device, command);
        break;
      default:
        throw new Error(
          `Protocol ${device.connectivity.protocol} not supported for commands`
        );
    }

    this.emit("command.sent", { device, command, timestamp: new Date() });
  }

  private sendMQTTCommand(device: IIoTDevice, command: IDeviceCommand): void {
    if (!this.mqttClient) {
      throw new Error("MQTT client not available");
    }

    const topic = `kaa/devices/${device.id}/commands`;
    const payload = JSON.stringify({
      command: command.command,
      parameters: command.parameters,
      timestamp: command.timestamp.toISOString(),
      priority: command.priority,
    });

    this.mqttClient.publish(topic, payload);
  }

  private async sendHTTPCommand(
    device: IIoTDevice,
    command: IDeviceCommand
  ): Promise<void> {
    const client =
      this.httpClients.get(device.manufacturer.toLowerCase()) ||
      this.httpClients.get("generic");
    if (!client) {
      throw new Error("HTTP client not available");
    }

    const url = `http://${device.connectivity.ipAddress}/api/command`;
    await client.post(url, {
      command: command.command,
      parameters: command.parameters,
      timestamp: command.timestamp.toISOString(),
    });
  }

  private async sendWebSocketCommand(
    device: IIoTDevice,
    command: IDeviceCommand
  ): Promise<void> {
    // Find WebSocket connection for this device
    // for (const client of this.wsServer.clients) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     await client.send(
    //       JSON.stringify({
    //         type: "command",
    //         deviceId: device.id,
    //         command: command.command,
    //         parameters: command.parameters,
    //         timestamp: command.timestamp.toISOString(),
    //       })
    //     );
    //   }
    // }

    await Promise.resolve({ device, command });
  }

  // Automation Engine
  private async executeAutomation(
    device: IIoTDevice,
    reading: ISensorReading
  ): Promise<void> {
    if (!device.configuration.automation) return;

    for (const rule of device.configuration.automation) {
      if (!rule.enabled) continue;

      // Check if trigger matches
      const isTriggered = await this.evaluateAutomationTrigger(
        rule.trigger,
        device,
        reading
      );
      if (!isTriggered) continue;

      // Check all conditions
      const conditionsMet = await this.evaluateAutomationConditions(
        rule.conditions
      );
      if (!conditionsMet) continue;

      // Execute actions
      for (const action of rule.actions) {
        try {
          if (action.delay) {
            setTimeout(async () => {
              await this.executeAutomationAction(action);
            }, action.delay * 1000);
          } else {
            await this.executeAutomationAction(action);
          }
        } catch (error) {
          console.error("Automation action failed:", error);
        }
      }

      this.emit("automation.executed", {
        rule,
        device,
        reading,
        timestamp: new Date(),
      });
    }
  }

  private async evaluateAutomationTrigger(
    trigger: IAutomationTrigger,
    device: IIoTDevice,
    reading: ISensorReading
  ): Promise<boolean> {
    switch (trigger.type) {
      case "sensor_value":
        return (
          trigger.source === device.id &&
          reading.data[trigger.value] !== undefined
        );
      case "device_status":
        return trigger.source === device.id && device.status === trigger.value;
      case "time":
        // Time-based triggers would be handled by scheduler
        return false;
      case "event":
        // Event-based triggers handled separately
        return false;
      default:
        return await Promise.resolve(false);
    }
  }

  private async evaluateAutomationConditions(
    conditions: IAutomationCondition[]
  ): Promise<boolean> {
    for (const condition of conditions) {
      const device = await this.getDevice(condition.deviceId.toString());
      if (!device) continue;

      const readings = await SensorReading.find({
        deviceId: condition.deviceId,
      });
      if (!readings || readings.length === 0) continue;

      const lastReading = readings.at(-1);
      const value = lastReading?.data[condition.metric];

      if (!this.evaluateCondition(condition, value)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(
    condition: IAutomationCondition,
    value: any
  ): boolean {
    const numValue =
      typeof value === "number" ? value : Number.parseFloat(value as string);
    const targetValue =
      typeof condition.value === "number"
        ? condition.value
        : Number.parseFloat(condition.value as string);

    if (Number.isNaN(numValue) || Number.isNaN(targetValue)) {
      return value === condition.value;
    }

    switch (condition.operator) {
      case "eq":
        return numValue === targetValue;
      case "neq":
        return numValue !== targetValue;
      case "gt":
        return numValue > targetValue;
      case "lt":
        return numValue < targetValue;
      case "gte":
        return numValue >= targetValue;
      case "lte":
        return numValue <= targetValue;
      default:
        return false;
    }
  }

  private async executeAutomationAction(
    action: IAutomationAction
  ): Promise<void> {
    await this.sendDeviceCommand({
      deviceId: action.deviceId,
      command: action.command,
      parameters: action.parameters,
      timestamp: new Date(),
      userId: new mongoose.Types.ObjectId("automation"), // TODO: get automation user id
      priority: CommandPriority.NORMAL,
    });
  }

  // Dashboard and Analytics
  async getPropertyDashboard(propertyId: string): Promise<IPropertyDashboard> {
    // Get all devices for this property
    const propertyDevices = await IoTDevice.find({ propertyId });

    // Calculate overview metrics
    const overview = await this.calculatePropertyOverview(propertyDevices);

    // Get recent alerts - 10 latest alerts
    const alerts = await IoTAlert.find({
      deviceId: { $in: propertyDevices.map((d) => d.id) },
    })
      .sort({ timestamp: -1 })
      .limit(10);

    // Calculate energy consumption
    const energyConsumption = await this.calculateEnergyConsumption(propertyId);

    // Get environmental data
    const environmentalData =
      await this.calculateEnvironmentalData(propertyDevices);

    // Get security status
    const securityStatus = await this.calculateSecurityStatus(propertyDevices);

    return await Promise.resolve({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      overview,
      devices: propertyDevices.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        status: d.status,
        lastSeen: d.lastSeen,
        batteryLevel: d.batteryLevel,
        signalStrength: d.signalStrength,
      })) as any,
      alerts,
      energyConsumption,
      environmentalData,
      securityStatus,
      lastUpdated: new Date(),
    });
  }

  private async calculatePropertyOverview(
    devices: IIoTDevice[]
  ): Promise<IPropertyOverview> {
    const onlineDevices = devices.filter(
      (d) => d.status === DeviceStatus.ONLINE
    ).length;

    const activeAlerts = await IoTAlert.countDocuments({
      acknowledged: false,
      deviceId: { $in: devices.map((d) => d.id) },
    });

    // Calculate averages from recent readings
    let totalTemp = 0,
      totalHumidity = 0,
      tempCount = 0,
      humidityCount = 0;

    for (const device of devices) {
      const readings = await SensorReading.find({ deviceId: device.id });
      if (readings && readings.length > 0) {
        const lastReading = readings.at(-1);
        if (lastReading?.data.temperature !== undefined) {
          totalTemp += lastReading?.data.temperature as number;
          tempCount++;
        }
        if (lastReading?.data.humidity !== undefined) {
          totalHumidity += lastReading.data.humidity as number;
          humidityCount++;
        }
      }
    }

    return {
      totalDevices: devices.length,
      onlineDevices,
      activeAlerts,
      energyUsage: 0, // Would be calculated from meter readings
      waterUsage: 0, // Would be calculated from meter readings
      averageTemperature: tempCount > 0 ? totalTemp / tempCount : 0,
      averageHumidity: humidityCount > 0 ? totalHumidity / humidityCount : 0,
      securityLevel:
        activeAlerts > 5
          ? SecurityLevel.HIGH
          : activeAlerts > 2
            ? SecurityLevel.MEDIUM
            : SecurityLevel.LOW,
    };
  }

  private async calculateEnergyConsumption(
    _propertyId: string
  ): Promise<IEnergyData> {
    // This would integrate with electricity meters and solar panels
    // For now, return sample data
    const today = new Date();
    const consumption: { timestamp: Date; value: number }[] = [];

    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        i
      );
      consumption.push({
        timestamp,
        value: Math.random() * 5 + 2, // kWh
      });
    }

    return await Promise.resolve({
      consumption,
      cost: 0,
      efficiency: 85,
      peakHours: IOT_CONSTANTS.UTILITY_RATES.ELECTRICITY.PEAK_HOURS,
    });
  }

  private async calculateEnvironmentalData(
    devices: IIoTDevice[]
  ): Promise<IEnvironmentalData> {
    const data: IEnvironmentalData = {
      temperature: { current: 0, min: 100, max: -100 },
      humidity: { current: 0, min: 100, max: 0 },
      airQuality: { current: 0, status: "unknown" },
      noiseLevel: { current: 0, status: "unknown" },
      lightLevel: { current: 0, status: "unknown" },
    };

    // Aggregate data from environmental sensors
    for (const device of devices) {
      if (
        [
          IotDeviceType.TEMPERATURE_SENSOR,
          IotDeviceType.HUMIDITY_SENSOR,
          IotDeviceType.AIR_QUALITY_SENSOR,
        ].includes(device.type)
      ) {
        const readings = await SensorReading.find({ deviceId: device.id });
        if (readings && readings.length > 0) {
          const lastReading = readings.at(-1);

          if (lastReading?.data.temperature !== undefined) {
            const temp = lastReading.data.temperature as number;
            data.temperature.current = temp;
            data.temperature.min = Math.min(data.temperature.min, temp);
            data.temperature.max = Math.max(data.temperature.max, temp);
          }

          if (lastReading?.data.humidity !== undefined) {
            const humidity = lastReading.data.humidity as number;
            data.humidity.current = humidity;
            data.humidity.min = Math.min(data.humidity.min, humidity);
            data.humidity.max = Math.max(data.humidity.max, humidity);
          }

          if (lastReading?.data.aqi !== undefined) {
            data.airQuality.current = lastReading.data.aqi as number;
            const standards = IOT_CONSTANTS.ENVIRONMENTAL_STANDARDS.AIR_QUALITY;
            data.airQuality.status =
              data.airQuality.current <= standards.good
                ? "good"
                : data.airQuality.current <= standards.moderate
                  ? "moderate"
                  : "unhealthy";
          }
        }
      }
    }

    return data;
  }

  private async calculateSecurityStatus(
    devices: IIoTDevice[]
  ): Promise<ISecurityStatus> {
    const securityDevices = devices.filter((d) =>
      [
        IotDeviceType.DOOR_LOCK,
        IotDeviceType.SECURITY_CAMERA,
        IotDeviceType.MOTION_DETECTOR,
      ].includes(d.type)
    );

    let lockedDoors = 0,
      unlockedDoors = 0;
    let activeCameras = 0,
      inactiveCameras = 0;
    let motionDetected = false;
    let lastActivity = new Date(0);

    for (const device of securityDevices) {
      const readings = await SensorReading.find({ deviceId: device.id });
      if (readings && readings.length > 0) {
        const lastReading = readings.at(-1);

        if (device.type === IotDeviceType.DOOR_LOCK) {
          if (lastReading?.data.locked) lockedDoors++;
          else unlockedDoors++;
        }

        if (device.type === IotDeviceType.SECURITY_CAMERA) {
          if (device.status === DeviceStatus.ONLINE) activeCameras++;
          else inactiveCameras++;
        }

        if (
          device.type === IotDeviceType.MOTION_DETECTOR &&
          lastReading?.data.motion
        )
          motionDetected = true;

        if ((lastReading as ISensorReading).timestamp > lastActivity) {
          lastActivity = (lastReading as ISensorReading).timestamp;
        }
      }
    }

    return {
      doors: { locked: lockedDoors, unlocked: unlockedDoors },
      cameras: { active: activeCameras, inactive: inactiveCameras },
      alarms: { armed: false, triggered: false }, // Would be determined by security system
      motion: motionDetected,
      lastActivity,
    };
  }

  // Message Handlers
  private handleMQTTMessage(topic: string, message: Buffer): void {
    try {
      const parts = topic.split("/");
      if (parts.length < 4) return;

      const deviceId = parts[2];
      const messageType = parts[3];
      const data = JSON.parse(message.toString());

      switch (messageType) {
        case "data":
          this.recordSensorReading({
            deviceId: new mongoose.Types.ObjectId(deviceId),
            timestamp: new Date(data.timestamp),
            data: data.values,
            quality: data.quality || DataQuality.GOOD,
            batteryLevel: data.battery,
            signalStrength: data.signal,
          });
          break;

        case "status":
          this.updateDeviceStatus(deviceId as string, data.status);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("MQTT message handling error:", error);
    }
  }

  //   private handleWebSocketMessage(_ws: WebSocket, message: any): void {
  //     switch (message.type) {
  //       case "sensor_data":
  //         this.recordSensorReading(message.data);
  //         break;

  //       case "device_status":
  //         this.updateDeviceStatus(message.deviceId, message.status);
  //         break;

  //       case "command_response":
  //         this.handleCommandResponse(message.deviceId, message.response);
  //         break;

  //       default:
  //         break;
  //     }
  //   }

  private async updateDeviceStatus(
    deviceId: string,
    status: any
  ): Promise<void> {
    const device = await this.getDevice(deviceId);
    if (!device) return;

    await this.updateDevice(deviceId, {
      status: status.online ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE,
      batteryLevel: status.battery,
      signalStrength: status.signal,
      lastSeen: new Date(),
    });
  }

  //   private handleCommandResponse(deviceId: string, response: any): void {
  //     this.emit("command.response", {
  //       deviceId,
  //       response,
  //       timestamp: new Date(),
  //     });
  //   }

  // Broadcasting
  private broadcastReading(reading: ISensorReading): void {
    const message = JSON.stringify({
      type: "sensor_reading",
      data: reading,
    });

    // for (const client of this.wsServer.clients) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(message);
    //   }
    // }
  }

  private broadcastAlert(alert: IIoTAlert): void {
    const message = JSON.stringify({
      type: "alert",
      data: alert,
    });

    // for (const client of this.wsServer.clients) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(message);
    //   }
    // }
  }

  // Background Tasks
  private startBackgroundTasks(): void {
    // Device health monitoring
    setInterval(async () => {
      await this.monitorDeviceHealth();
    }, 60_000); // Every minute

    // Cleanup old data
    setInterval(async () => {
      await this.cleanupOldData();
    }, 3_600_000); // Every hour

    // Energy consumption calculation
    setInterval(async () => {
      await this.calculateEnergyMetrics();
    }, 300_000); // Every 5 minutes
  }

  private async monitorDeviceHealth(): Promise<void> {
    const now = Date.now();
    const offlineThreshold = 5 * 60 * 1000; // 5 minutes

    const devices = await IoTDevice.find();

    for (const device of devices) {
      const lastSeenTime = device.lastSeen.getTime();

      if (
        now - lastSeenTime > offlineThreshold &&
        device.status === DeviceStatus.ONLINE
      ) {
        await this.updateDevice(device.id, { status: DeviceStatus.OFFLINE });

        // Trigger offline alert if configured
        this.triggerDeviceOfflineAlert(device);
      }

      // Check battery levels
      if (device.batteryLevel !== undefined && device.batteryLevel < 20) {
        this.triggerLowBatteryAlert(device);
      }
    }
  }

  private async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    // Clean up old readings from memory
    const readings = await SensorReading.find({
      timestamp: { $lt: cutoffDate },
    });
    for (const reading of readings) {
      await SensorReading.findByIdAndDelete(reading.id);
    }

    // Clean up resolved alerts
    const alerts = await IoTAlert.find();
    for (const alert of alerts) {
      if (alert.resolvedAt && alert.resolvedAt < cutoffDate) {
        await IoTAlert.findByIdAndDelete(alert.id);
        await this.redis.del(`alert:${alert.id}`);
      }
    }
  }

  private async calculateEnergyMetrics(): Promise<void> {
    // Calculate energy consumption and costs
    const devices = await IoTDevice.find();
    for (const device of devices) {
      if (device.type === IotDeviceType.ELECTRICITY_METER) {
        const readings = await SensorReading.find({ deviceId: device.id });
        if (readings && readings.length >= 2) {
          const latest = readings.at(-1);
          const previous = readings.at(-2);

          if (latest?.data.energy && previous?.data.energy) {
            const consumption =
              (latest?.data.energy as number) -
              (previous?.data.energy as number);
            const cost = this.calculateElectricityCost(consumption);

            // Store calculated metrics
            await this.redis.setEx(
              `energy_metrics:${device.propertyId}`,
              300,
              JSON.stringify({ consumption, cost, timestamp: new Date() })
            );
          }
        }
      }
    }
  }

  private calculateElectricityCost(consumption: number): number {
    const rates = IOT_CONSTANTS.UTILITY_RATES.ELECTRICITY.DOMESTIC;
    let cost = 0;
    let remaining = consumption;

    for (const rate of rates) {
      const bandConsumption = Math.min(remaining, rate.to - rate.from + 1);
      cost += bandConsumption * rate.rate;
      remaining -= bandConsumption;

      if (remaining <= 0) break;
    }

    return cost;
  }

  // Helper methods
  private async triggerDeviceOfflineAlert(device: IIoTDevice): Promise<void> {
    const alert: IIoTAlert = {
      id: crypto.randomUUID(),
      deviceId: device.id,
      type: AlertType.DEVICE_OFFLINE,
      severity: AlertSeverity.WARNING,
      title: "Device Offline",
      message: `Device ${device.name} has gone offline`,
      timestamp: new Date(),
      acknowledged: false,
      actions: [],
    };

    await IoTAlert.create(alert);

    await IoTAlert.create(alert);
    this.broadcastAlert(alert);
  }

  private async triggerLowBatteryAlert(device: IIoTDevice): Promise<void> {
    const alert: IIoTAlert = {
      id: crypto.randomUUID(),
      deviceId: device.id,
      type: AlertType.LOW_BATTERY,
      severity: AlertSeverity.WARNING,
      title: "Low Battery",
      message: `Device ${device.name} has low battery (${device.batteryLevel}%)`,
      timestamp: new Date(),
      acknowledged: false,
      actions: [],
    };

    await IoTAlert.create(alert);
    this.broadcastAlert(alert);
  }

  private mapAlertType(metric: string): AlertType {
    const mapping: Record<string, AlertType> = {
      temperature: AlertType.SENSOR_THRESHOLD,
      humidity: AlertType.SENSOR_THRESHOLD,
      motion: AlertType.SECURITY_BREACH,
      smoke: AlertType.SECURITY_BREACH,
      energy: AlertType.HIGH_CONSUMPTION,
    };

    return mapping[metric] || AlertType.SENSOR_THRESHOLD;
  }

  private mapAlertSeverity(alertConfig: IAlertConfig): AlertSeverity {
    // Map priority to severity
    switch (alertConfig.actions[0]?.priority) {
      case AlertPriority.CRITICAL:
        return AlertSeverity.CRITICAL;
      case AlertPriority.HIGH:
        return AlertSeverity.WARNING;
      default:
        return AlertSeverity.INFO;
    }
  }

  private generateAlertMessage(
    device: IIoTDevice,
    alertConfig: IAlertConfig,
    reading: ISensorReading
  ): string {
    const value = reading.data[alertConfig.condition.metric];
    return `${alertConfig.name}: ${device.name} ${alertConfig.condition.metric} is ${value}`;
  }

  // Caching methods
  private async cacheDevice(device: IIoTDevice): Promise<void> {
    await this.redis.setEx(
      `device:${device.id}`,
      86_400,
      JSON.stringify(device)
    );
  }

  private async getCachedDevice(deviceId: string): Promise<IIoTDevice | null> {
    const cached = await this.redis.get(`device:${deviceId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheReading(reading: ISensorReading): Promise<void> {
    const key = `readings:${reading.deviceId}`;
    await this.redis.lPush(key, JSON.stringify(reading));
    await this.redis.lTrim(key, 0, 999); // Keep last 1000 readings
    await this.redis.expire(key, 86_400); // 24 hours
  }

  private async cacheAlert(alert: IIoTAlert): Promise<void> {
    await this.redis.setEx(
      `alert:${alert.id}`,
      86_400 * 7,
      JSON.stringify(alert)
    );
  }

  private async getLastAlert(
    deviceId: string,
    _alertConfigId: string
  ): Promise<IIoTAlert | null> {
    return await IoTAlert.findOne({ deviceId }).sort({ timestamp: -1 });
  }

  private async loadDevices(): Promise<void> {
    try {
      const keys = await this.redis.keys("device:*");

      for (const key of keys) {
        const deviceData = await this.redis.get(key);
        if (deviceData) {
          const device = JSON.parse(deviceData);
          await IoTDevice.create(device);
        }
      }

      console.log(
        `Loaded ${await IoTDevice.countDocuments()} IoT devices from cache`
      );
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  }

  private async loadAlerts(): Promise<void> {
    try {
      const keys = await this.redis.keys("alert:*");

      for (const key of keys) {
        const alertData = await this.redis.get(key);
        if (alertData) {
          const alert = JSON.parse(alertData);
          await IoTAlert.create(alert);
        }
      }

      console.log(
        `Loaded ${await IoTAlert.countDocuments()} alerts from cache`
      );
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
  }

  async configureDevice(
    deviceId: string,
    config: IDeviceConfig
  ): Promise<void> {
    await this.sendDeviceCommand({
      deviceId: new mongoose.Types.ObjectId(deviceId),
      command: "configure",
      parameters: config,
      timestamp: new Date(),
      userId: new mongoose.Types.ObjectId("system"), // TODO: get system user id
      priority: CommandPriority.HIGH,
    });
  }

  // Public API methods
  async getDevicesForProperty(propertyId: string): Promise<IIoTDevice[]> {
    // return Array.from(this.devices.values()).filter(
    //   (device) => device.propertyId === propertyId
    // );
    return await IoTDevice.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
    });
  }

  async getDeviceReadings(
    deviceId: string,
    limit = 100
  ): Promise<ISensorReading[]> {
    const readings = await SensorReading.find({
      deviceId: new mongoose.Types.ObjectId(deviceId),
    })
      .sort({ timestamp: -1 })
      .limit(limit);
    return readings;
  }

  async getPropertyAlerts(
    propertyId: string,
    limit = 50
  ): Promise<IIoTAlert[]> {
    const propertyDevices = await IoTDevice.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
    });
    const propertyDeviceIds = new Set(propertyDevices.map((d) => d.id));

    const alerts = await IoTAlert.find({
      deviceId: { $in: propertyDeviceIds },
    })
      .sort({ timestamp: -1 })
      .limit(limit);

    return alerts;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = await IoTAlert.findById(alertId);
    if (alert) {
      alert.acknowledged = true;
      await this.cacheAlert(alert);

      this.emit("alert.acknowledged", { alert, userId, timestamp: new Date() });
    }
  }

  async getServiceHealth(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    devicesOnline: number;
    devicesTotal: number;
    activeAlerts: number;
    mqttConnected: boolean;
    websocketConnections: number;
  }> {
    try {
      const devicesTotal = await IoTDevice.countDocuments();
      const devicesOnline = await IoTDevice.countDocuments({
        status: DeviceStatus.ONLINE,
      });
      const activeAlerts = await IoTAlert.countDocuments({
        acknowledged: false,
      });

      const status =
        devicesOnline / Math.max(devicesTotal, 1) > 0.8
          ? "healthy"
          : devicesOnline / Math.max(devicesTotal, 1) > 0.5
            ? "degraded"
            : "unhealthy";

      return await Promise.resolve({
        status,
        devicesOnline,
        devicesTotal,
        activeAlerts,
        mqttConnected: this.mqttClient?.connected as boolean,
        websocketConnections: 0, // this.wsServer.clients.size,
      });
    } catch (error) {
      return await Promise.resolve({
        status: "unhealthy",
        devicesOnline: 0,
        devicesTotal: 0,
        activeAlerts: 0,
        mqttConnected: false,
        websocketConnections: 0,
      });
    }
  }
}

export const iotService = new IoTService();
