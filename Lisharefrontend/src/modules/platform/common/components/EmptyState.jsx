export default function EmptyState({ title = "No data found", subtitle = "Try again later." }) {
  return (
    <div className="state-card">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}
