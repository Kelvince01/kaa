import mongoose from "mongoose";
import { User } from "@kaa/models";
import { seedSystemTemplates } from "../../../features/reports/system-templates";

/**
 * Seed System Report Templates
 * 
 * Run with: bun run seed:templates
 */

async function main() {
  try {
    console.log("🌱 Starting report templates seeding...\n");

    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find admin user (or create one if needed)
    let adminUser = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });

    if (!adminUser) {
      console.log("⚠️  No admin user found, creating system admin...");
      adminUser = await User.create({
        email: "admin@kaapro.dev",
        firstName: "System",
        lastName: "Admin",
        role: "admin",
        isActive: true,
      });
      console.log("✅ Admin user created\n");
    } else {
      console.log(`✅ Using admin user: ${adminUser.email}\n`);
    }

    // Seed templates
    await seedSystemTemplates(adminUser._id);

    console.log("\n✨ Seeding completed successfully!");
  } catch (error) {
    console.error("\n❌ Error seeding templates:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

main();
