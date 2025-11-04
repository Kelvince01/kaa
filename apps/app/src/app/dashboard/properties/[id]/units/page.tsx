import { UnitsContainer } from "@/routes/dashboard/properties/units";

type UnitPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UnitsPage({ params }: UnitPageProps) {
  const propertyId = (await params).id;

  return (
    <div className="container mx-auto space-y-6 py-6">
      <UnitsContainer property={propertyId} />
    </div>
  );
}
