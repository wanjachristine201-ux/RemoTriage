// src/pages/Results.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { triageAPI } from "../services/api";

const LEVEL_CONFIG = {
  EMERGENCY: {
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: "🚨",
    label: "REQUIRES IMMEDIATE ATTENTION",
    labelSw: "INAHITAJI UDHURU WA HARAKA",
    confidence: 95,
    description: "This assessment suggests you should seek emergency medical care immediately.",
    descriptionSw: "Tathmini hii inapendekeza unatafuta huduma ya dharura ya matibabu mara moja.",
  },
  MODERATE: {
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: "⚠️",
    label: "REQUIRES MEDICAL ATTENTION",
    labelSw: "INAHITAJI MATIBABU",
    confidence: 85,
    description: "This assessment suggests you should see a healthcare provider soon.",
    descriptionSw: "Tathmini hii inapendekeza unamwone mtoa huduma ya afya hivi karibuni.",
  },
  LOW: {
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    icon: "✅",
    label: "MONITOR AT HOME",
    labelSw: "SAMBAZA NYUMBANI",
    confidence: 75,
    description: "This assessment suggests home care with monitoring for now.",
    descriptionSw: "Tathmini hii inapendekeza huduma ya nyumbani kwa ufuatiliaji kwa sasa.",
  },
};

const PREVENTION_TIPS = {
  general: [
    "Stay hydrated by drinking plenty of clean water",
    "Get adequate rest and sleep",
    "Practice good hygiene, especially hand washing",
    "Eat nutritious food to support your immune system",
    "Avoid close contact with others who are sick",
  ],
  respiratory: [
    "Use a clean cloth or tissue when coughing/sneezing",
    "Avoid smoke and other respiratory irritants",
    "Use a humidifier if air is dry",
    "Practice deep breathing exercises",
  ],
  gastrointestinal: [
    "Stay hydrated with oral rehydration solutions if needed",
    "Eat bland, easy-to-digest foods",
    "Avoid dairy and spicy foods temporarily",
    "Wash hands thoroughly after using the bathroom",
  ],
};

export default function Results() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [lang, setLang] = useState("en");
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("remo_last_result");
    if (!cached) {
      navigate("/assessment");
      return;
    }
    setData(JSON.parse(cached));
  }, [navigate]);

  const submitRating = async (stars) => {
    setRating(stars);
    try {
      await triageAPI.submitFeedback({
        requestId: data.requestId,
        rating: stars,
        level: data.triage.level,
      });
      setRated(true);
    } catch {
      setRated(true); // Don't block UX
    }
  };

  const getPreventionTips = (symptoms) => {
    const tips = [...PREVENTION_TIPS.general];
    
    if (symptoms?.some(s => s.includes('cough') || s.includes('breathing') || s.includes('chest'))) {
      tips.push(...PREVENTION_TIPS.respiratory);
    }
    if (symptoms?.some(s => s.includes('diarrhea') || s.includes('vomiting') || s.includes('abdominal'))) {
      tips.push(...PREVENTION_TIPS.gastrointestinal);
    }
    
    return tips.slice(0, 6); // Limit to 6 tips
  };

  if (!data) return <div className="page"><p>Loading...</p></div>;

  const { triage, aiGuidance, facilities, emergency } = data;
  const config = LEVEL_CONFIG[triage.level];
  const action = triage.action?.[lang] || triage.action?.en || "";
  const reason = triage.reason?.[lang] || triage.reason?.en || "";
  const preventionTips = getPreventionTips(data.input?.symptoms);

  return (
    <div className="page page--results">
      <header className="nav">
        <Link to="/" className="nav__brand">
          <span className="nav__cross">+</span> RemoTriage
        </Link>
        <div className="nav__actions">
          <button className="btn btn--ghost" onClick={() => setLang(lang === "en" ? "sw" : "en")}>
            {lang === "en" ? "SW" : "EN"}
          </button>
        </div>
      </header>

      <main className="container">
        {/* Triage Level Banner with Confidence */}
        <div
          className="result-banner"
          style={{ background: config.bg, border: `2px solid ${config.border}` }}
        >
          <div className="result-banner__level" style={{ color: config.color }}>
            {config.icon} {lang === "en" ? config.label : config.labelSw}
          </div>
          
          {/* Confidence Indicator */}
          <div className="confidence-indicator">
            <span>{lang === "en" ? "Confidence:" : "Uhakika:"}</span>
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${config.confidence}%` }}
              />
            </div>
            <span>{config.confidence}%</span>
          </div>
          
          <div className="result-banner__suspect">{triage.suspect}</div>
          <div className="result-banner__protocol">Protocol: {triage.protocol}</div>
          <p style={{ marginTop: '12px', fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
            {lang === "en" ? config.description : config.descriptionSw}
          </p>
        </div>

        {/* EMERGENCY call-out */}
        {triage.callEmergency && (
          <div className="action-card action-card--emergency">
            <h3>🚨 {lang === "en" ? "Seek Emergency Care Immediately" : "Tafuta Huduma ya Dharura Mara Moja"}</h3>
            <p>
              {lang === "en" 
                ? "Your symptoms require immediate medical attention. Please go to the nearest emergency department or call emergency services right away." 
                : "Dalili zako zinahitaji usaidizi wa matibabu wa haraka. Tafadhali nenda kituo cha dharura cha karibu zaidi au piga simu huduma za dharura mara moja."}
            </p>
            <div className="emergency-numbers">
              {Object.values(emergency || {}).map((e) => (
                <a key={e.number} href={`tel:${e.number.replace(/\s/g, "")}`} className="emergency-btn">
                  📞 {e.name}: <strong>{e.number}</strong>
                  {e.free && <span className="free-badge">FREE</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Why this result */}
        <div className="action-card">
          <h3>🔍 {lang === "en" ? "Why This Assessment" : "Kwa Nini Tathmini Hii"}</h3>
          <p>{reason}</p>
          <div className="safety-info">
            <div className="safety-info__icon">⚠️</div>
            <div className="safety-info__content">
              <strong>{lang === "en" ? "Important Safety Information" : "Maelezo Muhimu ya Usalama"}</strong>
              <p>
                {lang === "en" 
                  ? "This assessment is based on your reported symptoms and medical guidelines. It is not a diagnosis. Always consult with a qualified healthcare professional for proper medical care." 
                  : "Tathmini hii inatokana na dalili zilizoripotiwa na mwongozo wa matibabu. Sio uchunguzi. Daima shauriana na mtaalamu wa afya anayefaa kwa huduma ya matibabu sahihi."}
              </p>
            </div>
          </div>
        </div>

        {/* What to do now */}
        <div className="action-card action-card--primary">
          <h3>📋 {lang === "en" ? "Recommended Next Steps" : "Hatua Zinazopendekezwa za Kufuata"}</h3>
          <p>{action}</p>
          
          {/* Action Steps */}
          <ul className="action-steps">
            {triage.level === 'EMERGENCY' && (
              <>
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Call Emergency Services" : "Piga Simu Huduma za Dharura"}</strong>
                    <span>{lang === "en" ? "Dial 999 or 0800 723 253 immediately" : "Piga 999 au 0800 723 253 mara moja"}</span>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Go to Nearest Hospital" : "Nenda Hospitali ya Karibu"}</strong>
                    <span>{lang === "en" ? "Do not drive yourself if possible" : "Usiuendeshe gari lako iwezekanavyo"}</span>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Follow Up" : "Fuatilia"}</strong>
                    <span>{lang === "en" ? "Inform family members about your situation" : "Mjulishe wanafamilia kuhusu hali yako"}</span>
                  </div>
                </li>
              </>
            )}
            {triage.level === 'MODERATE' && (
              <>
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Schedule Doctor Visit" : "Panga Ziara ya Daktari"}</strong>
                    <span>{lang === "en" ? "Within 24-48 hours recommended" : "Inapendekezwa ndani ya masaa 24-48"}</span>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Monitor Symptoms" : "Sambaza Dalili"}</strong>
                    <span>{lang === "en" ? "Watch for any changes or worsening" : "Angalia mabadiliko yoyote au kuzorota kwa hali"}</span>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Rest & Hydrate" : "Pumzika & Hydrate"}</strong>
                    <span>{lang === "en" ? "Get adequate rest and fluids" : "Pumzika vizuri na kunywa maji"}</span>
                  </div>
                </li>
              </>
            )}
            {triage.level === 'LOW' && (
              <>
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Home Care" : "Matunzo ya Nyumbani"}</strong>
                    <span>{lang === "en" ? "Rest, hydrate, and monitor symptoms" : "Pumzika, kunywa maji, na kusambaza dalili"}</span>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Over-the-counter Medication" : "Dawa zisizo za Daktari"}</strong>
                    <span>{lang === "en" ? "Consider basic pain/fever relief if needed" : "Fikiria kuuza maumivu ya msingi/homa ikitabidi"}</span>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>{lang === "en" ? "Watch for Changes" : "Angalia Mabadiliko"}</strong>
                    <span>{lang === "en" ? "Seek care if symptoms worsen or don't improve" : "Tafuta huduma kama dalili zinazorota au haziboreshi"}</span>
                  </div>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Prevention and Self-Care */}
        {preventionTips.length > 0 && (
          <div className="prevention-tips">
            <h3>
              💡 {lang === "en" ? "Prevention & Self-Care Tips" : "Mapendekezo ya Kuzuia & Matunzo ya Kujihudumia"}
            </h3>
            <ul className="prevention-list">
              {preventionTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Guidance */}
        {aiGuidance && (
          <div className="ai-guidance">
            <h3>🤖 {lang === "en" ? "AI-Assisted Guidance" : "Mwongozo wa AI-Usaidizi"}</h3>
            <p>{aiGuidance}</p>
            <div className="ai-disclaimer">
              {lang === "en" 
                ? "Note: AI guidance is supplementary only and cannot override the medical triage assessment. Always prioritize professional medical advice." 
                : "Kumbuka: Mwongozo wa AI ni wa ziada tu na hauwezi kubadilisha tathmini ya matibabu ya dharura. Daima weka kipaumbele kushauri na wataalamu wa matibabu."}
            </div>
          </div>
        )}

        {/* Facilities */}
        {facilities && (
          <div className="facility-section">
            <h3>
              🏥 {lang === "en" ? "Nearby Healthcare Facilities" : "Vituo vya Afya Vilivyo Karibu"}
            </h3>
            {facilities.referralHospital && (
              <div className="facility-card facility-card--primary">
                <h4>
                  🏥 {facilities.referralHospital.name}
                </h4>
                <div className="facility-type">
                  {facilities.referralHospital.level} County Referral Hospital
                </div>
                <div className="facility-contact">
                  📞 
                  <a href={`tel:${facilities.referralHospital.phone}`}>
                    {facilities.referralHospital.phone}
                  </a>
                </div>
              </div>
            )}
            {facilities.nearby?.slice(0, 2).map((facility, index) => (
              <div key={index} className="facility-card">
                <h4>
                  🏥 {facility.name}
                </h4>
                <div className="facility-type">
                  {facility.level} • {facility.distance || 'Nearby'}
                </div>
                <div className="facility-contact">
                  📞 
                  <a href={`tel:${facility.phone}`}>
                    {facility.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Follow-up */}
        <div className="follow-up-section">
          <h3>{lang === "en" ? "When to Seek Further Care" : "Lini Kuta huduma zaidi"}</h3>
          <p>
            {lang === "en" 
              ? "If your symptoms worsen, don't improve within expected time, or you develop new concerning symptoms, please seek medical attention promptly." 
              : "Kama dalili zako zinazorota, haziboreshi ndani ya muda unatarajiwa, au unajipata dalili mpya za kuwasiliana, tafadhali tafuta huduma ya matibabu haraka."}
          </p>
          <div className="follow-up-actions">
            <button 
              className="btn btn--outline" 
              onClick={() => window.location.href = `tel:${emergency?.national?.number || '999'}`}
            >
              📞 {lang === "en" ? "Call for Help" : "Piga Simu Kwa Msaada"}
            </button>
            <Link to="/assessment" className="btn btn--primary">
              🔄 {lang === "en" ? "Re-assess" : "Tathmini Upya"}
            </Link>
          </div>
        </div>

        {/* Rating */}
        {!rated ? (
          <div className="rating-section">
            <p>{lang === "en" ? "Was this guidance helpful?" : "Je, mwongozo huu ulikuwa wa msaada?"}</p>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`star ${n <= rating ? "star--active" : ""}`}
                  onClick={() => submitRating(n)}
                  type="button"
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted text-center">
            {lang === "en" ? "Thank you for your feedback." : "Asante kwa maoni yako."}
          </p>
        )}

        {/* Actions */}
        <div className="result-actions">
          <Link to="/assessment" className="btn btn--outline">
            {lang === "en" ? "New Assessment" : "Tathmini Mpya"}
          </Link>
          <Link to="/" className="btn btn--ghost">
            {lang === "en" ? "Home" : "Nyumbani"}
          </Link>
        </div>

        {/* Final Disclaimer */}
        <div className="safety-info" style={{ marginTop: '32px' }}>
          <div className="safety-info__icon">⚠️</div>
          <div className="safety-info__content">
            <strong>{lang === "en" ? "Medical Disclaimer" : "Kanusho la Matibabu"}</strong>
            <p>
              {lang === "en" 
                ? "RemoTriage provides AI-assisted health triage guidance, not medical diagnosis. This information is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions you may have regarding a medical condition." 
                : "RemoTriage inatoa mwongozo wa afya wa AI-usaidizi, sio uchunguzi wa matibabu. Maelezo haya ni kwa madhumuni ya kielimu tu na hayapaswi kubadilisha ushauri wa kitaalamu wa matibabu, uchunguzi, au matibabu. Daima tafuta ushauri wa watoa huduma wa afya walioidhinishwa na maswali yoyote unayokuwa nayo kuhusu hali ya matibabu."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}