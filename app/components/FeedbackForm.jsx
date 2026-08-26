"use client";

/**
 * FeedbackForm — 5-dimensional satisfaction rating component.
 * Allows users to provide structured feedback on:
 * 1. Overall Experience
 * 2. Venue Quality & Atmosphere
 * 3. Menu & Dining Experience
 * 4. Decoration & Aesthetic Theme
 * 5. Value for Money / Budget Efficiency
 *
 * Feeds directly into the adaptive learning loop.
 */

import { useState } from "react";
import { Star, CheckCircle, Send, MessageSquare } from "lucide-react";
import { submitEventFeedback } from "../(public)/events/actions";

const DIMENSIONS = [
  { key: "venue_rating", label: "Venue Atmosphere & Comfort" },
  { key: "menu_rating", label: "Catering & Menu Quality" },
  { key: "decor_rating", label: "Decoration & Theme Aesthetics" },
  { key: "value_rating", label: "Value for Money & Budget Fit" },
];

export default function FeedbackForm({ bookingId, eventSummary, onSuccess }) {
  const [overallRating, setOverallRating] = useState(5);
  const [dimensionRatings, setDimensionRatings] = useState({
    venue_rating: 5,
    menu_rating: 5,
    decor_rating: 5,
    value_rating: 5,
  });
  const [comment, setComment] = useState("");
  const [wouldRebook, setWouldRebook] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [learnedInfo, setLearnedInfo] = useState(null);

  const handleStarClick = (dimKey, starValue) => {
    if (dimKey === "overall") {
      setOverallRating(starValue);
    } else {
      setDimensionRatings((prev) => ({ ...prev, [dimKey]: starValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await submitEventFeedback({
        booking_id: bookingId,
        overall_rating: overallRating,
        venue_rating: dimensionRatings.venue_rating,
        menu_rating: dimensionRatings.menu_rating,
        decor_rating: dimensionRatings.decor_rating,
        value_rating: dimensionRatings.value_rating,
        comment: comment.trim(),
        would_rebook: wouldRebook,
      });

      if (res.ok) {
        setSuccess(true);
        if (res.learning_triggered) {
          setLearnedInfo("System objective weights automatically re-calibrated based on your feedback!");
        }
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || "Failed to submit feedback.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="feedback-success-card">
        <CheckCircle size={48} className="text-emerald" />
        <h3>Thank You for Your Feedback!</h3>
        <p>Your review directly trains our hybrid AI coordinator to deliver even more accurate recommendations.</p>
        {learnedInfo && (
          <div className="feedback-badge-learned">
            <span>✨ {learnedInfo}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      {eventSummary && (
        <div className="feedback-header">
          <h3>Rate Your Event Experience</h3>
          <p className="feedback-sub">{eventSummary}</p>
        </div>
      )}

      {error && <div className="err mb-4">{error}</div>}

      {/* Overall Rating */}
      <div className="feedback-overall-box">
        <label className="feedback-label-main">Overall Satisfaction</label>
        <div className="feedback-stars large">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className={`star-btn ${star <= overallRating ? "active" : ""}`}
              onClick={() => handleStarClick("overall", star)}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <Star size={28} fill={star <= overallRating ? "#C5A880" : "none"} stroke="#C5A880" />
            </button>
          ))}
          <span className="feedback-score-text">{overallRating} / 5</span>
        </div>
      </div>

      {/* 4-Dimensional Breakdown */}
      <div className="feedback-dimensions-grid">
        {DIMENSIONS.map((dim) => {
          const currentVal = dimensionRatings[dim.key];
          return (
            <div key={dim.key} className="feedback-dim-item">
              <span className="feedback-dim-label">{dim.label}</span>
              <div className="feedback-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`star-btn ${star <= currentVal ? "active" : ""}`}
                    onClick={() => handleStarClick(dim.key, star)}
                    aria-label={`${dim.label} ${star} stars`}
                  >
                    <Star size={18} fill={star <= currentVal ? "#C5A880" : "none"} stroke="#C5A880" />
                  </button>
                ))}
                <span className="feedback-dim-val">{currentVal}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments */}
      <div className="field wide mt-4">
        <label htmlFor="fb-comment" className="flex items-center gap-2">
          <MessageSquare size={14} />
          Detailed Comments & Notes (Optional)
        </label>
        <textarea
          id="fb-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts on what went well or where recommendations could be improved..."
        />
      </div>

      {/* Would Rebook */}
      <div className="feedback-rebook-box">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={wouldRebook}
            onChange={(e) => setWouldRebook(e.target.checked)}
          />
          <span>I would gladly book an event with St. Lachland again.</span>
        </label>
      </div>

      {/* Submit Button */}
      <button type="submit" className="btn btn-solid w-full mt-4" disabled={submitting}>
        <Send size={16} />
        {submitting ? "Submitting Review..." : "Submit Event Feedback"}
      </button>
    </form>
  );
}
