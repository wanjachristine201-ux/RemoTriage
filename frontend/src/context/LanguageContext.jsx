// src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    'nav.brand': 'RemoTriage',
    'nav.start_assessment': 'Start Assessment',
    'nav.sign_in': 'Sign In',
    'nav.get_started': 'Get Started',
    'nav.language': 'Language',
    
    // Landing Page
    'landing.trusted_tagline': 'Trusted AI-Assisted Health Triage for Kenya',
    'landing.title': 'Know When to Seek Care',
    'landing.description': 'Get safe, reliable health guidance in under 60 seconds. RemoTriage combines WHO-aligned protocols with AI assistance to help you make informed healthcare decisions. Available via web app and USSD for all Kenyans.',
    'landing.start_assessment': 'Start Free Assessment',
    'landing.learn_more': 'Learn More',
    'landing.emergency_button': '🚨 Emergency Quick Access',
    'landing.disclaimer': '⚠️ AI-assisted guidance, not diagnosis. Always confirm with a qualified healthcare professional.',
    
    // Trust Signals
    'trust.who_imci': 'WHO IMCI Aligned',
    'trust.who_imci_desc': 'Built on World Health Organization Integrated Management of Childhood Illness protocols',
    'trust.universal_access': 'Universal Access',
    'trust.universal_access_desc': 'Works on smartphones and basic feature phones via USSD - no internet required',
    'trust.kenya_moh': 'Kenya Ministry of Health',
    'trust.kenya_moh_desc': 'Aligned with Kenya\'s national healthcare protocols and facility network',
    'trust.privacy': 'Privacy First',
    'trust.privacy_desc': 'Your health information is secure and confidential, compliant with healthcare standards',
    
    // How It Works
    'how_it_works.title': 'How RemoTriage Works',
    'how_it_works.select_symptoms': 'Select Symptoms',
    'how_it_works.select_symptoms_desc': 'Choose from a comprehensive list of symptoms in English or Kiswahili, designed for Kenya\'s healthcare context.',
    'how_it_works.ai_analysis': 'AI-Assisted Analysis',
    'how_it_works.ai_analysis_desc': 'Our WHO-aligned deterministic triage engine provides immediate, reliable assessment with supplementary AI guidance.',
    'how_it_works.clear_steps': 'Clear Next Steps',
    'how_it_works.clear_steps_desc': 'Receive actionable guidance on home care, clinic visits, or emergency care based on your specific situation.',
    
    // Safety Section
    'safety.title': 'Built for Safety and Trust',
    'safety.safety_first': 'Safety-First Design',
    'safety.safety_first_desc': 'Deterministic triage engine ensures consistent, reliable results. AI provides supplementary guidance only.',
    'safety.healthcare_professional': 'Healthcare Professional',
    'safety.healthcare_professional_desc': 'Developed with medical experts and aligned with WHO protocols and Kenya Ministry of Health standards.',
    'safety.kenya_focused': 'Kenya-Focused',
    'safety.kenya_focused_desc': 'Specifically designed for Kenya\'s healthcare landscape, facility network, and cultural context.',
    
    // Assessment Page
    'assessment.title': 'Symptom Assessment',
    'assessment.step': 'Step',
    'assessment.of': 'of',
    'assessment.symptoms': 'Symptoms',
    'assessment.medical_history': 'Medical History',
    'assessment.patient_info': 'Patient Info',
    'assessment.review': 'Review',
    
    // Emergency Symptoms
    'assessment.emergency_symptoms': 'Emergency Symptoms',
    'assessment.emergency_desc': 'Select if present (require urgent attention)',
    'assessment.common_symptoms': 'Common Symptoms',
    'assessment.mild_symptoms': 'Mild Symptoms',
    
    // Symptom Description
    'assessment.describe_symptoms': 'Describe your symptoms further',
    'assessment.symptoms_placeholder': 'When did symptoms start? What makes them better or worse? Any other details?',
    
    // Medical History
    'assessment.chronic_conditions': 'Chronic Conditions & Medical History',
    'assessment.chronic_desc': 'Select any chronic conditions you have. This helps us provide better guidance.',
    'assessment.medications': 'Current medications',
    'assessment.medications_placeholder': 'List any medications you\'re currently taking (including over-the-counter)',
    'assessment.allergies': 'Allergies',
    'assessment.allergies_placeholder': 'Any known allergies (medications, food, etc.)',
    
    // Patient Information
    'assessment.patient_info_title': 'Patient Information',
    'assessment.age_group': 'Age Group',
    'assessment.county': 'County',
    'assessment.season': 'Season',
    'assessment.pregnant': 'Currently pregnant',
    'assessment.additional_info': 'Additional Information',
    'assessment.additional_placeholder': 'Any other information that might help us provide better guidance...',
    
    // Location Context
    'assessment.location_context': 'Location Context',
    'assessment.location_desc': 'Assessment tailored for {county} County during {season} season',
    
    // Review
    'assessment.review_title': 'Review Your Assessment',
    'assessment.symptoms_selected': 'Symptoms:',
    'assessment.selected_count': 'selected',
    'assessment.chronic_selected': 'Chronic Conditions:',
    'assessment.age': 'Age Group:',
    'assessment.location': 'Location:',
    'assessment.pregnancy': 'Pregnancy:',
    'assessment.yes': 'Yes',
    'assessment.important': 'Important:',
    'assessment.important_desc': 'Please review your information carefully. This assessment will help determine the appropriate level of care.',
    
    // Navigation
    'assessment.previous': 'Previous',
    'assessment.next': 'Next',
    'assessment.analyzing': 'Analysing...',
    'assessment.get_results': 'Get Triage Result →',
    
    // Results Page
    'results.requires_immediate': 'REQUIRES IMMEDIATE ATTENTION',
    'results.requires_medical': 'REQUIRES MEDICAL ATTENTION',
    'results.monitor_home': 'MONITOR AT HOME',
    'results.confidence': 'Confidence:',
    'results.seek_emergency': 'Seek Emergency Care Immediately',
    'results.seek_emergency_desc': 'Your symptoms require immediate medical attention. Please go to the nearest emergency department or call emergency services right away.',
    'results.call_emergency': 'Call Emergency Services',
    'results.call_emergency_desc': 'Dial 999 or 0800 723 253 immediately',
    'results.go_hospital': 'Go to Nearest Hospital',
    'results.go_hospital_desc': 'Do not drive yourself if possible',
    'results.follow_up': 'Follow Up',
    'results.follow_up_desc': 'Inform family members about your situation',
    
    'results.schedule_doctor': 'Schedule Doctor Visit',
    'results.schedule_desc': 'Within 24-48 hours recommended',
    'results.monitor_symptoms': 'Monitor Symptoms',
    'results.monitor_desc': 'Watch for any changes or worsening',
    'results.rest_hydrate': 'Rest & Hydrate',
    'results.rest_desc': 'Get adequate rest and fluids',
    
    'results.home_care': 'Home Care',
    'results.home_desc': 'Rest, hydrate, and monitor symptoms',
    'results.otc_medication': 'Over-the-counter Medication',
    'results.otc_desc': 'Consider basic pain/fever relief if needed',
    'results.watch_changes': 'Watch for Changes',
    'results.watch_desc': 'Seek care if symptoms worsen or don\'t improve',
    
    'results.why_assessment': 'Why This Assessment',
    'results.safety_info': 'Important Safety Information',
    'results.safety_desc': 'This assessment is based on your reported symptoms and medical guidelines. It is not a diagnosis. Always consult with a qualified healthcare professional for proper medical care.',
    'results.next_steps': 'Recommended Next Steps',
    'results.prevention_tips': 'Prevention & Self-Care Tips',
    'results.ai_guidance': 'AI-Assisted Guidance',
    'results.ai_disclaimer': 'Note: AI guidance is supplementary only and cannot override the medical triage assessment. Always prioritize professional medical advice.',
    'results.facilities': 'Nearby Healthcare Facilities',
    'results.when_seek_care': 'When to Seek Further Care',
    'results.when_seek_desc': 'If your symptoms worsen, don\'t improve within expected time, or you develop new concerning symptoms, please seek medical attention promptly.',
    'results.call_help': 'Call for Help',
    'results.re_assess': 'Re-assess',
    'results.new_assessment': 'New Assessment',
    'results.home': 'Home',
    'results.medical_disclaimer': 'Medical Disclaimer',
    'results.medical_disclaimer_desc': 'RemoTriage provides AI-assisted health triage guidance, not medical diagnosis. This information is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions you may have regarding a medical condition.',
    
    // Age Groups
    'age.infant': 'Infant (<1 yr)',
    'age.child': 'Child (1–12)',
    'age.adult': 'Adult',
    'age.elderly': 'Elderly (60+)',
    
    // Seasons
    'season.dry': 'Dry season',
    'season.rainy': 'Rainy season',
    
    // Emergency
    'emergency.banner': '🚨 Life-threatening emergency? Call',
    'emergency.immediately': 'immediately',
    
    // Footer
    'footer.copyright': 'RemoTriage © 2025 · Built for Kenya\'s Healthcare System',
    'footer.not_device': 'Not a medical device — AI-assisted triage guidance only',
    'footer.ussd': 'Dial *384# for USSD access on any phone · Available in English & Kiswahili',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.continue': 'Continue',
    'common.finish': 'Finish',
    'common.close': 'Close',
  },
  
  sw: {
    // Navigation
    'nav.brand': 'RemoTriage',
    'nav.start_assessment': 'Anza Tathmini',
    'nav.sign_in': 'Ingia',
    'nav.get_started': 'Anza',
    'nav.language': 'Lugha',
    
    // Landing Page
    'landing.trusted_tagline': 'Mwongozo wa Afya wa AI-Usaidizi ulioaminika Kenya',
    'landing.title': 'Jua Lini Kuta Huduma',
    'landing.description': 'Pata mwongozo wa afya wa salama na wa kuaminika chini ya sekunde 60. RemoTriage inachanganya miongozo ya WHO na usaidizi wa AI kukusaidia kufanya maamuzi sahihi ya afya. Inapatikana kupitia programu ya wavuti na USSD kwa waKenya wote.',
    'landing.start_assessment': 'Anza Tathmini ya Bure',
    'landing.learn_more': 'Jifunze Zaidi',
    'landing.emergency_button': '🚨 Mfupi wa Dharura',
    'landing.disclaimer': '⚠️ Mwongozo wa AI-usaidizi tu, sio uchunguzi. Daima thibitisha na mtaalamu wa afya anayefaa.',
    
    // Trust Signals
    'trust.who_imci': 'IME ya WHO Imewekanishwa',
    'trust.who_imci_desc': 'Imejengwa kwenye miongozo ya Shirika la Afya Dunia ya Usimamizi wa Ugonjwa wa Watoto',
    'trust.universal_access': 'Ufikiaji wa Kila Mtu',
    'trust.universal_access_desc': 'Inafanya kazi kwenye simu za mkononi na simu za msingi kupitia USSD - hahitaji intaneti',
    'trust.kenya_moh': 'Wizara ya Afya ya Kenya',
    'trust.kenya_moh_desc': 'Imewekanishwa na miongozo ya afya ya kitaifa ya Kenya na mtandao wa vituo',
    'trust.privacy': 'Faraja ya Kwanza',
    'trust.privacy_desc': 'Maelezo yako ya afya ni salama na ya siri, inakidhi viwango vya afya',
    
    // How It Works
    'how_it_works.title': 'Jinsi RemoTriage Inavyofanya Kazi',
    'how_it_works.select_symptoms': 'Chagua Dalili',
    'how_it_works.select_symptoms_desc': 'Chagua kutoka kwenye orodha kamili ya dalili kwa Kiingereza au Kiswahili, iliyoundwa kwa muktadha wa afya wa Kenya.',
    'how_it_works.ai_analysis': 'Uchambuzi wa AI-Usaidizi',
    'how_it_works.ai_analysis_desc': 'Injini yetu ya kudumu ya tathimi iliowekanishwa na WHO inatoa tathmini ya haraka na ya kuaminika na mwongozo wa ziada wa AI.',
    'how_it_works.clear_steps': 'Hatua Zifuatazo za Wazi',
    'how_it_works.clear_steps_desc': 'Pokea mwongozo wa kuweza kutumika kuhusu matunzo ya nyumbani, ziara za kliniki, au huduma ya dharura kulingana na hali yako maalum.',
    
    // Safety Section
    'safety.title': 'Imejengwa kwa Usalama na Uaminifu',
    'safety.safety_first': 'Muundo wa Usalama wa Kwanza',
    'safety.safety_first_desc': 'Injini ya tathimi ya kudumu inahakikisha matokeo ya mara kwa mara na ya kuaminika. AI inatoa mwongozo wa ziada tu.',
    'safety.healthcare_professional': 'Mtaalamu wa Afya',
    'safety.healthcare_professional_desc': 'Imeundwa na wataalamu wa matibabu na imewekanishwa na miongozo ya WHO na viwango vya Wizara ya Afya ya Kenya.',
    'safety.kenya_focused': 'Iliyolenga Kenya',
    'safety.kenya_focused_desc': 'Ilipangwa mahususi kwa mandhari ya afya ya Kenya, mtandao wa vituo, na muktadha wa kiutamaduni.',
    
    // Assessment Page
    'assessment.title': 'Tathmini ya Dalili',
    'assessment.step': 'Hatua',
    'assessment.of': 'ya',
    'assessment.symptoms': 'Dalili',
    'assessment.medical_history': 'Historia ya Matibabu',
    'assessment.patient_info': 'Taarifa za Mgonjwa',
    'assessment.review': 'Kukagua',
    
    // Emergency Symptoms
    'assessment.emergency_symptoms': 'Dalili za Dharura',
    'assessment.emergency_desc': 'Chagua zilizopo (zinahitaji huduma ya haraka)',
    'assessment.common_symptoms': 'Dalili za Kawaida',
    'assessment.mild_symptoms': 'Dalili Ndogo',
    
    // Symptom Description
    'assessment.describe_symptoms': 'Eleza dalili zako zaidi',
    'assessment.symptoms_placeholder': 'Dalili zilianza lini? Nini huzifanya kuwa bora au mbaya? Maelezo mengine?',
    
    // Medical History
    'assessment.chronic_conditions': 'Magonjwa ya Kudumu & Historia ya Matibabu',
    'assessment.chronic_desc': 'Chagua magonjwa yoyote ya kudumu unayoayo. Hii husaidia kutoa mwongozo bora.',
    'assessment.medications': 'Dawa za sasa',
    'assessment.medications_placeholder': 'Orodhesha dawa zozote unazotumia kwa sasa (zikiwa pamoja na zisizo za daktari)',
    'assessment.allergies': 'Matatizo ya mialergi',
    'assessment.allergies_placeholder': 'Mialergi yoyote inayojulikana (dawa, chakula, n.k.)',
    
    // Patient Information
    'assessment.patient_info_title': 'Taarifa za Mgonjwa',
    'assessment.age_group': 'Kundi la Umri',
    'assessment.county': 'Kaunti',
    'assessment.season': 'Msimu',
    'assessment.pregnant': 'Ni mjamzito',
    'assessment.additional_info': 'Maelezo ya Ziada',
    'assessment.additional_placeholder': 'Maelezo yoyote mengine yanayoweza kusaidia kutoa mwongozo bora...',
    
    // Location Context
    'assessment.location_context': 'Muktadha wa Mahali',
    'assessment.location_desc': 'Tathmini imeboreshwa kwa Kaunti ya {county} wakati wa msimu wa {season}',
    
    // Review
    'assessment.review_title': 'Kagua Tathmini Yako',
    'assessment.symptoms_selected': 'Dalili:',
    'assessment.selected_count': 'zimechaguliwa',
    'assessment.chronic_selected': 'Magonjwa ya Kudumu:',
    'assessment.age': 'Kundi la Umri:',
    'assessment.location': 'Mahali:',
    'assessment.pregnancy': 'Ujauzito:',
    'assessment.yes': 'Ndio',
    'assessment.important': 'Muhimu:',
    'assessment.important_desc': 'Tafadhali kagua taarifa yako kwa uangalifu. Tathmini hii itasaidia kubaini kiwango cha chenji cha kufaa.',
    
    // Navigation
    'assessment.previous': 'Iliyotangulia',
    'assessment.next': 'Ifuatayo',
    'assessment.analyzing': 'Inachambua...',
    'assessment.get_results': 'Pata Matokeo →',
    
    // Results Page
    'results.requires_immediate': 'INAHITAJI UDHURU WA HARAKA',
    'results.requires_medical': 'INAHITAJI MATIBABU',
    'results.monitor_home': 'SAMBAZA NYUMBANI',
    'results.confidence': 'Uhakika:',
    'results.seek_emergency': 'Tafuta Huduma ya Dharura Mara Moja',
    'results.seek_emergency_desc': 'Dalili zako zinahitaji usaidizi wa matibabu wa haraka. Tafadhali nenda kituo cha dharura cha karibu zaidi au piga simu huduma za dharura mara moja.',
    'results.call_emergency': 'Piga Simu Huduma za Dharura',
    'results.call_emergency_desc': 'Piga 999 au 0800 723 253 mara moja',
    'results.go_hospital': 'Nenda Hospitali ya Karibu',
    'results.go_hospital_desc': 'Usiuendeshe gari lako iwezekanavyo',
    'results.follow_up': 'Fuatilia',
    'results.follow_up_desc': 'Mjulishe wanafamilia kuhusu hali yako',
    
    'results.schedule_doctor': 'Panga Ziara ya Daktari',
    'results.schedule_desc': 'Inapendekezwa ndani ya masaa 24-48',
    'results.monitor_symptoms': 'Sambaza Dalili',
    'results.monitor_desc': 'Angalia mabadiliko yoyote au kuzorota kwa hali',
    'results.rest_hydrate': 'Pumzika & Hydrate',
    'results.rest_desc': 'Pumzika vizuri na kunywa maji',
    
    'results.home_care': 'Matunzo ya Nyumbani',
    'results.home_desc': 'Pumzika, kunywa maji, na kusambaza dalili',
    'results.otc_medication': 'Dawa zisizo za Daktari',
    'results.otc_desc': 'Fikiria kuuza maumivu ya msingi/homa ikitabidi',
    'results.watch_changes': 'Angalia Mabadiliko',
    'results.watch_desc': 'Tafuta huduma kama dalili zinazorota au haziboreshi',
    
    'results.why_assessment': 'Kwa Nini Tathmini Hii',
    'results.safety_info': 'Maelezo Muhimu ya Usalama',
    'results.safety_desc': 'Tathmini hii inatokana na dalili zilizoripotiwa na mwongozo wa matibabu. Sio uchunguzi. Daima shauriana na mtaalamu wa afya anayefaa kwa huduma ya matibabu sahihi.',
    'results.next_steps': 'Hatua Zinazopendekezwa za Kufuata',
    'results.prevention_tips': 'Mapendekezo ya Kuzuia & Matunzo ya Kujihudumia',
    'results.ai_guidance': 'Mwongozo wa AI-Usaidizi',
    'results.ai_disclaimer': 'Kumbuka: Mwongozo wa AI ni wa ziada tu na hauwezi kubadilisha tathmini ya matibabu ya dharura. Daima weka kipaumbele kushauri na wataalamu wa matibabu.',
    'results.facilities': 'Vituo vya Afya Vilivyo Karibu',
    'results.when_seek_care': 'Lini Kuta huduma zaidi',
    'results.when_seek_desc': 'Kama dalili zako zinazorota, haziboreshi ndani ya muda unatarajiwa, au unajipata dalili mpya za kuwasiliana, tafadhali tafuta huduma ya matibabu haraka.',
    'results.call_help': 'Piga Simu Kwa Msaada',
    'results.re_assess': 'Tathmini Upya',
    'results.new_assessment': 'Tathmini Mpya',
    'results.home': 'Nyumbani',
    'results.medical_disclaimer': 'Kanusho la Matibabu',
    'results.medical_disclaimer_desc': 'RemoTriage inatoa mwongozo wa afya wa AI-usaidizi, sio uchunguzi wa matibabu. Maelezo haya ni kwa madhumuni ya kielimu tu na hayapaswi kubadilisha ushauri wa kitaalamu wa matibabu, uchunguzi, au matibabu. Daima tafuta ushauri wa watoa huduma wa afya walioidhinishwa na maswali yoyote unayokuwa nayo kuhusu hali ya matibabu.',
    
    // Age Groups
    'age.infant': 'Mtoto mchanga (<1 mwaka)',
    'age.child': 'Mtoto (1–12)',
    'age.adult': 'Mtu mzima',
    'age.elderly': 'Mzee (60+)',
    
    // Seasons
    'season.dry': 'Kiangazi',
    'season.rainy': 'Masika',
    
    // Emergency
    'emergency.banner': '🚨 Hatari ya maisha? Piga',
    'emergency.immediately': 'mara moja',
    
    // Footer
    'footer.copyright': 'RemoTriage © 2025 · Imejengwa kwa Mfumo wa Afya wa Kenya',
    'footer.not_device': 'Si kifaa cha matibabu — mwongozo wa tathimi wa AI-usaidizi tu',
    'footer.ussd': 'Piga *384# kwa ufikiaji wa USSD kwenye simu yoyote · Inapatikana kwa Kiingereza & Kiswahili',
    
    // Common
    'common.loading': 'Inapakia...',
    'common.error': 'Hitilafu',
    'common.cancel': 'Ghairi',
    'common.save': 'Hifadhi',
    'common.continue': 'Endelea',
    'common.finish': 'Maliza',
    'common.close': 'Funga',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to English
    const saved = localStorage.getItem('remotriage_language');
    return saved && (saved === 'en' || saved === 'sw') ? saved : 'en';
  });

  const t = (key, params = {}) => {
    const translation = translations[language][key] || translations.en[key] || key;
    
    // Replace parameters in the translation
    return Object.keys(params).reduce((str, param) => {
      return str.replace(`{${param}}`, params[param]);
    }, translation);
  };

  const changeLanguage = (lang) => {
    if (lang === 'en' || lang === 'sw') {
      setLanguage(lang);
      localStorage.setItem('remotriage_language', lang);
    }
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'sw' : 'en');
  };

  useEffect(() => {
    // Update document language attribute
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
