import { router } from "expo-router";
import { MapPin } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SearchBar } from "$/components/search-bar";
import { PropertyCard } from "$/modules/properties/components/property-card";
import { usePropertyStore } from "$/modules/properties/property.store";
import type { Property } from "$/modules/properties/property.type";

const popularLocations = [
  { id: "1", name: "Kilimani", county: "Nairobi", count: 45 },
  { id: "2", name: "Westlands", county: "Nairobi", count: 38 },
  { id: "3", name: "Karen", county: "Nairobi", count: 29 },
  { id: "4", name: "Lavington", county: "Nairobi", count: 22 },
  { id: "5", name: "Kileleshwa", county: "Nairobi", count: 18 },
];

const propertyTypes = [
  { id: "1", name: "Bedsitter", type: "bedsitter", count: 67 },
  { id: "2", name: "1 Bedroom", type: "one-bedroom", count: 54 },
  { id: "3", name: "2 Bedroom", type: "two-bedroom", count: 43 },
  { id: "4", name: "3 Bedroom", type: "three-bedroom", count: 31 },
];

export default function SearchScreen() {
  const {
    getFilteredProperties,
    searchQuery,
    setSearchQuery,
    setSearchFilters,
    searchFilters,
  } = usePropertyStore();

  const [activeTab, setActiveTab] = useState<"results" | "locations" | "types">(
    "results"
  );
  const filteredProperties = getFilteredProperties();

  const handlePropertyPress = (property: Property) => {
    router.push(`/property/${property.id}`);
  };

  const handleFilterPress = () => {
    router.push("/search/filters");
  };

  const handleLocationPress = (location: (typeof popularLocations)[0]) => {
    setSearchFilters({
      ...searchFilters,
      location: { county: location.county, area: location.name },
    });
    setActiveTab("results");
  };

  const handleTypePress = (type: (typeof propertyTypes)[0]) => {
    setSearchFilters({
      ...searchFilters,
      propertyType: [type.type],
    });
    setActiveTab("results");
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <PropertyCard onPress={() => handlePropertyPress(item)} property={item} />
  );

  const renderLocation = ({ item }: { item: (typeof popularLocations)[0] }) => (
    <TouchableOpacity
      className="mb-3 flex-row items-center rounded-lg bg-white p-4 shadow-sm"
      onPress={() => handleLocationPress(item)}
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
        <MapPin color="#007AFF" size={20} />
      </View>
      <View className="flex-1">
        <Text className="mb-0.5 font-semibold text-base text-black">
          {item.name}
        </Text>
        <Text className="text-gray-500 text-sm">
          {item.county} • {item.count} properties
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderType = ({ item }: { item: (typeof propertyTypes)[0] }) => (
    <TouchableOpacity
      className="m-1.5 flex-1 items-center rounded-lg bg-white p-4 shadow-sm"
      onPress={() => handleTypePress(item)}
    >
      <Text className="mb-1 font-semibold text-base text-black">
        {item.name}
      </Text>
      <Text className="text-gray-500 text-sm">{item.count} available</Text>
    </TouchableOpacity>
  );

  const renderTabs = () => (
    <View className="flex-row border-gray-200 border-b bg-white px-4 py-2">
      <TouchableOpacity
        className={`mx-1 flex-1 items-center rounded-lg py-3 ${
          activeTab === "results" ? "bg-blue-500" : ""
        }`}
        onPress={() => setActiveTab("results")}
      >
        <Text
          className={`font-semibold text-sm ${
            activeTab === "results" ? "text-white" : "text-gray-500"
          }`}
        >
          Results ({filteredProperties.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`mx-1 flex-1 items-center rounded-lg py-3 ${
          activeTab === "locations" ? "bg-blue-500" : ""
        }`}
        onPress={() => setActiveTab("locations")}
      >
        <Text
          className={`font-semibold text-sm ${
            activeTab === "locations" ? "text-white" : "text-gray-500"
          }`}
        >
          Locations
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`mx-1 flex-1 items-center rounded-lg py-3 ${
          activeTab === "types" ? "bg-blue-500" : ""
        }`}
        onPress={() => setActiveTab("types")}
      >
        <Text
          className={`font-semibold text-sm ${
            activeTab === "types" ? "text-white" : "text-gray-500"
          }`}
        >
          Types
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "results":
        return (
          <FlatList
            className="px-4 py-4"
            data={filteredProperties}
            keyExtractor={(item) => item.id}
            renderItem={renderProperty}
            showsVerticalScrollIndicator={false}
          />
        );
      case "locations":
        return (
          <FlatList
            className="px-4 py-4"
            data={popularLocations}
            keyExtractor={(item) => item.id}
            renderItem={renderLocation}
            showsVerticalScrollIndicator={false}
          />
        );
      case "types":
        return (
          <FlatList
            className="px-4 py-4"
            data={propertyTypes}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={renderType}
            showsVerticalScrollIndicator={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SearchBar
        onChangeText={setSearchQuery}
        onFilterPress={handleFilterPress}
        placeholder="Search properties, locations..."
        value={searchQuery}
      />

      {renderTabs()}
      {renderContent()}
    </View>
  );
}
