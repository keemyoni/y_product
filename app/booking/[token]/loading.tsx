import { Skeleton } from "@/components/ux/skeleton";

export default function BookingLoading() {
  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="mx-auto max-w-md space-y-5">
        <Skeleton className="h-56 rounded-[1.25rem]" />
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </main>
  );
}
