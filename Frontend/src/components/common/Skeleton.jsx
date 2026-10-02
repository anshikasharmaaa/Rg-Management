export const Skeleton = ({ className = "" }) => (
    <div
        aria-hidden="true"
        className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
);

export const StatGridSkeleton = ({
    count = 4,
    className = "grid grid-cols-2 gap-4 sm:grid-cols-4",
}) => (
    <div className={className} role="status" aria-label="Loading">
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-card"
            >
                <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="mt-4 h-7 w-16" />
            </div>
        ))}
    </div>
);

export const CardGridSkeleton = ({
    count = 8,
    image = true,
    className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}) => (
    <div className={className} role="status" aria-label="Loading">
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-card"
            >
                {image && <Skeleton className="mb-3 h-32 w-full rounded-lg" />}
                <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <div className="mt-4 flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

export const FoodCardSkeleton = ({ count = 6 }) => (
    <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-label="Loading menu"
    >
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card"
            >
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="mt-3 h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-3/4" />
                </div>
            </div>
        ))}
    </div>
);

export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
    <div
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card"
        role="status"
        aria-label="Loading"
    >
        <div className="flex gap-6 border-b border-gray-200 bg-gray-50 px-5 py-3">
            {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-3 flex-1" />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
            <div
                key={r}
                className="flex gap-6 border-b border-gray-100 px-5 py-4 last:border-0"
            >
                {Array.from({ length: cols }).map((_, c) => (
                    <Skeleton key={c} className="h-4 flex-1" />
                ))}
            </div>
        ))}
    </div>
);

// For use INSIDE an existing <tbody>
export const TableRowsSkeleton = ({ rows = 5, cols = 6 }) => (
    <>
        {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-gray-100 last:border-0">
                {Array.from({ length: cols }).map((_, c) => (
                    <td key={c} className="px-5 py-4">
                        <Skeleton className="h-4 w-full" />
                    </td>
                ))}
            </tr>
        ))}
    </>
);

export const ListSkeleton = ({ rows = 4 }) => (
    <div className="space-y-2" role="status" aria-label="Loading">
        {Array.from({ length: rows }).map((_, i) => (
            <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-card"
            >
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="mt-3 h-3 w-2/3" />
                <Skeleton className="mt-3 h-3 w-24" />
            </div>
        ))}
    </div>
);

export const ChartSkeleton = ({ count = 4 }) => (
    <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        role="status"
        aria-label="Loading charts"
    >
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-card"
            >
                <Skeleton className="mb-4 h-4 w-40" />
                <Skeleton className="h-64 w-full" />
            </div>
        ))}
    </div>
);