export default function ContactsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-32 rounded bg-muted" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-md border border-border">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
          >
            <div className="h-9 w-9 rounded-full bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
