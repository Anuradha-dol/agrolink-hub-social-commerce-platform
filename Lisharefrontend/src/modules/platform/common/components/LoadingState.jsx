export default function LoadingState({ text = "Loading..." }) {
  return (
    <div className="state-card">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
