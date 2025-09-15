export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  isVerified: boolean;
  userType: "tenant" | "landlord";
  createdAt: string;
};
