// ============================================================
// RemoTriage v4 — Deterministic Triage Engine
// src/services/triageEngine.js
//
// SOURCE OF TRUTH. No AI, no network calls.
// WHO IMCI-aligned + Kenya MoH protocols.
// Runs synchronously and is fully offline-capable.
// ============================================================

"use strict";

// ── VALID SYMPTOM IDs ────────────────────────────────────────
const VALID_SYMPTOMS = new Set([
  "fever", "high_fever", "mild_fever", "chills", "night_sweats",
  "difficulty_breathing", "cough", "mild_cough", "persistent_cough", "chest_pain",
  "severe_headache", "mild_headache", "stiff_neck", "convulsions",
  "altered_consciousness", "confusion", "blurred_vision", "lethargy",
  "abdominal_pain", "severe_abdominal_pain", "diarrhea", "vomiting",
  "cannot_drink", "no_urination",
  "fatigue", "weight_loss", "recurrent_infections", "face_swelling",
  "runny_nose", "sore_throat", "vaginal_bleeding", "not_feeding",
]);

// ── MALARIA ENDEMIC COUNTIES ─────────────────────────────────
const MALARIA_ENDEMIC_COUNTIES = new Set([
  "Kisumu", "Homa Bay", "Migori", "Siaya", "Kisii", "Nyamira",
  "Busia", "Bungoma", "Kakamega", "Vihiga", "Kilifi", "Kwale",
  "Mombasa", "Tana River", "Lamu", "Garissa", "Wajir", "Mandera",
  "Turkana", "West Pokot", "Samburu",
]);

// ── TRIAGE RULES (ordered: most severe first) ────────────────
//
// Each rule: { id, level, conditions(symptoms, ctx), suspect, reason, action,
//              facilityType, callEmergency, protocol }
//
// conditions(symptoms: Set, ctx: object) → boolean
//
const RULES = [

  // ── EMERGENCY RULES ─────────────────────────────────────────

  {
    id: "CEREBRAL_MALARIA",
    level: "EMERGENCY",
    conditions: (s, ctx) =>
      (s.has("altered_consciousness") || s.has("convulsions")) &&
      (s.has("fever") || s.has("high_fever")) &&
      MALARIA_ENDEMIC_COUNTIES.has(ctx.county),
    suspect: "Possible Cerebral Malaria",
    reason: {
      en: "Loss of consciousness or seizures combined with fever in a malaria-endemic county is a medical emergency consistent with cerebral malaria.",
      sw: "Kupoteza fahamu au degedege pamoja na homa katika kaunti ya malaria ni dharura ya kimatibabu inayoashiria malaria ya ubongo.",
    },
    action: {
      en: "Go to hospital IMMEDIATELY. Do not wait. Call emergency services now. Cerebral malaria can be fatal within hours without IV treatment.",
      sw: "Nenda hospitalini MARA MOJA. Usissubiri. Piga simu ya dharura sasa. Malaria ya ubongo inaweza kuua ndani ya masaa bila matibabu ya mishipa.",
    },
    facilityType: "hospital",
    callEmergency: true,
    protocol: "WHO_Malaria_Severe_2015 / KEMSA",
  },

  {
    id: "RESPIRATORY_EMERGENCY",
    level: "EMERGENCY",
    conditions: (s) =>
      s.has("difficulty_breathing") &&
      (s.has("chest_pain") || s.has("altered_consciousness") || s.has("convulsions")),
    suspect: "Severe Respiratory Distress",
    reason: {
      en: "Difficulty breathing combined with chest pain or altered consciousness indicates a life-threatening emergency requiring immediate hospital care.",
      sw: "Ugumu kupumua pamoja na maumivu ya kifua au kupoteza fahamu ni dalili ya dharura inayohitaji huduma ya hospitalini mara moja.",
    },
    action: {
      en: "Call emergency services NOW. Go to the nearest hospital immediately. Do not drive yourself — call for help or an ambulance.",
      sw: "Piga simu ya dharura SASA. Nenda hospitalini karibu nawe mara moja. Usijiendeshe — omba msaada au ambulensi.",
    },
    facilityType: "hospital",
    callEmergency: true,
    protocol: "WHO_IMCI_Emergency / Kenya_MoH_ARI",
  },

  {
    id: "MENINGITIS",
    level: "EMERGENCY",
    conditions: (s) =>
      s.has("stiff_neck") &&
      (s.has("severe_headache") || s.has("high_fever")) &&
      (s.has("fever") || s.has("high_fever") || s.has("convulsions") || s.has("altered_consciousness")),
    suspect: "Possible Bacterial Meningitis",
    reason: {
      en: "Stiff neck with high fever and severe headache is a classic presentation of bacterial meningitis — a life-threatening emergency.",
      sw: "Shingo ngumu pamoja na homa kali na maumivu makali ya kichwa ni dalili za kawaida za meningitis ya bakteria — dharura inayohatarisha maisha.",
    },
    action: {
      en: "Go to hospital IMMEDIATELY. Bacterial meningitis requires urgent IV antibiotics. Every hour of delay worsens outcomes.",
      sw: "Nenda hospitalini MARA MOJA. Meningitis ya bakteria inahitaji dawa za mishipa kwa haraka. Kila saa ya kuchelewa inazidisha hali.",
    },
    facilityType: "hospital",
    callEmergency: true,
    protocol: "WHO_IMCI_Meningitis / Kenya_MoH_2019",
  },

  {
    id: "OBSTETRIC_EMERGENCY",
    level: "EMERGENCY",
    conditions: (s, ctx) =>
      ctx.isPregnant &&
      (s.has("vaginal_bleeding") || s.has("severe_abdominal_pain") ||
       s.has("convulsions") || s.has("altered_consciousness")),
    suspect: "Obstetric Emergency",
    reason: {
      en: "Bleeding, severe abdominal pain, or convulsions in pregnancy are life-threatening obstetric emergencies.",
      sw: "Kutoka damu, maumivu makali ya tumbo, au degedege wakati wa ujauzito ni dharura za uzazi zinazhatarisha maisha.",
    },
    action: {
      en: "Go to the nearest maternity hospital IMMEDIATELY. Call for help now. Do not wait for symptoms to pass.",
      sw: "Nenda hospitalini ya uzazi iliyo karibu MARA MOJA. Omba msaada sasa. Usissubiri dalili zipite.",
    },
    facilityType: "hospital",
    callEmergency: true,
    protocol: "Kenya_MoH_Obstetric_Emergency / WHO_IMPAC",
  },

  {
    id: "INFANT_DANGER_SIGNS",
    level: "EMERGENCY",
    conditions: (s, ctx) =>
      ctx.ageGroup === "infant" &&
      (s.has("convulsions") || s.has("altered_consciousness") ||
       s.has("not_feeding") || s.has("difficulty_breathing") ||
       (s.has("high_fever") && s.has("lethargy"))),
    suspect: "Infant Danger Signs",
    reason: {
      en: "These are WHO-IMCI danger signs in an infant. Young children deteriorate rapidly and require urgent clinical assessment.",
      sw: "Hizi ni dalili za hatari za WHO-IMCI kwa mtoto mchanga. Watoto wachanga huharibika haraka na wanahitaji tathmini ya haraka ya kliniki.",
    },
    action: {
      en: "Take the infant to a hospital IMMEDIATELY. Do not delay. Infants with these signs need urgent medical evaluation.",
      sw: "Mpeleke mtoto mchanga hospitalini MARA MOJA. Usikawii. Watoto wachanga wenye dalili hizi wanahitaji tathmini ya haraka ya kimatibabu.",
    },
    facilityType: "hospital",
    callEmergency: true,
    protocol: "WHO_IMCI_Infant / Kenya_MoH_Paeds",
  },

  {
    id: "SEVERE_DEHYDRATION",
    level: "EMERGENCY",
    conditions: (s) =>
      (s.has("diarrhea") || s.has("vomiting")) &&
      s.has("cannot_drink") && s.has("no_urination"),
    suspect: "Severe Dehydration",
    reason: {
      en: "Unable to drink fluids combined with no urination indicates severe dehydration — a medical emergency requiring IV fluids.",
      sw: "Kutoweza kunywa maji pamoja na kutokuwa na mkojo unaashiria upungufu mkubwa wa maji — dharura inayohitaji maji ya mishipa.",
    },
    action: {
      en: "Go to hospital IMMEDIATELY for IV fluid replacement. Severe dehydration is life-threatening, especially in infants and the elderly.",
      sw: "Nenda hospitalini MARA MOJA kwa kujazwa maji kupitia mishipa. Upungufu mkubwa wa maji ni hatari kwa maisha, hasa kwa watoto wachanga na wazee.",
    },
    facilityType: "hospital",
    callEmergency: true,
    protocol: "WHO_ORT_Severe / Kenya_MoH_Diarrhoea",
  },

  // ── MODERATE RULES ──────────────────────────────────────────

  {
    id: "MALARIA_SUSPECTED",
    level: "MODERATE",
    conditions: (s, ctx) =>
      (s.has("fever") || s.has("high_fever") || s.has("mild_fever")) &&
      (s.has("chills") || s.has("severe_headache") || s.has("fatigue")) &&
      MALARIA_ENDEMIC_COUNTIES.has(ctx.county),
    suspect: "Suspected Malaria",
    reason: {
      en: "Fever with chills, headache, or fatigue in a malaria-endemic county requires prompt malaria testing.",
      sw: "Homa pamoja na baridi, maumivu ya kichwa, au uchovu katika kaunti ya malaria inahitaji upimaji wa malaria wa haraka.",
    },
    action: {
      en: "Visit a health facility today for a malaria rapid test (RDT). Free testing is available at government dispensaries. Do not self-treat without a test.",
      sw: "Tembelea kituo cha afya leo kwa kipimo cha haraka cha malaria (RDT). Upimaji wa bure unapatikana katika zahanati za serikali. Usijitibue bila kipimo.",
    },
    facilityType: "health_centre",
    callEmergency: false,
    protocol: "Kenya_MoH_Malaria_Policy_2019 / WHO_RDT",
  },

  {
    id: "RAINY_SEASON_FEVER",
    level: "MODERATE",
    conditions: (s, ctx) =>
      (s.has("fever") || s.has("high_fever")) &&
      ctx.season === "rainy" &&
      MALARIA_ENDEMIC_COUNTIES.has(ctx.county),
    suspect: "Fever in Malaria Season",
    reason: {
      en: "Fever during the rainy season in an endemic county has a high prior probability of malaria.",
      sw: "Homa wakati wa mvua katika kaunti ya malaria ina uwezekano mkubwa wa kuwa malaria.",
    },
    action: {
      en: "Get a malaria test at your nearest government health facility today. Treatment is free with a positive test.",
      sw: "Pima malaria katika kituo cha afya cha serikali kilicho karibu nawe leo. Matibabu ni bure ukipata matokeo chanya.",
    },
    facilityType: "health_centre",
    callEmergency: false,
    protocol: "Kenya_MoH_Malaria_Policy_2019",
  },

  {
    id: "POSSIBLE_TB",
    level: "MODERATE",
    conditions: (s) =>
      s.has("persistent_cough") &&
      (s.has("weight_loss") || s.has("night_sweats") || s.has("fatigue")),
    suspect: "Possible Tuberculosis",
    reason: {
      en: "A cough lasting 2 or more weeks combined with weight loss or night sweats meets the WHO criteria for TB screening.",
      sw: "Kikohozi kinachochukua wiki 2 au zaidi pamoja na kupoteza uzito au jasho usiku kinakidhi vigezo vya WHO vya uchunguzi wa TB.",
    },
    action: {
      en: "Visit a health facility this week for TB screening. Sputum tests and chest X-rays are free at government hospitals. TB is curable with treatment.",
      sw: "Tembelea kituo cha afya wiki hii kwa uchunguzi wa TB. Vipimo vya makohozi na eksirei ni bure katika hospitali za serikali. TB inatibika.",
    },
    facilityType: "health_centre",
    callEmergency: false,
    protocol: "Kenya_MoH_TB_Guidelines_2022 / WHO_TB",
  },

  {
    id: "POSSIBLE_HIV_OI",
    level: "MODERATE",
    conditions: (s) =>
      s.has("weight_loss") && s.has("recurrent_infections") &&
      (s.has("night_sweats") || s.has("persistent_cough") || s.has("fatigue")),
    suspect: "Possible HIV / Opportunistic Infection",
    reason: {
      en: "Unexplained weight loss with recurrent infections and night sweats warrants HIV testing and further clinical evaluation.",
      sw: "Kupoteza uzito bila sababu wazi pamoja na maambukizi yanayorudia na jasho usiku kunahitaji upimaji wa VVU na tathmini zaidi ya kliniki.",
    },
    action: {
      en: "Visit a health facility for voluntary HIV testing and counselling (HTC). Testing is confidential and free at all government facilities.",
      sw: "Tembelea kituo cha afya kwa upimaji wa hiari wa VVU na ushauri (HTC). Upimaji ni wa siri na bure katika vituo vyote vya serikali.",
    },
    facilityType: "health_centre",
    callEmergency: false,
    protocol: "Kenya_MoH_HIV_2022 / WHO_ART",
  },

  {
    id: "MODERATE_RESPIRATORY",
    level: "MODERATE",
    conditions: (s) =>
      s.has("difficulty_breathing") &&
      !s.has("chest_pain") && !s.has("altered_consciousness") && !s.has("convulsions"),
    suspect: "Respiratory Illness",
    reason: {
      en: "Difficulty breathing without other danger signs suggests a respiratory illness (e.g. severe pneumonia, asthma attack) requiring same-day medical review.",
      sw: "Ugumu kupumua bila dalili nyingine za hatari unaashiria ugonjwa wa kupumua (mf. nimonia kali, shambulio la pumu) unaohitaji tathmini ya kimatibabu siku hiyo.",
    },
    action: {
      en: "Go to a health facility today — do not wait until tomorrow. If breathing worsens significantly, proceed to hospital immediately.",
      sw: "Nenda kituo cha afya leo — usissubiri kesho. Kama kupumua kuzidi kuwa mbaya zaidi, nenda hospitalini mara moja.",
    },
    facilityType: "health_centre",
    callEmergency: false,
    protocol: "Kenya_MoH_ARI / WHO_IMCI_ALRI",
  },

  {
    id: "MODERATE_FEVER_CHILD",
    level: "MODERATE",
    conditions: (s, ctx) =>
      (ctx.ageGroup === "child" || ctx.ageGroup === "infant") &&
      (s.has("high_fever") || s.has("fever")) &&
      (s.has("severe_headache") || s.has("stiff_neck") || s.has("confusion")),
    suspect: "Febrile Illness with Neurological Signs in Child",
    reason: {
      en: "High fever with headache, stiff neck, or confusion in a child requires urgent evaluation to rule out meningitis and cerebral malaria.",
      sw: "Homa kali pamoja na maumivu ya kichwa, shingo ngumu, au mkanganyiko kwa mtoto kunahitaji tathmini ya haraka kuondoa meningitis na malaria ya ubongo.",
    },
    action: {
      en: "Take the child to a health facility TODAY. If you see any worsening — seizures, loss of consciousness — go to hospital immediately.",
      sw: "Mpeleke mtoto kituo cha afya LEO. Kama utaona hali inazidi — degedege, kupoteza fahamu — nenda hospitalini mara moja.",
    },
    facilityType: "health_centre",
    callEmergency: false,
    protocol: "WHO_IMCI_Child / Kenya_MoH_Paeds",
  },

  {
    id: "DIARRHOEA_MODERATE",
    level: "MODERATE",
    conditions: (s) =>
      s.has("diarrhea") &&
      (s.has("vomiting") || s.has("high_fever")) &&
      !s.has("cannot_drink"),
    suspect: "Gastroenteritis with Dehydration Risk",
    reason: {
      en: "Diarrhoea with vomiting or fever can lead to dangerous dehydration, especially in children and the elderly.",
      sw: "Kuhara pamoja na kutapika au homa kunaweza kusababisha upungufu wa maji hatari, hasa kwa watoto na wazee.",
    },
    action: {
      en: "Start oral rehydration salts (ORS) immediately — mix 1 sachet in 1 litre of clean water. Visit a health facility today if not improving within 6 hours.",
      sw: "Anza chumvi za kujazwa maji (ORS) mara moja — changanya mfuko 1 katika lita 1 ya maji safi. Tembelea kituo cha afya leo ikiwa haiboreshi ndani ya saa 6.",
    },
    facilityType: "dispensary",
    callEmergency: false,
    protocol: "WHO_ORT / Kenya_MoH_Diarrhoea",
  },

  {
    id: "MODERATE_FEVER_ELDERLY",
    level: "MODERATE",
    conditions: (s, ctx) =>
      ctx.ageGroup === "elderly" &&
      (s.has("high_fever") || (s.has("fever") && s.has("confusion"))),
    suspect: "Febrile Illness in Elderly",
    reason: {
      en: "Fever in elderly patients can mask serious infections. Confusion with fever is especially concerning and warrants same-day assessment.",
      sw: "Homa kwa wazee inaweza kuficha maambukizi makubwa. Mkanganyiko pamoja na homa ni wasiwasi hasa na unahitaji tathmini siku hiyo.",
    },
    action: {
      en: "Visit a health facility today for assessment. Bring any medication the patient is currently taking.",
      sw: "Tembelea kituo cha afya leo kwa tathmini. Lete dawa zote anazotumia mgonjwa kwa sasa.",
    },
    facilityType: "health_centre",
    callEmergency: false,
    protocol: "Kenya_MoH_Elderly_Care",
  },

  // ── LOW RULES ────────────────────────────────────────────────

  {
    id: "URTI",
    level: "LOW",
    conditions: (s) =>
      (s.has("mild_cough") || s.has("runny_nose") || s.has("sore_throat")) &&
      !s.has("high_fever") && !s.has("difficulty_breathing") &&
      !s.has("persistent_cough"),
    suspect: "Upper Respiratory Tract Infection (Common Cold / Flu)",
    reason: {
      en: "Mild cough, runny nose, and sore throat without high fever or breathing difficulty suggest an uncomplicated upper respiratory infection.",
      sw: "Kikohozi kidogo, pua inayotiririka, na koo inayouma bila homa kali au ugumu kupumua kunaashiria maambukizi ya njia ya juu ya kupumua yasiyokomplika.",
    },
    action: {
      en: "Rest and stay hydrated. Symptoms usually resolve in 7–10 days. Use paracetamol for fever or pain if needed. See a health worker if symptoms worsen or last more than 10 days.",
      sw: "Pumzika na kunywa maji mengi. Dalili kawaida huisha ndani ya siku 7–10. Tumia paracetamol kwa homa au maumivu ikiwa inahitajika. Tembelea mfanyakazi wa afya ikiwa dalili zinazidi au kudumu zaidi ya siku 10.",
    },
    facilityType: "dispensary",
    callEmergency: false,
    protocol: "Kenya_MoH_URTI / WHO_IMCI",
  },

  {
    id: "MILD_FEVER_LOW_RISK",
    level: "LOW",
    conditions: (s) =>
      s.has("mild_fever") &&
      !s.has("stiff_neck") && !s.has("convulsions") &&
      !s.has("altered_consciousness") && !s.has("difficulty_breathing"),
    suspect: "Mild Febrile Illness",
    reason: {
      en: "Mild fever without danger signs is likely a self-limiting viral illness.",
      sw: "Homa ndogo bila dalili za hatari inaweza kuwa ugonjwa wa virusi unaopungua peke yake.",
    },
    action: {
      en: "Monitor temperature every 4–6 hours. Take paracetamol for comfort. Drink plenty of fluids. If fever rises above 38.5°C or new symptoms appear, visit a health facility.",
      sw: "Fuatilia joto kila masaa 4–6. Chukua paracetamol kwa starehe. Kunywa maji mengi. Kama homa inaongezeka zaidi ya 38.5°C au dalili mpya zinaonekana, tembelea kituo cha afya.",
    },
    facilityType: "dispensary",
    callEmergency: false,
    protocol: "Kenya_MoH_Fever_Management",
  },

  {
    id: "GI_MILD",
    level: "LOW",
    conditions: (s) =>
      (s.has("diarrhea") || s.has("vomiting") || s.has("abdominal_pain")) &&
      !s.has("high_fever") && !s.has("cannot_drink") && !s.has("no_urination"),
    suspect: "Mild Gastrointestinal Illness",
    reason: {
      en: "Mild stomach upset, loose stools, or abdominal pain without danger signs is likely a self-limiting gastrointestinal illness.",
      sw: "Tumbo kidogo, kinyesi laini, au maumivu ya tumbo bila dalili za hatari kunaweza kuwa ugonjwa mdogo wa utumbo unaopona peke yake.",
    },
    action: {
      en: "Stay hydrated with ORS or clean water. Eat small, bland meals. Avoid street food. See a health worker if symptoms persist beyond 48 hours or if you cannot keep fluids down.",
      sw: "Jiburudishe kwa ORS au maji safi. Kula milo midogo ya chakula cha kawaida. Epuka chakula cha barabarani. Tembelea mfanyakazi wa afya ikiwa dalili zinaendelea zaidi ya masaa 48 au kama huwezi kudumisha maji.",
    },
    facilityType: "dispensary",
    callEmergency: false,
    protocol: "Kenya_MoH_GI / WHO_ORT",
  },

  {
    id: "FATIGUE_GENERAL",
    level: "LOW",
    conditions: (s) =>
      s.has("fatigue") &&
      !s.has("fever") && !s.has("high_fever") &&
      !s.has("weight_loss") && !s.has("persistent_cough"),
    suspect: "General Fatigue / Weakness",
    reason: {
      en: "Fatigue without fever, weight loss, or persistent cough may have many causes, most of which are manageable.",
      sw: "Uchovu bila homa, kupoteza uzito, au kikohozi kinachoendelea unaweza kuwa na sababu nyingi, nyingi zikiweza kudhibitiwa.",
    },
    action: {
      en: "Rest well, maintain a balanced diet, and stay hydrated. If fatigue is severe or has lasted more than 2 weeks, visit a health facility for a check-up.",
      sw: "Pumzika vizuri, kudumisha lishe bora, na kunywa maji mengi. Kama uchovu ni mkubwa au umechukua zaidi ya wiki 2, tembelea kituo cha afya kwa uchunguzi.",
    },
    facilityType: "dispensary",
    callEmergency: false,
    protocol: "Kenya_MoH_General",
  },

  // ── CATCH-ALL ────────────────────────────────────────────────
  {
    id: "GENERAL_ILLNESS",
    level: "LOW",
    conditions: () => true, // always matches if nothing above did
    suspect: "General Illness",
    reason: {
      en: "Your symptoms do not currently match a specific high-risk pattern.",
      sw: "Dalili zako kwa sasa hazilingani na muundo mahususi wa hatari ya juu.",
    },
    action: {
      en: "Monitor your symptoms. If they worsen, new symptoms appear, or you are concerned, visit the nearest health facility.",
      sw: "Fuatilia dalili zako. Kama zinazidi, dalili mpya zinaonekana, au unajali, tembelea kituo cha afya kilicho karibu nawe.",
    },
    facilityType: "dispensary",
    callEmergency: false,
    protocol: "Kenya_MoH_General",
  },
];

// ── DISCLAIMER TEXT ──────────────────────────────────────────
const DISCLAIMER = {
  en: "⚠️ This is triage guidance only — not a diagnosis. Always confirm findings with a qualified health worker.",
  sw: "⚠️ Hii ni mwongozo wa utriage tu — si uchunguzi. Daima thibitisha matokeo na mfanyakazi wa afya aliyehitimu.",
};

// ── MAIN runTriage FUNCTION ──────────────────────────────────
/**
 * @param {Object} params
 * @param {string[]} params.symptoms  - array of symptom IDs
 * @param {string}   params.ageGroup  - infant | child | adult | elderly
 * @param {boolean}  params.isPregnant
 * @param {string}   params.county
 * @param {string}   params.season    - rainy | dry
 * @returns {Object} triageResult
 */
function runTriage({ symptoms = [], ageGroup = "adult", isPregnant = false, county = "", season = "dry" }) {
  const symptomSet = new Set(symptoms.filter((s) => VALID_SYMPTOMS.has(s)));
  const ctx = { ageGroup, isPregnant, county, season };

  const matched = RULES.filter((rule) => rule.conditions(symptomSet, ctx));

  // Primary result = first (most severe) match
  const primary = matched[0] || RULES[RULES.length - 1];

  // Secondary findings = all other EMERGENCY/MODERATE matches (excluding catch-all)
  const otherFindings = matched
    .slice(1)
    .filter((r) => r.level !== "LOW" && r.id !== "GENERAL_ILLNESS")
    .map((r) => ({ id: r.id, level: r.level, suspect: r.suspect }));

  return {
    level: primary.level,
    ruleId: primary.id,
    suspect: primary.suspect,
    reason: primary.reason,
    action: primary.action,
    callEmergency: primary.callEmergency,
    facilityType: primary.facilityType,
    protocol: primary.protocol,
    allMatchedRules: otherFindings,
    disclaimer: DISCLAIMER,
    malariaEndemicCounty: MALARIA_ENDEMIC_COUNTIES.has(county),
    timestamp: new Date().toISOString(),
    version: "4.0.0",
    engine: "RemoTriage-Deterministic-v4",
  };
}

module.exports = { runTriage, VALID_SYMPTOMS };
