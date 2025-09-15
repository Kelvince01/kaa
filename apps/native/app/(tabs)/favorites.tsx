import { router } from "expo-router";
import { Heart } from "lucide-react-native";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PropertyCard } from "$/modules/properties/components/property-card";
import { usePropertyStore } from "$/modules/properties/property.store";
import type { Property } from "$/modules/properties/property.type";

export default function FavoritesScreen() {
  const { properties, favorites } = usePropertyStore();

  const favoriteProperties = properties.filter((property) =>
    favorites.includes(property.id)
  );

  const handlePropertyPress = (property: Property) => {
    router.push(`/property/${property.id}`);
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <PropertyCard onPress={() => handlePropertyPress(item)} property={item} />
  );

  const renderEmpty = () => (
    <View className="items-center justify-center px-8 py-20">
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-gray-50">
        <Heart color="#E5E5EA" size={48} />
      </View>
      <Text className="mb-2 font-semibold text-black text-xl">
        No favorites yet
      </Text>
      <Text className="text-center text-base text-gray-500 leading-5">
        Start exploring properties and tap the heart icon to save your favorites
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="border-gray-200 border-b bg-white px-4 py-5">
        <Text className="mb-1 font-bold text-2xl text-black">My Favorites</Text>
        <Text className="text-base text-gray-500">
          {favoriteProperties.length} saved properties
        </Text>
      </View>

      <FlatList
        className="px-4 py-4"
        data={favoriteProperties}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        renderItem={renderProperty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
