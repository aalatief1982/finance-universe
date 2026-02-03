interface Item {
  name: string;
  value: number;
  [key: string]: unknown;
}

export const MAX_SUBCATEGORIES = 6;

export const chunkSubcategoryData = (items: Item[], size: number = MAX_SUBCATEGORIES) => {
  const chunks: Item[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export type { Item };
