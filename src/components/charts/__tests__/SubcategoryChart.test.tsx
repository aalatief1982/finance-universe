import { describe, it, expect } from 'vitest';
import { chunkSubcategoryData, MAX_SUBCATEGORIES } from '../SubcategoryChart';

describe('chunkSubcategoryData', () => {
  it('splits subcategories into chunks of MAX_SUBCATEGORIES', () => {
    const data = Array.from({ length: 15 }, (_, i) => ({ name: `S${i}`, value: i }));
    const chunks = chunkSubcategoryData(data);
    expect(chunks.length).toBe(Math.ceil(data.length / MAX_SUBCATEGORIES));
    expect(chunks[0].length).toBe(MAX_SUBCATEGORIES);
    expect(chunks[1].length).toBe(MAX_SUBCATEGORIES);
    expect(chunks[2].length).toBe(data.length - MAX_SUBCATEGORIES * 2);
  });
});
