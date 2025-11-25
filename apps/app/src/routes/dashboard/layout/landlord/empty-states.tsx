import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Building, Plus } from "lucide-react";
import Link from "next/link";

export const EmptyProperties = () => (
  <Card className="mx-auto w-full max-w-2xl">
    <CardHeader className="text-center">
      <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <CardTitle>No Properties Found</CardTitle>
      <CardDescription>
        You don't have any properties yet. Create your first property to get
        started.
      </CardDescription>
    </CardHeader>
    <CardContent className="text-center">
      <Link href="/dashboard/properties/create">
        <Button className="w-full max-w-xs">
          <Plus className="mr-2 h-4 w-4" />
          Create Property
        </Button>
      </Link>
    </CardContent>
  </Card>
);
