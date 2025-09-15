import { Button } from "@kaa/ui-native";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePropertyStore } from "$/modules/properties/property.store";
import type { SearchFilters } from "$/modules/properties/property.type";

const propertyTypes = [
  { id: "bedsitter", label: "Bedsitter" },
  { id: "one-bedroom", label: "1 Bedroom" },
  { id: "two-bedroom", label: "2 Bedroom" },
  { id: "three-bedroom", label: "3 Bedroom" },
  { id: "house", label: "House" },
  { id: "apartment", label: "Apartment" },
];

const counties = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
];

const bedroomOptions = [1, 2, 3, 4, 5];

const priceRanges = [
  { min: 0, max: 15_000, label: "Under KES 15,000" },
  { min: 15_000, max: 30_000, label: "KES 15,000 - 30,000" },
  { min: 30_000, max: 50_000, label: "KES 30,000 - 50,000" },
  { min: 50_000, max: 100_000, label: "KES 50,000 - 100,000" },
  { min: 100_000, max: 999_999, label: "Above KES 100,000" },
];

export default function FiltersScreen() {
  const { searchFilters, setSearchFilters } = usePropertyStore();
  const [localFilters, setLocalFilters] =
    useState<SearchFilters>(searchFilters);

  const handleApplyFilters = () => {
    setSearchFilters(localFilters);
    router.back();
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      priceRange: { min: 0, max: 100_000 },
    };
    setLocalFilters(clearedFilters);
  };

  const togglePropertyType = (type: string) => {
    const currentTypes = localFilters.propertyType || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    setLocalFilters({
      ...localFilters,
      propertyType: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const toggleBedroom = (bedroom: number) => {
    const currentBedrooms = localFilters.bedrooms || [];
    const newBedrooms = currentBedrooms.includes(bedroom)
      ? currentBedrooms.filter((b) => b !== bedroom)
      : [...currentBedrooms, bedroom];

    setLocalFilters({
      ...localFilters,
      bedrooms: newBedrooms.length > 0 ? newBedrooms : undefined,
    });
  };

  const selectPriceRange = (range: (typeof priceRanges)[0]) => {
    setLocalFilters({
      ...localFilters,
      priceRange: { min: range.min, max: range.max },
    });
  };

  const selectCounty = (county: string) => {
    setLocalFilters({
      ...localFilters,
      location: { ...localFilters.location, county },
    });
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View className="my-6">
      <Text className="mb-4 font-semibold text-black text-xl">{title}</Text>
      {children}
    </View>
  );

  const renderPropertyTypes = () => (
    <View className="-mx-1 flex-row flex-wrap">
      {propertyTypes.map((type) => (
        <TouchableOpacity
          className={`m-1 rounded-full bg-gray-100 px-4 py-2.5 ${
            localFilters.propertyType?.includes(type.id)
              ? "bg-blue-500"
              : "bg-gray-100"
          }`}
          key={type.id}
          onPress={() => togglePropertyType(type.id)}
        >
          <Text
            className={`font-medium text-sm ${
              localFilters.propertyType?.includes(type.id)
                ? "text-white"
                : "text-black"
            }`}
          >
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPriceRanges = () => (
    <View className="gap-2">
      {priceRanges.map((range, index) => (
        <TouchableOpacity
          className={`rounded-lg border bg-gray-50 px-4 py-4 ${
            localFilters.priceRange.min === range.min &&
            localFilters.priceRange.max === range.max
              ? "border-blue-500 bg-blue-50"
              : "border-transparent bg-gray-50"
          }`}
          key={`${index}-${range.min}-${range.max}`}
          onPress={() => selectPriceRange(range)}
        >
          <Text
            className={`text-base ${
              localFilters.priceRange.min === range.min &&
              localFilters.priceRange.max === range.max
                ? "font-semibold text-blue-500"
                : "text-black"
            }`}
          >
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCounties = () => (
    <View className="-mx-1 flex-row flex-wrap">
      {counties.map((county) => (
        <TouchableOpacity
          className={`m-1 rounded-full bg-gray-100 px-4 py-2.5 ${
            localFilters.location?.county === county
              ? "bg-blue-500"
              : "bg-gray-100"
          }`}
          key={county}
          onPress={() => selectCounty(county)}
        >
          <Text
            className={`font-medium text-sm ${
              localFilters.location?.county === county
                ? "text-white"
                : "text-black"
            }`}
          >
            {county}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBedrooms = () => (
    <View className="-mx-1 flex-row flex-wrap">
      {bedroomOptions.map((bedroom) => (
        <TouchableOpacity
          className={`m-1 rounded-full bg-gray-100 px-4 py-2.5 ${
            localFilters.bedrooms?.includes(bedroom)
              ? "bg-blue-500"
              : "bg-gray-100"
          }`}
          key={bedroom}
          onPress={() => toggleBedroom(bedroom)}
        >
          <Text
            className={`font-medium text-sm ${
              localFilters.bedrooms?.includes(bedroom)
                ? "text-white"
                : "text-black"
            }`}
          >
            {bedroom}+ bed{bedroom > 1 ? "s" : ""}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderToggleOptions = () => (
    <View className="gap-4">
      <TouchableOpacity
        className="flex-row items-center justify-between py-2"
        onPress={() =>
          setLocalFilters({
            ...localFilters,
            furnished:
              localFilters.furnished === undefined
                ? true
                : localFilters.furnished
                  ? false
                  : undefined,
          })
        }
      >
        <Text className="text-base text-black">Furnished</Text>
        <View
          className={`h-7 w-12 justify-center rounded-full px-0.5 ${
            localFilters.furnished === true
              ? "items-end bg-blue-500"
              : "bg-gray-300"
          }`}
        >
          {localFilters.furnished === true && (
            <View className="h-6.5 w-6.5 rounded-full bg-white" />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center justify-between py-2"
        onPress={() =>
          setLocalFilters({
            ...localFilters,
            petsAllowed:
              localFilters.petsAllowed === undefined
                ? true
                : localFilters.petsAllowed
                  ? false
                  : undefined,
          })
        }
      >
        <Text className="text-base text-black">Pets Allowed</Text>
        <View
          className={`h-7 w-12 justify-center rounded-full px-0.5 ${
            localFilters.petsAllowed === true
              ? "items-end bg-blue-500"
              : "bg-gray-300"
          }`}
        >
          {localFilters.petsAllowed === true && (
            <View className="h-6.5 w-6.5 rounded-full bg-white" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-gray-200 border-b px-4 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <X color="#000000" size={24} />
        </TouchableOpacity>
        <Text className="font-semibold text-black text-lg">Filters</Text>
        <TouchableOpacity onPress={handleClearFilters}>
          <Text className="font-semibold text-base text-blue-500">Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {renderSection("Property Type", renderPropertyTypes())}
        {renderSection("Price Range", renderPriceRanges())}
        {renderSection("Location", renderCounties())}
        {renderSection("Bedrooms", renderBedrooms())}
        {renderSection("Additional Options", renderToggleOptions())}
      </ScrollView>

      <View className="border-gray-200 border-t px-4 py-4">
        <Button className="w-full" onPress={handleApplyFilters}>
          <Text>Apply Filters</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
