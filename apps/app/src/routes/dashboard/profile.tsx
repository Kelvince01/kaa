"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { PhoneInput } from "@kaa/ui/components/extensions/phone-input";
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
  Edit2,
  Lock,
  Mail,
  MapPin,
  Save,
  Upload,
  UserIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import SelectCountry from "@/components/common/form-fields/select-country";
import SelectCounty from "@/components/common/form-fields/select-county";
import { useAuthStore } from "@/modules/auth";
import { useUploadAvatar } from "@/modules/auth/auth.queries";
import { useChangePassword, useUpdateUser } from "@/modules/users/user.queries";

// Validation schemas
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z
    .object({
      line1: z.string().optional(),
      town: z.string().optional(),
      postalCode: z.string().optional(),
      county: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

const ProfileContainer = () => {
  const { user, isAuthenticated, isLoading: loading } = useAuthStore();
  const uploadAvatarMutation = useUploadAvatar();
  const changePasswordMutation = useChangePassword();
  const updateUserMutation = useUpdateUser();

  const [editMode, setEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form setup
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: {
        line1: "",
        town: "",
        postalCode: "",
        county: "",
        country: "",
      },
    },
  });

  // Password form setup
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: {
          line1: user.address?.line1 || "",
          town: user.address?.town || "",
          postalCode: user.address?.postalCode || "",
          county: user.address?.county || "",
          country: user.address?.country || "",
        },
      });
    }
  }, [user, profileForm]);

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormData) => {
    updateUserMutation.mutate(
      {
        id: user?.id || "",
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: {
            line1: data.address?.line1 || "",
            town: data.address?.town || "",
            postalCode: data.address?.postalCode || "",
            county: data.address?.county || "",
            country: data.address?.country || "",
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
          setEditMode(false);
        },
        onError: (error: any) => {
          console.error("Error updating profile:", error);
          toast.error("Failed to update profile");
        },
      }
    );
  };

  // Handle password form submission
  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          toast.success("Password updated successfully");
          passwordForm.reset();
        },
        onError: (error: any) => {
          console.error("Error updating password:", error);
          toast.error("Failed to update password");
        },
      }
    );
  };

  // Handle profile image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, WEBP)");
      return;
    }

    await uploadAvatarMutation.mutate(file, {
      onSuccess: () => {
        toast.success("Profile image updated successfully");
      },
      onError: (error: any) => {
        console.error("Error uploading profile image:", error);
        toast.error("Failed to upload profile image");
      },
    });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode && user) {
      // Reset form when entering edit mode
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: {
          line1: user.address?.line1 || "",
          town: user.address?.town || "",
          postalCode: user.address?.postalCode || "",
          county: user.address?.county || "",
          country: user.address?.country || "",
        },
      });
    }
  };

  // Show loading state
  if (loading || !(isAuthenticated || loading)) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 w-full rounded-lg bg-gray-200" />
        <div className="h-64 w-full rounded-lg bg-gray-200" />
      </div>
    );
  }

  // Get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "tenant":
        return "Tenant";
      case "landlord":
        return "Landlord";
      case "admin":
        return "Administrator";
      default:
        return role;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Profile Information Card */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button onClick={toggleEditMode} size="sm" variant="outline">
                {editMode ? (
                  <>
                    <X className="-ml-1 mr-2 h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="-ml-1 mr-2 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                className="space-y-6"
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* First Name */}
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <UserIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              {...field}
                              className="pl-10"
                              disabled={!editMode}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Last Name */}
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <UserIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              {...field}
                              className="pl-10"
                              disabled={!editMode}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email (read-only) */}
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          className="bg-gray-50 pl-10"
                          disabled={true}
                          type="email"
                          value={user?.email || ""}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Email cannot be changed</FormDescription>
                  </FormItem>

                  {/* Phone */}
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <PhoneInput
                            {...field}
                            defaultCountry="KE"
                            disabled={!editMode}
                            international
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Type (read-only) */}
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-gray-50"
                        disabled={true}
                        type="text"
                        value={getRoleDisplay(
                          (user?.role as { name: string })?.name || ""
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      Contact support to change account type
                    </FormDescription>
                  </FormItem>
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                  <h3 className="flex items-center font-medium text-gray-800">
                    <MapPin className="mr-2 h-5 w-5" />
                    Address Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Street Address */}
                    <div className="md:col-span-2">
                      <FormField
                        control={profileForm.control}
                        name="address.line1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!editMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Town */}
                    <FormField
                      control={profileForm.control}
                      name="address.town"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Town</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!editMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Postal Code */}
                    <FormField
                      control={profileForm.control}
                      name="address.postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!editMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country */}
                    <FormField
                      control={profileForm.control}
                      name="address.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <SelectCountry {...field} disabled={!editMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* County */}
                    <FormField
                      control={profileForm.control}
                      name="address.county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County</FormLabel>
                          <FormControl>
                            <SelectCounty {...field} disabled={!editMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Save Button */}
                {editMode && (
                  <div className="flex justify-end">
                    <Button
                      disabled={updateUserMutation.isPending}
                      type="submit"
                    >
                      {updateUserMutation.isPending ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="-ml-1 mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Profile Image and Password Change */}
      <div className="space-y-6">
        {/* Profile Image */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-gray-200">
                {user?.avatar ? (
                  <Image
                    alt={`${user.firstName} ${user.lastName}`}
                    className="object-cover"
                    fill
                    src={user.avatar}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <UserIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              <Input
                accept="image/jpeg, image/png"
                className="hidden"
                onChange={handleImageUpload}
                ref={fileInputRef}
                type="file"
              />

              <Button
                disabled={uploadAvatarMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                {uploadAvatarMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="-ml-1 mr-2 h-4 w-4" />
                    Upload New Picture
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form
                className="space-y-4"
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              >
                {/* Current Password */}
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input type="password" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Password */}
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input type="password" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input type="password" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    className="w-full"
                    disabled={changePasswordMutation.isPending}
                    type="submit"
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileContainer;
