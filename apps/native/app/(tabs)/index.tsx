import { type ErrorBoundaryProps, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchBar } from "$/components/search-bar";
import { useAuthStore } from "$/modules/auth/auth.store";
import { PropertyCard } from "$/modules/properties/components/property-card";
import { usePropertyStore } from "$/modules/properties/property.store";
import type { Property } from "$/modules/properties/property.type";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-4">
      <Text className="mb-2 text-center font-semibold text-black text-lg">
        Something went wrong
      </Text>
      <Text className="mb-5 text-center text-gray-500 text-sm">
        {error
          ? error.message
          : "An unexpected error occurred. Please try again later."}
      </Text>
      <TouchableOpacity
        className="rounded bg-blue-500 px-4 py-2"
        onPress={retry}
      >
        <Text className="font-medium text-sm text-white">Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    fetchProperties,
    getFilteredProperties,
    isLoading,
    searchQuery,
    setSearchQuery,
  } = usePropertyStore();

  const [refreshing, setRefreshing] = useState(false);
  const filteredProperties = getFilteredProperties();

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  }, [fetchProperties]);

  const handlePropertyPress = (property: Property) => {
    router.push({
      pathname: "/property/[id]" as any,
      params: { id: property.id },
    });
  };

  const handleFilterPress = () => {
    router.push("/search/filters" as any);
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <PropertyCard onPress={() => handlePropertyPress(item)} property={item} />
  );

  const renderHeader = () => (
    <View className="py-5">
      <Text className="mb-1 font-bold text-2xl text-black">
        Hello, {user?.name?.split(" ")[0] || "Guest"}! 👋
      </Text>
      <Text className="text-base text-gray-500">
        Find your perfect home in Kenya
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-15">
      <Text className="mb-2 font-semibold text-black text-lg">
        No properties found
      </Text>
      <Text className="text-center text-gray-500 text-sm">
        Try adjusting your search criteria
      </Text>
    </View>
  );

  const renderRefreshButton = () => (
    <TouchableOpacity
      className="mt-5 items-center py-4"
      disabled={refreshing}
      onPress={onRefresh}
    >
      <Text className="font-medium text-blue-500 text-sm">
        {refreshing ? "Refreshing..." : "Pull to refresh"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <SearchBar
        onChangeText={setSearchQuery}
        onFilterPress={handleFilterPress}
        placeholder="Search by location, type..."
        value={searchQuery}
      />

      <FlatList
        className="px-4 pb-5"
        data={filteredProperties}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={isLoading ? null : renderEmpty}
        ListFooterComponent={renderRefreshButton}
        ListHeaderComponent={renderHeader}
        renderItem={renderProperty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
