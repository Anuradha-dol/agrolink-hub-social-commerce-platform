import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import heroBackground from "/src/assets/backgrounds/agrolink-landing-hero-marketplace-4k.jpg";
import socialFeatureImage from "/src/assets/backgrounds/landing-feature-social-friends-generated.jpg";
import commerceFeatureImage from "/src/assets/backgrounds/landing-feature-commerce-generated.jpg";
import workspaceFeatureImage from "/src/assets/backgrounds/landing-feature-workspace-generated.jpg";
import { reviewService } from "/src/modules/business/review/services/reviewService";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import { assistantService } from "/src/modules/social/chatbot/services/assistantService";

const quickAnswers = {
  marketplace: "Marketplace is for browsing products, saving items, building a cart, and placing orders with local sellers.",
  orders: "Orders keep buyer and seller updates in one place, from pending to completed.",
  seller: "Business and seller accounts can manage a page, publish products, follow orders, and review insights.",
  social: "The feed is where members share posts, stories, reels, comments, reactions, and messages.",
  support: "Support helps members report problems, read admin replies, and leave website reviews.",
  calendar: "Calendar is for events, tasks, meetings, birthdays, and reminders.",
  admin: "Admins can review users, reports, support tickets, and platform safety workflows."
};

const assistantPrompts = [
  "How does the marketplace work?",
  "How can sellers publish products?",
  "How do I reset my password?"
];

const heroHighlights = [
  "Community feed",
  "Marketplace orders",
  "Seller tools",
  "Support and safety"
];

const heroMetrics = [
  { value: "10K+", label: "Active users" },
  { value: "5K+", label: "Products listed" },
  { value: "2K+", label: "Local sellers" },
  { value: "100+", label: "Communities" }
];

const featureCards = [
  {
    label: "Social",
    title: "Share updates, stories, and media",
    text: "Posts, reels, stories, chat, followers, comments, and notifications keep the community active.",
    image: socialFeatureImage
  },
  {
    label: "Commerce",
    title: "Turn local products into orders",
    text: "Sellers can publish products while buyers browse, save, add to cart, and track purchases.",
    image: commerceFeatureImage
  },
  {
    label: "Workspace",
    title: "Keep the work organized",
    text: "Calendar, analytics, support tickets, admin reviews, and role-based tools sit beside the daily feed.",
    image: workspaceFeatureImage
  }
];

const workflowItems = [
  "Members share posts, stories, and product updates",
  "Customers discover products from the marketplace",
  "Sellers manage orders, chats, and reviews",
  "Support and admin tools keep the platform organized"
];

function unwrapReviews(response) {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function reviewName(review) {
  return review.username || review.userName || review.customerName || review.user?.username || review.user?.name || "AgroLink member";
}

function reviewAvatarUrl(review) {
  const value = review.profileImageUrl || review.userProfileImageUrl || review.avatarUrl || review.user?.profileImageUrl || "";
  if (!value) return "";
  if (/^(data:image\/|blob:)/i.test(value)) return value;
  return toMediaUrl(value);
}

function getAssistantAnswer(text) {
  const lower = text.toLowerCase();
  const key = Object.keys(quickAnswers).find((item) => lower.includes(item));
  if (key) return quickAnswers[key];
  if (lower.includes("sell") || lower.includes("seller") || lower.includes("business")) return quickAnswers.seller;
  if (lower.includes("buy") || lower.includes("product") || lower.includes("cart")) return quickAnswers.marketplace;
  if (lower.includes("chat") || lower.includes("post") || lower.includes("feed")) return quickAnswers.social;
  return "AgroLink Hub brings the social feed, marketplace, seller tools, calendar, chat, support, and admin safety into one connected workspace.";
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5h14a2.4 2.4 0 0 1 2.4 2.4v6.9a2.4 2.4 0 0 1-2.4 2.4h-6.4l-5.1 3.3a.9.9 0 0 1-1.4-.75V17.2H5a2.4 2.4 0 0 1-2.4-2.4V7.9A2.4 2.4 0 0 1 5 5.5Zm3.2 4.2h7.6M8.2 13h4.9" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12 20 4l-4.7 16-3.1-6.2L4 12Zm8.2 1.8L20 4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function shouldLetBrowserHandle(event) {
  return event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const landingRootRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", text: "Hi, ask me about AgroLink Hub. I answer from the platform knowledge base." }
  ]);
  const [chatText, setChatText] = useState("");

  useEffect(() => {
    reviewService.list()
      .then((response) => setReviews(unwrapReviews(response).slice(0, 3)))
      .catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    const root = landingRootRef.current;
    if (!root) return undefined;

    const animatedSelectors = [
      ".landing-section-head",
      ".landing-live-panel",
      ".landing-panel-list article",
      ".landing-feature-card",
      ".landing-story-band",
      ".landing-workflow-list li",
      ".landing-review-card"
    ].join(",");

    const revealItems = root.querySelectorAll(animatedSelectors);
    const driftItems = root.querySelectorAll([
      ".landing-live-panel",
      ".landing-panel-list article",
      ".landing-feature-card",
      ".landing-story-band",
      ".landing-workflow-list li",
      ".landing-review-card"
    ].join(","));

    revealItems.forEach((item, index) => {
      item.classList.add("landing-reveal-item");
      item.style.setProperty("--landing-reveal-delay", `${Math.min(index * 35, 220)}ms`);
    });

    driftItems.forEach((item) => {
      item.classList.add("landing-drift-item");
    });

    let observer;
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.14 });

      revealItems.forEach((item) => observer.observe(item));
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0;

    const updateDrift = () => {
      frameId = 0;
      if (reduceMotion) return;

      const viewportCenter = window.innerHeight / 2;
      driftItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const progress = Math.max(-1, Math.min(1, (viewportCenter - itemCenter) / window.innerHeight));

        item.style.setProperty("--landing-drift-x", "0px");
        item.style.setProperty("--landing-drift-y", `${(progress * -10).toFixed(2)}px`);
        item.style.setProperty("--landing-drift-rotate", "0deg");
      });
    };

    const scheduleDrift = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateDrift);
    };

    scheduleDrift();
    window.addEventListener("scroll", scheduleDrift, { passive: true });
    window.addEventListener("resize", scheduleDrift);

    return () => {
      if (observer) observer.disconnect();
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleDrift);
      window.removeEventListener("resize", scheduleDrift);
    };
  }, []);

  const sendChat = async (event, presetText) => {
    event?.preventDefault();
    const cleanText = (presetText || chatText).trim();
    if (!cleanText || chatLoading) return;

    setChatMessages((previous) => [
      ...previous,
      { type: "user", text: cleanText }
    ].slice(-10));
    setChatText("");
    setChatOpen(true);
    setChatLoading(true);

    try {
      const answer = await assistantService.ask(cleanText);
      setChatMessages((previous) => [
        ...previous,
        { type: "bot", text: answer || getAssistantAnswer(cleanText) }
      ].slice(-10));
    } catch {
      setChatMessages((previous) => [
        ...previous,
        { type: "bot", text: "I could not reach the knowledge base right now. Please make sure the backend server is running." }
      ].slice(-10));
    } finally {
      setChatLoading(false);
    }
  };

  const softNavigate = (to) => (event) => {
    if (shouldLetBrowserHandle(event)) return;
    event.preventDefault();
    const go = () => navigate(to);

    if (document.startViewTransition) {
      document.startViewTransition(go);
      return;
    }

    go();
  };

  return (
    <main ref={landingRootRef} className="landing-page-public landing-v2" style={{ "--landing-hero-image": `url(${heroBackground})` }}>
      <section className="landing-hero-v2">
        <div className="landing-hero-shade" />
        <nav className="landing-nav landing-nav-v2">
          <Link className="landing-brand" to="/" onClick={softNavigate("/")}>
            <img src={agroLinkHubLogo} alt="AgroLink Hub" />
            <span>AgroLink Hub</span>
          </Link>
          <div>
            <Link to="/login" onClick={softNavigate("/login")}>Login</Link>
            <Link className="landing-nav-cta" to="/signup" onClick={softNavigate("/signup")}>Create account</Link>
          </div>
        </nav>

        <div className="landing-hero-content">
          <div className="landing-hero-copy-v2">
            <span className="landing-kicker">Social marketplace for communities and businesses</span>
            <h1>
              <span className="landing-headline-line">One place for</span>
              <span className="landing-headline-line"><span className="landing-headline-accent">posts</span>, shops,</span>
              <span className="landing-headline-line">and daily work.</span>
            </h1>
            <p>
              AgroLink Hub gives members, sellers, buyers, and creators one place to share updates,
              sell products, manage orders, chat, plan tasks, and get support.
            </p>
            <div className="landing-actions landing-actions-v2">
              <Link className="landing-primary-action" to="/signup" onClick={softNavigate("/signup")}>Start with AgroLink</Link>
              <Link className="landing-secondary-action" to="/login" onClick={softNavigate("/login")}>Login</Link>
            </div>
            <div className="landing-highlight-row" aria-label="Platform highlights">
              {heroHighlights.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>

          <div className="landing-metric-strip" aria-label="AgroLink Hub platform numbers">
            {heroMetrics.map((metric) => (
              <article key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-feature-section">
        <div className="landing-section-head">
          <span>Built around real work</span>
          <h2>Social, selling, and support in the same flow.</h2>
        </div>
        <aside className="landing-live-panel landing-workspace-panel" aria-label="Platform areas">
          <span className="landing-panel-label">Inside the workspace</span>
          <div className="landing-panel-list">
            <article>
              <strong>Feed and stories</strong>
              <p>Community updates, media, reactions, comments, and messages.</p>
            </article>
            <article>
              <strong>Marketplace</strong>
              <p>Products, carts, orders, seller pages, reviews, and analytics.</p>
            </article>
            <article>
              <strong>Operations</strong>
              <p>Calendar planning, support tickets, reports, and admin moderation.</p>
            </article>
          </div>
        </aside>
        <div className="landing-feature-grid">
          {featureCards.map((feature) => (
            <article className="landing-feature-card" key={feature.label}>
              <figure className="landing-feature-card-media">
                <img src={feature.image} alt="" loading="lazy" decoding="async" />
              </figure>
              <div className="landing-feature-card-body">
                <span>{feature.label}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-story-band">
        <div className="landing-story-copy">
          <span>How it feels</span>
          <h2>Members can post, sell, reply, and plan without leaving the platform.</h2>
          <p>
            The product is shaped for communities and small businesses: practical tools first,
            with social activity keeping people connected between orders.
          </p>
        </div>
        <ol className="landing-workflow-list">
          {workflowItems.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>

      <section className="landing-section landing-review-section">
        <div className="landing-section-head">
          <span>Member voice</span>
          <h2>Real reviews can appear here.</h2>
        </div>
        <div className="landing-review-grid">
          {reviews.length ? reviews.map((review) => (
            <article className="landing-review-card" key={review.id}>
              <div className="landing-review-author">
                <span className="landing-review-avatar">
                  {reviewAvatarUrl(review) ? <img src={reviewAvatarUrl(review)} alt="" /> : reviewName(review).slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>{reviewName(review)}</strong>
                  <span>{`Rating ${Math.max(1, Number(review.rating || 5))}/5`}</span>
                </div>
              </div>
              <p>{review.comment}</p>
            </article>
          )) : (
            <article className="landing-review-card">
              <div className="landing-review-author">
                <span className="landing-review-avatar">A</span>
                <div>
                  <strong>Reviews are ready</strong>
                  <span>Member feedback</span>
                </div>
              </div>
              <p>Members can publish website reviews from the Support Center after joining.</p>
            </article>
          )}
        </div>
      </section>

      <div className={`landing-assistant ${chatOpen ? "open" : ""}`}>
        <button
          className="landing-assistant-launcher"
          type="button"
          aria-label={chatOpen ? "Close AgroLink assistant" : "Open AgroLink assistant"}
          aria-expanded={chatOpen}
          onClick={() => setChatOpen((open) => !open)}
        >
          {!chatOpen ? <span className="landing-assistant-cta-label">Ask assistant</span> : null}
          {chatOpen ? <CloseIcon /> : <ChatIcon />}
        </button>

        {chatOpen && (
          <aside className="landing-assistant-panel" aria-label="AgroLink assistant">
            <div className="landing-assistant-header">
              <div>
                <span>AgroLink assistant</span>
                <strong>Ask before joining</strong>
              </div>
              <button type="button" aria-label="Close assistant" onClick={() => setChatOpen(false)}>
                <CloseIcon />
              </button>
            </div>

            <div className="landing-assistant-messages">
              {chatMessages.map((message, index) => (
                <p key={`${message.type}-${index}`} className={message.type}>{message.text}</p>
              ))}
              {chatLoading ? <p className="bot">Searching the knowledge base...</p> : null}
            </div>

            <div className="landing-assistant-prompts">
              {assistantPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={(event) => sendChat(event, prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <form className="landing-assistant-form" onSubmit={sendChat}>
              <input
                value={chatText}
                onChange={(event) => setChatText(event.target.value)}
                placeholder="Ask about selling, orders, feed..."
              />
              <button type="submit" aria-label="Send message">
                <SendIcon />
              </button>
            </form>
          </aside>
        )}
      </div>
    </main>
  );
}
