import { EmptyState } from "@/components/ui";
import { getMemberBooking } from "@/lib/server/view-models";
import { BookingClient } from "./booking-client";

export default async function MemberBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await getMemberBooking(token);

  if (!view) {
    return (
      <main id="main-content" className="min-h-screen px-4 py-6 md:py-10">
        <div className="mx-auto max-w-md">
          <EmptyState title="유효하지 않은 링크입니다" description="예약 링크가 재발급되었거나 잘못된 주소일 수 있습니다." />
        </div>
      </main>
    );
  }

  return <BookingClient view={view} />;
}
