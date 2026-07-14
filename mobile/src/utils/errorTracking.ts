// Inert until EXPO_PUBLIC_SENTRY_DSN is set — no Sentry account exists for
// this project yet. Using the browser SDK (not @sentry/react-native)
// deliberately: this app only ships as a web build today (Vercel), and the
// browser SDK is pure JS with no native-module/config-plugin surface to
// risk breaking the Expo web export. Loaded dynamically rather than at the
// top of the bundle — @sentry/browser adds ~1.5MB, and there's no reason
// to ship that to every visitor while the DSN is unset and it does
// nothing. Once a real DSN is configured, this becomes a real (small,
// one-time) lazy-loaded chunk on first use instead of dead weight upfront.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
let sentryPromise: Promise<typeof import("@sentry/browser")> | null = null;

function getSentry() {
  if (!dsn) return null;
  if (!sentryPromise) {
    sentryPromise = import("@sentry/browser").then((Sentry) => {
      Sentry.init({ dsn, environment: process.env.NODE_ENV || "production", tracesSampleRate: 0.1 });
      return Sentry;
    });
  }
  return sentryPromise;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  const sentry = getSentry();
  if (!sentry) return;
  sentry.then((Sentry) => Sentry.captureException(error, context ? { extra: context } : undefined)).catch(() => {});
}
