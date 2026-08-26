"use client";

import { useState } from "react";

const OPTIONS = {
  colorPalette: ["Pastel", "Earth Tones", "Jewel Tones", "Monochrome", "Vibrant"],
  lightingStyle: ["Fairy Lights", "Chandeliers", "Neon Signs", "Lanterns", "Spotlights"],
  seatingArrangement: ["Round Tables", "Banquet Style", "Lounge Seating", "U-Shape"],
  centerpieceType: ["Tall Floral", "Short Floral", "Candles", "Geometric", "Minimalist"],
  floralArrangement: ["Roses", "Wildflowers", "Peonies", "Tropical", "Orchids"],
  tableclothMaterial: ["Satin", "Sequins", "Velvet", "Linen", "Chiffon"],
  flooring: ["White Seamless", "Wooden", "Checkerboard", "LED", "Custom Decal"],
  backdropStyle: ["Floral Wall", "Drape & Fairy Lights", "Neon Sign", "Archway", "Greenery"],
  ceilingDraping: ["Starburst", "Parallel", "Tent Style", "None", "Mixed with Florals"],
  entranceDecor: ["Floral Arch", "Red Carpet", "Lantern Pathway", "Signage", "Welcome Drink Station"]
};

export default function DesignGeneratorPopup({ onClose, onGenerate, eventContext = {} }) {
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
  
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setAnswers({ ...answers, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    
    const prompt = `A highly detailed, photorealistic interior architectural render of ${venueName} at St. Lachland luxury hotel tailored for a ${eventType} with ${guests} guests.
    Theme: ${theme}
    Color Palette: ${answers.colorPalette}
    Lighting Style: ${answers.lightingStyle}
    Seating Arrangement: ${answers.seatingArrangement}
    Centerpiece Type: ${answers.centerpieceType}
    Floral Arrangement: ${answers.floralArrangement}
    Tablecloth Material: ${answers.tableclothMaterial}
    Flooring / Dancefloor: ${answers.flooring}
    Backdrop Style: ${answers.backdropStyle}
    Ceiling Draping: ${answers.ceilingDraping}
    Entrance Decor: ${answers.entranceDecor}
    Special Notes: ${answers.specialNotes || "Luxury editorial aesthetic, warm atmospheric lighting, cinematic framing"}`;

    try {
      const res = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          venueName,
          eventType,
          theme,
          guests
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate design");
      }
      
      const urls = Array.isArray(data?.data)
        ? data.data.map((d) => d?.url).filter(Boolean)
        : [];
      if (urls.length === 0) {
        throw new Error("No image URLs returned from API");
      }

      onGenerate(urls);
      onClose();
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
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
          
          {error && (
            <div className="dg-error">
              {error}
            </div>
          )}

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
              <label>Special Instructions & Architectural Notes</label>
              <textarea 
                name="specialNotes"
                value={answers.specialNotes}
                onChange={handleChange}
                placeholder="E.g., Ceylon tea garden view backdrop, candlelit aisle, gold Chiavari chairs..."
                rows={2}
              ></textarea>
            </div>
          </form>
        </div>
        
        <div className="dg-modal-footer">
          <button 
            type="button" 
            onClick={onClose} 
            className="dg-btn-cancel"
            disabled={generating}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="design-form"
            disabled={generating}
            className="dg-btn-submit"
          >
            {generating ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite', height: '20px', width: '20px', color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Synthesizing Concept Perspectives...
              </>
            ) : "Synthesize AI Visuals"}
          </button>
        </div>
      </div>
    </div>
  );
}
