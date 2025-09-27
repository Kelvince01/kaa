import { Permission, Role, RolePermission, User, UserRole } from "@kaa/models";
import {
  type IPermission,
  type IRole,
  KYCStatus,
  PermissionAction,
  UserStatus,
} from "@kaa/models/types";
import { logger } from "@kaa/utils";
import type mongoose from "mongoose";
import { MongooseSetup } from "~/database/mongoose.setup";
import featuresPermissions from "./features";

new MongooseSetup();

// Define default roles
const defaultRoles: Pick<IRole, "name" | "description" | "isSystem">[] = [
  {
    name: "super_admin",
    description: "Super administrator with full system access",
    isSystem: true,
  },
  {
    name: "admin",
    description: "Administrator with extensive system access",
    isSystem: true,
  },
  {
    name: "landlord",
    description: "Property owner with own properties management capabilities",
    isSystem: true,
  },
  {
    name: "agent",
    description: "Real estate agent with property management capabilities",
    isSystem: true,
  },
  {
    name: "accountant",
    description: "Manage finances and payments",
    isSystem: true,
  },
  {
    name: "tenant",
    description: "Property tenant with limited access",
    isSystem: true,
  },
  {
    name: "contractor",
    description: "Maintenance staff with access to maintenance tasks",
    isSystem: true,
  },
  {
    name: "pending",
    description: "Pending user with limited access",
    isSystem: true,
  },
];

const seedRoles = async () => {
  console.log("Seeding roles...");

  try {
    const insertedRoles = await Role.insertMany(defaultRoles);
    console.log(`Inserted ${insertedRoles.length} roles`);
    return insertedRoles;
  } catch (error) {
    console.error("Error seeding roles:", error);
    throw error;
  }
};

// Define permissions for 'roles' resource
const rolesPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    name: "roles:create",
    description: "Permission to create roles",
    resource: "roles",
    action: PermissionAction.CREATE,
  },
  {
    name: "roles:read",
    description: "Permission to read/view roles",
    resource: "roles",
    action: PermissionAction.READ,
  },
  {
    name: "roles:update",
    description: "Permission to update roles",
    resource: "roles",
    action: PermissionAction.UPDATE,
  },
  {
    name: "roles:delete",
    description: "Permission to delete roles",
    resource: "roles",
    action: PermissionAction.DELETE,
  },
];

// Define permissions for 'permissions' resource
const permissionsPermissions: Pick<
  IPermission,
  "name" | "description" | "resource" | "action"
>[] = [
  {
    name: "permissions:create",
    description: "Permission to create permissions",
    resource: "permissions",
    action: PermissionAction.CREATE,
  },
  {
    name: "permissions:read",
    description: "Permission to read/view permissions",
    resource: "permissions",
    action: PermissionAction.READ,
  },
  {
    name: "permissions:update",
    description: "Permission to update permissions",
    resource: "permissions",
    action: PermissionAction.UPDATE,
  },
  {
    name: "permissions:delete",
    description: "Permission to delete permissions",
    resource: "permissions",
    action: PermissionAction.DELETE,
  },
];

// Combine all permissions
const allPermissions = [
  ...rolesPermissions,
  ...permissionsPermissions,
  ...featuresPermissions,
];

/**
 * Seeds roles and permissions specific to roles management
 */
export const seedPermissions = async () => {
  console.log("Seeding permissions...");

  // Insert permissions
  try {
    const insertedPermissions = await Permission.insertMany(allPermissions);

    console.log(`Inserted ${insertedPermissions.length} permissions`);
    return insertedPermissions;
  } catch (error) {
    console.error("Error seeding roles management permissions:", error);
    throw error;
  }
};

// Define role-permission mappings
const rolePermissionMappings = {
  // admin: [
  //     "users:read",
  //     "users:create",
  //     "users:update",
  //     "users:delete",
  //     "properties:read",
  //     "properties:create",
  //     "properties:update",
  //     "properties:delete",
  //     "payments:read",
  //     "payments:create",
  //     "payments:update",
  //     "contracts:read",
  //     "contracts:create",
  //     "contracts:update",
  //     "contracts:delete",
  //     "reports:read",
  //     "reports:create",
  //     "admin:manage",
  // ],
  landlord: [
    "users:read",
    "properties:read",
    "properties:create",
    "properties:update",
    "payments:read",
    "contracts:read",
    "contracts:create",
    "contracts:update",
    // "reports:read",
  ],
  tenant: [
    "users:read",
    "properties:read",
    "payments:read",
    "payments:create",
    "contracts:read",
  ],
  agent: [
    "users:read",
    "properties:read",
    "properties:create",
    "properties:update",
    "payments:read",
    "contracts:read",
    "contracts:create",
    "contracts:update",
  ],
};

/**
 * Assigns all roles and permissions management permissions to the Admin role
 * @param insertedPermissions - The permissions to assign
 * @param adminRoleId - The ID of the Admin role
 */
export const assignPermissionsToAdmin = async (
  insertedPermissions: Pick<IPermission, "_id">[]
) => {
  console.log("Assigning roles management permissions to Admin role...");

  const role = await Role.findOne({ name: "admin" });
  const adminRoleId = (role?._id as mongoose.Types.ObjectId).toString();

  // Create role_permissions entries
  const rolePermissionValues = insertedPermissions.map((permission) => ({
    roleId: adminRoleId,
    permissionId: permission._id,
  }));

  try {
    const insertedRolePermissions =
      await RolePermission.insertMany(rolePermissionValues);

    console.log(
      `Assigned ${insertedRolePermissions.length} permissions to Admin role`
    );
    return insertedRolePermissions;
  } catch (error) {
    console.error("Error assigning permissions to Admin role:", error);
    throw error;
  }
};

const seedFeatures = async () => {
  console.log("Seeding features permissions...");

  try {
    const insertedFeatures = await Permission.insertMany(featuresPermissions);

    console.log(`Inserted ${insertedFeatures.length} features permissions`);
    return insertedFeatures;
  } catch (error) {
    console.error("Error seeding features permissions:", error);
    throw error;
  }
};

// Create admin user
const adminUser = {
  slug: "admin",
  addresses: [
    {
      type: "residential",
      county: "Nairobi",
      country: "Kenya",
      estate: "Westlands",
      line1: "Westlands, Nairobi",
      postalCode: "00100",
      town: "Nairobi",
      isPrimary: true,
    },
  ],
  profile: {
    firstName: "Admin",
    lastName: "User",
    displayName: "Admin",
    fullName: "Admin User",
  },
  contact: {
    email: "admin@kaapro.dev",
    phone: {
      number: "+254712345678",
      countryCode: "+254",
      formatted: "+254712345678",
    },
    preferredContact: "email",
  },
  verification: {
    emailVerified: true,
    phoneVerified: true,
    identityVerified: true,
    kycStatus: KYCStatus.VERIFIED,
  },
  preferences: {
    theme: "light",
    currency: "KES",
    timezone: "Africa/Nairobi",
    notifications: {
      email: true,
      sms: true,
      marketing: true,
      push: true,
      whatsapp: true,
    },
    language: "en",
    privacy: {
      profileVisible: true,
      showPhone: true,
      showEmail: true,
    },
    accessibility: {
      prefersReducedMotion: false,
      prefersContrast: "no-preference",
      prefersDarkMode: false,
      fontSize: "medium",
    },
  },
  settings: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    autoLogout: false,
  },
  activity: {
    lastActivity: new Date(),
    lastLoginIP: "127.0.0.1",
    loginAttempts: 0,
  },
  password: "Admin@123",
  status: UserStatus.ACTIVE,
};

// Seed database
const seedDatabase = async (): Promise<void> => {
  try {
    // Clear existing data
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await UserRole.deleteMany({});
    await RolePermission.deleteMany({});

    // Create roles
    const createdRoles: Record<string, any> = {};
    for (const role of defaultRoles) {
      const newRole = await Role.create(role);
      createdRoles[role.name] = newRole;
      logger.info(`Created role: ${role.name}`);
    }

    // Create permissions
    const createdPermissions: Record<string, any> = {};
    for (const permission of allPermissions) {
      const newPermission = await Permission.create(permission);
      createdPermissions[permission.name] = newPermission;
      logger.info(`Created permission: ${permission.name}`);
    }

    // console.log(Object.values(createdPermissions))

    // If you want to assign all created permissions to admin, use createdPermissions.
    await assignPermissionsToAdmin(Object.values(createdPermissions));

    // Assign permissions to roles
    for (const [roleName, permissionNames] of Object.entries(
      rolePermissionMappings
    )) {
      const role = createdRoles[roleName];
      // console.log(role)
      // console.log(permissionNames)
      for (const permissionName of permissionNames) {
        const permission = createdPermissions[permissionName];
        // console.log(permission)
        await RolePermission.create({
          roleId: role._id,
          permissionId: permission._id,
        });
        logger.info(
          `Assigned permission ${permissionName} to role ${roleName}`
        );
      }
    }

    // Check if admin user exists
    const existingAdmin = await User.findOne({
      email: adminUser.contact.email,
    });
    if (existingAdmin) {
      logger.info(`Admin user already exists: ${adminUser.contact.email}`);
    } else {
      // Create admin user
      const newAdmin = await User.create({
        ...adminUser,
        role: createdRoles.admin._id,
      });
      logger.info(`Created admin user: ${adminUser.contact.email}`);

      // Assign admin role to admin user
      await UserRole.create({
        userId: newAdmin._id,
        roleId: createdRoles.admin._id,
        assignedBy: newAdmin._id,
      });
      logger.info(`Assigned admin role to user: ${adminUser.contact.email}`);
    }

    logger.info("Database seeded successfully");
  } catch (error) {
    logger.error("Error seeding database:", error);
  }
};

/**
 * Export a function to run the seed
 */
// export const runSeed = async () => {
//     try {
//         // await seedRoles();
//         // const insertedPermissions = await seedPermissions();
//         const insertedFeaturesPermissions = await seedFeatures();
//         await assignPermissionsToAdmin(insertedFeaturesPermissions);
//         console.log("✅ Roles and permissions seeded and assigned successfully");
//     } catch (error) {
//         console.error("❌ Error seeding roles and permissions:", error);
//         if (error instanceof Error) {
//             console.error(error.message);
//         }
//         process.exit(1);
//     }
// };

// // Allow running directly with Node
// runSeed()
//     .then(() => {
//         console.log("Seed completed successfully");
//         process.exit(0);
//     })
//     .catch((error) => {
//         console.error("Failed to seed roles management permissions:", error);
//         process.exit(1);
//     });

seedDatabase()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed roles management permissions:", error);
    process.exit(1);
  });
