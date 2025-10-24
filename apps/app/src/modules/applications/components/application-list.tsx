"use client";

import { Check, Clock, File, Home, Info, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth";
import type { Property } from "@/modules/properties";
import type { User } from "@/modules/users/user.type";
import {
  DocumentCategory,
  DocumentStatus,
} from "@/routes/account/applications";
import { useApplications } from "../application.queries";
import {
  type Application,
  ApplicationStatus,
  TimelineEventStatus,
} from "../application.type";

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "draft":
        return {
          label: "Draft",
          icon: File,
          color: "bg-gray-100 text-gray-800",
        };
      case "submitted":
        return {
          label: "Submitted",
          icon: Clock,
          color: "bg-blue-100 text-blue-800",
        };
      case "in_review":
        return {
          label: "In Review",
          icon: Info,
          color: "bg-yellow-100 text-yellow-800",
        };
      case "approved":
        return {
          label: "Approved",
          icon: Check,
          color: "bg-green-100 text-green-800",
        };
      case "rejected":
        return {
          label: "Rejected",
          icon: X,
          color: "bg-red-100 text-red-800",
        };
      case "withdrawn":
        return {
          label: "Withdrawn",
          icon: X,
          color: "bg-gray-100 text-gray-800",
        };
      default:
        return {
          label: status,
          icon: Info,
          color: "bg-gray-100 text-gray-800",
        };
    }
  };

  const { label, icon: Icon, color } = getStatusInfo(status);

  return (
    <span
      className={`application-status inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${color}`}
    >
      <Icon aria-hidden="true" className="mr-1 h-3 w-3" />
      {label}
    </span>
  );
};

const ApplicationList = () => {
  const { user } = useAuthStore();
  const isLandlord = user?.role === "landlord";
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading, error } = useApplications({ status: null });

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
  ];

  // Filter applications based on status
  const filteredApplications =
    filter === "all"
      ? mockApplications // data?.items
      : mockApplications.filter((app: Application) => app.status === filter);

  // Format date
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-primary-600 border-t-2 border-b-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        <p>Error loading applications. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="application-list">
      {/* Filters */}
      <div className="application-filter mb-6">
        <div className="sm:flex sm:justify-between">
          <div className="flex space-x-2">
            <button
              className={`rounded-md px-3 py-2 font-medium text-sm ${
                filter === "all"
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFilter("all")}
              type="button"
            >
              All
            </button>
            <button
              className={`rounded-md px-3 py-2 font-medium text-sm ${
                filter === "submitted"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFilter("submitted")}
              type="button"
            >
              Submitted
            </button>
            <button
              className={`rounded-md px-3 py-2 font-medium text-sm ${
                filter === "in_review"
                  ? "bg-yellow-100 text-yellow-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFilter("in_review")}
              type="button"
            >
              In Review
            </button>
            <button
              className={`rounded-md px-3 py-2 font-medium text-sm ${
                filter === "approved"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFilter("approved")}
              type="button"
            >
              Approved
            </button>
          </div>
        </div>
      </div>
      {/* Applications list */}
      {filteredApplications?.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-center shadow-sm">
          <File className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 font-medium text-gray-900 text-sm">
            No applications found
          </h3>
          <p className="mt-1 text-gray-500 text-sm">
            {filter === "all"
              ? "You haven't submitted any applications yet."
              : `You don't have any applications with "${filter}" status.`}
          </p>
          {!isLandlord && (
            <div className="mt-6">
              <Link
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                href="/properties"
              >
                Browse Properties
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredApplications?.map((application: Application) => (
              <li key={application._id}>
                <Link
                  className="block hover:bg-gray-50"
                  href={`/applications/${application._id}`}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-200">
                          {(application.property as Property).media
                            .images?.[0] ? (
                            <Image
                              alt={(application.property as Property).title}
                              className="h-full w-full object-cover"
                              height={40}
                              src={
                                (application.property as Property).media
                                  .images[0]?.url ?? ""
                              }
                              width={40}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-200">
                              <Home className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="truncate font-medium text-primary-600 text-sm">
                            {(application.property as Property).title}
                          </p>
                          <p className="truncate text-gray-500 text-sm">
                            {
                              (application.property as Property).location
                                .address.line1
                            }{" "}
                            {
                              (application.property as Property).location
                                .address.postalCode
                            }
                            {
                              (application.property as Property).location
                                .address.town
                            }
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex shrink-0">
                        <StatusBadge status={application.status} />
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-gray-500 text-sm">
                          <span className="truncate">
                            {isLandlord
                              ? `${(application.tenant as User).firstName} ${(application.tenant as User).lastName}`
                              : `KES ${(application.property as Property).pricing.rent} pcm`}
                          </span>
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-gray-500 text-sm sm:mt-0">
                        <p>
                          <span>Applied on </span>
                          <time dateTime={application.createdAt}>
                            {formatDate(application.createdAt as string)}
                          </time>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ApplicationList;
