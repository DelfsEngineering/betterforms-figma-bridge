## Figma to BF Plugin

### MVP PoC (current)
Scope:
- Plugin‑only. No BF server calls.
- Selection preview (thumbnail) and metadata when a frame/group is selected.
- Developer Mode panel with normalized compact node JSON and Download.
- Preserve Figma layer names in JSON (`name` on nodes).

User flow:
1. Select a frame/group in Figma.
2. Plugin shows preview, basic properties, and layer name(s).
3. Click “Export JSON” to download the compact node JSON (or copy to clipboard).

Data shape:
- See “Developer Mode: Selection Data Viewer & Export” for the exact JSON shape and normalization rules.

Acceptance criteria:
- Supports FRAME/GROUP/TEXT; handles multi‑selection; reasonable depth limit; normalized colors; no console errors.

### Future Additions

#### Hybrid Approach: JS Preprocessor + LLM Polish

**Concept:** Instead of sending raw Figma data to LLM, use JavaScript to handle deterministic conversions first, then let LLM handle semantic understanding and polish.

**Architecture Options:**

**Option A: Pure LLM (Current)**
```
Figma JSON → LLM (Claude/GPT) → BetterForms JSON
```
- **Pros:** Simple, flexible, easy to evolve
- **Cons:** Slower (~30s), expensive ($0.15), overkill for simple designs

**Option B: JS Preprocessor + LLM Polish**
```
Figma JSON → JS Converter → Draft BF JSON → LLM → Final BF JSON
```

**What JS Can Handle (Deterministic):**
1. **Structural scaffolding**
   - `FRAME` → `{ type: "group", fields: [] }`
   - `TEXT` → `{ type: "html", html: node.characters }`

2. **Attribute generation**
   - `data-idbf` from node.id
   - `BFName` normalization (lowercase, underscores, trim)

3. **Basic Tailwind conversion**
   - Size: `w-[${node.width}px]`, `h-[${node.height}px]`
   - Padding: `p-[${node.paddingTop}px]`
   - AutoLayout: `HORIZONTAL` → `flex flex-row`, `gap-[${itemSpacing}px]`

4. **Token substitution**
   - If color matches token → `bg-[var(--${tokenName})]`

5. **Layout basics**
   - `layoutMode: "HORIZONTAL"` → `flex flex-row`
   - `primaryAxisSizingMode: "FILL"` → `w-full`

**What LLM Still Handles (Semantic Understanding):**
1. **Component type detection**
   - "Is this frame a button or just a styled div?"
   - "Is this text an input label or display text?"
   - "Is this a card, form, navigation, or generic group?"

2. **Layout intelligence**
   - "These 3 equal-width items need `grid grid-cols-3`"
   - "This scrollable area needs `overflow-y-auto`"
   - "This fixed header needs `sticky top-0`"

3. **Style refinement**
   - "Use `w-full` instead of `w-[500px]` for responsive"
   - "Use `rounded-lg` instead of `rounded-[8px]`"
   - "Combine to `shadow-md` instead of custom values"

4. **Icon detection & handling** *(Now handled by preprocessor as of v0.8.6)*
   - Font Awesome text → `<i class="fa-regular fa-edit">`
   - Extract icon name from character/unicode
   - Note: Preprocessor now automatically converts Font Awesome icons

5. **Edge cases**
   - Complex gradients → inline styles
   - Multiple shadows → arbitrary values
   - Validation & cleanup

**Option C: Tiered System**
```
                    ┌─> Simple (< 10 elements)
                    │   → JS Only (instant, free)
                    │
Figma JSON ─────────┼─> Medium (10-50 elements)  
                    │   → JS + Claude 3.5 (3s, $0.02)
                    │
                    └─> Complex (50+ elements)
                        → JS + GPT-5 (15s, $0.08)
```
- **Pros:** Optimal cost/speed/quality for each case
- **Cons:** Most complex to build and maintain

**Estimated Performance Impact:**

**Current (Pure LLM):**
- Simple button: 28s, $0.15, 95% quality
- Complex header (75 elements): 35s, $0.18, 94% quality

**With JS Preprocessing:**
- Simple button: 1s JS + 5s LLM = 6s (78% faster), $0.03 (80% cheaper), ~93% quality
- Complex header: 2s JS + 12s LLM = 14s (60% faster), $0.07 (61% cheaper), ~94% quality

**Decision Framework:**

**Use JS Preprocessor when:**
- ✅ Doing 100+ conversions/month (cost savings)
- ✅ Speed matters (user waiting in UI)
- ✅ Designs follow consistent patterns
- ✅ Team has time to build/maintain JS converter

**Stick with Pure LLM when:**
- ✅ Still experimenting with output format
- ✅ Designs are highly variable/creative
- ✅ Development speed > runtime speed
- ✅ Cost is not a primary concern

**Next Steps Before Implementation:**
1. Analyze 20 real test cases: how much is mechanical vs semantic?
2. Prototype simple JS converter for ONE use case (buttons)
3. Compare JS output vs LLM output quality
4. Measure actual time/cost/quality savings
5. If savings > 60% with no quality loss → build full system
6. If savings < 30% or quality drops → stick with pure LLM

#### JS Preprocessor Specification (Routing + Scope)

Goal: deterministically convert mechanical Figma properties into a draft BetterForms JSON, reduce token/cost, and route to the right prompt/model based on complexity.

Modes and Routing
- Client flag in request body: `preprocess: "auto" | "on" | "off"` (default: `auto`)
- Backend chooses prompt/model by complexity and flag.

Request (plugin → BF)
```json
{
  "data": [ /* selection nodes */ ],
  "tokens": { "all": {"…": {}}, "used": [ {"…": {}} ] },
  "preprocess": "auto",
  "routeHint": "auto"
}
```

Backend routing (concept)
```ts
const { preprocess = "auto" } = req.body
const complexity = scoreComplexity(req.body.data)
const force = preprocess === "on" ? "pre" : preprocess === "off" ? "raw" : null
const route = force ?? (complexity <= 40 ? "pre" : "raw")
// route=pre → run JS preprocessor, use "preprocessed" prompt
// route=raw → skip pre, use full prompt directly
```

Preprocessor I/O Contract
- Input: `data[]` (selection), `tokens` (all/used)
- Output for LLM (appended to payload):
  - `draftSchema`: minimal BF skeleton (no semantic guesses)
  - `meta.preprocessor`: `{ complexityScore, metrics, issues[], recommendedRoute, version }`
  - `normalizedData`: normalized Figma props (rounded numbers, canonical enums)

Deterministic Transforms (handled in JS)
1) Identity & Naming
   - Generate `attributes['data-idbf']` for groups/elements
   - Create `BFName` from `node.name` (lowercase, underscores, ≤50 chars)

2) Structure Scaffolding
   - FRAME/GROUP/INSTANCE → `{ type: "group", fields: [] }`
   - TEXT → `{ type: "html", html: node.characters }` (no icon detection)
   - RECTANGLE/ELLIPSE/VECTOR → `{ type: "html" }` with size only

3) Layout (AutoLayout → Flex)
   - direction: HORIZONTAL → `flex flex-row`; VERTICAL → `flex flex-col`
   - gap: `gap-[{itemSpacing}px]`
   - padding: `p-[{t}px]` or per-side when asymmetric
   - child overrides: `layoutGrow:1` → `flex-1`; `layoutAlign:STRETCH` → `self-stretch`; CENTER → `self-center`

4) Sizing & Position
   - `w-[{w}px]`, `h-[{h}px]` (rounded)
   - FIXED/AUTO/FILL → `w-[px]/w-auto/w-full` (prefer `flex-1` for width in flex children)
   - ABSOLUTE → `absolute top-[ypx] left-[xpx]`
   - min/max → `min-w-[px] max-w-[px] min-h-[px] max-h-[px]`

5) Overflow
   - direction → `overflow-x-auto` / `overflow-y-auto` / `overflow-auto`
   - `clips:true` → `overflow-hidden`

6) Corners & Borders (basic)
   - radius → `rounded-[px]` or per-corner variants
   - stroke → `border-[px]` + `border-[#hex]` or token var

7) Background (SOLID only)
   - First visible SOLID fill → `bg-[var(--Token)]` else `bg-[#hex]`
   - Skip when `fills:[]` or `visible:false`
   - Gradients/Images: pass through normalized `fills[]` (no classes)

8) Tokens
   - Prefer `tokens.used`; fallback to exact matches in `tokens.all`
   - Emit CSS vars `var(--{tokenName})` when available

9) Numeric Precision
   - px rounded to ints when close; else 1–2 decimals
   - font sizes to whole numbers

Passed-through (LLM decides)
- Icon fonts (Font Awesome/Material) and `<i>` vs button `icon` property
- Semantic types (button vs div, inputs, cards, nav)
- Grid vs flex, wrapping, advanced alignment
- Gradients to CSS, multiple shadows to arbitrary values
- Vector/SVG handling and placeholders

Complexity Scoring (0–100)
- Features counted: `elementCount`, `absoluteCount`, `gradientsCount`, `vectorsCount`, `multiEffectsCount`, `instancesCount`
- Weighted sum → score; thresholds: `<=40` → route "pre", `>40` → route "raw" (tunable)

Routing Matrix (examples)
- pre → Claude 3.5 + "preprocessed" prompt (polish-only)
- raw → GPT‑5‑mini + full constraint prompt
- Manual override: `preprocess:"on"|"off"`

Diagnostics & Safety
- Include `meta.preprocessor.metrics` and `issues[]` (e.g., "gradient present → LLM")
- On error: fall back to raw route and record reason

Milestones
- v0: Buttons/simple groups → scaffold + size + padding + bg + border
- v1: Absolute/min-max/overflow/tokens
- v2: Per-corner radii, child alignment overrides

#### UI Preprocessing Controls

**Settings Panel (Account Tab)**

Add preprocessing toggle in the Account tab alongside API key settings:

```html
<div class="setting-group">
  <label class="setting-label">
    <input type="checkbox" id="preprocessingEnabled" />
    <span>Enable JS Preprocessing (faster, cheaper)</span>
  </label>
  <div class="setting-description">
    Converts basic Figma properties locally before sending to AI. 
    Reduces cost by ~60% and speeds up simple conversions.
  </div>
</div>

<div class="setting-group" id="preprocessModeGroup" style="display:none;">
  <label for="preprocessMode">Preprocessing Mode:</label>
  <select id="preprocessMode">
    <option value="auto">Auto (recommended)</option>
    <option value="on">Always preprocess</option>
    <option value="off">Never preprocess</option>
  </select>
  <div class="setting-description">
    • Auto: Preprocess simple designs, skip for complex ones
    • Always: Force preprocessing (may reduce quality on complex designs)
    • Never: Send raw data to AI (slower but highest quality)
  </div>
</div>
```

**State Management**

```js
let state = {
  apiKey: '',
  activeTab: 'preview',
  selectionData: null,
  tokens: null,
  sending: false,
  sendAs: 'element',
  elementName: '',
  preprocessing: {
    enabled: false,
    mode: 'auto' // 'auto' | 'on' | 'off'
  }
}

// Load from clientStorage on init
async function loadSettings() {
  const apiKey = await figma.clientStorage.getAsync('bf.apiKey')
  const preprocessEnabled = await figma.clientStorage.getAsync('bf.preprocessing.enabled')
  const preprocessMode = await figma.clientStorage.getAsync('bf.preprocessing.mode')
  
  state.apiKey = apiKey || ''
  state.preprocessing.enabled = preprocessEnabled !== false // default true
  state.preprocessing.mode = preprocessMode || 'auto'
  
  updateUI()
}

// Save when changed
async function savePreprocessingSetting() {
  const enabled = document.getElementById('preprocessingEnabled').checked
  const mode = document.getElementById('preprocessMode').value
  
  await figma.clientStorage.setAsync('bf.preprocessing.enabled', enabled)
  await figma.clientStorage.setAsync('bf.preprocessing.mode', mode)
  
  state.preprocessing.enabled = enabled
  state.preprocessing.mode = mode
  
  figma.notify('Preprocessing settings saved')
}
```

**Visual Indicator**

Show preprocessing status in the preview tab:

```html
<div id="preprocessingIndicator" class="preprocessing-badge" style="display:none;">
  <svg width="12" height="12" viewBox="0 0 12 12">
    <circle cx="6" cy="6" r="5" fill="#10b981"/>
  </svg>
  <span>Preprocessing enabled</span>
</div>
```

**Send Button Logic**

Determine preprocess flag based on settings:

```js
async function sendToBetterForms() {
  // ... existing validation ...
  
  // Determine preprocessing mode
  let preprocessFlag = 'off'
  if (state.preprocessing.enabled) {
    preprocessFlag = state.preprocessing.mode // 'auto', 'on', or 'off'
  }
  
  // Run preprocessing if enabled and mode is 'on' or 'auto'
  let processedData = state.selectionData
  let draftSchema = null
  let preprocessMeta = null
  
  if (preprocessFlag === 'on' || preprocessFlag === 'auto') {
    const preprocessResult = await preprocessSelection(state.selectionData, state.tokens)
    
    if (preprocessResult.success) {
      processedData = preprocessResult.normalizedData
      draftSchema = preprocessResult.draftSchema
      preprocessMeta = preprocessResult.meta
      
      // For 'auto' mode, check complexity score
      if (preprocessFlag === 'auto' && preprocessMeta.complexityScore > 40) {
        // Override to 'off' for complex designs
        preprocessFlag = 'off'
        processedData = state.selectionData // revert to raw
        draftSchema = null
        preprocessMeta = null
      }
    } else {
      // Preprocessing failed, fall back to raw
      preprocessFlag = 'off'
      console.warn('Preprocessing failed, falling back to raw:', preprocessResult.error)
    }
  }
  
  const response = await fetch('https://appdev.fmbetterforms.com/api/v1/figma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: state.apiKey,
      type: state.sendAs,
      elementName: state.elementName || '',
      data: processedData,
      tokens: state.tokens,
      preprocessing: {
        enabled: preprocessFlag !== 'off',
        mode: preprocessFlag,
        draftSchema: draftSchema,
        meta: preprocessMeta
      }
    })
  })
  
  // ... rest of send logic ...
}
```

#### Server Payload Structure (Enhanced)

**Request Body Shape**

```json
{
  "apiKey": "user_api_key_here",
  "type": "element",
  "elementName": "Button Primary",
  "data": [ /* Figma node tree (raw or normalized) */ ],
  "tokens": {
    "all": { "primary-500": { "value": "#3b82f6" } },
    "used": [ { "name": "primary-500", "value": "#3b82f6" } ]
  },
  "preprocessing": {
    "enabled": true,
    "mode": "auto",
    "draftSchema": { /* Partial BF schema if preprocessed */ },
    "meta": {
      "version": "0.1.0",
      "complexityScore": 23,
      "metrics": {
        "elementCount": 8,
        "absoluteCount": 0,
        "gradientsCount": 0,
        "vectorsCount": 1,
        "multiEffectsCount": 0,
        "instancesCount": 0
      },
      "issues": [
        "Vector icon found, placeholder generated"
      ],
      "recommendedRoute": "pre",
      "processingTime": 45
    }
  }
}
```

**Preprocessing Flag States**

| enabled | mode | draftSchema | Server Behavior |
|---------|------|-------------|-----------------|
| `false` | N/A | `null` | Full LLM conversion (raw Figma → BF) |
| `true` | `"off"` | `null` | Full LLM conversion (explicit override) |
| `true` | `"auto"` | Present if score ≤ 40 | LLM polish (draft → final BF) |
| `true` | `"auto"` | `null` if score > 40 | Full LLM conversion (complexity fallback) |
| `true` | `"on"` | Always present | LLM polish (forced preprocessing) |

**Server Response (Enhanced)**

```json
{
  "success": true,
  "schema": { /* Final BF schema */ },
  "meta": {
    "route": "preprocessed",
    "model": "claude-3.5-sonnet",
    "preprocessingUsed": true,
    "inputComplexity": 23,
    "tokensUsed": 1243,
    "processingTime": 3200,
    "cost": 0.03,
    "warnings": []
  }
}
```

**Server Error Cases**

```json
{
  "success": false,
  "error": "Preprocessing failed: invalid draftSchema structure",
  "fallbackAttempted": true,
  "fallbackSuccess": false,
  "meta": {
    "route": "raw",
    "preprocessingUsed": false,
    "originalError": "Missing required field 'type' in draftSchema.fields[2]"
  }
}
```

#### Backend Routing Logic (Detailed)

```ts
// Server-side handler
async function handleFigmaConversion(req, res) {
  const { data, tokens, preprocessing } = req.body
  
  // Extract preprocessing info
  const preprocessEnabled = preprocessing?.enabled ?? false
  const preprocessMode = preprocessing?.mode ?? 'off'
  const draftSchema = preprocessing?.draftSchema ?? null
  const preprocessMeta = preprocessing?.meta ?? null
  
  let route = 'raw'
  let prompt = 'full-conversion-prompt'
  let model = 'gpt-4o-mini'
  
  // Determine routing
  if (preprocessEnabled && preprocessMode !== 'off' && draftSchema) {
    // Use preprocessed route
    route = 'preprocessed'
    prompt = 'polish-only-prompt'
    model = 'claude-3.5-sonnet'
    
    // Validate draft schema
    const validation = validateDraftSchema(draftSchema)
    if (!validation.valid) {
      // Fall back to raw route
      console.warn('Invalid draft schema, falling back to raw route:', validation.errors)
      route = 'raw'
      prompt = 'full-conversion-prompt'
      draftSchema = null
    }
  } else if (preprocessEnabled && preprocessMode === 'auto') {
    // Auto mode without draft (complexity > threshold)
    const complexity = preprocessMeta?.complexityScore ?? scoreComplexity(data)
    if (complexity > 40) {
      route = 'raw'
      model = 'gpt-4o-mini' // or gpt-5 for very complex
    }
  }
  
  // Prepare LLM payload
  const llmPayload = {
    route,
    model,
    prompt,
    data: draftSchema ? { draft: draftSchema, original: data } : data,
    tokens,
    meta: preprocessMeta
  }
  
  // Call LLM
  const result = await callLLM(llmPayload)
  
  // Return enhanced response
  res.json({
    success: true,
    schema: result.schema,
    meta: {
      route,
      model,
      preprocessingUsed: route === 'preprocessed',
      inputComplexity: preprocessMeta?.complexityScore,
      tokensUsed: result.tokensUsed,
      processingTime: result.processingTime,
      cost: calculateCost(result.tokensUsed, model),
      warnings: result.warnings || []
    }
  })
}

function scoreComplexity(data) {
  // Flatten all nodes
  const allNodes = flattenNodes(data)
  
  const metrics = {
    elementCount: allNodes.length,
    absoluteCount: allNodes.filter(n => n.constraints?.horizontal === 'ABSOLUTE').length,
    gradientsCount: allNodes.filter(n => hasGradient(n.fills)).length,
    vectorsCount: allNodes.filter(n => n.type === 'VECTOR').length,
    multiEffectsCount: allNodes.filter(n => (n.effects?.length ?? 0) > 2).length,
    instancesCount: allNodes.filter(n => n.type === 'INSTANCE').length
  }
  
  // Weighted scoring
  const score = 
    metrics.elementCount * 0.5 +
    metrics.absoluteCount * 2 +
    metrics.gradientsCount * 3 +
    metrics.vectorsCount * 1.5 +
    metrics.multiEffectsCount * 2 +
    metrics.instancesCount * 1
  
  return Math.min(100, Math.round(score))
}
```

#### Prompt Templates

**Full Conversion Prompt (raw route)**
- Used when: preprocessing disabled or complexity > threshold
- Input: Raw Figma data + tokens
- Output: Complete BF schema
- Model: GPT-4o-mini or GPT-5

**Polish-Only Prompt (preprocessed route)**
- Used when: preprocessing enabled and draft schema valid
- Input: Draft BF schema + normalized Figma data + tokens
- Output: Refined BF schema
- Model: Claude 3.5 Sonnet

```markdown
You are refining a BetterForms schema that has been partially generated from Figma.

INPUT:
- draftSchema: Mechanical conversion of Figma properties (structure, layout, basic styles)
- originalData: Normalized Figma node tree (reference only)
- tokens: Available design tokens

YOUR TASKS:
1. Semantic improvements:
   - Identify component types (buttons, inputs, cards, navigation)
   - Add appropriate field types and properties
   - Improve class names (use standard Tailwind over arbitrary values when possible)
   - Detect icons and convert to proper format

2. Validation & cleanup:
   - Ensure all required BF properties are present
   - Remove redundant or conflicting classes
   - Fix any structural issues
   - Add accessibility attributes where appropriate

3. Preserve:
   - All data-idbf attributes
   - Original Figma names in comments
   - Exact dimensions where specified
   - Token references

OUTPUT:
Valid BetterForms schema JSON matching the contract.
```

**Cost Comparison**

| Route | Preprocessing | Tokens In | Tokens Out | Model | Time | Cost |
|-------|--------------|-----------|------------|-------|------|------|
| Raw | No | ~8,000 | ~2,500 | GPT-4o-mini | 25s | $0.15 |
| Preprocessed | Yes | ~2,500 | ~1,000 | Claude 3.5 | 8s | $0.03 |
| **Savings** | | **-69%** | **-60%** | | **-68%** | **-80%** |

---

### Progress (Dev Log)
- Added UI with fixed red header and logo; API key Save/Logout.
- Persist API key in clientStorage; Logout clears it.
- UI handshake on load to fetch existing key automatically.
- Selection watcher posts full node tree (depth-limited) and PNG preview.
- UI shows preview image and full JSON for selected nodes.

### Architecture
- High‑level diagram and data flow
- Plugin (Figma) ↔ Gateway (`/llm/query` if used) ↔ BF API
- Auth: OAuth/JWT exchange, scopes
- Rate limits and retries

#### Data Transport (Figma Plugin → BF App)
Figma plugins run in a sandboxed environment and cannot directly message arbitrary browser tabs with `window.postMessage` unless they opened that window and retain a reference. We have these options:

- Direct API: Plugin calls BF server REST endpoints (`/llm/query`, `/forms/:id`) over HTTPS using tenant JWT/API key. Pros: reliable, works outside the BF app context. Cons: managing auth inside plugin.
- BF Inbox Endpoint: Expose a minimal `POST /inbox/figma` on BF that accepts payloads (node tree, options), triggers LLM, and responds with schema. Optionally persists for later retrieval.
- Clipboard/Manual: Generate schema in plugin and user pastes into BF. Pros: trivial MVP. Cons: no automation.
- Opened Window Bridge: Plugin opens BF app window with a token and target route, then uses `window.postMessage` to that window reference. Works only for the window the plugin opened, not arbitrary tabs.

Recommendation:
1) MVP: Clipboard/manual paste for lowest friction.
2) Phase 2: Direct API to `/llm/query` and optional `/forms/:id` with JWT issued via a short OAuth device‑like flow (user signs into BF in a popup to grant tenant token stored in Figma plugin client storage).
3) Optional: `POST /inbox/figma` to decouple LLM specifics and allow queued processing.

### Realtime Assistant ↔ Plugin Channel
- The plugin UI opens a WebSocket to BF and authenticates (tenant JWT or short‑lived token exchanged via pairing code).
- The user keeps the plugin open in Figma; they can switch to the BF AI chat and back. The WS stays connected in the plugin UI as long as the plugin is open.
- Chat can send commands to the plugin via a shared `channelId`:
  - Example outbound (BF → plugin): `{ "channelId": "abc", "action": "figma.exportSelection", "args": { "format": "PNG" }, "correlationId": "123" }`
  - Example inbound (plugin → BF): `{ "channelId": "abc", "action": "tool.result", "correlationId": "123", "ok": true, "data": { "urls": ["https://…"] } }`
- The plugin forwards WS messages between its UI and the Figma worker using `figma.ui.onmessage` and `figma.ui.postMessage` to execute Figma API calls.
- Limitations: only works while the plugin is open; network interruptions should auto‑reconnect with backoff; keep tokens short‑lived.

### Connected Indicator & Pairing (API key)
- Pairing: User pastes a BF API key in the plugin. Plugin exchanges it for a short‑lived WS token + `channelId` via `POST /auth/plugin`.
- Presence: BF browser client (chat) registers a `channelId` listener. Plugin sends `ping` every 5–10s. Browser responds with `pong` including app/site hash and user id.
- Indicator logic in plugin UI:
  - Connected (green): last `pong` < 20s ago.
  - Degraded (yellow): last `pong` 20–60s; retrying WS.
  - Disconnected (red): no `pong` > 60s; show “Open BF and sign in” hint.
- Privacy: API key is stored in Figma `clientStorage`. Always exchange for short‑lived WS token; never keep provider keys in plugin.

Example messages:
```json
// plugin → BF (WS)
{ "type": "ping", "channelId": "abc", "ts": 1730500000 }

// BF browser → BF server (subscription already live) → plugin
{ "type": "pong", "channelId": "abc", "ts": 1730500001, "app": "my-app-hash", "userId": "u_123" }
```

### End‑to‑End Workflow
1. User selects one or more nodes (frames/groups/components) in Figma.
2. Plugin extracts a compact node tree (only needed props: id, name, type, layout, absoluteBoundingBox, fills, strokes, text, children, autolayout info, styles).
3. Plugin sends the node tree and user options to the BetterForms server, which calls the unified LLM gateway (`POST /llm/query`) with a strict prompt and JSON‑only output constraints.
4. LLM returns a BF page schema (JSON). The plugin validates against a minimal shape and highlights issues.
5. Preview: show a hierarchical view and JSON. User can copy to clipboard, download, or push to BF via API (optional).
6. Optional push: authenticated call to update/create a page/form record in BF. For MVP, prefer copy/paste into a page.

### Data Mapping Specification
- Node types and properties supported
- Style mapping (colors, text, layout)
- Constraints/autolayout translation
- Naming conventions and IDs

#### Initial Mapping (MVP)
- Frame/Group (including AutoLayout): `type: "group"`, `label: <node.name>`, `styleClasses` derived from layout (e.g., `flex flex-col` vs `flex-row`, gaps, padding). Children mapped recursively to `schema.fields`.
- Text: `type: "html"` with sanitized HTML (preserve text, line breaks). Do not infer inputs in MVP.
- Vector/Rectangle/Ellipse/Icon: `type: "html"` with a wrapper `<div>` and inline/styleClasses approximating size/position; images become `<img>` with exported asset URL if provided by user.
- Components/Instances: treat as Group in MVP; later map to `bfcomponent` when a named component is recognized.
- Unsupported nodes: produce `type: "html"` with a comment note in `html` and add a warning in the result `meta`.

Preserve Figma Layer Names:
- For any group/frame/component emitted as a BF group, set `label` to the Figma node’s `name`.
- For `html` fields created from leaf nodes, prefix the HTML with an HTML comment containing the original `name` (e.g., `<!-- name: Button / Primary -->`).
- Optionally attach `nodeName` and `nodeId` into a `meta` object on each field for round‑trips and diffs.

Mapping Guidelines:
- Prefer Tailwind‑like classes already used in BF docs (e.g., `flex`, `w-full`, `border`); fall back to inline styles when no class analog exists.
- Preserve logical structure (nesting) rather than absolute coordinates when AutoLayout is present.
- Never emit executable scripts; output must be inert HTML or BF field definitions.

### API Contracts
- Endpoints, payloads, and examples
- Error codes

#### Plugin → BetterForms (LLM conversion)
- Method: `POST`
- Path: `/llm/query`
- Auth: Bearer JWT (Feathers auth), tenant audience preserved. For MVP, allow local dev with an API key header if needed.
- Request body (OpenAI example):
```json
{
  "payload": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "stream": false,
    "messages": [
      { "role": "system", "content": "You convert Figma nodes to FM BetterForms page schema. Output strict JSON only matching the contract below." },
      { "role": "user", "content": "<FIGMA_NODES_JSON>" },
      { "role": "user", "content": "<PLUGIN_OPTIONS_JSON>" },
      { "role": "user", "content": "Contract: { pages:[{ schema:{ fields:[...] } }], model:{}, options:{} } Only use types: group, html (MVP)." }
    ],
    "providerArgs": { "response_format": { "type": "json_object" }, "temperature": 0 }
  }
}
```

#### Optional: Push generated schema to BF page
- Method: `PATCH` (or `POST` on create)
- Path: `/forms/:id` (or `/formsmulti`)
- Body: a record where the page JSON/schema field is updated with the generated schema.
- Auth: same JWT as above.

#### Errors
- `400` invalid selection or malformed Figma JSON
- `422` schema validation failed (explain which field)
- `429` provider or BF rate limit
- `502` provider error; include `provider` and `requestId`

### UX Notes
- Plugin UI states (idle, selecting, exporting, errors)
- Preview and diff for re‑sync

#### Minimal UI (MVP)
- Toolbar: Select nodes → Generate → Preview → Copy JSON
- Options: "Flatten absolute positioning" (on/off), "Use autolayout where possible" (default on)
- Validation banner with warnings for unsupported nodes

#### Selection Preview & "Ready" Event
- When the user selects a frame/group in Figma, the plugin UI renders a lightweight preview (thumbnail via `exportAsync` or simplified canvas) and shows node name/size.
- If WS is connected, the plugin sends a `selection.ready` event so the BF UI can surface a CTA (e.g., "Generate from selection").

Event shape (plugin → BF):
```json
{
  "type": "selection.ready",
  "channelId": "abc",
  "selection": {
    "nodeIds": ["10:2"],
    "name": "Hero / Variant A",
    "kind": "FRAME",
    "size": { "w": 1440, "h": 640 },
    "autolayout": { "direction": "VERTICAL", "gap": 24 },
    "previewUrl": "data:image/png;base64,iVBOR..." // optional
  }
}
```

BF UI handling:
- Listen on the same `channelId`. When `selection.ready` arrives, show a toast/banner with the node name and a "Generate Schema" button.
- If the user clicks generate, BF can either:
  - Ask the plugin to export the compact node tree: send `{ type: "selection.request", correlationId }` and await `{ type: "selection.data", correlationId, nodes: {...} }`, then call `/llm/query` server-side; or
  - Instruct the plugin to call `/llm/query` directly and return results via `{ type: "llm.result", ... }`.

Plugin pseudocode (worker side):
```js
figma.on('selectionchange', async () => {
  const node = figma.currentPage.selection[0]
  if (!node) return
  const preview = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 0.25 } })
  const payload = {
    type: 'selection.ready',
    channelId,
    selection: {
      nodeIds: [node.id],
      name: node.name,
      kind: node.type,
      size: { w: node.width, h: node.height },
      autolayout: getAutoLayout(node),
      previewUrl: `data:image/png;base64,${base64(preview)}`
    }
  }
  figma.ui.postMessage({ wsSend: payload })
})
```

### Developer Mode: Selection Data Viewer & Export
Goal: Let developers see exactly what we will feed an LLM. Provides a normalized, compact node JSON and a Download button.

Compact Node JSON (shape):
```json
{
  "version": 1,
  "selection": [
    {
      "id": "10:2",
      "name": "Hero / Variant A",
      "type": "FRAME",
      "size": { "w": 1440, "h": 640 },
      "autolayout": { "direction": "VERTICAL", "gap": 24, "padding": { "t": 64, "r": 64, "b": 64, "l": 64 }, "align": "START" },
      "style": { "fills": [{ "type": "SOLID", "color": "#0F172A" }], "strokes": [] },
      "children": [
        { "id": "12:8", "type": "TEXT", "name": "Title", "text": "Welcome", "style": { "color": "#ffffff", "font": { "family": "Inter", "size": 48, "weight": 700 } } }
      ],
      "meta": { "page": "Home" }
    }
  ]
}
```

Normalization rules:
- Keep only fields needed for mapping (id, name, type, size, autolayout, style, text, children) and drop volatile properties.
- Convert Figma color to hex; include opacity only when < 1.
- Round numeric values to reasonable precision (e.g., 2 decimals).
- Limit depth (e.g., 4 levels) with a `truncated: true` flag in `meta` when cut off.

Minimal plugin extraction (worker):
```js
function toHex({ r, g, b }) { const c = v => (Math.round(v * 255)).toString(16).padStart(2,'0'); return `#${c(r)}${c(g)}${c(b)}` }
function simplifyNode(n) {
  const base = { id: n.id, name: n.name, type: n.type }
  if ('width' in n && 'height' in n) base.size = { w: n.width, h: n.height }
  if ('layoutMode' in n) base.autolayout = { direction: n.layoutMode, gap: n.itemSpacing, padding: { t: n.paddingTop, r: n.paddingRight, b: n.paddingBottom, l: n.paddingLeft }, align: n.primaryAxisAlignItems }
  if ('fills' in n && Array.isArray(n.fills)) base.style = { fills: n.fills.filter(f=>f.visible!==false).map(f=>({ type: f.type, color: f.type==='SOLID'&&f.color?toHex(f.color):undefined, opacity: f.opacity })) }
  if (n.type === 'TEXT') base.text = n.characters
  if ('children' in n) base.children = n.children.slice(0, 50).map(simplifyNode)
  return base
}
function exportSelectionJSON() {
  const sel = figma.currentPage.selection
  const data = { version: 1, selection: sel.map(simplifyNode) }
  figma.ui.postMessage({ downloadJson: { filename: `figma-selection-${Date.now()}.json`, data } })
}
```

UI download helper (ui.html):
```js
window.onmessage = (e) => {
  const msg = e.data.pluginMessage
  if (msg?.downloadJson) {
    const blob = new Blob([JSON.stringify(msg.downloadJson.data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = msg.downloadJson.filename
    document.body.appendChild(a); a.click(); a.remove()
  }
}
```

### Milestones & Deliverables
- Phase 1: Prototype export of basic frames → BF containers
- Phase 2: Styles and text/components mapping
- Phase 3: Assets + re‑sync + diffs
- Phase 4: Hardening, docs, and roll‑out

### Risks & Mitigations
- Figma API limits → queueing/backoff
- Complex autolayouts → partial support with warnings
- Style drift between Figma and BF → mapping table + overrides

### Open Questions
- Preferred mapping schema version and storage location
- Need for design tokens import/export?
- Multi‑tenant defaults per audience?

### LLM Prompt Template (Draft)
System:
"""
You convert Figma node trees into FM BetterForms page schema. Return JSON only.
Contract: { "pages":[{ "schema":{ "fields":[ /* BF fields */ ] } }], "model":{}, "options":{} }
Types allowed for MVP: group, html. Preserve structure. Prefer class names (flex, gap, padding) over inline style when clear.
Do not include explanations. If unsure, emit html with a warning comment and proceed.
"""

User:
"""
FIGMA_NODES = <FIGMA_NODES_JSON>
PLUGIN_OPTIONS = { useAutoLayout: true, flattenAbsolute: false }
"""

Output constraints:
- Must be valid JSON object, no trailing commas, no comments except inside string `html`.
- Root keys must include `pages[0].schema.fields`.
- Provide a `meta` object with `warnings[]` (strings) when you drop or approximate features.

### Example Output (MVP)
```json
{
  "model": {},
  "options": {},
  "pages": [
    {
      "schema": {
        "fields": [
          {
            "type": "group",
            "label": "Header",
            "styleClasses": "flex flex-row items-center gap-4 p-4 border-b",
            "schema": {
              "fields": [
                { "type": "html", "html": "<h1>Title</h1>", "styleClasses": "text-xl font-bold" }
              ]
            }
          },
          {
            "type": "group",
            "label": "Body",
            "styleClasses": "flex flex-col p-6 gap-6",
            "schema": { "fields": [ { "type": "html", "html": "<p>Content</p>" } ] }
          }
        ]
      }
    }
  ],
  "meta": { "warnings": [] }
}
```

### Validation Notes
- Quick shape check: ensure `pages[0].schema.fields` exists and elements use only allowed types.
- Optionally run a BF conversion helper (e.g., `convertToVFG3`) when needed by consumers.
- When validation fails, surface the exact JSON path and reason in the plugin.

### References
- Figma REST & Plugin APIs
- BF `serverapp/` services and `webapp/` components
- Related docs in `Internal Docs/front-end-tool-feature/*`
- Public docs: https://docs.fmbetterforms.com/
- Sibling docs repo: `../BetterForms_Docs/` (e.g., `core-concepts/`, `reference/`)


