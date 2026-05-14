import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Operator Portal · CarRentDesk",
    template: "%s · Operator Portal",
  },
  robots: { index: false, follow: false },
};

/**
 * Operator portal layout.
 * Auth guarding is done in middleware — by the time any /app/* page renders,
 * the session cookie is guaranteed to exist (or the user was redirected away).
 */
export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
