
// Re-export from the refactored module
export { UserContext, UserProvider, useUser } from './user/UserContext';

// This file is kept for backward compatibility
// All functionality has been moved to separate modules:
// - src/context/user/UserContext.tsx (main context provider)
// - src/context/user/types.ts (type definitions)
// - src/context/user/auth-utils.ts (authentication utilities)
// - src/context/user/preferences-utils.ts (preferences utilities)
// - src/context/user/theme-utils.ts (theme utilities)
