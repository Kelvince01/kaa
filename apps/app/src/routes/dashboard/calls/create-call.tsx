"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
import { Switch } from "@kaa/ui/components/switch";
import { Textarea } from "@kaa/ui/components/textarea";
import { ArrowLeft, Video } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CallType, useCreateCall } from "@/modules/comms/video-calling";

const createCallSchema = z.object({
  type: z.enum(Object.values(CallType)),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  maxParticipants: z.number().min(2).max(50),
  isRecorded: z.boolean(),
  allowScreenShare: z.boolean(),
  allowRecording: z.boolean(),
  muteOnJoin: z.boolean(),
  videoOnJoin: z.boolean(),
  waitingRoom: z.boolean(),
  passcode: z.string().optional(),
  language: z.enum(["en", "sw"]),
});

type CreateCallFormData = z.infer<typeof createCallSchema>;

export default function CreateCall() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") as CallType | null;

  const { mutateAsync: createCall, isPending } = useCreateCall();

  const form = useForm<CreateCallFormData>({
    resolver: zodResolver(createCallSchema),
    defaultValues: {
      type: defaultType || CallType.SUPPORT_CALL,
      title: "",
      description: "",
      maxParticipants: 10,
      isRecorded: false,
      allowScreenShare: true,
      allowRecording: true,
      muteOnJoin: false,
      videoOnJoin: true,
      waitingRoom: false,
      language: "en",
    },
  });

  const onSubmit = async (data: CreateCallFormData) => {
    try {
      console.log(data);

      const call = await createCall({
        type: data.type,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt
          ? new Date(data.scheduledAt).toISOString()
          : undefined,
        maxParticipants: data.maxParticipants,
        isRecorded: data.isRecorded,
        settings: {
          allowScreenShare: data.allowScreenShare,
          allowRecording: data.allowRecording,
          muteOnJoin: data.muteOnJoin,
          videoOnJoin: data.videoOnJoin,
          waitingRoom: data.waitingRoom,
          passcode: data.passcode,
        },
        kenyaSpecific: {
          language: data.language,
          county: "Nairobi",
        },
      });

      router.push(`/dashboard/calls/${call.data._id}`);
    } catch (error) {
      console.error("Failed to create call:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/calls">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Create Video Call
          </h1>
          <p className="text-muted-foreground">
            Set up a new video call or property tour
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
          <CardDescription>
            Configure your video call settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Call Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Type</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select call type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="property_tour">
                          Property Tour
                        </SelectItem>
                        <SelectItem value="tenant_meeting">
                          Tenant Meeting
                        </SelectItem>
                        <SelectItem value="maintenance_call">
                          Maintenance Call
                        </SelectItem>
                        <SelectItem value="support_call">
                          Support Call
                        </SelectItem>
                        <SelectItem value="consultation">
                          Consultation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the type of video call
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Property Tour - 2BR Apartment"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your call a descriptive title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details about the call..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Scheduled Time */}
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty to start immediately
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Max Participants */}
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input
                        max={50}
                        min={2}
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of participants (2-50)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Call Settings</h3>

                <FormField
                  control={form.control}
                  name="isRecorded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Record Call</FormLabel>
                        <FormDescription>
                          Automatically record this call
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowScreenShare"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Screen Sharing
                        </FormLabel>
                        <FormDescription>
                          Participants can share their screen
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waitingRoom"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Waiting Room
                        </FormLabel>
                        <FormDescription>
                          Participants wait for host approval
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="muteOnJoin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Mute on Join
                        </FormLabel>
                        <FormDescription>
                          Participants join with microphone muted
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Language */}
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4">
                <Link href="/dashboard/calls">
                  <Button disabled={isPending} type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button disabled={isPending} type="submit">
                  {isPending ? (
                    "Creating..."
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Create Call
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
