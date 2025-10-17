#!/usr/bin/env tsx

/**
 * Integration Validation Script
 * Validates that all services are properly integrated with the orchestrator
 */

import { VirtualTourServicesOrchestrator } from "./virtual-tour-services.orchestrator";
import { VirtualToursService as VirtualTourService } from "./virtual-tours.service";

const ServiceOrchestrator = new VirtualTourServicesOrchestrator();

const VirtualToursService = new VirtualTourService();

async function validateIntegration() {
  console.log("🔍 Starting Virtual Tours Integration Validation...\n");

  try {
    // Step 1: Initialize orchestrator
    console.log("1️⃣ Initializing Service Orchestrator...");
    await ServiceOrchestrator.initialize();
    console.log("✅ Service Orchestrator initialized\n");

    // Step 2: Check service status
    console.log("2️⃣ Checking Service Status...");
    const status = ServiceOrchestrator.getInitializationStatus();
    console.log(
      `📊 Services: ${status.initializedServices.length}/${status.totalServices} initialized`
    );
    console.log(`✅ Healthy: ${status.initializedServices.join(", ")}`);
    if (status.failedServices.length > 0) {
      console.log(`❌ Failed: ${status.failedServices.join(", ")}`);
    }
    console.log("");

    // Step 3: Check system health
    console.log("3️⃣ Checking System Health...");
    const health = ServiceOrchestrator.getSystemHealth();
    console.log(`💚 Overall Health: ${health.overall}`);
    console.log(`📈 Timestamp: ${health.timestamp}`);
    if (health.degradedServices.length > 0) {
      console.log(`⚠️ Degraded: ${health.degradedServices.join(", ")}`);
    }
    console.log("");

    // Step 4: Enable advanced mode
    console.log("4️⃣ Enabling Advanced Mode...");
    await VirtualToursService.enableAdvancedMode();
    console.log("✅ Advanced mode enabled\n");

    // Step 5: Check capabilities
    console.log("5️⃣ Checking Service Capabilities...");
    const capabilities = VirtualToursService.getServiceCapabilities();
    console.log(`🎯 Advanced Mode: ${capabilities.advancedMode}`);
    console.log(
      `🏗️ Orchestrator Status: ${capabilities.orchestrator.initialized}`
    );
    console.log("");

    // Step 6: Test individual services
    console.log("6️⃣ Testing Individual Services...");
    const serviceTests = [
      { name: "ai", description: "AI Analysis" },
      { name: "collaboration", description: "Real-time Collaboration" },
      { name: "ml-analytics", description: "ML Analytics" },
      { name: "edge-computing", description: "Edge Computing" },
      { name: "iot-integration", description: "IoT Integration" },
    ];

    for (const test of serviceTests) {
      const isAvailable = ServiceOrchestrator.isServiceAvailable(test.name);
      const service = ServiceOrchestrator.getService(test.name);
      const status = isAvailable ? "✅" : "❌";
      console.log(
        `${status} ${test.description}: ${isAvailable ? "Available" : "Unavailable"}`
      );
    }
    console.log("");

    // Step 7: Test feature flags
    console.log("7️⃣ Testing Feature Flags...");
    const features = capabilities.features;
    for (const [feature, enabled] of Object.entries(features)) {
      const status = enabled ? "✅" : "❌";
      console.log(`${status} ${feature}: ${enabled}`);
    }
    console.log("");

    // Step 8: Validate integration points
    console.log("8️⃣ Validating Integration Points...");

    // Check existing service integration
    const existingIntegrations = [
      {
        name: "M-Pesa Service",
        check: () => !!require("../payments/mpesa/mpesa.service"),
      },
      {
        name: "SMS Service",
        check: () => !!require("../comms/sms/sms.service"),
      },
      {
        name: "Geocoding Utils",
        check: () => !!require("../../shared/utils/geocoding.util"),
      },
      {
        name: "i18n Utils",
        check: () => !!require("../../shared/utils/i18n.util"),
      },
    ];

    for (const integration of existingIntegrations) {
      try {
        const isWorking = integration.check();
        console.log(
          `✅ ${integration.name}: ${isWorking ? "Integrated" : "Not found"}`
        );
      } catch (error) {
        console.log(`❌ ${integration.name}: Integration failed`);
      }
    }
    console.log("");

    // Step 9: Performance summary
    console.log("9️⃣ Performance Summary...");
    const metrics = ServiceOrchestrator.getServiceMetrics();
    console.log(`📊 Service Metrics Available: ${Object.keys(metrics).length}`);
    console.log(
      `⚡ Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    );
    console.log(`🕐 Uptime: ${Math.round(process.uptime())}s`);
    console.log("");

    // Final validation
    console.log("🎯 INTEGRATION VALIDATION RESULTS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const totalServices = status.totalServices;
    const healthyServices = status.initializedServices.length;
    const healthPercentage = Math.round(
      (healthyServices / totalServices) * 100
    );

    console.log(
      `📈 Service Health: ${healthyServices}/${totalServices} (${healthPercentage}%)`
    );
    console.log(`🏆 System Status: ${health.overall.toUpperCase()}`);
    console.log(
      `🚀 Advanced Mode: ${capabilities.advancedMode ? "ENABLED" : "DISABLED"}`
    );
    console.log(
      `🔧 Orchestration: ${capabilities.orchestrator.initialized ? "COMPLETE" : "INCOMPLETE"}`
    );

    if (healthPercentage >= 80 && health.overall !== "unhealthy") {
      console.log("🎉 INTEGRATION SUCCESSFUL - Ready for production!");
    } else if (healthPercentage >= 60) {
      console.log("⚠️ INTEGRATION PARTIAL - Some features may be degraded");
    } else {
      console.log("❌ INTEGRATION FAILED - System needs attention");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return {
      success: healthPercentage >= 80,
      healthPercentage,
      systemHealth: health.overall,
      advancedMode: capabilities.advancedMode,
      orchestratorInitialized: capabilities.orchestrator.initialized,
    };
  } catch (error) {
    console.error("💥 Integration validation failed:", error);
    return {
      success: false,
      error: (error as Error).message,
      healthPercentage: 0,
      systemHealth: "unhealthy",
      advancedMode: false,
      orchestratorInitialized: false,
    };
  } finally {
    // Cleanup
    try {
      await ServiceOrchestrator.shutdown();
      console.log("🛑 Services shutdown completed");
    } catch (error) {
      console.warn("⚠️ Cleanup warning:", (error as Error).message);
    }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateIntegration()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Validation error:", error);
      process.exit(1);
    });
}

export { validateIntegration };
