"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kaa/ui/components/card";
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
import { Label } from "@kaa/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader2, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAmenityMetadata, useCreateAmenity } from "../amenity.queries";
import type { AmenityCategory, AmenityType, CreateAmenityRequest } from "../amenity.type";

interface CreateAmenityFormProps {
	initialData?: Partial<CreateAmenityRequest>;
	onSuccess?: (amenity: any) => void;
	onCancel?: () => void;
}

const createAmenitySchema = z.object({
	name: z.string().min(1, "Name is required").max(200, "Name too long"),
	type: z.string().min(1, "Type is required"),
	category: z.string().min(1, "Category is required"),
	description: z.string().optional(),
	location: z.object({
		country: z.string().default("Kenya"),
		county: z.string().min(1, "County is required"),
		constituency: z.string().optional(),
		ward: z.string().optional(),
		estate: z.string().optional(),
		address: z.object({
			line1: z.string().min(1, "Address line 1 is required"),
			line2: z.string().optional(),
			town: z.string().min(1, "Town is required"),
			postalCode: z.string().optional(),
		}),
		coordinates: z.object({
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180),
		}),
	}),
	contact: z
		.object({
			phone: z.string().optional(),
			email: z.string().email().optional().or(z.literal("")),
			website: z.string().url().optional().or(z.literal("")),
		})
		.optional(),
	operatingHours: z
		.object({
			monday: z.string().optional(),
			tuesday: z.string().optional(),
			wednesday: z.string().optional(),
			thursday: z.string().optional(),
			friday: z.string().optional(),
			saturday: z.string().optional(),
			sunday: z.string().optional(),
		})
		.optional(),
	tags: z.array(z.string()).optional(),
});

type CreateAmenityFormData = z.infer<typeof createAmenitySchema>;

export function CreateAmenityForm({ initialData, onSuccess, onCancel }: CreateAmenityFormProps) {
	const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
	const [locationLoading, setLocationLoading] = useState(false);

	const { data: metadata } = useAmenityMetadata();
	const createMutation = useCreateAmenity();

	const form = useForm<CreateAmenityFormData>({
		resolver: zodResolver(createAmenitySchema),
		defaultValues: {
			location: {
				country: "Kenya",
				county: "",
				address: {
					line1: "",
					town: "",
				},
				coordinates: {
					latitude: 0,
					longitude: 0,
				},
			},
			contact: {},
			operatingHours: {},
			tags: [],
			...initialData,
		},
	});

	const selectedCategory = form.watch("category");
	const availableTypes = metadata?.categoryTypeMapping[selectedCategory as AmenityCategory] || [];

	const getCurrentLocation = () => {
		setLocationLoading(true);

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setCurrentLocation({ lat: latitude, lng: longitude });
					form.setValue("location.coordinates.latitude", latitude);
					form.setValue("location.coordinates.longitude", longitude);
					setLocationLoading(false);
				},
				(error) => {
					console.error("Error getting location:", error);
					setLocationLoading(false);
				}
			);
		} else {
			setLocationLoading(false);
		}
	};

	const onSubmit = async (data: CreateAmenityFormData) => {
		try {
			const result = await createMutation.mutateAsync(data);
			onSuccess?.(result);
			form.reset();
		} catch (error) {
			// Error handled by mutation
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<Plus className="h-5 w-5" />
					<span>Add New Amenity</span>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Basic Information */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name *</FormLabel>
										<FormControl>
											<Input placeholder="e.g., Nairobi Hospital" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category *</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{metadata?.categories.map((category) => (
													<SelectItem key={category} value={category}>
														{category.charAt(0).toUpperCase() + category.slice(1)}
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
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Type *</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={!selectedCategory}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{availableTypes.map((type) => (
													<SelectItem key={type} value={type}>
														{type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Brief description of the amenity"
												rows={3}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Location Information */}
						<div className="space-y-4">
							<h3 className="font-medium text-lg">Location Information</h3>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="location.county"
									render={({ field }) => (
										<FormItem>
											<FormLabel>County *</FormLabel>
											<FormControl>
												<Input placeholder="e.g., Nairobi" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="location.ward"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ward</FormLabel>
											<FormControl>
												<Input placeholder="e.g., Westlands" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="location.address.line1"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Address Line 1 *</FormLabel>
											<FormControl>
												<Input placeholder="e.g., Kimathi Street" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="location.address.town"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Town *</FormLabel>
											<FormControl>
												<Input placeholder="e.g., Nairobi" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Coordinates */}
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>Coordinates *</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={getCurrentLocation}
										disabled={locationLoading}
									>
										{locationLoading ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<MapPin className="mr-2 h-4 w-4" />
										)}
										Use Current Location
									</Button>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="location.coordinates.latitude"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Latitude</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="any"
														placeholder="-1.2921"
														{...field}
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="location.coordinates.longitude"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Longitude</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="any"
														placeholder="36.8219"
														{...field}
														onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
						</div>

						{/* Contact Information */}
						<div className="space-y-4">
							<h3 className="font-medium text-lg">Contact Information (Optional)</h3>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<FormField
									control={form.control}
									name="contact.phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone</FormLabel>
											<FormControl>
												<Input placeholder="+254-20-1234567" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="contact.email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input type="email" placeholder="info@example.com" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="contact.website"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Website</FormLabel>
											<FormControl>
												<Input type="url" placeholder="https://example.com" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Operating Hours */}
						<div className="space-y-4">
							<h3 className="font-medium text-lg">Operating Hours (Optional)</h3>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								{["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
									(day) => (
										<FormField
											key={day}
											control={form.control}
											name={`operatingHours.${day}` as any}
											render={({ field }) => (
												<FormItem>
													<FormLabel className="capitalize">{day}</FormLabel>
													<FormControl>
														<Input placeholder="e.g., 9:00 AM - 5:00 PM or Closed" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)
								)}
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end space-x-4">
							{onCancel && (
								<Button type="button" variant="outline" onClick={onCancel}>
									Cancel
								</Button>
							)}
							<Button
								type="submit"
								disabled={createMutation.isPending}
								className="bg-blue-600 hover:bg-blue-700"
							>
								{createMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Create Amenity
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
