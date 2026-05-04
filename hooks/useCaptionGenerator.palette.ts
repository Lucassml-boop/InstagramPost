import {
  parseBrandColors,
  serializeBrandColors
} from "@/components/create-post/utils";

export function getDefaultBrandColors() {
  return serializeBrandColors({
    primary: "#d62976",
    background: "#101828",
    support: "",
    accent: ""
  });
}

export function isLegacyDefaultPalette(value: string) {
  const palette = parseBrandColors(value);
  return (
    palette.primary === "#d62976" &&
    palette.background === "#101828" &&
    palette.support === "#f59e0b" &&
    palette.accent === "#f8fafc"
  );
}

export function normalizeLegacyPalette(value: string, defaultBrandColors: string) {
  return isLegacyDefaultPalette(value) ? defaultBrandColors : value;
}
