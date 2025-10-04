"use client";

import { config } from "@kaa/config";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect } from "react";
import { ACTIONS, EVENTS, STATUS } from "react-joyride";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const JoyRideNoSSR = dynamic(() => import("react-joyride"), { ssr: false });

type GuidedTourProps = {
  userRole: "landlord" | "tenant" | "admin" | "agent";
};

type Placement = "top" | "bottom" | "left" | "right";

type Step = {
  target: string;
  content: string;
  disableBeacon?: boolean;
  placement?: Placement;
  title?: string;
};

type ToursStore = {
  run: boolean;
  steps: Step[];
  completedTours: Record<string, boolean>;

  setRun: (run: boolean) => void;
  setSteps: (steps: Step[]) => void;
  setCompletedTours: (completedTours: Record<string, boolean>) => void;
};

const useToursStore = create<ToursStore>()(
  persist(
    (set) => ({
      run: false,
      steps: [],
      completedTours: {},

      setRun: (run: boolean) => set({ run }),
      setSteps: (steps: Step[]) => set({ steps }),
      setCompletedTours: (completedTours: Record<string, boolean>) =>
        set({ completedTours }),
    }),
    {
      name: `${config.slug}-tours-store`,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        run: state.run,
        steps: state.steps,
        completedTours: state.completedTours,
      }),
    }
  )
);

const GuidedTour: React.FC<GuidedTourProps> = ({ userRole }) => {
  const { run, steps, completedTours, setRun, setSteps, setCompletedTours } =
    useToursStore();
  const tourKey = "main-tour";
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    // Check if user has completed the tour already
    if (!completedTours[tourKey]) {
      setRun(true);
    }

    // Set steps based on route and user role
    updateSteps();
  }, [completedTours, setRun]);

  const updateSteps = () => {
    const path = pathname;

    // Define step sets for different pages
    let currentSteps: Step[] = [];

    // Home page tour
    if (path === "/") {
      currentSteps = getHomePageSteps();
    }
    // Property search page tour
    else if (path === "/properties" || path.startsWith("/properties/search")) {
      currentSteps = getPropertySearchSteps();
    }
    // Property detail page tour
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    else if (path.match(/\/properties\/[a-zA-Z0-9]+$/)) {
      currentSteps = getPropertyDetailSteps();
    }
    // User dashboard tour
    else if (path === "/dashboard") {
      currentSteps = getDashboardSteps(userRole);
    }
    // Admin dashboard tour
    else if (path.startsWith("/admin")) {
      currentSteps = getAdminSteps();
    }
    // Booking page tour
    else if (path.startsWith("/bookings")) {
      currentSteps = getBookingSteps();
    }
    // Applications page tour
    else if (path.startsWith("/applications")) {
      currentSteps = getApplicationSteps();
    }

    setSteps(currentSteps);
  };

  const getHomePageSteps = (): Step[] => [
    {
      target: ".search-container",
      content:
        "Start your search here. Enter a location, property type, or other criteria to find your ideal property.",
      disableBeacon: true,
      placement: "bottom",
      title: "Property Search",
    },
    {
      target: ".featured-properties",
      content: "Browse through our featured properties selected just for you.",
      placement: "top",
      title: "Featured Properties",
    },
    {
      target: ".navigation-menu",
      content:
        "Access all parts of the site from our navigation menu. You can search properties, view your bookings, and more.",
      placement: "bottom",
      title: "Navigation",
    },
    {
      target: ".user-menu",
      content:
        "Manage your account, view your messages, and access settings from here.",
      placement: "bottom",
      title: "User Menu",
    },
  ];

  const getPropertySearchSteps = (): Step[] => [
    {
      target: ".search-filters",
      content:
        "Refine your search with these filters. You can filter by price, number of bedrooms, property type, and more.",
      disableBeacon: true,
      placement: "right",
      title: "Search Filters",
    },
    {
      target: ".saved-searches",
      content:
        "Save your searches for later use. This helps you quickly find properties matching your criteria.",
      placement: "bottom",
      title: "Saved Searches",
    },
    {
      target: ".property-grid",
      content:
        "View all properties matching your search criteria here. Click on any property to see more details.",
      placement: "top",
      title: "Property Results",
    },
    {
      target: ".property-map",
      content:
        "See where properties are located on the map. You can also search directly from the map view.",
      placement: "left",
      title: "Property Map",
    },
    {
      target: ".compare-button",
      content:
        "Add properties to your comparison list to compare them side by side.",
      placement: "bottom",
      title: "Compare Properties",
    },
  ];

  const getPropertyDetailSteps = (): Step[] => [
    {
      target: ".property-gallery",
      content:
        "Browse through property photos and virtual tours to get a feel for the property.",
      disableBeacon: true,
      placement: "bottom",
      title: "Property Gallery",
    },
    {
      target: ".property-details",
      content:
        "Here you'll find all the key details about the property, including price, size, and amenities.",
      placement: "left",
      title: "Property Details",
    },
    {
      target: ".booking-form",
      content: "Book a viewing or request more information directly from here.",
      placement: "left",
      title: "Book a Viewing",
    },
    {
      target: ".neighborhood-info",
      content:
        "Learn about the neighborhood, nearby amenities, and transport options.",
      placement: "top",
      title: "Neighborhood Info",
    },
    {
      target: ".landlord-info",
      content:
        "See information about the landlord or agent and contact them if you have questions.",
      placement: "right",
      title: "Landlord Info",
    },
    {
      target: ".property-reviews",
      content:
        "Read reviews from past tenants to get a better understanding of the property and landlord.",
      placement: "top",
      title: "Reviews",
    },
  ];

  const getDashboardSteps = (
    role: "landlord" | "tenant" | "admin" | "agent"
  ): Step[] => {
    if (role === "tenant") {
      return [
        {
          target: ".dashboard-nav",
          content:
            "Navigate through different sections of your dashboard from here.",
          disableBeacon: true,
          placement: "right",
          title: "Dashboard Navigation",
        },
        {
          target: ".saved-properties",
          content: "View all properties you've saved for later.",
          placement: "bottom",
          title: "Saved Properties",
        },
        {
          target: ".bookings-section",
          content: "Manage your property viewings and bookings here.",
          placement: "bottom",
          title: "Your Bookings",
        },
        {
          target: ".messages-section",
          content:
            "Access your conversations with landlords and property agents.",
          placement: "bottom",
          title: "Messages",
        },
        {
          target: ".account-settings",
          content:
            "Update your profile, notification preferences, and security settings.",
          placement: "left",
          title: "Account Settings",
        },
      ];
    }
    if (role === "landlord") {
      return [
        {
          target: ".dashboard-nav",
          content:
            "Navigate through different sections of your landlord dashboard from here.",
          disableBeacon: true,
          placement: "right",
          title: "Dashboard Navigation",
        },
        {
          target: ".my-properties",
          content: "Manage all your listed properties from here.",
          placement: "bottom",
          title: "Your Properties",
        },
        {
          target: ".tenant-requests",
          content:
            "View and respond to viewing requests and applications from tenants.",
          placement: "bottom",
          title: "Tenant Requests",
        },
        {
          target: ".income-overview",
          content: "Track your rental income and payments here.",
          placement: "bottom",
          title: "Financial Overview",
        },
        {
          target: ".add-property-button",
          content: "Click here to add a new property listing.",
          placement: "left",
          title: "Add New Property",
        },
      ];
    }

    return [];
  };

  const getAdminSteps = (): Step[] => [
    {
      target: ".admin-nav",
      content:
        "Navigate through different sections of the admin dashboard from here.",
      disableBeacon: true,
      placement: "right",
      title: "Admin Navigation",
    },
    {
      target: ".stats-overview",
      content: "View key performance metrics and statistics for the platform.",
      placement: "bottom",
      title: "Statistics Overview",
    },
    {
      target: ".data-tables",
      content:
        "Manage users, properties, bookings, and more from these data tables.",
      placement: "top",
      title: "Data Management",
    },
    {
      target: ".analytics-section",
      content: "Access detailed analytics and generate custom reports here.",
      placement: "bottom",
      title: "Advanced Analytics",
    },
    {
      target: ".settings-section",
      content: "Configure system settings, preferences, and admin access here.",
      placement: "left",
      title: "System Settings",
    },
  ];

  const getBookingSteps = (): Step[] => [
    {
      target: ".booking-list",
      content: "View all your upcoming and past bookings here.",
      disableBeacon: true,
      placement: "bottom",
      title: "Your Bookings",
    },
    {
      target: ".booking-filter",
      content: "Filter your bookings by status, date, or property type.",
      placement: "right",
      title: "Filter Bookings",
    },
    {
      target: ".calendar-view",
      content:
        "View your bookings in a calendar format to help plan your schedule.",
      placement: "top",
      title: "Calendar View",
    },
    {
      target: ".booking-actions",
      content:
        "Manage your bookings from here. You can reschedule, cancel, or confirm bookings.",
      placement: "left",
      title: "Booking Actions",
    },
  ];

  const getApplicationSteps = (): Step[] => [
    {
      target: ".application-list",
      content: "View all your rental applications here, both ongoing and past.",
      disableBeacon: true,
      placement: "bottom",
      title: "Your Applications",
    },
    {
      target: ".application-filter",
      content:
        "Filter your applications by status to quickly find what you're looking for.",
      placement: "bottom",
      title: "Filter Applications",
    },
    {
      target: ".application-status",
      content: "These badges show the current status of each application.",
      placement: "right",
      title: "Application Status",
    },
    {
      target: ".application-timeline",
      content:
        "Track the progress of your application through each stage of the process.",
      placement: "top",
      title: "Application Timeline",
    },
    {
      target: ".application-documents",
      content: "Upload and manage documents required for your application.",
      placement: "left",
      title: "Application Documents",
    },
  ];

  const handleJoyrideCallback = (data: any) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Update state to advance the tour
      // If we're going back, we need to make sure we don't mark the tour as complete
      if (action === ACTIONS.NEXT) {
        // Proceed to next step
      }
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Need to set our running state to false, so we can restart if we click start again.
      setRun(false);

      // Mark this tour as completed in localStorage
      completedTours[tourKey] = true;
      console.log("completedTours", completedTours);
      setCompletedTours(completedTours);
    }
  };

  return (
    <>
      <JoyRideNoSSR
        callback={handleJoyrideCallback}
        continuous
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip Tour",
        }}
        run={run}
        showProgress
        showSkipButton
        steps={steps}
        styles={{
          options: {
            primaryColor: "#50C878",
            arrowColor: "#ffffff",
            backgroundColor: "#ffffff",
            textColor: "#333333",
            zIndex: 10_000,
          },
          buttonClose: {
            display: "none",
          },
          buttonNext: {
            backgroundColor: "#50C878",
          },
          buttonBack: {
            color: "#50C878",
            marginRight: 10,
          },
          tooltip: {
            borderRadius: 8,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        }}
      />

      {/* Optional button to restart the tour */}
      {!run && (
        <button
          aria-label="Start Tour"
          className="tour-guide-trigger fixed right-4 bottom-4 z-50 rounded-full bg-primary-600 p-3 text-white shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onClick={() => setRun(true)}
          type="button"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>
      )}
    </>
  );
};

export default GuidedTour;
