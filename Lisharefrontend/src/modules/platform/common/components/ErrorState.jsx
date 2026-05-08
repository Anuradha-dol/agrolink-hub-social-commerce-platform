export default function ErrorState({ message = "Something went wrong", onRetry }) {
  return (
    <div className="state-card state-error">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
