import { useToast } from "../hooks/useToast";

export default function ToastHost() {
  const { toasts } = useToast();

  return (
    <div className="toast-host">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
