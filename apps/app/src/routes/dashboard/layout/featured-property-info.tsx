import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import Image from "next/image";

export function FeaturedPropertyInfo() {
  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="font-heading text-emerald-900">
          Property Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6">
        <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200">
          <Image
            alt="Property"
            className="h-full w-full object-cover"
            height={40}
            src="https://wqnmyfkavrotpmupbtou.supabase.co/storage/v1/object/public/reweb/blocks/placeholder.png"
            width={40}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600">Unit:</span>
            <span className="font-medium text-emerald-900">3B</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600">Building:</span>
            <span className="font-medium text-emerald-900">
              Kileleshwa Heights
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600">Lease:</span>
            <span className="font-medium text-emerald-900">Until Dec 2024</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600">Manager:</span>
            <span className="font-medium text-emerald-900">Sarah Wanjiku</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
