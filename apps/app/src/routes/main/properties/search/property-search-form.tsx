import { Bell, MapPin, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

type PropertySearchFormProps = {
  className?: string;
  defaultValues?: {
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    propertyType?: string;
    furnishedStatus?: string;
    availability?: string;
    radius?: string;
  };
  isAdvanced?: boolean;
};

const PropertySearchForm: React.FC<PropertySearchFormProps> = ({
  className,
  defaultValues,
  isAdvanced = false,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState(defaultValues?.location || "");
  const [minPrice, setMinPrice] = useState(defaultValues?.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(defaultValues?.maxPrice || "");
  const [bedrooms, setBedrooms] = useState(defaultValues?.bedrooms || "");
  const [propertyType, setPropertyType] = useState(
    defaultValues?.propertyType || ""
  );
  const [furnishedStatus, setFurnishedStatus] = useState(
    defaultValues?.furnishedStatus || ""
  );
  const [availability, setAvailability] = useState(
    defaultValues?.availability || ""
  );
  const [radius, setRadius] = useState(defaultValues?.radius || "1");
  const [showAdvanced, setShowAdvanced] = useState(isAdvanced);

  // Price options for dropdown selects
  const priceOptions = [
    { value: "", label: "No min" },
    { value: "300", label: "£300" },
    { value: "500", label: "£500" },
    { value: "700", label: "£700" },
    { value: "900", label: "£900" },
    { value: "1100", label: "£1,100" },
    { value: "1300", label: "£1,300" },
    { value: "1500", label: "£1,500" },
    { value: "1700", label: "£1,700" },
    { value: "2000", label: "£2,000" },
    { value: "2500", label: "£2,500" },
    { value: "3000", label: "£3,000" },
    { value: "3500", label: "£3,500" },
    { value: "4000", label: "£4,000" },
    { value: "5000", label: "£5,000" },
    { value: "7500", label: "£7,500" },
    { value: "10000", label: "£10,000" },
    { value: "12500", label: "£12,500" },
    { value: "15000", label: "£15,000" },
    { value: "20000", label: "£20,000" },
  ];

  const maxPriceOptions = [
    { value: "", label: "No max" },
    ...priceOptions.filter((option) => option.value !== ""),
  ];

  // Sync form values with URL query params
  useEffect(() => {
    if (searchParams) {
      setLocation(searchParams.get("location") || "");
      setMinPrice(searchParams.get("minPrice") || "");
      setMaxPrice(searchParams.get("maxPrice") || "");
      setBedrooms(searchParams.get("bedrooms") || "");
      setPropertyType(searchParams.get("propertyType") || "");
      setFurnishedStatus(searchParams.get("furnishedStatus") || "");
      setAvailability(searchParams.get("availability") || "");
      setRadius(searchParams.get("radius") || "1");
    }
  }, [searchParams]);

  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Collect all form values
    const params = {
      ...(location && { location }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(bedrooms && { bedrooms }),
      ...(propertyType && { propertyType }),
      ...(furnishedStatus && { furnishedStatus }),
      ...(availability && { availability }),
      ...(radius && { radius }),
    };

    // Create a URLSearchParams object
    const searchParams = new URLSearchParams();

    // Add each parameter to the search params
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value as string);
    }

    // Create the URL string
    const queryString = searchParams.toString();
    const url = `/properties${queryString ? `?${queryString}` : ""}`;

    // Navigate to properties page with search params
    router.push(url);
  };

  // Toggle advanced search options
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <div className={`rounded-lg bg-white p-4 shadow-md ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end">
          {/* Location input */}
          <div className="flex-1">
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="location"
            >
              Location
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="location"
                name="location"
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, postcode or area"
                type="text"
                value={location}
              />
            </div>
          </div>

          {/* Minimum price dropdown */}
          <div className="w-full md:w-36">
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="minPrice"
            >
              Min Price
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="minPrice"
              name="minPrice"
              onChange={(e) => setMinPrice(e.target.value)}
              value={minPrice}
            >
              {priceOptions.map((option) => (
                <option key={`min-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Maximum price dropdown */}
          <div className="w-full md:w-36">
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="maxPrice"
            >
              Max Price
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="maxPrice"
              name="maxPrice"
              onChange={(e) => setMaxPrice(e.target.value)}
              value={maxPrice}
            >
              {maxPriceOptions.map((option) => (
                <option key={`max-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms dropdown */}
          <div className="w-full md:w-36">
            <label
              className="mb-1 block font-medium text-gray-700 text-sm"
              htmlFor="bedrooms"
            >
              Bedrooms
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="bedrooms"
              name="bedrooms"
              onChange={(e) => setBedrooms(e.target.value)}
              value={bedrooms}
            >
              <option value="">Any</option>
              <option value="studio">Studio</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5+">5+</option>
            </select>
          </div>

          {/* Search button */}
          <div className="mt-4 w-full md:mt-0 md:w-auto">
            <button
              className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
            >
              <Search className="mr-2" />
              Search
            </button>
          </div>
        </div>

        {/* Advanced search toggle */}
        <div className="mb-2 flex items-center justify-between">
          <button
            className="flex items-center font-medium text-blue-600 text-sm hover:text-blue-800"
            onClick={toggleAdvanced}
            type="button"
          >
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>

          <button
            className="flex items-center font-medium text-blue-600 text-sm hover:text-blue-800"
            onClick={() => router.push("/alert/create")}
            type="button"
          >
            <Bell className="mr-1" />
            Create search alert
          </button>
        </div>

        {/* Advanced search options */}
        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-gray-200 border-t pt-4 md:grid-cols-3">
            {/* Property type */}
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="propertyType"
              >
                Property type
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="propertyType"
                name="propertyType"
                onChange={(e) => setPropertyType(e.target.value)}
                value={propertyType}
              >
                <option value="">Any</option>
                <option value="flat">Flat / Apartment</option>
                <option value="house">House</option>
                <option value="detached">Detached house</option>
                <option value="semi-detached">Semi-detached house</option>
                <option value="terraced">Terraced house</option>
                <option value="bungalow">Bungalow</option>
                <option value="maisonette">Maisonette</option>
                <option value="room">Room</option>
              </select>
            </div>

            {/* Furnished status */}
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="furnishedStatus"
              >
                Furnished status
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="furnishedStatus"
                name="furnishedStatus"
                onChange={(e) => setFurnishedStatus(e.target.value)}
                value={furnishedStatus}
              >
                <option value="">Any</option>
                <option value="furnished">Furnished</option>
                <option value="part-furnished">Part furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="availability"
              >
                Availability
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="availability"
                name="availability"
                onChange={(e) => setAvailability(e.target.value)}
                value={availability}
              >
                <option value="">Any time</option>
                <option value="now">Available now</option>
                <option value="1week">Within 1 week</option>
                <option value="2weeks">Within 2 weeks</option>
                <option value="1month">Within 1 month</option>
                <option value="3months">Within 3 months</option>
              </select>
            </div>

            {/* Search radius */}
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="radius"
              >
                Search radius (miles)
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="radius"
                name="radius"
                onChange={(e) => setRadius(e.target.value)}
                value={radius}
              >
                <option value="0">This area only</option>
                <option value="0.25">¼ mile</option>
                <option value="0.5">½ mile</option>
                <option value="1">1 mile</option>
                <option value="3">3 miles</option>
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="20">20 miles</option>
                <option value="30">30 miles</option>
                <option value="40">40 miles</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PropertySearchForm;
