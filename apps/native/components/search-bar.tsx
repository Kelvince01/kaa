import { Input } from "@kaa/ui-native";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  placeholder = "Search properties...",
}: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-white px-4 py-2">
      <View className="mr-3 flex-1">
        <Input
          //   containerStyle={styles.inputContainer}
          onChangeText={onChangeText}
          placeholder={placeholder}
          value={value}
        />
        <Search color="#8E8E93" size={20} />
      </View>
      <TouchableOpacity
        className="h-12 w-12 items-center justify-center rounded-lg bg-gray-100"
        onPress={onFilterPress}
      >
        <SlidersHorizontal color="#007AFF" size={24} />
      </TouchableOpacity>
    </View>
  );
}
