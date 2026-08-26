import { getResearchAnalytics } from "../../actions";


export const metadata = {
  title: "AI Research Analytics — St. Lachland Hotel",
  description: "Empirical evaluation metrics, Pareto distribution analysis, and adaptive learning status.",
};

export default async function AnalyticsPage() {
  let analytics;
  try {
    analytics = await getResearchAnalytics();
  } catch (err) {
    return (
      <div className="ad-content">
        <h1 className="ad-title">AI Research Analytics</h1>
        <p className="err mt-4">Failed to load analytics: {err.message}</p>
      </div>
    );
  }

  const {
    recommendations_count,
    acceptance_rate,
    feedback_metrics,
    objective_weights,
    recent_logs,
    venue_performance,
  } = analytics;

  return (
    <div className="ad-content">
      <div className="ad-page-head flex justify-between items-center mb-8">
        <div>
          <span className="eyebrow">Empirical AI Validation</span>
          <h1 className="ad-title">Hybrid Neuro-Symbolic Engine Analytics</h1>
          <p className="text-stone-500 text-sm mt-1">
            Real-time performance metrics, multi-objective Pareto distribution, and adaptive learning feedback telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="ad-badge-pulse">● System Status: Online &amp; Calibrating</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ad-stats-grid mb-8">
        <div className="ad-stat-card">
          <div className="ad-stat-lbl">AI Consultations Logged</div>
          <div className="ad-stat-num">{recommendations_count}</div>
          <div className="ad-stat-sub">Full multi-objective evaluations</div>
        </div>

        <div className="ad-stat-card">
          <div className="ad-stat-lbl">Pareto Frontier Acceptance</div>
          <div className="ad-stat-num">{acceptance_rate}%</div>
          <div className="ad-stat-sub">Users reserving recommended packages</div>
        </div>

        <div className="ad-stat-card">
          <div className="ad-stat-lbl">Mean Customer Satisfaction</div>
          <div className="ad-stat-num">{feedback_metrics.overall} <span className="text-sm font-normal text-stone-400">/ 5.0</span></div>
          <div className="ad-stat-sub">Across {feedback_metrics.total} verified event reviews</div>
        </div>

        <div className="ad-stat-card">
          <div className="ad-stat-lbl">Rebook &amp; Loyalty Intent</div>
          <div className="ad-stat-num">{feedback_metrics.rebook_percentage}%</div>
          <div className="ad-stat-sub">Positive long-term satisfaction</div>
        </div>
      </div>

      {/* Grid: Objective Weights & Dimensional Satisfaction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Objective Weights Card */}
        <div className="ad-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold font-serif text-emerald">Adaptive Objective Weights</h2>
            <span className="text-xs px-2 py-1 bg-stone-100 rounded text-stone-600 font-mono">
              Source: {objective_weights.source.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-stone-500 mb-4">
            Dynamic weights used in Pareto scalarization, calibrated via Pearson correlation against user ratings.
          </p>

          <div className="space-y-3">
            {[
              { label: "Cost Efficiency (w_cost)", val: objective_weights.w_cost, color: "#1A3C34" },
              { label: "Aesthetic Quality (w_quality)", val: objective_weights.w_quality, color: "#C5A880" },
              { label: "Availability Headroom (w_availability)", val: objective_weights.w_availability, color: "#4A7C59" },
              { label: "Weather Safety (w_weather)", val: objective_weights.w_weather, color: "#5A9E87" },
              { label: "Personalized Preference (w_preference)", val: objective_weights.w_preference, color: "#8E7D5B" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{item.label}</span>
                  <span className="font-mono">{Math.round((item.val || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(item.val || 0) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5-Dimensional Satisfaction Card */}
        <div className="ad-card">
          <h2 className="text-lg font-bold font-serif text-emerald mb-4">Multi-Dimensional Satisfaction Breakdown</h2>
          <p className="text-xs text-stone-500 mb-4">
            Post-event user ratings across the 4 key operational sub-dimensions.
          </p>

          <div className="space-y-4">
            {[
              { label: "Venue Atmosphere & Aesthetics", score: feedback_metrics.venue },
              { label: "Menu & Culinary Satisfaction", score: feedback_metrics.menu },
              { label: "Decoration & Theme Fidelity", score: feedback_metrics.decor },
              { label: "Perceived Value for Money", score: feedback_metrics.value },
            ].map((dim) => (
              <div key={dim.label}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{dim.label}</span>
                  <span className="font-mono">{dim.score} / 5.0</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald rounded-full"
                    style={{ width: `${(dim.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Venue Performance Matrix */}
      {venue_performance?.length > 0 && (
        <div className="ad-card mb-8">
          <h2 className="text-lg font-bold font-serif text-emerald mb-2">Venue Performance &amp; AI Recommendation Efficacy</h2>
          <p className="text-xs text-stone-500 mb-4">
            Empirical correlation between venue recommendations, booking volume, and guest satisfaction ratings.
          </p>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Venue Name</th>
                  <th>Confirmed Bookings</th>
                  <th>Mean Guest Satisfaction</th>
                  <th>Budget Value Rating</th>
                </tr>
              </thead>
              <tbody>
                {venue_performance.map((vp) => (
                  <tr key={vp.venue_name}>
                    <td className="font-semibold text-emerald">{vp.venue_name}</td>
                    <td>{vp.booking_count}</td>
                    <td>{vp.avg_rating ? `${Math.round(vp.avg_rating * 10) / 10} / 5.0` : "No ratings yet"}</td>
                    <td>{vp.avg_value ? `${Math.round(vp.avg_value * 10) / 10} / 5.0` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explainable AI (XAI) Telemetry & Audit Logs */}
      <div className="ad-card">
        <h2 className="text-lg font-bold font-serif text-emerald mb-2">Explainable AI (XAI) Audit Trail</h2>
        <p className="text-xs text-stone-500 mb-4">
          Causal explanations, constraint triggers, and Pareto rankings generated for recent user sessions.
        </p>

        {recent_logs?.length === 0 ? (
          <p className="text-sm text-stone-400 italic">No recommendations logged yet. Generate a recommendation from the Event Planner to populate telemetry.</p>
        ) : (
          <div className="space-y-4">
            {recent_logs.map((log) => (
              <div key={log.id} className="p-4 border border-stone-200 rounded-lg bg-stone-50 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald font-mono">{log.session_id}</span>
                    <span className="px-2 py-0.5 bg-emerald/10 text-emerald rounded text-2xs font-semibold">
                      Pareto Rank #{log.pareto_rank || 1}
                    </span>
                    {log.accepted && (
                      <span className="px-2 py-0.5 bg-emerald text-white rounded text-2xs font-semibold">
                        ✓ Reserved by User
                      </span>
                    )}
                  </div>
                  <span className="text-stone-400">{new Date(log.created_at).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-stone-500 font-semibold block mb-1">User Constraints:</span>
                    <p className="text-stone-700 font-mono">
                      {log.input_params?.event_type?.toUpperCase()} · {log.input_params?.guests} Guests · Budget: LKR {Number(log.input_params?.budget || 0).toLocaleString()} · Theme: {log.input_params?.theme} {log.input_params?.event_date ? `· Date: ${log.input_params?.event_date}` : ""}
                    </p>
                  </div>

                  <div>
                    <span className="text-stone-500 font-semibold block mb-1">Recommended Solution:</span>
                    <p className="text-stone-700">
                      <strong>{log.final_output?.venue?.name}</strong> · {log.final_output?.menu?.name} · {log.final_output?.decoration?.name} (Total: LKR {Number(log.final_output?.total_cost || 0).toLocaleString()})
                    </p>
                  </div>
                </div>

                {log.explanation?.summary && (
                  <div className="mt-3 pt-2 border-t border-stone-200">
                    <span className="text-stone-500 font-semibold block mb-1">Generated Natural Language Explanation:</span>
                    <p className="text-stone-800 italic bg-white p-2 rounded border border-stone-100">
                      &ldquo;{log.explanation.summary}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
