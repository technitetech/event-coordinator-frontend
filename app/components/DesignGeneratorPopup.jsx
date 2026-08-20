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

export default function DesignGeneratorPopup({ onClose, onGenerate }) {
  const [answers, setAnswers] = useState({
    colorPalette: "Pastel",
    lightingStyle: "Fairy Lights",
    seatingArrangement: "Round Tables",
    centerpieceType: "Tall Floral",
    floralArrangement: "Roses",
    tableclothMaterial: "Satin",
    flooring: "White Seamless",
    backdropStyle: "Floral Wall",
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
    
    const prompt = `A highly detailed, realistic rendering of a wedding hall interior design. 
    Color Palette: ${answers.colorPalette}
    Lighting Style: ${answers.lightingStyle}
    Seating Arrangement: ${answers.seatingArrangement}
    Centerpiece Type: ${answers.centerpieceType}
    Floral Arrangement: ${answers.floralArrangement}
    Tablecloth Material: ${answers.tableclothMaterial}
    Flooring/Dancefloor: ${answers.flooring}
    Backdrop Style: ${answers.backdropStyle}
    Ceiling Draping: ${answers.ceilingDraping}
    Entrance Decor: ${answers.entranceDecor}
    Special Notes: ${answers.specialNotes}`;

    try {
      const res = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate design");
      }
      
      // data.data is OpenAI format for image generation response (data.data[0].url)
      const imageUrl = data.data && data.data.length > 0 ? data.data[0].url : null;
      if (!imageUrl) {
        throw new Error("No image URL returned from API");
      }
      
      onGenerate(imageUrl);
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
          <h2>Design Your Wedding Hall</h2>
          <button onClick={onClose} className="dg-modal-close">&times;</button>
        </div>
        
        <div className="dg-modal-body">
          <p>Answer a few quick questions to customize your hall's decoration. Our AI will generate a unique visual design based on your preferences!</p>
          
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
              <label>Special Notes</label>
              <textarea 
                name="specialNotes"
                value={answers.specialNotes}
                onChange={handleChange}
                placeholder="Any specific instructions or themes you want to include..."
                rows={3}
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
                Generating...
              </>
            ) : "Generate & Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
