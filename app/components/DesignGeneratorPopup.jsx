"use client";

import { useState } from "react";
import { DESIGN_OPTIONS as OPTIONS, MAX_SPECIAL_NOTES } from "../../lib/design-prompt";

export default function DesignGeneratorPopup({ onClose, onSubmitAnswers, eventContext = {} }) {
  const {
    eventType = "wedding",
    venueName = "Crystal Ballroom",
    theme = "floral",
    guests = 100,
  } = eventContext;

  const [answers, setAnswers] = useState({
    colorPalette: theme === "tropical" ? "Vibrant" : theme === "classic" ? "Jewel Tones" : "Pastel",
    lightingStyle: eventType === "wedding" ? "Chandeliers" : "Fairy Lights",
    seatingArrangement: eventType === "conference" ? "U-Shape" : "Round Tables",
    centerpieceType: theme === "modern" ? "Geometric" : "Tall Floral",
    floralArrangement: theme === "tropical" ? "Tropical" : "Roses",
    tableclothMaterial: "Satin",
    flooring: "White Seamless",
    backdropStyle: theme === "tropical" ? "Greenery" : "Floral Wall",
    ceilingDraping: "Starburst",
    entranceDecor: "Floral Arch",
    specialNotes: ""
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnswers({
      ...answers,
      [name]: name === "specialNotes" ? value.slice(0, MAX_SPECIAL_NOTES) : value,
    });
  };

  // Hand the structured selections to the parent and close straight away — the
  // render takes 20–40s, so the progress belongs on the page behind the modal
  // rather than trapping the user in a frozen dialog.
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitAnswers({ answers, venueName, eventType, theme, guests });
    onClose();
  };

  return (
    <div className="dg-modal-overlay">
      <div className="dg-modal">
        <div className="dg-modal-header">
          <div>
            <h2>AI Event Concept Visualizer</h2>
            <span className="text-xs text-stone-400">Venue context: {venueName} · {eventType.toUpperCase()} ({theme})</span>
          </div>
          <button onClick={onClose} className="dg-modal-close" aria-label="Close modal">&times;</button>
        </div>
        
        <div className="dg-modal-body">
          <p>Customize aesthetic parameters for <strong>{venueName}</strong>. Our multimodal AI generator creates 4 synchronized architectural perspectives adhering to your constraints.</p>

          <form id="design-form" onSubmit={handleSubmit}>
            <div className="dg-form-grid">
              {Object.entries(OPTIONS).map(([key, options]) => (
                <div key={key} className="dg-field">
                  <label>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <select 
                    name={key} 
                    value={answers[key]} 
                    onChange={handleChange}
                  >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>
            
            <div className="dg-field dg-field-full">
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span>Special Instructions &amp; Architectural Notes</span>
                <span
                  style={{
                    fontSize: "0.72em",
                    fontWeight: 400,
                    color: answers.specialNotes.length >= MAX_SPECIAL_NOTES ? "#b45309" : "#a8a29e",
                  }}
                >
                  {answers.specialNotes.length}/{MAX_SPECIAL_NOTES}
                </span>
              </label>
              <textarea
                name="specialNotes"
                value={answers.specialNotes}
                onChange={handleChange}
                maxLength={MAX_SPECIAL_NOTES}
                placeholder="E.g., Ceylon tea garden view backdrop, candlelit aisle, gold Chiavari chairs..."
                rows={2}
              ></textarea>
            </div>
          </form>
        </div>
        
        <div className="dg-modal-footer">
          <button type="button" onClick={onClose} className="dg-btn-cancel">
            Cancel
          </button>
          <button type="submit" form="design-form" className="dg-btn-submit">
            Synthesize AI Visuals
          </button>
        </div>
      </div>
    </div>
  );
}
