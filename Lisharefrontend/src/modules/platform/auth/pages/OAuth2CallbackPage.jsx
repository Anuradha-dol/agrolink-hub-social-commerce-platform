import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { getUserLandingPath } from "../utils/roleRedirect";

export default function OAuth2CallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { pushToast } = useToast();
  const [message, setMessage] = useState("Completing Google sign in...");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(location.search);

    async function completeGoogleSignIn() {
      if (params.get("oauth2") === "failed") {
        const errorMessage = params.get("message") || "Google sign in failed";
        pushToast(errorMessage, "error");
        navigate(`/login?oauth2=failed&message=${encodeURIComponent(errorMessage)}`, { replace: true });
        return;
      }

      try {
        const currentUser = await refreshUser();
        if (!active) return;

        if (!currentUser) {
          throw new Error("Session was not created");
        }

        setMessage("Redirecting to your workspace...");
        pushToast("Google sign in successful", "success");
        navigate(getUserLandingPath(currentUser), { replace: true });
      } catch {
        if (!active) return;
        const errorMessage = "Could not complete Google sign in";
        pushToast(errorMessage, "error");
        navigate(`/login?oauth2=failed&message=${encodeURIComponent(errorMessage)}`, { replace: true });
      }
    }

    completeGoogleSignIn();
    return () => {
      active = false;
    };
  }, [location.search, navigate, pushToast, refreshUser]);

  return (
    <main className="auth-ref-page auth-oauth-callback-ref">
      <Link className="auth-brand-ref" to="/" aria-label="AgroLink Hub home">
        <img src={agroLinkHubLogo} alt="" />
        <span><strong>AgroLink <em>Hub</em></strong><small>Connect. Share. Sell. Grow Together.</small></span>
      </Link>

      <section className="auth-oauth-card" aria-live="polite">
        <span className="auth-oauth-spinner" aria-hidden="true" />
        <h1>Google Sign In</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
