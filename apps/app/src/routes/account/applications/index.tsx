"use client";

import { AlertCircle, Filter, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type Application,
  ApplicationStatus,
  TimelineEventStatus,
} from "@/modules/applications/application.type";
import ApplicationTracker from "@/modules/applications/components/application-tracker";

export enum DocumentStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
  EXPIRED = "expired",
  ERROR = "error",
  NOT_STARTED = "not_started",
}

export enum DocumentCategory {
  GENERAL = "general",
  IDENTITY = "identity",
  ADDRESS = "address",
  INCOME = "income",
  REFERENCE = "reference",
  OTHER = "other",
}

const Applications = () => {
  // const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    timeframe: "all",
  });

  // Mock application data
  const mockApplications: Application[] = [
    {
      _id: "app-1",
      property: {
        _id: "prop-1",
        memberId: "prop-1",
        title: "2 Bedroom Apartment in Hackney",
        description: "Modern apartment in the heart of Hackney",
        // location: "Hackney, London",
        location: {
          country: "United Kingdom",
          county: "",
          constituency: "",
          address: {
            line1: "123 Hackney Road",
            town: "London",
            postalCode: "E8 3SA",
          },
        },
        pricing: {
          rentAmount: 1800,
          securityDeposit: 1800,
          currency: "KES",
          paymentFrequency: "monthly",
          utilitiesIncluded: [],
          negotiable: false,
        },
        details: {
          bedrooms: 2,
          bathrooms: 1,
          furnished: true,
          petsAllowed: false,
        },
        amenities: [],
        type: "apartment",
        available: true,
        availableFrom: "2025-04-01",
        media: {
          photos: [
            { url: "/images/property1.jpg", isPrimary: true },
            { url: "/images/property1-2.jpg", isPrimary: false },
          ],
        },
        features: ["Balcony", "Washing Machine", "Dishwasher"],
        landlord: {
          _id: "landlord-1",
          memberId: "prop-1",
          firstName: "James",
          lastName: "Wilson",
          email: "james@example.com",
          role: "landlord",
          createdAt: "2025-01-01T00:00:00",
          updatedAt: "2025-01-01T00:00:00",
          isVerified: true,
          emailVerified: true,
          phoneVerified: true,
          status: "active",
        },
        // contactName: "James Wilson",
        // contactPhone: "07123456789",
        geolocation: {
          type: "Point",
          coordinates: [51.545, -0.055],
        },
        status: "active",
        createdAt: "2025-03-01T00:00:00",
        updatedAt: "2025-03-01T00:00:00",
      },
      tenant: {
        _id: "user-tenant-1",
        memberId: "prop-1",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "07700900001",
        password: "",
        role: "tenant",
        createdAt: "2025-01-01T00:00:00",
        updatedAt: "2025-01-01T00:00:00",
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
        status: "active",
      },
      status: ApplicationStatus.submitted,
      appliedAt: "2025-03-28T10:30:00",
      moveInDate: "2025-04-15",
      offerAmount: 1500,
      notes: "First-time renter with good references",
      timeline: [
        {
          title: "Application Submitted",
          description:
            "Your application has been successfully submitted and is pending review.",
          date: "2025-03-28T10:30:00",
          status: TimelineEventStatus.COMPLETED,
          actor: "tenant",
        },
        {
          title: "Documents Uploaded",
          description:
            "Proof of ID, proof of address, and employment reference details provided.",
          date: "2025-03-28T10:25:00",
          status: TimelineEventStatus.COMPLETED,
          actor: "tenant",
        },
        {
          title: "Application Started",
          description: "You started your application for this property.",
          date: "2025-03-28T09:45:00",
          status: TimelineEventStatus.COMPLETED,
          actor: "tenant",
        },
      ],
      documents: [
        {
          _id: "doc-1",
          name: "Proof of ID",
          status: DocumentStatus.VERIFIED,
          uploadedAt: "2025-03-28T10:10:00",
          user: {
            _id: "user-1",
            memberId: "prop-1",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            phone: "07700900001",
            password: "",
            role: "tenant",
            createdAt: "2025-01-01T00:00:00",
            updatedAt: "2025-01-01T00:00:00",
            isVerified: true,
            emailVerified: true,
            phoneVerified: true,
            status: "active",
          },
          type: DocumentCategory.IDENTITY,
          category: DocumentCategory.IDENTITY,
          file: "/docs/id.pdf",
          mimeType: "application/pdf",
          size: 1_024_000,
        },
        {
          _id: "doc-2",
          name: "Proof of Address",
          status: DocumentStatus.VERIFIED,
          uploadedAt: "2025-03-28T10:15:00",
          user: {
            _id: "user-1",
            memberId: "prop-1",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            phone: "07700900001",
            password: "",
            role: "tenant",
            createdAt: "2025-01-01T00:00:00",
            updatedAt: "2025-01-01T00:00:00",
            isVerified: true,
            emailVerified: true,
            phoneVerified: true,
            status: "active",
          },
          type: DocumentCategory.ADDRESS,
          category: DocumentCategory.ADDRESS,
          file: "/docs/address.pdf",
          mimeType: "application/pdf",
          size: 824_000,
        },
        {
          _id: "doc-3",
          name: "Employment Reference",
          status: DocumentStatus.PENDING,
          uploadedAt: "2025-03-28T10:20:00",
          user: {
            _id: "user-1",
            memberId: "prop-1",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            phone: "07700900001",
            password: "",
            role: "tenant",
            createdAt: "2025-01-01T00:00:00",
            updatedAt: "2025-01-01T00:00:00",
            isVerified: true,
            emailVerified: true,
            phoneVerified: true,
            status: "active",
          },
          type: DocumentCategory.REFERENCE,
          category: DocumentCategory.REFERENCE,
          file: "/docs/employment.pdf",
          mimeType: "application/pdf",
          size: 724_000,
        },
      ],
      messages: [
        {
          _id: "msg-1",
          sender: {
            _id: "system",
            memberId: "prop-1",
            firstName: "System",
            lastName: "System",
            email: "system@example.com",
            phone: "07700900001",
            password: "",
            role: "admin",
            createdAt: "2025-01-01T00:00:00",
            updatedAt: "2025-01-01T00:00:00",
            isVerified: true,
            emailVerified: true,
            phoneVerified: true,
            status: "active",
          },
          receiver: {
            _id: "user-tenant-1",
            memberId: "prop-1",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            phone: "07700900001",
            password: "",
            role: "tenant",
            createdAt: "2025-01-01T00:00:00",
            updatedAt: "2025-01-01T00:00:00",
            isVerified: true,
            emailVerified: true,
            phoneVerified: true,
            status: "active",
          },
          content:
            "Your application has been received and is being processed. You will be notified once there is an update.",
          isRead: false,
          createdAt: "2025-03-28T10:35:00",
          updatedAt: "2025-03-28T10:35:00",
        },
        {
          _id: "msg-2",
          sender: {
            _id: "system",
            memberId: "prop-1",
            firstName: "System",
            lastName: "System",
            email: "system@example.com",
            phone: "07700900001",
            password: "",
            role: "admin",
            createdAt: "2025-01-01T00:00:00",
            updatedAt: "2025-01-01T00:00:00",
            isVerified: true,
            emailVerified: true,
            phoneVerified: true,
            status: "active",
          },
          receiver: {
            _id: "user-tenant-1",
            memberId: "prop-1",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            phone: "07700900001",
            password: "",
            role: "tenant",
            createdAt: "2025-01-01T00:00:00",
            updatedAt: "2025-01-01T00:00:00",
            isVerified: true,
            emailVerified: true,
            phoneVerified: true,
            status: "active",
          },
          content:
            "We have received all your required documents. Thank you for providing this information promptly.",
          isRead: true,
          createdAt: "2025-03-28T10:25:00",
          updatedAt: "2025-03-28T10:25:00",
        },
      ],
      createdAt: "2025-03-28T09:45:00",
      // updatedAt: "2025-03-28T10:35:00",
    },
    /*{
			_id: "app-2",
			property: {
				_id: "prop-2",
				title: "1 Bedroom Flat in Camden",
				description: "Charming flat in Camden area",
				price: 1500,
				location: "Camden, London",
				bedrooms: 1,
				bathrooms: 1,
				propertyType: "flat",
				furnished: true,
				available: true,
				availableFrom: "2025-04-15",
				deposit: 1725,
				images: ["/images/property2.jpg", "/images/property2-2.jpg"],
				features: ["High Ceilings", "Wooden Floors", "Large Windows"],
				landlord: {
					_id: "landlord-2",
					firstName: "Sarah",
					lastName: "Johnson",
					email: "sarah@example.com",
					role: "landlord",
					createdAt: "2025-01-01T00:00:00",
					updatedAt: "2025-01-01T00:00:00",
					isVerified: true,
					emailVerified: true,
					phoneVerified: true,
					status: "active",
				},
				contactName: "Sarah Johnson",
				contactPhone: "07234567890",
				rentPeriod: "month",
				geolocation: {
					type: "Point",
					coordinates: [51.539, -0.142],
				},
				status: "active",
				createdAt: "2025-03-01T00:00:00",
				updatedAt: "2025-03-01T00:00:00",
				address: {
					line1: "45 Camden High Street",
					town: "London",
					postalCode: "NW1 7JH",
					country: "United Kingdom",
				},
				petsAllowed: true,
			},
			tenant: {
				_id: "user-tenant-1",
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "07700900001",
				password: "",
				role: "tenant",
				createdAt: "2025-01-01T00:00:00",
				updatedAt: "2025-01-01T00:00:00",
				isVerified: true,
				emailVerified: true,
				phoneVerified: true,
				status: "active",
			},
			status: "in_review",
			appliedAt: "2025-03-25T14:20:00",
			moveInDate: "2025-04-15",
			offerAmount: 1200,
			notes: "Looking for a 12-month lease minimum",
			timeline: [
				{
					title: "Application Under Review",
					description: "Your application is currently being reviewed by our team.",
					date: "2025-03-26T09:15:00",
					status: "in_progress",
				},
				{
					title: "Reference Checks Started",
					description: "We have begun contacting your references for verification.",
					date: "2025-03-26T09:10:00",
					status: "in_progress",
				},
				{
					title: "Application Submitted",
					description: "Your application has been successfully submitted and is pending review.",
					date: "2025-03-25T14:20:00",
					status: "completed",
				},
			],
			documents: [
				{
					_id: "doc-4",
					name: "Proof of ID",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-03-25T14:00:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.IDENTITY,
					category: DocumentCategory.IDENTITY,
					file: "/docs/id2.pdf",
					mimeType: "application/pdf",
					size: 924000,
				},
				{
					_id: "doc-5",
					name: "Proof of Address",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-03-25T14:05:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.ADDRESS,
					category: DocumentCategory.ADDRESS,
					file: "/docs/address2.pdf",
					mimeType: "application/pdf",
					size: 624000,
				},
				{
					_id: "doc-6",
					name: "Employment Reference",
					status: DocumentStatus.PENDING,
					uploadedAt: "2025-03-25T14:10:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.REFERENCE,
					category: DocumentCategory.REFERENCE,
					file: "/docs/employment2.pdf",
					mimeType: "application/pdf",
					size: 524000,
				},
				{
					_id: "doc-7",
					name: "Previous Landlord Reference",
					status: DocumentStatus.PENDING,
					uploadedAt: "2025-03-25T14:15:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.REFERENCE,
					category: DocumentCategory.REFERENCE,
					file: "/docs/landlord_ref.pdf",
					mimeType: "application/pdf",
					size: 424000,
				},
			],
			messages: [
				{
					_id: "msg-3",
					sender: {
						_id: "system",
						firstName: "System",
						lastName: "System",
						email: "system@example.com",
						phone: "07700900001",
						password: "",
						role: "admin",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					receiver: {
						_id: "user-tenant-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					content:
						"We are currently checking your references. This process typically takes 3-5 business days.",
					isRead: false,
					createdAt: "2025-03-26T09:20:00",
					updatedAt: "2025-03-26T09:20:00",
				},
				{
					_id: "msg-4",
					sender: {
						_id: "system",
						firstName: "System",
						lastName: "System",
						email: "system@example.com",
						phone: "07700900001",
						password: "",
						role: "admin",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					receiver: {
						_id: "user-tenant-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					content: "Your application has been moved to the review stage.",
					isRead: true,
					createdAt: "2025-03-26T09:15:00",
					updatedAt: "2025-03-26T09:15:00",
				},
			],
			createdAt: "2025-03-25T14:00:00",
			updatedAt: "2025-03-26T09:20:00",
		},
		{
			_id: "app-3",
			property: {
				_id: "prop-3",
				title: "3 Bedroom House in Greenwich",
				description: "Spacious family home with garden",
				price: 2500,
				location: "Greenwich, London",
				bedrooms: 3,
				bathrooms: 2,
				propertyType: "house",
				furnished: false,
				available: true,
				availableFrom: "2025-05-01",
				deposit: 2875,
				images: ["/images/property3.jpg", "/images/property3-2.jpg"],
				features: ["Garden", "Garage", "Modern Kitchen"],
				landlord: {
					_id: "landlord-3",
					firstName: "Michael",
					lastName: "Brown",
					email: "michael@example.com",
					phone: "07345678901",
					password: "",
					role: "landlord",
					createdAt: "2025-01-01T00:00:00",
					updatedAt: "2025-01-01T00:00:00",
					isVerified: true,
					emailVerified: true,
					phoneVerified: true,
					status: "active",
				},
				contactName: "Michael Brown",
				contactPhone: "07345678901",
				rentPeriod: "month",
				geolocation: {
					type: "Point",
					coordinates: [51.483, -0.004],
				},
				status: "active",
				createdAt: "2025-02-01T00:00:00",
				updatedAt: "2025-02-01T00:00:00",
				address: {
					line1: "89 Greenwich High Road",
					town: "London",
					postalCode: "SE10 8JL",
					country: "United Kingdom",
				},
				petsAllowed: true,
			},
			tenant: {
				_id: "user-tenant-1",
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "07700900001",
				password: "",
				role: "tenant",
				createdAt: "2025-01-01T00:00:00",
				updatedAt: "2025-01-01T00:00:00",
				isVerified: true,
				emailVerified: true,
				phoneVerified: true,
				status: "active",
			},
			status: "approved",
			appliedAt: "2025-03-15T11:40:00",
			moveInDate: "2025-04-15",
			offerAmount: 2500,
			notes: "Family with two children looking for long-term rental",
			timeline: [
				{
					title: "Application Approved",
					description: "Congratulations! Your application has been approved by the landlord.",
					date: "2025-03-20T15:30:00",
					status: "completed",
				},
				{
					title: "Landlord Review",
					description: "Your application is being reviewed by the landlord.",
					date: "2025-03-18T10:20:00",
					status: "in_progress",
				},
				{
					title: "Reference Checks Completed",
					description: "All your references have been verified successfully.",
					date: "2025-03-17T14:15:00",
					status: "completed",
				},
				{
					title: "Application Submitted",
					description: "Your application has been successfully submitted and is pending review.",
					date: "2025-03-15T11:40:00",
					status: "completed",
				},
			],
			documents: [
				{
					_id: "doc-8",
					name: "Proof of ID",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-03-15T11:20:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.IDENTITY,
					category: DocumentCategory.IDENTITY,
					file: "/docs/passport.pdf",
					mimeType: "application/pdf",
					size: 1124000,
				},
				{
					_id: "doc-9",
					name: "Proof of Address",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-03-15T11:25:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.ADDRESS,
					category: DocumentCategory.ADDRESS,
					file: "/docs/utility.pdf",
					mimeType: "application/pdf",
					size: 724000,
				},
				{
					_id: "doc-10",
					name: "Employment Reference",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-03-15T11:30:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.REFERENCE,
					category: DocumentCategory.REFERENCE,
					file: "/docs/emp_ref.pdf",
					mimeType: "application/pdf",
					size: 524000,
				},
				{
					_id: "doc-11",
					name: "Previous Landlord Reference",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-03-15T11:35:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.REFERENCE,
					category: DocumentCategory.REFERENCE,
					file: "/docs/landlord_ref.pdf",
					mimeType: "application/pdf",
					size: 624000,
				},
			],
			messages: [
				{
					_id: "msg-5",
					sender: {
						_id: "admin",
						firstName: "Admin",
						lastName: "Admin",
						email: "admin@example.com",
						phone: "07700900001",
						password: "",
						role: "admin",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					receiver: {
						_id: "user-tenant-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					content:
						"Congratulations! Your application has been approved. Please log in to review and sign the tenancy agreement.",
					isRead: false,
					createdAt: "2025-03-20T15:35:00",
					updatedAt: "2025-03-20T15:35:00",
				},
				{
					_id: "msg-6",
					sender: {
						_id: "admin",
						firstName: "Admin",
						lastName: "Admin",
						email: "admin@example.com",
						phone: "07700900001",
						password: "",
						role: "admin",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					receiver: {
						_id: "user-tenant-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					content:
						"All your references have been verified. Your application is now with the landlord for final approval.",
					isRead: true,
					createdAt: "2025-03-17T14:20:00",
					updatedAt: "2025-03-17T14:20:00",
				},
			],
			createdAt: "2025-03-15T11:20:00",
			updatedAt: "2025-03-20T15:35:00",
		},
		{
			_id: "app-4",
			property: {
				_id: "prop-4",
				title: "Studio Flat in Shoreditch",
				description: "Modern studio apartment in trendy Shoreditch",
				price: 1300,
				location: "Shoreditch, London",
				bedrooms: 0,
				bathrooms: 1,
				propertyType: "studio",
				furnished: true,
				available: true,
				availableFrom: "2025-04-10",
				deposit: 1495,
				images: ["/images/property4.jpg", "/images/property4-2.jpg"],
				features: ["Open-plan Kitchen", "Large Windows", "Great Location"],
				landlord: {
					_id: "landlord-4",
					firstName: "Emma",
					lastName: "Taylor",
					email: "emma@example.com",
					role: "landlord",
					createdAt: "2025-01-01T00:00:00",
					updatedAt: "2025-01-01T00:00:00",
					isVerified: true,
					emailVerified: true,
					phoneVerified: true,
					status: "active",
				},
				contactName: "Emma Taylor",
				contactPhone: "07456789012",
				rentPeriod: "month",
				geolocation: {
					type: "Point",
					coordinates: [51.523, -0.077],
				},
				status: "active",
				createdAt: "2025-02-10T00:00:00",
				updatedAt: "2025-02-10T00:00:00",
				address: {
					line1: "12 Shoreditch High Street",
					town: "London",
					postalCode: "E1 6PG",
					country: "United Kingdom",
				},
				petsAllowed: false,
			},
			tenant: {
				_id: "user-tenant-1",
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "07700900001",
				password: "",
				role: "tenant",
				createdAt: "2025-01-01T00:00:00",
				updatedAt: "2025-01-01T00:00:00",
				isVerified: true,
				emailVerified: true,
				phoneVerified: true,
				status: "active",
			},
			status: "rejected",
			appliedAt: "2025-03-10T09:30:00",
			moveInDate: "2025-04-01",
			offerAmount: 1100,
			notes: "First-time renter in London",
			timeline: [
				{
					title: "Application Declined",
					description:
						"Unfortunately, your application was not successful. Please see the message for more details.",
					date: "2025-03-13T16:45:00",
					status: "completed",
				},
				{
					title: "Reference Check Issue",
					description: "There was an issue verifying one of your references.",
					date: "2025-03-12T14:30:00",
					status: "warning",
				},
				{
					title: "Application Submitted",
					description: "Your application has been successfully submitted and is pending review.",
					date: "2025-03-10T09:30:00",
					status: "completed",
				},
			],
			documents: [
				{
					_id: "doc-12",
					name: "Proof of ID",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-03-10T09:10:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.IDENTITY,
					category: DocumentCategory.IDENTITY,
					file: "/docs/passport2.pdf",
					mimeType: "application/pdf",
					size: 924000,
				},
				{
					_id: "doc-13",
					name: "Proof of Address",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-03-10T09:15:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.ADDRESS,
					category: DocumentCategory.ADDRESS,
					file: "/docs/bank.pdf",
					mimeType: "application/pdf",
					size: 824000,
				},
				{
					_id: "doc-14",
					name: "Employment Reference",
					status: DocumentStatus.REJECTED,
					uploadedAt: "2025-03-10T09:20:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.REFERENCE,
					category: DocumentCategory.REFERENCE,
					file: "/docs/emp_ref2.pdf",
					mimeType: "application/pdf",
					size: 524000,
					rejectionReason: "Unable to verify employment details",
				},
			],
			messages: [
				{
					_id: "msg-7",
					sender: {
						_id: "admin",
						firstName: "Admin",
						lastName: "Admin",
						email: "admin@example.com",
						phone: "07700900001",
						password: "",
						role: "admin",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					receiver: {
						_id: "user-tenant-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					content:
						"We regret to inform you that your application was not successful. This was due to issues with the employment reference provided. You are welcome to apply for other properties on our platform.",
					isRead: true,
					createdAt: "2025-03-13T16:50:00",
					updatedAt: "2025-03-13T16:50:00",
				},
				{
					_id: "msg-8",
					sender: {
						_id: "admin",
						firstName: "Admin",
						lastName: "Admin",
						email: "admin@example.com",
						phone: "07700900001",
						password: "",
						role: "admin",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					receiver: {
						_id: "user-tenant-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					content:
						"We are having difficulties verifying your employment reference. Could you please provide alternative contact details?",
					isRead: true,
					createdAt: "2025-03-12T14:35:00",
					updatedAt: "2025-03-12T14:35:00",
				},
			],
			createdAt: "2025-03-10T09:00:00",
			updatedAt: "2025-03-13T16:50:00",
		},
		{
			_id: "app-5",
			property: {
				_id: "prop-5",
				title: "2 Bedroom Flat in Islington",
				description: "Beautiful flat in the heart of Islington",
				price: 1900,
				location: "Islington, London",
				bedrooms: 2,
				bathrooms: 1,
				propertyType: "flat",
				furnished: true,
				available: false,
				availableFrom: "2025-03-01",
				deposit: 2185,
				images: ["/images/property5.jpg", "/images/property5-2.jpg"],
				features: ["Close to Transport", "Renovated Kitchen", "Private Parking"],
				landlord: {
					_id: "landlord-5",
					firstName: "David",
					lastName: "Clark",
					email: "david@example.com",
					role: "landlord",
					createdAt: "2025-01-01T00:00:00",
					updatedAt: "2025-01-01T00:00:00",
					isVerified: true,
					emailVerified: true,
					phoneVerified: true,
					status: "active",
				},
				contactName: "David Clark",
				contactPhone: "07567890123",
				rentPeriod: "month",
				geolocation: {
					type: "Point",
					coordinates: [51.536, -0.103],
				},
				status: "active",
				createdAt: "2025-01-15T00:00:00",
				updatedAt: "2025-02-28T10:00:00",
				address: {
					line1: "34 Upper Street",
					town: "London",
					postalCode: "N1 0PN",
					country: "United Kingdom",
				},
				petsAllowed: true,
			},
			tenant: {
				_id: "user-tenant-1",
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "07700900001",
				password: "",
				role: "tenant",
				createdAt: "2025-01-01T00:00:00",
				updatedAt: "2025-01-01T00:00:00",
				isVerified: true,
				emailVerified: true,
				phoneVerified: true,
				status: "active",
			},
			status: "approved",
			appliedAt: "2025-02-20T13:15:00",
			moveInDate: "2025-03-15",
			offerAmount: 1800,
			notes: "Looking for long-term tenancy",
			timeline: [
				{
					title: "Contract Signed",
					description: "You have successfully signed the tenancy agreement.",
					date: "2025-02-28T10:00:00",
					status: "completed",
				},
				{
					title: "Application Approved",
					description: "Congratulations! Your application has been approved by the landlord.",
					date: "2025-02-25T14:20:00",
					status: "completed",
				},
				{
					title: "Reference Checks Completed",
					description: "All your references have been verified successfully.",
					date: "2025-02-23T11:30:00",
					status: "completed",
				},
				{
					title: "Application Submitted",
					description: "Your application has been successfully submitted and is pending review.",
					date: "2025-02-20T13:15:00",
					status: "completed",
				},
			],
			documents: [
				{
					_id: "doc-15",
					name: "Proof of ID",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-02-20T13:00:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.IDENTITY,
					category: DocumentCategory.IDENTITY,
					file: "/docs/passport3.pdf",
					mimeType: "application/pdf",
					size: 1024000,
				},
				{
					_id: "doc-16",
					name: "Proof of Address",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-02-20T13:05:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.ADDRESS,
					category: DocumentCategory.ADDRESS,
					file: "/docs/utility2.pdf",
					mimeType: "application/pdf",
					size: 824000,
				},
				{
					_id: "doc-17",
					name: "Employment Reference",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-02-20T13:10:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.REFERENCE,
					category: DocumentCategory.REFERENCE,
					file: "/docs/emp_ref3.pdf",
					mimeType: "application/pdf",
					size: 624000,
				},
				{
					_id: "doc-18",
					name: "Signed Tenancy Agreement",
					status: DocumentStatus.VERIFIED,
					uploadedAt: "2025-02-28T10:00:00",
					user: {
						_id: "user-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					type: DocumentCategory.OTHER,
					category: DocumentCategory.OTHER,
					file: "/docs/tenancy_agreement.pdf",
					mimeType: "application/pdf",
					size: 1524000,
				},
			],
			messages: [
				{
					_id: "msg-9",
					sender: {
						_id: "admin",
						firstName: "Admin",
						lastName: "Admin",
						email: "admin@example.com",
						phone: "07700900001",
						password: "",
						role: "admin",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					receiver: {
						_id: "user-tenant-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					content:
						"Thank you for signing the tenancy agreement. Your move-in date is set for March 15th. Please contact us if you have any questions before then.",
					isRead: false,
					createdAt: "2025-02-28T10:05:00",
					updatedAt: "2025-02-28T10:05:00",
				},
				{
					_id: "msg-10",
					sender: {
						_id: "admin",
						firstName: "Admin",
						lastName: "Admin",
						email: "admin@example.com",
						phone: "07700900001",
						password: "",
						role: "admin",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					receiver: {
						_id: "user-tenant-1",
						firstName: "Jane",
						lastName: "Smith",
						email: "jane@example.com",
						phone: "07700900001",
						password: "",
						role: "tenant",
						createdAt: "2025-01-01T00:00:00",
						updatedAt: "2025-01-01T00:00:00",
						isVerified: true,
						emailVerified: true,
						phoneVerified: true,
						status: "active",
					},
					content:
						"Congratulations! Your application has been approved. Please log in to review and sign the tenancy agreement.",
					isRead: true,
					createdAt: "2025-02-25T14:25:00",
					updatedAt: "2025-02-25T14:25:00",
				},
			],
			createdAt: "2025-02-20T13:00:00",
			updatedAt: "2025-02-28T10:05:00",
		},*/
  ];

  // Fetch applications from API

  // biome-ignore lint/correctness/useExhaustiveDependencies: we need to use a mock data for the demo
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);

        // In a real app, fetch from API
        // const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/applications`);

        // For demo purposes, use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setApplications(mockApplications);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setError("Failed to load your applications. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Filter applications based on current filter settings
  const filteredApplications = applications.filter((app) => {
    // Filter by status
    if (filters.status !== "all" && app.status !== filters.status) {
      return false;
    }

    // Filter by timeframe
    if (filters.timeframe !== "all") {
      const appDate = new Date(app.appliedAt);
      const now = new Date();

      if (filters.timeframe === "last7days") {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        if (appDate < sevenDaysAgo) return false;
      } else if (filters.timeframe === "last30days") {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        if (appDate < thirtyDaysAgo) return false;
      } else if (filters.timeframe === "last3months") {
        const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        if (appDate < threeMonthsAgo) return false;
      }
    }

    return true;
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 md:flex md:items-center md:justify-between">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">My Applications</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Track the status of your rental applications and manage your
            documents.
          </p>
        </div>

        <div className="mt-4 flex items-center md:mt-0">
          <button
            className="mr-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 text-sm leading-4 shadow-sm hover:bg-gray-50 focus:outline-none"
            onClick={() => window.location.reload()}
            type="button"
          >
            <RefreshCw className="mr-1.5 h-4 w-4 text-gray-500" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center">
          <div className="mr-4 mb-2 flex items-center">
            <Filter className="mr-1.5 h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700 text-sm">
              Filter by:
            </span>
          </div>

          <div className="mr-4 mb-2">
            <select
              className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              onChange={(e) => handleFilterChange("status", e.target.value)}
              value={filters.status}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewing">Under Review</option>
              <option value="pending_references">Pending References</option>
              <option value="background_check">Background Check</option>
              <option value="landlord_review">Landlord Review</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="contract_pending">Contract Pending</option>
              <option value="contract_signed">Contract Signed</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          <div className="mr-4 mb-2">
            <select
              className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              onChange={(e) => handleFilterChange("timeframe", e.target.value)}
              value={filters.timeframe}
            >
              <option value="all">All Time</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last3months">Last 3 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Application Tracker */}
      {isLoading ? (
        <div className="animate-pulse rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 h-6 w-1/4 rounded bg-gray-200" />
          <div className="space-y-4">
            <div className="h-20 rounded bg-gray-200" />
            <div className="h-20 rounded bg-gray-200" />
            <div className="h-20 rounded bg-gray-200" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="border-red-400 border-l-4 bg-red-50 p-4">
            <div className="flex">
              <div className="shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ApplicationTracker applications={filteredApplications} />
      )}

      {/* Info about application process */}
      <div className="mt-8 rounded-lg bg-blue-50 p-6">
        <h2 className="mb-3 font-medium text-blue-900 text-lg">
          About the Application Process
        </h2>
        <div className="space-y-2 text-blue-700 text-sm">
          <p>
            The rental application process typically involves several steps,
            from submitting your application to signing a tenancy agreement.
          </p>
          <p>
            We'll keep you updated every step of the way, and you can always
            check the status of your applications on this page.
          </p>
          <p>
            If you have any questions about a specific application, please use
            the messaging feature within the application details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Applications;
