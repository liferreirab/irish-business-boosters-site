import type { Metadata } from "next";
import Redirect from "@/components/Redirect";

// Old address (already shared in places): send people to /start.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function OldWorkWithUs() {
  return <Redirect to="/start" />;
}
