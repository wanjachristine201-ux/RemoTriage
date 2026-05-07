// src/pages/Assessment.jsx
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTriage } from "../hooks/useTriage";

const SYMPTOM_LIST = [
  // Emergency-tier symptoms
  { id: "difficulty_breathing", label: "Difficulty breathing", labelSw: "Ugumu kupumua", tier: "danger" },
  { id: "convulsions", label: "Convulsions/Seizures", labelSw: "Degedege", tier: "danger" },
  { id: "altered_consciousness", label: "Loss of consciousness", labelSw: "Kupoteza fahamu", tier: "danger" },
  { id: "chest_pain", label: "Severe chest pain", labelSw: "Maumivu makali ya kifua", tier: "danger" },
  { id: "vaginal_bleeding", label: "Vaginal bleeding (pregnancy)", labelSw: "Kutoka damu (ukiwa mjamzito)", tier: "danger" },
  // Moderate-tier
  { id: "fever", label: "Fever", labelSw: "Homa", tier: "moderate" },
  { id: "high_fever", label: "High fever (≥39°C)", labelSw: "Homa kali sana", tier: "moderate" },
  { id: "severe_headache", label: "Severe headache", labelSw: "Maumivu makali ya kichwa", tier: "moderate" },
  { id: "stiff_neck", label: "Stiff neck", labelSw: "Shingo ngumu", tier: "moderate" },
  { id: "diarrhea", label: "Diarrhea", labelSw: "Kuhara", tier: "moderate" },
  { id: "vomiting", label: "Vomiting", labelSw: "Kutapika", tier: "moderate" },
  { id: "confusion", label: "Confusion", labelSw: "Mkanganyiko", tier: "moderate" },
  { id: "persistent_cough", label: "Persistent cough (2+ weeks)", labelSw: "Kikohozi cha muda mrefu", tier: "moderate" },
  // Lower risk
  { id: "mild_fever", label: "Mild fever", labelSw: "Homa ndogo", tier: "low" },
  { id: "mild_cough", label: "Mild cough", labelSw: "Kikohozi kidogo", tier: "low" },
  { id: "mild_headache", label: "Mild headache", labelSw: "Maumivu madogo ya kichwa", tier: "low" },
  { id: "runny_nose", label: "Runny nose", labelSw: "Pua inayotiririka", tier: "low" },
  { id: "sore_throat", label: "Sore throat", labelSw: "Koo inayouma", tier: "low" },
  { id: "fatigue", label: "Fatigue/Weakness", labelSw: "Uchovu/Udhaifu", tier: "low" },
  { id: "abdominal_pain", label: "Abdominal pain", labelSw: "Maumivu ya tumbo", tier: "low" },
  { id: "weight_loss", label: "Unexplained weight loss", labelSw: "Kupungua uzito bila sababu", tier: "low" },
  { id: "night_sweats", label: "Night sweats", labelSw: "Jasho usiku", tier: "low" },
];

const CHRONIC_CONDITIONS = [
  { id: "diabetes", label: "Diabetes", labelSw: "Kisukari" },
  { id: "asthma", label: "Asthma", labelSw: "Asthma" },
  { id: "hypertension", label: "High blood pressure", labelSw: "Shinikizo la damu la juu" },
  { id: "hiv", label: "HIV", labelSw: "VVU" },
  { id: "heart_disease", label: "Heart disease", labelSw: "Magonjwa ya moyo" },
  { id: "tuberculosis", label: "Tuberculosis", labelSw: "Kifua kikuu" },
  { id: "malaria_history", label: "Recurrent malaria", labelSw: "Malaria mara nyingi" },
  { id: "none", label: "None of the above", labelSw: "Hamna hapo juu" },
];

const COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Nyeri",
  "Meru", "Machakos", "Kisii", "Kakamega", "Kilifi", "Kwale", "Garissa",
  "Wajir", "Mandera", "Homa Bay", "Migori", "Siaya", "Bungoma", "Embu",
  "Kitui", "Makueni", "Laikipia", "Narok", "Kajiado", "Kericho", "Turkana",
  "Tana River", "Lamu", "Marsabit", "Isiolo", "Baringo", "Vihiga", "Busia",
  "Nyamira", "Nandi", "Trans Nzoia", "West Pokot", "Samburu",
  "Nyandarua", "Kirinyaga", "Murang'a", "Taita-Taveta", "Tharaka-Nithi",
  "Elgeyo-Marakwet", "Bomet",
];

const ASSESSMENT_STEPS = [
  { id: 1, label: "Symptoms", labelSw: "Dalili" },
  { id: 2, label: "Medical History", labelSw: "Historia ya Matibabu" },
  { id: 3, label: "Patient Info", labelSw: "Taarifa za Mgonjwa" },
  { id: 4, label: "Review", labelSw: "Kukagua" },
];

export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { runAssessment, loading, error } = useTriage();

  const [lang, setLang] = useState("en");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState(new Set());
  const [selectedConditions, setSelectedConditions] = useState(new Set());
  const [validationError, setValidationError] = useState("");
  const [formData, setFormData] = useState({
    ageGroup: "adult",
    isPregnant: false,
    county: "Nairobi",
    season: "dry",
    symptomDescription: "",
    medications: "",
    allergies: "",
    additionalNotes: "",
  });

  const toggleSymptom = (id) => {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCondition = (id) => {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const nextStep = () => {
    if (currentStep === 1 && selectedSymptoms.size === 0) {
      setValidationError(lang === "en" 
        ? "Please select at least one symptom to continue." 
        : "Tafadhali chagua dalili moja kwa kuendelea.");
      return;
    }
    setValidationError("");
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.size === 0) {
      setValidationError(lang === "en" 
        ? "Please select at least one symptom to continue." 
        : "Tafadhali chagua dalili moja kwa kuendelea.");
      return;
    }
    setValidationError("");
    
    const payload = {
      symptoms: [...selectedSymptoms],
      chronicConditions: [...selectedConditions],
      ...formData,
      language: lang,
      requestAI: true,
    };
    
    const result = await runAssessment(payload);
    if (result) navigate("/results");
  };

  const label = (s) => (lang === "sw" ? s.labelSw : s.label);
  const tieredSymptoms = useMemo(() => ({
    danger: SYMPTOM_LIST.filter((s) => s.tier === "danger"),
    moderate: SYMPTOM_LIST.filter((s) => s.tier === "moderate"),
    low: SYMPTOM_LIST.filter((s) => s.tier === "low"),
  }), []);

  const getStepIcon = (step) => {
    if (step < currentStep) return "✓";
    if (step === currentStep) return step;
    return step;
  };

  return (
    <div className="page page--assessment">
      {/* Nav */}
      <header className="nav">
        <Link to="/" className="nav__brand">
          <span className="nav__cross">+</span> RemoTriage
        </Link>
        <div className="nav__actions">
          <button className="btn btn--ghost" onClick={() => setLang(lang === "en" ? "sw" : "en")}>
            {lang === "en" ? "SW" : "EN"}
          </button>
          {user && <span className="muted">{user.name}</span>}
        </div>
      </header>

      <main className="container">
        {/* Progress Stepper */}
        <div className="progress-stepper">
          {ASSESSMENT_STEPS.map((step) => (
            <div
              key={step.id}
              className={`progress-step ${
                step.id === currentStep ? "progress-step--active" : ""
              } ${step.id < currentStep ? "progress-step--completed" : ""}`}
            >
              <div className="progress-step__circle">
                {getStepIcon(step.id)}
              </div>
              <div className="progress-step__label">
                {lang === "en" ? step.label : step.labelSw}
              </div>
            </div>
          ))}
        </div>

        <div className="page-header">
          <h1>{lang === "en" ? "Symptom Assessment" : "Tathmini ya Dalili"}</h1>
          <p className="muted">
            {lang === "en"
              ? "Step " + currentStep + " of 4: " + ASSESSMENT_STEPS[currentStep - 1].label
              : "Hatua " + currentStep + " ya 4: " + ASSESSMENT_STEPS[currentStep - 1].labelSw}
          </p>
        </div>

        {(error || validationError) && (
          <div className="alert alert--error">{error || validationError}</div>
        )}

        {/* Step 1: Symptom Selection */}
        {currentStep === 1 && (
          <div className="symptom-section">
            {/* Danger symptoms */}
            <div className="symptom-category">
              <div className="card card--danger">
                <div className="severity-indicator severity-indicator--danger">
                  ⚠️ {lang === "en" ? "Emergency Symptoms" : "Dalili za Dharura"}
                </div>
                <h2>
                  {lang === "en" ? "Select if present (require urgent attention)" : "Chagua zilizopo (zinahitaji huduma ya haraka)"}
                </h2>
                <div className="chip-grid">
                  {tieredSymptoms.danger.map((s) => (
                    <button
                      key={s.id}
                      className={`chip chip--danger ${selectedSymptoms.has(s.id) ? "chip--active" : ""}`}
                      onClick={() => toggleSymptom(s.id)}
                      type="button"
                    >
                      {label(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Moderate symptoms */}
            <div className="symptom-category">
              <div className="card">
                <div className="severity-indicator severity-indicator--moderate">
                  ⚡ {lang === "en" ? "Common Symptoms" : "Dalili za Kawaida"}
                </div>
                <div className="chip-grid">
                  {tieredSymptoms.moderate.map((s) => (
                    <button
                      key={s.id}
                      className={`chip ${selectedSymptoms.has(s.id) ? "chip--active" : ""}`}
                      onClick={() => toggleSymptom(s.id)}
                      type="button"
                    >
                      {label(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mild symptoms */}
            <div className="symptom-category">
              <div className="card">
                <div className="severity-indicator severity-indicator--low">
                  💚 {lang === "en" ? "Mild Symptoms" : "Dalili Ndogo"}
                </div>
                <div className="chip-grid">
                  {tieredSymptoms.low.map((s) => (
                    <button
                      key={s.id}
                      className={`chip ${selectedSymptoms.has(s.id) ? "chip--active" : ""}`}
                      onClick={() => toggleSymptom(s.id)}
                      type="button"
                    >
                      {label(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Symptom description */}
            <div className="card">
              <h3>{lang === "en" ? "Describe your symptoms further" : "Eleza dalili zako zaidi"}</h3>
              <textarea
                className="form__textarea"
                placeholder={lang === "en" 
                  ? "When did symptoms start? What makes them better or worse? Any other details?" 
                  : "Dalili zilianza lini? Nini huzifanya kuwa bora au mbaya? Maelezo mengine?"}
                value={formData.symptomDescription}
                onChange={(e) => setFormData({ ...formData, symptomDescription: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Medical History */}
        {currentStep === 2 && (
          <div className="medical-history">
            <h3>
              🏥 {lang === "en" ? "Chronic Conditions & Medical History" : "Magonjwa ya Kudumu & Historia ya Matibabu"}
            </h3>
            <p className="muted">
              {lang === "en" 
                ? "Select any chronic conditions you have. This helps us provide better guidance." 
                : "Chagua magonjwa yoyote ya kudumu unayoayo. Hii husaidia kutoa mwongozo bora."}
            </p>
            
            <div className="condition-grid">
              {CHRONIC_CONDITIONS.map((condition) => (
                <div
                  key={condition.id}
                  className={`condition-item ${selectedConditions.has(condition.id) ? "chip--active" : ""}`}
                  onClick={() => toggleCondition(condition.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedConditions.has(condition.id)}
                    onChange={() => {}}
                  />
                  <span>{label(condition)}</span>
                </div>
              ))}
            </div>

            {/* Medications */}
            <div className="form__group">
              <label>{lang === "en" ? "Current medications" : "Dawa za sasa"}</label>
              <textarea
                className="form__textarea"
                placeholder={lang === "en" 
                  ? "List any medications you're currently taking (including over-the-counter)" 
                  : "Orodhesha dawa zozote unazotumia kwa sasa (zikiwa pamoja na zisizo za daktari)"}
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              />
            </div>

            {/* Allergies */}
            <div className="form__group">
              <label>{lang === "en" ? "Allergies" : "Matatizo ya mialergi"}</label>
              <textarea
                className="form__textarea"
                placeholder={lang === "en" 
                  ? "Any known allergies (medications, food, etc.)" 
                  : "Mialergi yoyote inayojulikana (dawa, chakula, n.k.)"}
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 3: Patient Information */}
        {currentStep === 3 && (
          <div>
            <div className="card">
              <h3>{lang === "en" ? "Patient Information" : "Taarifa za Mgonjwa"}</h3>
              
              <div className="form__row">
                <div className="form__group">
                  <label>{lang === "en" ? "Age Group" : "Kundi la Umri"}</label>
                  <select
                    className="form__input"
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                  >
                    <option value="infant">{lang === "en" ? "Infant (<1 yr)" : "Mtoto mchanga (<1 mwaka)"}</option>
                    <option value="child">{lang === "en" ? "Child (1–12)" : "Mtoto (1–12)"}</option>
                    <option value="adult">{lang === "en" ? "Adult" : "Mtu mzima"}</option>
                    <option value="elderly">{lang === "en" ? "Elderly (60+)" : "Mzee (60+)"}</option>
                  </select>
                </div>
                <div className="form__group">
                  <label>{lang === "en" ? "County" : "Kaunti"}</label>
                  <select
                    className="form__input"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  >
                    {COUNTIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form__row">
                <div className="form__group">
                  <label>{lang === "en" ? "Season" : "Msimu"}</label>
                  <select
                    className="form__input"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  >
                    <option value="dry">{lang === "en" ? "Dry season" : "Kiangazi"}</option>
                    <option value="rainy">{lang === "en" ? "Rainy season" : "Masika"}</option>
                  </select>
                </div>
                <div className="form__group form__group--checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isPregnant}
                      onChange={(e) => setFormData({ ...formData, isPregnant: e.target.checked })}
                    />
                    {lang === "en" ? "Currently pregnant" : "Ni mjamzito"}
                  </label>
                </div>
              </div>
            </div>

            {/* Location context */}
            <div className="location-context">
              <div className="location-context__icon">📍</div>
              <div className="location-context__info">
                <strong>{lang === "en" ? "Location Context" : "Muktadha wa Mahali"}</strong>
                <span>
                  {lang === "en" 
                    ? `Assessment tailored for ${formData.county} County during ${formData.season === "dry" ? "dry" : "rainy"} season` 
                    : `Tathmini imeboreshwa kwa Kaunti ya ${formData.county} wakati wa msimu wa ${formData.season === "dry" ? "kiangazi" : "masika"}`}
                </span>
              </div>
            </div>

            {/* Additional notes */}
            <div className="card">
              <h3>{lang === "en" ? "Additional Information" : "Maelezo ya Ziada"}</h3>
              <textarea
                className="form__textarea"
                placeholder={lang === "en" 
                  ? "Any other information that might help us provide better guidance..." 
                  : "Maelezo yoyote mengine yanayoweza kusaidia kutoa mwongozo bora..."}
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="card">
            <h3>{lang === "en" ? "Review Your Assessment" : "Kagua Tathmini Yako"}</h3>
            
            <div className="review-summary">
              <div className="finding-row">
                <strong>{lang === "en" ? "Symptoms:" : "Dalili:"}</strong>
                <span>{selectedSymptoms.size} {lang === "en" ? "selected" : "zimechaguliwa"}</span>
              </div>
              
              {selectedConditions.size > 0 && (
                <div className="finding-row">
                  <strong>{lang === "en" ? "Chronic Conditions:" : "Magonjwa ya Kudumu:"}</strong>
                  <span>{selectedConditions.size} {lang === "en" ? "selected" : "zimechaguliwa"}</span>
                </div>
              )}
              
              <div className="finding-row">
                <strong>{lang === "en" ? "Age Group:" : "Kundi la Umri:"}</strong>
                <span>{formData.ageGroup}</span>
              </div>
              
              <div className="finding-row">
                <strong>{lang === "en" ? "Location:" : "Mahali:"}</strong>
                <span>{formData.county}</span>
              </div>
              
              {formData.isPregnant && (
                <div className="finding-row">
                  <strong>{lang === "en" ? "Pregnancy:" : "Ujauzito:"}</strong>
                  <span>{lang === "en" ? "Yes" : "Ndio"}</span>
                </div>
              )}
            </div>
            
            <div className="alert alert--error" style={{ marginTop: '20px' }}>
              <strong>⚠️ {lang === "en" ? "Important:" : "Muhimu:"}</strong>
              {lang === "en" 
                ? " Please review your information carefully. This assessment will help determine the appropriate level of care." 
                : " Tafadhali kagua taarifa yako kwa uangalifu. Tathmini hii itasaidia kubaini kiwango cha chenji cha kufaa."}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          {currentStep > 1 && (
            <button className="btn btn--outline" onClick={prevStep}>
              ← {lang === "en" ? "Previous" : "Iliyotangulia"}
            </button>
          )}
          
          {currentStep < 4 ? (
            <button className="btn btn--primary" onClick={nextStep}>
              {lang === "en" ? "Next" : "Ifuatayo"} →
            </button>
          ) : (
            <button
              className="btn btn--primary btn--full"
              onClick={handleSubmit}
              disabled={loading || selectedSymptoms.size === 0}
            >
              {loading
                ? (lang === "en" ? "Analysing..." : "Inachambua...")
                : (lang === "en" ? "Get Triage Result →" : "Pata Matokeo →")}
            </button>
          )}
        </div>

        {/* Selected count */}
        {selectedSymptoms.size > 0 && (
          <p className="selected-count">
            {selectedSymptoms.size} symptom{selectedSymptoms.size !== 1 ? "s" : ""} selected
          </p>
        )}

        <p className="disclaimer">
          {lang === "en"
            ? "⚠️ AI-assisted guidance only. Not a diagnosis. Always confirm with a qualified healthcare professional."
            : "⚠️ Mwongozo wa AI-usaidizi tu. Si uchunguzi. Daima thibitisha na mtaalamu wa afya."}
        </p>
      </main>
    </div>
  );
}