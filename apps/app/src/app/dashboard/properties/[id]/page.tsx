import { IntegratedPropertyDashboard } from "@/routes/dashboard/properties/IntegratedPropertyDashboard";

function PropertyIntegratedPage({ id }: { id: string }) {
  return (
    <div>
      <IntegratedPropertyDashboard landlordId="" propertyId={id} userId="" />
    </div>
  );
}

export default PropertyIntegratedPage;
