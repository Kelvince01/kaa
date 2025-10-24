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
import { useProperties } from "@/modules/properties/property.queries";
import { ApplicationStatus } from "../application.type";

interface ApplicationFormProps<T extends FieldValues>
  extends Omit<React.ComponentPropsWithRef<"form">, "onSubmit"> {
  children: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
}

export function ApplicationForm<T extends FieldValues>({
  form,
  onSubmit,
  children,
}: ApplicationFormProps<T>) {
  const { data } = useProperties();

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 px-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name={"title" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none"
                  placeholder="Do a kickflip"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={"property" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="capitalize">
                    <SelectValue placeholder="Select a label" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {data?.properties.map((item) => (
                      <SelectItem
                        className="capitalize"
                        key={item._id}
                        value={item._id}
                      >
                        {item.title}
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
          name={"status" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="capitalize">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {Object.values(ApplicationStatus).map((item) => (
                      <SelectItem
                        className="capitalize"
                        key={item}
                        value={item}
                      >
                        {item}
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
          name={"property" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="capitalize">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {data?.properties.map((item) => (
                      <SelectItem
                        className="capitalize"
                        key={item._id}
                        value={item._id}
                      >
                        {item.title}
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
          name={"estimatedHours" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Hours</FormLabel>
              <FormControl>
                <Input
                  min="0"
                  placeholder="Enter estimated hours"
                  step="0.5"
                  type="number"
                  {...field}
                  onChange={(event) =>
                    field.onChange(event.target.valueAsNumber)
                  }
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
