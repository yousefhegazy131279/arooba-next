export default function ListSkeleton({ label = 'جاري التحميل', count = 6 }: { label?: string; count?: number }) {
  return <div className="list-skeleton" role="status" aria-label={label} aria-busy="true">
    <span className="sr-only">{label}</span>
    {Array.from({ length: count }, (_, index) => <div className="skeleton-card" key={index} aria-hidden="true"><div /><span /><span /></div>)}
  </div>;
}
