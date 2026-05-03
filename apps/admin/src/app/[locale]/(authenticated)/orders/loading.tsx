// Skeleton placeholder while the orders list query runs. The list query
// joins orders + events + sellers + counts so it can take 1-2 seconds on
// busy events. This avoids the perception of a hung dashboard.
export default function OrdersLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-32 rounded bg-muted" />
      <div className="mt-6 flex gap-3">
        <div className="h-9 w-48 rounded-md bg-muted" />
        <div className="h-9 w-40 rounded-md bg-muted" />
        <div className="h-9 w-28 rounded-md bg-muted" />
      </div>
      <div className="mt-6 overflow-hidden rounded-md border border-border">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
