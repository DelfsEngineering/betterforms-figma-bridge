# Documentation Overview

Clean, organized documentation for the Figma-to-BetterForms conversion system.

---

## 📌 Core Prompts (2 files)

### `llm-prompt-template.md`
**Purpose:** Main production prompt for Claude 3.5 Sonnet
**Size:** 1,267 lines
**Use:** Default conversion prompt

### `llm-prompt-gpt5.md`
**Purpose:** Optimized prompt for GPT-5/o1-mini reasoning models
**Size:** 643 lines (49% smaller)
**Use:** Higher accuracy, slower, 7x cost

---

## 📚 Reference Docs (2 files)

### `BETTERFORMS_SCHEMA_REFERENCE.md`
**Purpose:** Complete BetterForms schema documentation
**Contains:**
- All field types (20+)
- Property reference
- Common patterns
- Best practices
- Examples

### `FIGMA_DATA_REFERENCE.md`
**Purpose:** All Figma data extraction info
**Contains:**
- Currently extracted properties
- Research findings (additional data available)
- Known limitations
- Code modification guide
- Priority matrix

---

## 🔬 Comparison & Testing (1 file)

### `PROMPT_COMPARISON.md`
**Purpose:** A/B testing guide for both prompts
**Contains:**
- Metrics comparison
- Key differences
- Performance expectations
- Testing recommendations
- ROI analysis

---

## 📜 History (1 file)

### `DEVELOPMENT_HISTORY.md`
**Purpose:** Complete evolution record
**Contains:**
- Initial implementation
- v2: Icon & gradient fixes
- v3: Font Awesome schema fix
- Phase 1: Research implementation
- Prompt cleanup
- All decisions made

---

## 📖 Spec (1 file)

### `spec.md`
**Purpose:** Original project specification
**Contains:**
- MVP scope and architecture
- Data transport options
- API contracts
- Future ideas: Hybrid JS + LLM approach

---

## Quick Navigation

**Starting out?**
→ Read `BETTERFORMS_SCHEMA_REFERENCE.md` + `FIGMA_DATA_REFERENCE.md`

**Modifying prompts?**
→ Edit `llm-prompt-template.md` or `llm-prompt-gpt5.md`

**Testing different models?**
→ See `PROMPT_COMPARISON.md`

**Understanding what changed?**
→ Check `DEVELOPMENT_HISTORY.md`

**Adding new features?**
→ See "Code Modification Guide" in `FIGMA_DATA_REFERENCE.md`

**Considering JS preprocessing?**
→ See "Future Additions: Hybrid Approach" in `spec.md`

---

## File Count: 7 (down from 14)

**Consolidated from:**
- CURRENT_DATA_REFERENCE.md
- additional-figma-data.md  
- Figma_to_BetterForms_Research_Report.md
- implementation-summary.md
- prompt-improvements-v2.md
- prompt-improvements-v3.md
- prompt-improvements-phase1-research.md
- prompt-redundancy-analysis.md
- prompt-refinement-summary.md

**Into:**
- FIGMA_DATA_REFERENCE.md (all Figma data)
- DEVELOPMENT_HISTORY.md (all improvements)
- PROMPT_COMPARISON.md (testing guide)

**Result:** 50% fewer files, better organization, no lost information.

