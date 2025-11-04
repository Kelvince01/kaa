/**
 * Contact form modal for contacting the landlord
 */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Separator } from "@kaa/ui/components/separator";
import { Textarea } from "@kaa/ui/components/textarea";
import { Clock, MessageCircle, Send, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useCreateApplication } from "@/modules/applications/application.mutations";
import type { Property } from "@/modules/properties/property.type";
import { formatCurrency } from "@/shared/utils/format.util";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  interestedInViewing: z.boolean(),
  moveInDate: z.string().optional(),
  budget: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

type ContactFormModalProps = {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
};

export function ContactFormModal({
  property,
  isOpen,
  onClose,
}: ContactFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createApplicationMutation = useCreateApplication();

  const landlord = property.landlord;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: `Hi, I'm interested in your property "${property.title}". Could you please provide more information?`,
      interestedInViewing: true,
      moveInDate: "",
      budget: property.pricing?.rent?.toString() || "",
      agreeToTerms: false,
    },
  });

  const getLandlordInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);

      console.log("Contact form data:", {
        ...data,
        propertyId: property._id,
        landlordId: (landlord as any)?.id,
      });

      await createApplicationMutation.mutateAsync({
        property: property._id,
        moveInDate: data.moveInDate ?? "",
        offerAmount: Number(data.budget) ?? 0,
        notes: data.message,
      });

      toast.success(
        "Message sent successfully! The landlord will contact you soon."
      );
      form.reset();
      onClose();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Contact Landlord
          </DialogTitle>
          <DialogDescription>
            Send a message to inquire about this property. Your contact details
            will be shared with the landlord.
          </DialogDescription>
        </DialogHeader>

        {/* Property Summary */}
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
              {property.media?.images?.[0]?.url ? (
                // biome-ignore lint/nursery/useImageSize: by author
                // biome-ignore lint/performance/noImgElement: by author
                <img
                  alt={property.title}
                  className="h-full w-full object-cover"
                  src={property.media.images[0].url}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted-foreground/20">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-sm">
                {property.title}
              </h3>
              <p className="truncate text-muted-foreground text-xs">
                {property.location?.address.town}, {property.location?.county}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-bold text-primary text-sm">
                  {formatCurrency(property.pricing?.rent || 0, "KES")}
                </span>
                <span className="text-muted-foreground text-xs">
                  /{property.pricing?.paymentFrequency || "month"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Landlord Info */}
        {landlord && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  alt={(landlord as any).personalInfo.firstName}
                  src={(landlord as any).personalInfo.avatar}
                />
                <AvatarFallback>
                  {getLandlordInitials(
                    `${(landlord as any).personalInfo.firstName} ${(landlord as any).personalInfo.lastName}`
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">
                  {(landlord as any).personalInfo.firstName}
                </h4>
                {(landlord as any)?.personalInfo.title && (
                  <p className="text-muted-foreground text-xs">
                    {(landlord as any).personalInfo.title}
                  </p>
                )}
                {(landlord as any)?.responseTime && (
                  <div className="mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground text-xs">
                      Responds in {(landlord as any).responseTime}
                    </span>
                  </div>
                )}
              </div>
              {(landlord as any)?.status === "verified" && (
                <Badge
                  className="border-green-200 bg-green-50 text-green-700 text-xs"
                  variant="outline"
                >
                  Verified
                </Badge>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Contact Form */}
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Personal Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.email@example.com"
                        type="email"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your phone number"
                      type="tel"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Details */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="moveInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Move-in Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Budget</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your budget"
                        type="number"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[100px]"
                      placeholder="Enter your message or questions about the property..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Viewing Interest */}
            <FormField
              control={form.control}
              name="interestedInViewing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={isSubmitting}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I'm interested in scheduling a viewing
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Terms Agreement */}
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={isSubmitting}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm">
                      I agree to the terms and conditions and privacy policy *
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                disabled={isSubmitting}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="min-w-[120px]"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
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
