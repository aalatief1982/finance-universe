export const formatVendorDisplay = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
