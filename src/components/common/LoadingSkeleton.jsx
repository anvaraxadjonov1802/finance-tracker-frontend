export function SkeletonBlock({ className = "" }) {
    return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
  }
  
  export function SkeletonCard() {
    return (
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <SkeletonBlock className="h-4 w-24 mb-3" />
        <SkeletonBlock className="h-8 w-36 mb-2" />
        <SkeletonBlock className="h-4 w-40" />
      </div>
    );
  }
  
  export function SkeletonListItem() {
    return (
      <div className="border rounded-2xl p-5">
        <SkeletonBlock className="h-5 w-40 mb-3" />
        <SkeletonBlock className="h-4 w-28 mb-4" />
        <SkeletonBlock className="h-4 w-full mb-2" />
        <SkeletonBlock className="h-4 w-2/3 mb-4" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    );
  }