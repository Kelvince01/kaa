"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PropertyStatus } from "@kaa/models/types";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Avatar, AvatarFallback } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@kaa/ui/components/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Home,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import useDebounce from "@/hooks/use-debounce";
import { useProperties } from "@/modules/properties/property.queries";
import type { Property } from "@/modules/properties/property.type";
import { useUsers } from "@/modules/users/user.queries";
import type { User } from "@/modules/users/user.type";
import { useCreateConversation } from "../conversation.queries";

// Form validation schema
const conversationFormSchema = z.object({
  recipientId: z.string().min(1, "Please select a recipient"),
  propertyId: z.string().optional(),
  initialMessage: z
    .string()
    .max(500, "Message must be less than 500 characters")
    .optional(),
});

type ConversationFormValues = z.infer<typeof conversationFormSchema>;

type NewConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
  preselectedUserId?: string;
  preselectedPropertyId?: string;
};

export function NewConversationDialog({
  open,
  onOpenChange,
  onConversationCreated,
  preselectedUserId,
  preselectedPropertyId,
}: NewConversationDialogProps) {
  const createConversationMutation = useCreateConversation();

  // Search states
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [propertySearchOpen, setPropertySearchOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");

  // Debounced search values
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const debouncedPropertySearch = useDebounce(propertySearch, 300);

  // Selected items
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );

  // Form setup with validation
  const form = useForm<ConversationFormValues>({
    resolver: zodResolver(conversationFormSchema),
    defaultValues: {
      recipientId: preselectedUserId || "",
      propertyId: preselectedPropertyId || "",
      initialMessage: "",
    },
  });

  // Query users with search
  const { data: usersData, isLoading: isSearchingUsers } = useUsers({
    search: debouncedUserSearch,
    limit: 10,
    isActive: true,
  });

  // Query properties with search
  const { data: propertiesData, isLoading: isSearchingProperties } =
    useProperties({
      query: debouncedPropertySearch,
      limit: 10,
      status: PropertyStatus.ACTIVE,
    });

  // Handle form submission
  async function onSubmit(values: ConversationFormValues) {
    try {
      const result = await createConversationMutation.mutateAsync(values);
      if (result?.data?._id) {
        toast.success("Conversation started", {
          description: "You can now send messages to this user.",
        });
        onConversationCreated(result.data._id);
        form.reset();
        setSelectedUser(null);
        setSelectedProperty(null);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Failed to create conversation. Please try again.");
    }
  }

  // Get users and properties from API responses
  const users = usersData?.users || [];
  const properties = propertiesData?.properties || [];

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setSelectedUser(null);
          setSelectedProperty(null);
        }
        onOpenChange(open);
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>
            Connect with users and discuss property-related matters.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* User Selection with Search */}
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Recipient</FormLabel>
                  <Popover
                    onOpenChange={setUserSearchOpen}
                    open={userSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          aria-expanded={userSearchOpen}
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          role="combobox"
                          variant="outline"
                        >
                          {selectedUser ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs">
                                  {selectedUser.firstName[0]}
                                  {selectedUser.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {selectedUser.firstName} {selectedUser.lastName}
                              </span>
                              <Badge className="ml-2" variant="secondary">
                                {(selectedUser.role as { name: string }).name}
                              </Badge>
                            </div>
                          ) : (
                            <span>Select a user...</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0">
                      <Command>
                        <CommandInput
                          onValueChange={setUserSearch}
                          placeholder="Search users by name or email..."
                          value={userSearch}
                        />
                        <CommandEmpty>
                          {isSearchingUsers ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            "No users found."
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-[200px]">
                            {users.map((user) => (
                              <CommandItem
                                key={user.id}
                                onSelect={() => {
                                  setSelectedUser(user);
                                  form.setValue("recipientId", user.id);
                                  setUserSearchOpen(false);
                                }}
                                value={user.id}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === user.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <Avatar className="mr-2 h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {user.firstName[0]}
                                    {user.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {user.firstName} {user.lastName}
                                    </span>
                                    <Badge
                                      className="text-xs"
                                      variant="outline"
                                    >
                                      {(user.role as { name: string }).name}
                                    </Badge>
                                  </div>
                                  <span className="text-muted-foreground text-xs">
                                    {user.email}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the user you want to start a conversation with.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Property Selection with Search (Optional) */}
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Property
                    <Badge className="ml-2" variant="secondary">
                      Optional
                    </Badge>
                  </FormLabel>
                  <Popover
                    onOpenChange={setPropertySearchOpen}
                    open={propertySearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          aria-expanded={propertySearchOpen}
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          role="combobox"
                          variant="outline"
                        >
                          {selectedProperty ? (
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span className="truncate">
                                {selectedProperty.title}
                              </span>
                              <Badge className="ml-2" variant="secondary">
                                {selectedProperty.pricing.currency}{" "}
                                {selectedProperty.pricing.rent}/mo
                              </Badge>
                            </div>
                          ) : (
                            <span>Select a property (optional)...</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0">
                      <Command>
                        <CommandInput
                          onValueChange={setPropertySearch}
                          placeholder="Search properties..."
                          value={propertySearch}
                        />
                        <CommandEmpty>
                          {isSearchingProperties ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            "No properties found."
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-[200px]">
                            {selectedProperty && (
                              <CommandItem
                                onSelect={() => {
                                  setSelectedProperty(null);
                                  form.setValue("propertyId", "");
                                  setPropertySearchOpen(false);
                                }}
                                value="clear"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Clear selection
                              </CommandItem>
                            )}
                            {properties.map((property) => (
                              <CommandItem
                                key={property._id}
                                onSelect={() => {
                                  setSelectedProperty(property);
                                  form.setValue("propertyId", property._id);
                                  setPropertySearchOpen(false);
                                }}
                                value={property._id}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === property._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {property.title}
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                    <span>
                                      {property.location.address.line1},{" "}
                                      {property.location.address.town}
                                    </span>
                                    <span>•</span>
                                    <span className="font-medium">
                                      {property.pricing.currency}{" "}
                                      {property.pricing.rent}/mo
                                    </span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Link this conversation to a specific property for context.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Message with Character Count */}
            <FormField
              control={form.control}
              name="initialMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Initial Message
                    <Badge className="ml-2" variant="secondary">
                      Optional
                    </Badge>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        className="resize-none pr-12"
                        placeholder="Hi, I'm interested in..."
                        rows={4}
                        {...field}
                      />
                      <span
                        className={cn(
                          "absolute right-2 bottom-2 text-xs",
                          field.value && field.value.length > 450
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {field.value?.length || 0}/500
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Start the conversation with an optional opening message.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Display */}
            {createConversationMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to create conversation. Please try again.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                onClick={() => {
                  form.reset();
                  setSelectedUser(null);
                  setSelectedProperty(null);
                  onOpenChange(false);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={createConversationMutation.isPending}
                type="submit"
              >
                {createConversationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Start Conversation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
