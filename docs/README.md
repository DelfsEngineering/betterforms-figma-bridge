# Documentation Overview

Clean, organized documentation for the Figma-to-BetterForms conversion system.

---

## 📌 Core Prompt (1 file)

### `llm-prompt-gpt5-reasoning_preprocessor.md`
**Purpose:** Production prompt for GPT-5 reasoning models with preprocessing
**Size:** 657 lines
**Features:**
- Optimized for o1-mini reasoning capabilities
- Works with JavaScript preprocessor (v0.8.6+)
- Handles deterministic conversions: Font Awesome icons, drop shadows, borders, layouts
- Focuses LLM on semantic understanding and edge cases
**Use:** Default conversion prompt

---

## 📚 Reference Docs (3 files)

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

### `future-features.md`
**Purpose:** Planned features and implementation notes
**Contains:**
- Automatic Image URL Resolution from Figma API
- Implementation steps
- Benefits and trade-offs
- Priority and effort estimates

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
→ Edit `llm-prompt-gpt5-reasoning_preprocessor.md`


**Planning future features?**
→ See `future-features.md`

**Understanding the hybrid approach?**
→ See "Future Additions: Hybrid Approach" in `spec.md`

---

## File Count: 6 core docs

**Active Files:**
- `llm-prompt-gpt5-reasoning_preprocessor.md` - Production prompt
- `BETTERFORMS_SCHEMA_REFERENCE.md` - BF schema reference
- `FIGMA_DATA_REFERENCE.md` - Figma extraction reference
- `future-features.md` - Planned features
- `spec.md` - Original specification
- `README.md` (this file) - Documentation overview


