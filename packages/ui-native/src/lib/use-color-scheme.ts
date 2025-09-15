import { useColorScheme as useNativewindColorScheme } from 'nativewind';

export function useColorScheme() {
  const nativewindColorScheme = useNativewindColorScheme();

  return {
    colorScheme: nativewindColorScheme.colorScheme ?? 'dark',
    isDarkColorScheme: nativewindColorScheme.colorScheme === 'dark',
    setColorScheme: nativewindColorScheme.setColorScheme.bind(
      nativewindColorScheme,
    ),
    toggleColorScheme: nativewindColorScheme.toggleColorScheme.bind(
      nativewindColorScheme,
    ),
  };
}
