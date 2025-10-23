import { createContext } from "react";
import { useTenant } from "../tenant.store";
import type { Tenant } from "../tenant.type";

export const TenantContext = createContext<Tenant | null>(null);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const tenant = useTenant();

  if (!tenant) {
    return <div>Loading...</div>;
  }

  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
};
