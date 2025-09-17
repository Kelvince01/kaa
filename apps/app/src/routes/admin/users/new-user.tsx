"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
import { ChevronLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Define the validation schema with proper types
const validationSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    role: z.string(),
    sendInvite: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type UserFormSchema = z.infer<typeof validationSchema>;

const AdminNewUserClient = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // const createUserMutation = useMutation(trpc.admin.users.create.mutationOptions({
  // 	onSuccess: () => {
  // 		toast.success("User has been created successfully");
  // 		form.reset();
  // 	},
  // }));

  // Create formState variable to use in the validation schema
  const initialFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "tenant",
    sendInvite: true,
  };

  // Initialize the form with default values
  const form = useForm<UserFormSchema>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialFormValues,
  });

  const handleFormSubmit = async (_formValues: UserFormSchema) => {
    try {
      setIsSubmitting(true);

      // API call would go here
      // await axios.post('/admin/users', formValues);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success handling
      setSuccess(true);
      toast.success("User has been created successfully");
      form.reset();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <UserPlus className="mr-2 h-6 w-6 text-primary" />
          <h1 className="font-bold text-2xl">Add New User</h1>
        </div>
        <Link
          className="flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-200"
          href="/admin/users"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
          <span className="ml-2">Back to Users</span>
        </Link>
      </div>

      {success ? (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4">
          <div className="flex">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <div className="ml-3">
              <h3 className="font-medium text-green-800 text-sm">
                User created successfully
              </h3>
              <div className="mt-2 text-green-700 text-sm">
                <p>
                  The new user has been added to the system.
                  {form.getValues("sendInvite") &&
                    " An invitation email has been sent."}
                </p>
              </div>
              <div className="mt-4">
                <button
                  className="rounded-md bg-green-100 px-4 py-2 text-green-800 text-sm transition-colors hover:bg-green-200"
                  onClick={() => setSuccess(false)}
                  type="button"
                >
                  Add Another User
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="given-name"
                        id="firstName"
                        placeholder="Enter first name"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="family-name"
                        id="lastName"
                        placeholder="Enter last name"
                        required
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="email"
                        id="email"
                        placeholder="Enter email address"
                        required
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <FormControl>
                      <Select {...field} required>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="landlord">Landlord</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="new-password"
                        id="password"
                        placeholder="Enter password"
                        required
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="new-password"
                        id="confirmPassword"
                        placeholder="Confirm password"
                        required
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="sendInvite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          id="sendInvite"
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Send invitation email to this user
                        </FormLabel>
                        <FormDescription>
                          If checked, the user will receive an email with
                          instructions to set up their account.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <Link
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-200"
                href="/admin/users"
              >
                Cancel
              </Link>
              <button
                className={`rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/80 transition-colors${isSubmitting || !form.formState.isValid ? "cursor-not-allowed opacity-50" : ""}`}
                disabled={isSubmitting || !form.formState.isValid}
                type="submit"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default AdminNewUserClient;
