// Visible indicator that the backend auth bypass is active (prototype only).
// Driven by VITE_AUTH_BYPASS so it disappears automatically once real MSAL
// auth is wired up post-prototype.

const DEV_USER = 'admin@mcmaster.ca';

export function DevModeBanner() {
  if (import.meta.env.VITE_AUTH_BYPASS !== 'true') return null;

  return (
    <div
      role="status"
      className="bg-mcmaster-gold px-4 py-2 text-center text-sm font-medium text-mcmaster-maroon-dark"
    >
      ⚠ DEV MODE — auth bypassed, acting as {DEV_USER}
    </div>
  );
}
