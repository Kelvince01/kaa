"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const testFormSchema = z.object({
  name: z.string(),
  description: z.string(),
});

type TestForm = z.infer<typeof testFormSchema>;

export default function TestPage() {
  const [value, setValue] = useState("");
  const [blocknoteId] = useState("test");

  const form = useForm<TestForm>({
    resolver: zodResolver(testFormSchema),
  });

  const onSubmit = (values: TestForm) => {
    console.log(values);
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>

      <button
        onClick={() => {
          console.log("Upload");
        }}
        type="button"
      >
        Upload
      </button>
      <button
        onClick={() => {
          console.log("Media Library");
        }}
        type="button"
      >
        Media Library
      </button>
    </div>
  );
}
