"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { CheckCircle, Shield, Users, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useVerifyAmenityWithLevel } from "../amenity.queries";
import type { Amenity } from "../amenity.type";

type VerificationDialogProps = {
  amenity: Amenity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: (amenity: Amenity) => void;
};

const verificationSchema = z.object({
  verificationLevel: z.enum(["basic", "full", "community_verified"]),
  notes: z.string().optional(),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

const verificationLevels = [
  {
    value: "basic",
    label: "Basic Verification",
    description: "Location and basic details confirmed",
    icon: CheckCircle,
    color: "text-blue-600",
  },
  {
    value: "full",
    label: "Full Verification",
    description: "Location, contact info, and hours verified",
    icon: Shield,
    color: "text-green-600",
  },
  {
    value: "community_verified",
    label: "Community Verified",
    description: "Verified by multiple users or community reports",
    icon: Users,
    color: "text-purple-600",
  },
] as const;

export function VerificationDialog({
  amenity,
  open,
  onOpenChange,
  onVerified,
}: VerificationDialogProps) {
  const verifyMutation = useVerifyAmenityWithLevel();

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      verificationLevel: "basic",
      notes: "",
    },
  });

  const selectedLevel = form.watch("verificationLevel");
  const levelInfo = verificationLevels.find(
    (level) => level.value === selectedLevel
  );

  const onSubmit = async (data: VerificationFormData) => {
    if (!amenity) return;

    try {
      const result = await verifyMutation.mutateAsync({
        amenityId: amenity._id,
        verificationLevel: data.verificationLevel,
        notes: data.notes,
      });
      onVerified?.(result);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  if (!amenity) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Amenity</DialogTitle>
          <DialogDescription>
            Verify "{amenity.name}" with appropriate verification level
          </DialogDescription>
        </DialogHeader>

        {/* Amenity Info */}
        <div className="mb-4 rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center space-x-2">
            <span className="text-lg">{getCategoryIcon(amenity.category)}</span>
            <div>
              <h4 className="font-medium">{amenity.name}</h4>
              <p className="text-muted-foreground text-sm capitalize">
                {amenity.type.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge
              className="text-xs"
              variant={amenity.isAutoDiscovered ? "secondary" : "default"}
            >
              {amenity.isAutoDiscovered ? "Auto-Discovered" : "Manual Entry"}
            </Badge>
            {amenity.isAutoDiscovered && (
              <Badge className="text-xs" variant="outline">
                {amenity.source.includes("google")
                  ? "Google Places"
                  : "OpenStreetMap"}
              </Badge>
            )}
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="verificationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Level</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select verification level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {verificationLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center space-x-2">
                            <level.icon className={`h-4 w-4 ${level.color}`} />
                            <span>{level.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Level Description */}
            {levelInfo && (
              <Alert>
                <levelInfo.icon className={`h-4 w-4 ${levelInfo.color}`} />
                <AlertDescription>
                  <strong>{levelInfo.label}:</strong> {levelInfo.description}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about the verification process..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Document what was verified or any issues found
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button onClick={handleClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={verifyMutation.isPending}
                type="submit"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Amenity
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function (should be imported from AmenityCard)
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    education: "🎓",
    healthcare: "🏥",
    shopping: "🛒",
    transport: "🚌",
    banking: "🏦",
    entertainment: "🎬",
    religious: "⛪",
    government: "🏛️",
    utilities: "⚡",
    food: "🍽️",
    security: "🛡️",
    sports: "⚽",
  };
  return icons[category] || "📍";
};
