const WEB_FONT_STACK =
  'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

const FONTS = {
  regular: {
    fontFamily: WEB_FONT_STACK,
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: WEB_FONT_STACK,
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: WEB_FONT_STACK,
    fontWeight: '600' as const,
  },
  heavy: {
    fontFamily: WEB_FONT_STACK,
    fontWeight: '700' as const,
  },
};

export const NAV_THEME = {
  light: {
    dark: false,
    colors: {
      background: 'hsl(0 0% 100%)', // background
      border: 'hsl(240 5.9% 90%)', // border
      card: 'hsl(0 0% 100%)', // card
      notification: 'hsl(0 84.2% 60.2%)', // destructive
      primary: 'hsl(240 5.9% 10%)', // primary
      text: 'hsl(240 10% 3.9%)', // foreground
    },
    fonts: FONTS,
  },
  dark: {
    dark: true,
    colors: {
      background: 'hsl(240 10% 3.9%)', // background
      border: 'hsl(240 3.7% 15.9%)', // border
      card: 'hsl(240 10% 3.9%)', // card
      notification: 'hsl(0 72% 51%)', // destructive
      primary: 'hsl(0 0% 98%)', // primary
      text: 'hsl(0 0% 98%)', // foreground
    },
    fonts: FONTS,
  },
};
