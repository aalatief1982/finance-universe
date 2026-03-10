/**
 * @file startup-ready.ts
 * @description Lightweight startup readiness signaling for coordinated splash → content handoff.
 *
 * Two independent signals must fire before the splash hides:
 *   1. routeReady  – initial route decision is final (AppRoutes)
 *   2. contentReady – first visible content is painted / decoded
 *        • returning user: signaled immediately when route is decided
 *        • new user (onboarding): signaled when slide 1 image loads
 *
 * AppLoader subscribes via onStartupReady() and hides splash when both signals fire.
 */

type ReadyCallback = () => void;

let routeResolved = false;
let contentResolved = false;
let listener: ReadyCallback | null = null;

const checkAndNotify = () => {
  if (routeResolved && contentResolved && listener) {
    const cb = listener;
    listener = null;
    cb();
  }
};

/** Called by AppRoutes when initialRouteCheckDone becomes true. */
export const signalRouteReady = () => {
  if (routeResolved) return;
  routeResolved = true;
  checkAndNotify();
};

/** Called when first visible content is ready (image load or immediate for returning users). */
export const signalContentReady = () => {
  if (contentResolved) return;
  contentResolved = true;
  checkAndNotify();
};

/** Subscribe to be notified when both signals have fired. If already fired, calls back synchronously. */
export const onStartupReady = (cb: ReadyCallback) => {
  if (routeResolved && contentResolved) {
    cb();
    return;
  }
  listener = cb;
};
