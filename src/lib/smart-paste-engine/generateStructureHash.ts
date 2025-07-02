import SHA256 from 'crypto-js/sha256';

export function generateStructureHash(template: string): string {
  return SHA256(template).toString();
}
