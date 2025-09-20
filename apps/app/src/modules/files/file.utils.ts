export function removeFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) return filename; // No extension found
  return filename.substring(0, lastDotIndex);
}

export function removeAllExtensions(filename: string) {
  const firstDotIndex = filename.indexOf(".");
  if (firstDotIndex === -1) return filename;
  return filename.substring(0, firstDotIndex);
}
