export const getFriendlyMessage = (err: unknown): string => {
  const message = typeof err === 'string' ? err : (err as any)?.message ?? '';
  if (message.toLowerCase().includes('permission')) {
    return 'SMS permission is required to continue.';
  }
  if (message.toLowerCase().includes('storage')) {
    return 'There was a problem saving your data. Please try again.';
  }
  return 'Something went wrong. Please try again later.';
};
