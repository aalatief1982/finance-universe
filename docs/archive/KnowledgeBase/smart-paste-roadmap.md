# Smart Paste Parsing & Learning - Implementation Roadmap (Post-SWOT)

This roadmap translates critical SWOT insights into actionable improvements for the Smart Paste SMS engine.

---

## ✅ Phase 1: Structural Hardening & Scoring Engine (Week 1-2)

### 🔹 1.1 Dual-Key Template Indexing
- [ ] Refactor template store to use `{sender}:{templateHash}` as ID key
- [ ] Modify `learnFromTransaction` and `loadTemplateBank` to segment by sender

### 🔹 1.2 Field-Level Confidence Scoring
- [ ] Introduce `confidenceScore` per field (0-1 scale)
- [ ] Weigh based on: source (direct/inferred), match type, vendor match
- [ ] Visualize low-confidence fields in transaction edit screen

### 🔹 1.3 Template Normalization & Hashing Refactor
- [ ] Refactor `extractTemplateStructure` to tokenize before hashing
- [ ] Strip all whitespace, normalize punctuation for hashing
- [ ] Store version and hash algorithm in template metadata

---

## ✅ Phase 2: Learning & Template Lifecycle Management (Week 3-4)

### 🔹 2.1 Template Versioning
- [ ] Add metadata: `createdAt`, `lastUsedAt`, `usageCount`
- [ ] Track template performance: success vs fallback ratio
- [ ] Auto-flag templates unused in 90 days for review

### 🔹 2.2 Template Health Dashboard (Internal Tool)
- [ ] Dev-only screen to view:
  - Template hash and match stats
  - Keyword → category mappings
  - Template creation samples

### 🔹 2.3 Keyword Mapping Enhancements
- [ ] Add `lastUpdated` and `mappingCount` per keyword
- [ ] Handle conflicting mappings: show multiple options with ranking
- [ ] Support context-specific keyword rules (sender, type)

---

## ✅ Phase 3: Security & Sync Layer (Week 5-6)

### 🔹 3.1 Local Storage Encryption
- [ ] Encrypt local banks (templateBank, keywordBank, transactionStore)
- [ ] Use session-derived symmetric key stored in memory
- [ ] Auto-wipe data on logout/session timeout

### 🔹 3.2 Optional Firebase Sync
- [ ] User opt-in cloud sync: templates, keyword mappings
- [ ] Sync vendor → category learning across devices
- [ ] Use Firestore with user UID namespaces

---

## ✅ Phase 4: Robustness & Future-Proofing (Week 7-8)

### 🔹 4.1 Regression Monitoring & Fallback Strategy
- [ ] If a previously matched template fails N times, auto-flag for retraining
- [ ] Store failure logs: sender, message, expected structure
- [ ] Trigger `Train Model` redirect automatically

### 🔹 4.2 Internationalization Resilience
- [ ] Add support for Eastern Arabic numerals and RTL messages
- [ ] Normalize numerals and punctuation before parsing
- [ ] Extend `regex` to match more language-specific constructs

---

## 🔚 Final Deliverables

- [ ] Confidence-aware parsing pipeline
- [ ] Template lifecycle engine
- [ ] Encrypted local data persistence
- [ ] Admin dashboard for learning QA
- [ ] Sync-ready keyword/template learning
- [ ] Field-level fallback and failover logic

