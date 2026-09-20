import { PageLoader } from "@/components/ui/Loader";

// Route-level loader for the retail module — shown centred while a page fetches.
export default function Loading() {
  return <PageLoader label="Loading…" />;
}
