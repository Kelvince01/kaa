"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { MultiSelect } from "@/components/ui/multi-select";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import {
  WebhookContentType,
  WebhookEnvironment,
  WebhookEventType,
  WebhookMethod,
  WebhookPriority,
} from "../webhook.type";

const webhookFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  url: z.string().url("Must be a valid URL"),
  method: z.nativeEnum(WebhookMethod).optional(),
  events: z
    .array(z.nativeEnum(WebhookEventType))
    .min(1, "At least one event is required"),
  environment: z.nativeEnum(WebhookEnvironment).optional(),
  priority: z.nativeEnum(WebhookPriority).optional(),
  contentType: z.nativeEnum(WebhookContentType).optional(),
  timeout: z.number().min(1000).max(120_000).optional(),
  tags: z.array(z.string()).optional(),
});

type WebhookFormValues = z.infer<typeof webhookFormSchema>;

type WebhookFormProps = {
  defaultValues?: Partial<WebhookFormValues>;
  onSubmit: (values: WebhookFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  supportedEvents?: WebhookEventType[];
};

export const WebhookForm = ({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Create Webhook",
  supportedEvents = Object.values(WebhookEventType),
}: WebhookFormProps) => {
  const form = useFormWithDraft<WebhookFormValues>("webhook-form", {
    formOptions: {
      resolver: zodResolver(webhookFormSchema),
      defaultValues: {
        method: WebhookMethod.POST,
        environment: WebhookEnvironment.PRODUCTION,
        priority: WebhookPriority.MEDIUM,
        contentType: WebhookContentType.JSON,
        timeout: 15_000,
        ...defaultValues,
      },
    },
    onUnsavedChanges: () => toast.info("Unsaved changes detected!"),
  });

  const handleSubmit = async (values: WebhookFormValues) => {
    await onSubmit(values);
  };

  const eventOptions = supportedEvents.map((event) => ({
    label: event.replace(/\./g, " ").toUpperCase(),
    value: event,
  }));

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Webhook" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for your webhook
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Webhook for handling property events..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional description of what this webhook does
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/webhook"
                  type="url"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The URL where webhook payloads will be sent
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HTTP Method</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(WebhookMethod).map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="environment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Environment</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(WebhookEnvironment).map((env) => (
                      <SelectItem key={env} value={env}>
                        {env.charAt(0).toUpperCase() + env.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(WebhookPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content Type</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(WebhookContentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="events"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Events</FormLabel>
              <FormControl>
                <MultiSelect
                  onValueChange={field.onChange}
                  options={eventOptions}
                  placeholder="Select events to listen to"
                  value={field.value || []}
                />
              </FormControl>
              <FormDescription>
                Select the events that will trigger this webhook
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeout (ms)</FormLabel>
              <FormControl>
                <Input
                  max={120_000}
                  min={1000}
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseInt(e.target.value, 10))
                  }
                />
              </FormControl>
              <FormDescription>
                Request timeout in milliseconds (1000-120000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" disabled={isLoading} type="submit">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
};
