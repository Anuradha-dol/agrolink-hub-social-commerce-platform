import { useEffect, useMemo, useState } from "react";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { supportService } from "../services/supportService";
import { reviewService } from "/src/modules/business/review/services/reviewService";

const unwrapList = (response) => {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

export default function SupportCenterPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [question, setQuestion] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const displayName = useMemo(
    () => `${user?.firstName || user?.name || ""} ${user?.lastName || ""}`.trim() || "AgroLink member",
    [user]
  );
  const firstName = displayName.split(" ")[0] || "there";

  const load = async () => {
    setLoading(true);
    try {
      const [ticketsResponse, reviewsResponse] = await Promise.all([
        supportService.mine(),
        reviewService.list()
      ]);
      setTickets(unwrapList(ticketsResponse));
      setReviews(unwrapList(reviewsResponse).slice(0, 8));
    } catch {
      pushToast("Failed to load support center", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitTicket = async (event) => {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      pushToast("Write the problem before submitting", "error");
      return;
    }

    setSubmittingTicket(true);
    try {
      await supportService.create({
        email: user?.email || "",
        question: cleanQuestion
      });
      setQuestion("");
      pushToast("Problem sent to admin", "success");
      await load();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to send problem", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    const cleanComment = reviewComment.trim();
    if (!cleanComment) {
      pushToast("Write your review before submitting", "error");
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewService.create({
        comment: cleanComment,
        rating: Number(rating),
        status: "PUBLISHED"
      });
      setReviewComment("");
      setRating(5);
      pushToast("Review published", "success");
      await load();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to publish review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <LoadingState text="Loading support center..." />;

  return (
    <div className="support-center-page">
      <section className="page-hero support-hero-panel support-reference-hero">
        <div className="support-reference-copy">
          <span className="auth-badge">Message Center</span>
          <h2>Hi {firstName}, how can we help you today?</h2>
          <p>Find answers, send problem reports, read admin responses, and publish real reviews for AgroLink Hub.</p>
          <div className="support-help-search" aria-hidden="true">
            <span>Search help articles, guides or FAQs...</span>
          </div>
          <div className="support-suggestion-row" aria-label="Popular support topics">
            {["Place an order", "Track delivery", "Plan & Grow", "Payment & Refunds"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="support-reference-art" aria-hidden="true">
          <span className="support-leaf-bubble">Fresh help</span>
          <span className="support-orbit-dot one" />
          <span className="support-orbit-dot two" />
        </div>
        <div className="hero-stats">
          <article>
            <strong>{tickets.length}</strong>
            <span>My Reports</span>
          </article>
          <article>
            <strong>{reviews.length}</strong>
            <span>Public Reviews</span>
          </article>
        </div>
      </section>

      {user?.moderationMessage ? (
        <section className={`moderation-message-card ${String(user?.moderationStatus || "").toLowerCase()}`}>
          <span>{user?.moderationStatus || "ADMIN MESSAGE"}</span>
          <h3>Admin Message</h3>
          <p>{user.moderationMessage}</p>
        </section>
      ) : null}

      <div className="support-grid">
        <form className="card support-form-card" onSubmit={submitTicket}>
          <h2>Tell Admin a Problem</h2>
          <p>Use this for bugs, marketplace issues, unsafe content, account problems, or feature problems.</p>
          <label>
            Your account
            <input value={`${displayName} - ${user?.email || ""}`} readOnly />
          </label>
          <label>
            Problem details
            <textarea
              rows={7}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Explain what happened, where it happened, and what admin should review..."
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submittingTicket}>
            {submittingTicket ? "Sending..." : "Send Problem"}
          </button>
        </form>

        <form className="card support-form-card" onSubmit={submitReview}>
          <h2>Publish Website Review</h2>
          <p>Reviews are public and can be shown on the landing page.</p>
          <label>
            Rating
            <select value={rating} onChange={(event) => setRating(event.target.value)}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} stars</option>
              ))}
            </select>
          </label>
          <label>
            Review
            <textarea
              rows={7}
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Tell visitors what AgroLink Hub helped you do..."
            />
          </label>
          <button className="btn btn-secondary" type="submit" disabled={submittingReview}>
            {submittingReview ? "Publishing..." : "Publish Review"}
          </button>
        </form>
      </div>

      <section className="card support-ticket-list">
        <h2>My Problem Reports</h2>
        {tickets.length ? (
          <div className="support-ticket-scroll">
            {tickets.map((ticket) => (
              <article className="support-ticket-card" key={ticket.id}>
                <div>
                  <strong>{ticket.status || "OPEN"}</strong>
                  <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Recently"}</span>
                </div>
                <p>{ticket.question}</p>
                {ticket.adminResponse ? (
                  <blockquote>{ticket.adminResponse}</blockquote>
                ) : (
                  <small>Waiting for admin response.</small>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No problem reports submitted yet.</p>
        )}
      </section>
    </div>
  );
}
