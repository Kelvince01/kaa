import { Button } from "@kaa/ui-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Bath,
  Bed,
  Car,
  Droplets,
  Heart,
  MapPin,
  Phone,
  Share,
  Shield,
  Star,
  Wifi,
  Zap,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePropertyStore } from "$/modules/properties/property.store";

const { width } = Dimensions.get("window");

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { properties, toggleFavorite } = usePropertyStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const property = properties.find((p) => p.id === id);

  if (!property) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-6 text-gray-600 text-lg">Property not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const formatPrice = (price: number) => {
    return `KES ${price.toLocaleString()}`;
  };

  const handleShare = () => {
    Alert.alert(
      "Share Property",
      "Share functionality would be implemented here"
    );
  };

  const handleContact = () => {
    router.push(`/chat/chat_${property.landlord.id}`);
  };

  const handleBookViewing = () => {
    Alert.alert(
      "Book Viewing",
      "Would you like to schedule a viewing for this property?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Book Now",
          onPress: () => {
            Alert.alert("Success", "Viewing request sent to landlord");
          },
        },
      ]
    );
  };

  const handleCall = () => {
    Alert.alert("Call Landlord", `Call ${property.landlord.name}?`);
  };

  const amenityIcons: { [key: string]: any } = {
    WiFi: Wifi,
    Parking: Car,
    Security: Shield,
    Water: Droplets,
    Electricity: Zap,
  };

  const renderImageGallery = () => (
    <View className="relative h-75">
      <ScrollView
        horizontal
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(index);
        }}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {property.images.map((image, index) => (
          <Image
            className="h-75 w-full"
            key={`${index}-${image}`}
            source={{ uri: image }}
          />
        ))}
      </ScrollView>

      <View className="absolute right-4 bottom-4 rounded-2xl bg-black/70 px-3 py-1.5">
        <Text className="font-semibold text-sm text-white">
          {currentImageIndex + 1} / {property.images.length}
        </Text>
      </View>

      <View className="absolute top-4 right-4 left-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
          onPress={() => router.back()}
        >
          <ArrowLeft color="#000000" size={24} />
        </TouchableOpacity>
        <View className="flex-row">
          <TouchableOpacity
            className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-white/90"
            onPress={handleShare}
          >
            <Share color="#000000" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-white/90"
            onPress={() => toggleFavorite(property.id)}
          >
            <Heart
              color={property.isFavorite ? "#FF3B30" : "#000000"}
              fill={property.isFavorite ? "#FF3B30" : "transparent"}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {renderImageGallery()}

        <View className="p-4">
          <View className="mb-6">
            <View className="mb-2 flex-row items-start justify-between">
              <Text className="mr-4 flex-1 font-bold text-2xl text-black">
                {property.title}
              </Text>
              <Text className="font-bold text-blue-500 text-xl">
                {formatPrice(property.price)}/month
              </Text>
            </View>

            <View className="mb-2 flex-row items-center">
              <MapPin color="#8E8E93" size={16} />
              <Text className="ml-1 text-base text-gray-500">
                {property.location.area}, {property.location.county}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Star color="#FFD700" fill="#FFD700" size={16} />
              <Text className="ml-1 text-base text-gray-600">
                {property.rating} ({property.reviewCount} reviews)
              </Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-3 font-semibold text-black text-xl">
              Property Features
            </Text>
            <View className="flex-row flex-wrap items-center">
              <View className="mr-6 mb-2 flex-row items-center">
                <Bed color="#007AFF" size={20} />
                <Text className="ml-2 text-base text-gray-600">
                  {property.features.bedrooms} Bedroom
                  {property.features.bedrooms > 1 ? "s" : ""}
                </Text>
              </View>
              <View className="mr-6 mb-2 flex-row items-center">
                <Bath color="#007AFF" size={20} />
                <Text className="ml-2 text-base text-gray-600">
                  {property.features.bathrooms} Bathroom
                  {property.features.bathrooms > 1 ? "s" : ""}
                </Text>
              </View>
              {property.features.parking && (
                <View className="mr-6 mb-2 flex-row items-center">
                  <Car color="#007AFF" size={20} />
                  <Text className="ml-2 text-base text-gray-600">Parking</Text>
                </View>
              )}
              {property.features.furnished && (
                <View className="mr-2 mb-2 rounded-2xl bg-blue-50 px-3 py-1.5">
                  <Text className="font-semibold text-blue-500 text-sm">
                    Furnished
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-3 font-semibold text-black text-xl">
              Amenities
            </Text>
            <View className="flex-row flex-wrap">
              {property.amenities.map((amenity, index) => {
                const IconComponent = amenityIcons[amenity] || Shield;
                return (
                  <View
                    className="mb-3 w-1/2 flex-row items-center"
                    key={`${index}-${amenity}`}
                  >
                    <IconComponent color="#34C759" size={18} />
                    <Text className="ml-2 text-base text-gray-600">
                      {amenity}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-3 font-semibold text-black text-xl">
              Description
            </Text>
            <Text className="text-base text-gray-600 leading-6">
              {property.description}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="mb-3 font-semibold text-black text-xl">
              Landlord
            </Text>
            <View className="flex-row items-center rounded-lg bg-gray-50 p-4">
              <Image
                className="mr-3 h-15 w-15 rounded-full"
                source={{ uri: property.landlord.avatar }}
              />
              <View className="flex-1">
                <View className="mb-1 flex-row items-center">
                  <Text className="mr-2 font-semibold text-black text-lg">
                    {property.landlord.name}
                  </Text>
                  {property.landlord.verified && (
                    <View className="flex-row items-center rounded-xl bg-green-500 px-2 py-0.5">
                      <Shield color="#FFFFFF" size={12} />
                      <Text className="ml-1 font-semibold text-white text-xs">
                        Verified
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center">
                  <Star color="#FFD700" fill="#FFD700" size={14} />
                  <Text className="ml-1 text-gray-600 text-sm">
                    {property.landlord.rating} rating
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row items-center border-gray-200 border-t bg-white px-4 py-4">
        <TouchableOpacity
          className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-50"
          onPress={handleCall}
        >
          <Phone color="#007AFF" size={20} />
        </TouchableOpacity>
        <Button
          className="mr-3 flex-1"
          onPress={handleContact}
          variant="outline"
        >
          Message
        </Button>
        <Button className="flex-1" onPress={handleBookViewing}>
          Book Viewing
        </Button>
      </View>
    </SafeAreaView>
  );
}
