import { Heart, MapPin, Star } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { usePropertyStore } from "../property.store";
import type { Property } from "../property.type";

type PropertyCardProps = {
  property: Property;
  onPress: () => void;
};

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const { toggleFavorite } = usePropertyStore();

  const formatPrice = (price: number) => {
    return `KES ${price.toLocaleString()}`;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="mb-4 rounded-xl bg-white shadow-lg"
      onPress={onPress}
    >
      <View className="relative">
        <Image
          className="h-50 w-full rounded-t-xl"
          source={{ uri: property.images[0] }}
        />
        <TouchableOpacity
          className="absolute top-3 right-3 h-9 w-9 items-center justify-center rounded-full bg-black/30"
          onPress={() => toggleFavorite(property.id)}
        >
          <Heart
            color={property.isFavorite ? "#FF3B30" : "#FFFFFF"}
            fill={property.isFavorite ? "#FF3B30" : "transparent"}
            size={20}
          />
        </TouchableOpacity>
        {property.landlord.verified && (
          <View className="absolute top-3 left-3 rounded-md bg-green-500 px-2 py-1">
            <Text className="font-semibold text-white text-xs">Verified</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <View className="mb-2 flex-row items-start justify-between">
          <Text
            className="mr-2 flex-1 font-semibold text-black text-lg"
            numberOfLines={1}
          >
            {property.title}
          </Text>
          <Text className="font-bold text-base text-blue-500">
            {formatPrice(property.price)}/month
          </Text>
        </View>

        <View className="mb-2 flex-row items-center">
          <MapPin color="#8E8E93" size={14} />
          <Text className="ml-1 text-gray-500 text-sm">
            {property.location.area}, {property.location.county}
          </Text>
        </View>

        <View className="mb-3 flex-row items-center">
          <Text className="mr-2 text-gray-600 text-sm">
            {property.features.bedrooms} bed • {property.features.bathrooms}{" "}
            bath
          </Text>
          {property.features.furnished && (
            <Text className="rounded bg-gray-100 px-2 py-0.5 font-medium text-blue-500 text-xs">
              Furnished
            </Text>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Star color="#FFD700" fill="#FFD700" size={14} />
            <Text className="ml-1 text-gray-600 text-sm">
              {property.rating} ({property.reviewCount})
            </Text>
          </View>
          <Text className="font-medium text-gray-500 text-xs">
            {property.propertyType.replace("-", " ").toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
