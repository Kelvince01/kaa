import { Template } from "@kaa/models";
import type { ITemplateCreateRequest } from "@kaa/models/types";
import { MongooseSetup } from "~/database/mongoose.setup";
import { authTemplates } from "./auth.templates";

// import { contractTemplates } from "./contract.templates";

new MongooseSetup();

export const allTemplates: ITemplateCreateRequest[] = [
  ...authTemplates,
  // ...contractTemplates,
];

export const seedTemplates = async () => {
  console.log("Seeding templates...");
  try {
    const templates = await Template.insertMany(allTemplates);
    console.log(`Inserted ${templates.length} templates`);
  } catch (error) {
    console.error("Error seeding templates:", error);
    throw error;
  }
};

seedTemplates()
  .then(() => {
    console.log("✅ Templates seeded successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  });
