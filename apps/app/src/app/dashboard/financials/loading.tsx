export default function FinancialsLoading() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header Loading */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-96 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Metrics Cards Loading */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
            key={i.toString()}
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
            </div>
            <div>
              <div className="mb-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation Loading */}
      <div className="space-y-4">
        <div className="inline-flex h-10 w-full items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <div className="grid w-full grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                className="h-8 animate-pulse rounded bg-gray-200"
                key={i.toString()}
              />
            ))}
          </div>
        </div>

        {/* Content Area Loading */}
        <div className="min-h-[600px] space-y-4">
          <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                className="h-48 animate-pulse rounded-lg bg-gray-200"
                key={i.toString()}
              />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
