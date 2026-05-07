# RemoTriage v4

**Safe, rule-based health triage for Kenya. Web + USSD. WHO IMCI-aligned.**

> ⚠️ Triage guidance tool only. Not a medical device. Always confirm with a qualified health worker.

---

## 🏗️ Architecture Overview

```
remotriage/
├── backend/
│   ├── server.js              ← Entry point
│   ├── config/
│   │   └── database.js        ← MongoDB connection
│   └── src/
│       ├── app.js             ← Express app, middleware stack
│       ├── controllers/
│       │   ├── triageController.js
│       │   ├── authController.js
│       │   ├── facilityController.js
│       │   └── ussdController.js
│       ├── services/
│       │   ├── triageEngine.js     ← DETERMINISTIC core (no AI)
│       │   ├── aiService.js        ← Supplementary AI layer
│       │   ├── facilityService.js  ← KMHFR + offline DB
│       │   └── ussdService.js      ← Africa's Talking USSD
│       ├── routes/
│       │   ├── triage.js
│       │   ├── auth.js
│       │   ├── facilities.js
│       │   └── ussd.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Assessment.js
│       │   └── Facility.js
│       ├── middlewares/
│       │   ├── auth.js           ← JWT auth
│       │   ├── optionalAuth.js
│       │   ├── validate.js       ← Joi schemas
│       │   └── errorHandler.js   ← Centralized errors
│       └── utils/
│           └── logger.js
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── context/AuthContext.jsx
        ├── hooks/useTriage.js
        ├── services/api.js
        └── pages/
            ├── Landing.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── Assessment.jsx
            └── Results.jsx
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and Anthropic API key
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔌 API Reference

### POST /api/v4/triage

```json
{
  "symptoms": ["fever", "altered_consciousness"],
  "ageGroup": "adult",
  "isPregnant": false,
  "county": "Kisumu",
  "season": "rainy",
  "language": "en",
  "requestAI": true
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "uuid",
  "triage": {
    "level": "EMERGENCY",
    "ruleId": "CEREBRAL_MALARIA",
    "suspect": "Possible Cerebral Malaria",
    "reason": { "en": "...", "sw": "..." },
    "action": { "en": "Go to hospital IMMEDIATELY...", "sw": "..." },
    "callEmergency": true,
    "facilityType": "hospital",
    "protocol": "WHO_Malaria_Severe_2015 / KEMSA"
  },
  "aiGuidance": null,
  "aiSafetyNote": "AI guidance is supplementary only. It cannot override the rule-based triage level.",
  "facilities": { ... },
  "emergency": { "national": { "number": "0800 723 253", "free": true } }
}
```

### POST /api/v4/auth/register
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "securepass123" }
```

### POST /api/v4/auth/login
```json
{ "email": "jane@example.com", "password": "securepass123" }
```

### GET /api/v4/facilities?county=Nairobi

### POST /api/v4/ussd (Africa's Talking webhook)

---

## 🧠 Safety Architecture

```
User Input
    │
    ▼
[Joi Validation] ──── Invalid ──→ 400 Error
    │
    ▼
[Deterministic Triage Engine]   ← SOURCE OF TRUTH
    │                              Rule-based, no network
    │                              WHO IMCI + Kenya MoH protocols
    ▼
triageResult.level = EMERGENCY|MODERATE|LOW
    │
    ├── level == EMERGENCY ──→ Skip AI, return immediately
    │
    └── level != EMERGENCY ──→ [AI Service] (supplementary)
                                    │
                                    ├── Sanitise output
                                    ├── Block diagnosis language
                                    ├── Block level downgrades
                                    └── Return explanation only
```

**Core safety contract:**
- AI **NEVER** called for EMERGENCY results
- AI **CANNOT** change `triage.level`
- If AI fails → graceful fallback, triage result unchanged
- Deterministic engine runs synchronously (offline-capable)

---

## 📱 USSD Flow

Dial `*384#` from any Kenyan phone (via Africa's Talking):

```
Step 1: Age group selection
Step 2: County selection
Step 3: Main symptom selection
Step 4: Follow-up questions (symptom-dependent)
Step 5: Result (END message)

EMERGENCY results terminate immediately with hospital + emergency number
MODERATE/LOW results show action + nearest facility
```

No internet needed on the user's device. Works on 2G feature phones.

---

## 🗄️ Database Schema

### User
| Field | Type | Notes |
|-------|------|-------|
| name | String | Required |
| email | String | Unique, lowercase |
| phone | String | Optional, E.164 |
| password | String | bcrypt hashed, never returned |
| role | Enum | patient / clinician / admin |

### Assessment
| Field | Type | Notes |
|-------|------|-------|
| requestId | UUID | Indexed, public reference |
| userId | ObjectId | Null for anonymous |
| input | Object | symptoms, ageGroup, county, etc |
| triage | Object | level, ruleId, suspect |
| aiGuidance | String | Supplementary only |
| feedback | Object | rating 1-5, comment |

### Facility
| Field | Type | Notes |
|-------|------|-------|
| name | String | |
| county | String | Indexed |
| level | Enum | L2–L6 |
| location | GeoJSON Point | 2dsphere index |
| services | [String] | maternity, emergency, etc |

---

## 🔐 Security Checklist

- [x] JWT authentication (7-day expiry)
- [x] bcrypt password hashing (cost factor 12)
- [x] Joi input validation on all endpoints
- [x] express-mongo-sanitize (NoSQL injection prevention)
- [x] Helmet.js security headers
- [x] Rate limiting (100 req/15min per IP)
- [x] IP hashing in logs (no raw IPs stored)
- [x] Error messages sanitised in production
- [x] Request body size limit (10kb)

---

## 🌍 Startup Pitch

### Elevator Pitch
RemoTriage is a mobile-first health triage platform that helps people in Kenya's low-resource communities make life-or-death care decisions in under 60 seconds — using WHO-aligned protocols accessible via smartphone or a basic feature phone with no internet.

### Problem
Kenya has **1 doctor per 5,000 people** in rural areas. Every day, thousands of families face the same question: "Is this serious enough to go to hospital?" The wrong answer — in either direction — costs lives. Over-reliance on informal advice leads to delayed emergency care. Unnecessary clinic visits overwhelm fragile facilities. There is no trusted, accessible triage tool built for this context.

### Solution
RemoTriage delivers safe, deterministic symptom triage through:
- **Web app** — clean 3-step flow, bilingual (English/Kiswahili)
- **USSD** (`*384#`) — works on any phone, no internet, no data cost
- **API** — embeddable by CHWs, clinics, and insurance platforms
- **AI layer** — Claude provides warm, simple guidance *after* the rule engine decides — never instead of it

### Market Opportunity
- 54 million Kenyans; 70% in low-resource settings
- 46 million mobile subscribers; 30M are feature phones
- Digital health market in Sub-Saharan Africa: **$3.4B by 2028** (CAGR 22%)
- NHIF + SHA reform creating demand for pre-authorisation triage tools

### Competitive Advantage
| Feature | RemoTriage | Generic symptom checkers |
|---------|-----------|--------------------------|
| USSD / Feature phone | ✅ | ❌ |
| Kenya-specific protocols | ✅ | ❌ |
| Bilingual EN/SW | ✅ | ❌ |
| Offline-capable | ✅ | ❌ |
| WHO IMCI aligned | ✅ | Partial |
| AI cannot override triage | ✅ | Unknown |

### Monetization
1. **B2B SaaS** — CHW platforms, mission hospitals, insurance (SHA/NHIF pre-auth)
2. **API licensing** — Telecoms (Safaricom, Airtel), health apps
3. **Data insights** (anonymised) — MoH, NGOs, research institutions
4. **Premium features** — Assessment history, family health profiles, CHW dashboards

### Roadmap
**Phase 1 (Current):** Core triage API + web + USSD for Kenya
**Phase 2:** CHW dashboard, assessment history, integration with KMHFR live facility data
**Phase 3:** East Africa expansion (Uganda, Tanzania), maternal health module
**Phase 4:** Insurance pre-authorisation API, diagnostic support tools

---

## License
MIT — Built for Kenya's health system