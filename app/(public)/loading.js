export default function Loading() {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <div className="route-loading-bar" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
