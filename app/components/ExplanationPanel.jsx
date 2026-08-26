"use client";

/**
 * ExplanationPanel — Expandable XAI panel for each recommendation.
 * Shows: summary, dominant factors, rule triggers, trade-offs, counterfactuals.
 */
import { useState } from "react";
import RadarChart from "./RadarChart";
import { ChevronDown, ChevronUp, Lightbulb, AlertTriangle, ArrowRight, Shield, Zap, Info } from "lucide-react";

const RULE_ICONS = {
  constraint: Shield,
  optimization: Zap,
  safety: AlertTriangle,
  warning: AlertTriangle,
};

export default function ExplanationPanel({ explanation, scores }) {
  const [open, setOpen] = useState(false);

  if (!explanation) return null;

  return (
    <div className="xai-panel">
      <button className="xai-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Info size={16} strokeWidth={1.5} />
        <span>Why this recommendation?</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="xai-body">
          {/* Summary */}
          <p className="xai-summary">{explanation.summary}</p>

          {/* Radar Chart + Score Breakdown */}
          <div className="xai-radar-row">
            <div className="xai-radar-wrap">
              <RadarChart scores={scores} size={180} color="#1a3c34" />
            </div>
            <div className="xai-scores">
              <h4>Score Breakdown</h4>
              {explanation.scores_breakdown?.map((s) => (
                <div key={s.label} className="xai-score-bar">
                  <span className="xai-score-label">{s.label}</span>
                  <div className="xai-bar-track">
                    <div
                      className="xai-bar-fill"
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                  <span className="xai-score-pct">{s.score}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dominant Factors */}
          {explanation.primary_reasons?.length > 0 && (
            <div className="xai-section">
              <h4>Key Factors</h4>
              {explanation.primary_reasons.map((r, i) => (
                <div key={i} className="xai-factor">
                  <span className="xai-factor-badge">{r.factor}: {r.score}%</span>
                  <span className="xai-factor-reason">{r.reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rule Triggers */}
          {explanation.rule_triggers?.length > 0 && (
            <div className="xai-section">
              <h4>Rules Applied</h4>
              {explanation.rule_triggers.map((r, i) => {
                const Icon = RULE_ICONS[r.type] || Info;
                return (
                  <div key={i} className={`xai-rule xai-rule-${r.type}`}>
                    <Icon size={14} strokeWidth={1.5} />
                    <div>
                      <strong>{r.rule}</strong>
                      <p>{r.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trade-offs */}
          {explanation.trade_offs?.length > 0 && (
            <div className="xai-section">
              <h4>Trade-offs vs. Alternatives</h4>
              <div className="xai-tradeoffs">
                {explanation.trade_offs.map((t, i) => (
                  <div key={i} className={`xai-tradeoff xai-tradeoff-${t.direction}`}>
                    <span className="xai-tradeoff-obj">{t.objective}</span>
                    <span className="xai-tradeoff-diff">
                      {t.direction === "better" ? "+" : ""}{t.diff}%
                    </span>
                    <span className="xai-tradeoff-vs">vs. {t.vs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Counterfactuals */}
          {explanation.counterfactuals?.length > 0 && (
            <div className="xai-section">
              <h4><Lightbulb size={14} /> What-If Alternatives</h4>
              {explanation.counterfactuals.map((cf, i) => (
                <div key={i} className="xai-counterfactual">
                  <div className="xai-cf-change">
                    <ArrowRight size={12} />
                    <strong>{cf.change}</strong>
                  </div>
                  <p className="xai-cf-effect">{cf.effect}</p>
                </div>
              ))}
            </div>
          )}

          {/* Confidence */}
          {explanation.confidence !== undefined && (
            <div className="xai-confidence">
              Recommendation Confidence: {Math.round(explanation.confidence * 100)}%
              <div className="xai-conf-bar">
                <div className="xai-conf-fill" style={{ width: `${explanation.confidence * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
