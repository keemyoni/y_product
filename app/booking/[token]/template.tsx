import { PageTransition } from "@/components/ux/page-transition";

export default function BookingTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
