import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { reviewService } from "/src/modules/business/review/services/reviewService";

const quickAnswers = {
  marketplace: "Marketplace connects buyers with business sellers. Login, open Marketplace, then browse products or manage listings if you are a business account.",
  social: "The social feed supports posts, reels, stories, reactions, comments, shares, saves and reports.",
  support: "After login, open Support to report a problem, read admin responses, or publish a website review.",
  xp: "XP is earned from real posts. Education and news posts give more XP than general posts."
};

function unwrapReviews(response) {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

export default function LandingPage() {
  const [reviews, setReviews] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", text: "Ask about marketplace, social feed, support, or XP." }
  ]);
  const [chatText, setChatText] = useState("");

  useEffect(() => {
    reviewService.list()
      .then((response) => setReviews(unwrapReviews(response).slice(0, 6)))
      .catch(() => setReviews([]));
  }, []);

  const sendChat = (event) => {
    event.preventDefault();
    const cleanText = chatText.trim();
    if (!cleanText) return;
    const lower = cleanText.toLowerCase();
    const key = Object.keys(quickAnswers).find((item) => lower.includes(item));
    const answer = quickAnswers[key] || "Login or sign up to use the full AgroLink Hub workspace. For specific problems, use the Support page after login.";
    setChatMessages((previous) => [...previous, { type: "user", text: cleanText }, { type: "bot", text: answer }].slice(-8));
    setChatText("");
  };

  return (
    <main className="landing-page-public">
      <section className="landing-hero">
        <nav className="landing-nav">
          <Link className="landing-brand" to="/">
            <img src={agroLinkHubLogo} alt="AgroLink Hub" />
            <span>AgroLink Hub</span>
          </Link>
          <div>
            <Link to="/login">Login</Link>
            <Link className="landing-nav-cta" to="/signup">Sign Up</Link>
          </div>
        </nav>

        <div className="landing-hero-grid">
          <div className="landing-copy">
            <span className="auth-badge">Agro + Link + Hub</span>
            <h1>Social farming, business, marketplace and planning in one workspace.</h1>
            <p>
              Connect farmers, buyers, business sellers and communities with posts, reels, stories,
              marketplace products, orders, calendars, reviews and admin-supported safety.
            </p>
            <div className="landing-actions">
              <Link className="btn btn-primary" to="/signup">Create Account</Link>
              <Link className="btn btn-secondary" to="/login">Login</Link>
            </div>
          </div>

          <aside className="landing-showcase-card">
            <span>Live Platform</span>
            <h2>Community + Commerce</h2>
            <div className="landing-feature-stack">
              <article><strong>Social</strong><p>Feed, stories, reels, chat and reactions.</p></article>
              <article><strong>Business</strong><p>Products, orders, pages and analytics.</p></article>
              <article><strong>Safety</strong><p>Reports, admin reviews, warnings and support.</p></article>
            </div>
          </aside>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <span>Public Reviews</span>
          <h2>What members say</h2>
        </div>
        <div className="landing-review-grid">
          {reviews.length ? reviews.map((review) => (
            <article className="landing-review-card" key={review.id}>
              <strong>{review.username || "AgroLink member"}</strong>
              <span>{"*".repeat(Math.max(1, Number(review.rating || 5)))}</span>
              <p>{review.comment}</p>
            </article>
          )) : <article className="landing-review-card"><strong>No public reviews yet</strong><p>Login and open Support to publish the first real website review.</p></article>}
        </div>
      </section>

      <section className="landing-chatbot">
        <div>
          <span>Landing Chat Bot</span>
          <h2>Ask before joining</h2>
          <p>Quick answers for visitors. Login for real chat, support tickets and admin responses.</p>
        </div>
        <form className="landing-bot-card" onSubmit={sendChat}>
          <div className="landing-bot-messages">
            {chatMessages.map((message, index) => (
              <p key={`${message.type}-${index}`} className={message.type}>{message.text}</p>
            ))}
          </div>
          <div className="landing-bot-input">
            <input
              value={chatText}
              onChange={(event) => setChatText(event.target.value)}
              placeholder="Ask about marketplace, support, XP..."
            />
            <button type="submit">Ask</button>
          </div>
        </form>
      </section>
    </main>
  );
}
