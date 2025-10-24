"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import type * as React from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
// import { BookingType, ViewingType } from "../booking.type";
import { useProperties } from "@/modules/properties/property.queries";
import { BookingType, ViewingType } from "../booking.type";

interface BookingFormProps<T extends FieldValues>
  extends Omit<React.ComponentPropsWithRef<"form">, "onSubmit"> {
  children: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
}

export function BookingForm<T extends FieldValues>({
  form,
  onSubmit,
  children,
}: BookingFormProps<T>) {
  const { data: propertiesData } = useProperties();

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 px-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name={"property" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {propertiesData?.properties?.map((property) => (
                      <SelectItem key={property._id} value={property._id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={"type" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booking Type</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {Object.values(BookingType).map((type) => (
                      <SelectItem
                        className="capitalize"
                        key={type}
                        value={type}
                      >
                        {type === "viewing" ? "Property Viewing" : type}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={"viewingType" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Viewing Type (optional)</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select viewing type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {Object.values(ViewingType).map((type) => (
                      <SelectItem
                        className="capitalize"
                        key={type}
                        value={type}
                      >
                        {type === "in-person" ? "In Person" : "Virtual"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={"date" as FieldPath<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input placeholder="Select date" type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={"time" as FieldPath<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input placeholder="Select time" type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name={"notes" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none"
                  placeholder="Add any notes about this booking..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={"specialRequests" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Requests (optional)</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none"
                  placeholder="Any special requests or requirements..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {children}
      </form>
    </Form>
  );
}
