General Info:
-Model: gpt5-mini
-Reasoning: medium

What it did right:
-Nested groups with correct colors
-All buttons are present in schema (but none of them render)

What it did wrong:
-No text in schema
-Buttons don't render

AI generated improved prompt (failed on same test case): 
Task
Convert a single selected Figma node (JSON) to a single FileMaker BetterForms schema JSON object that visually matches the design using TailwindCSS utilities.

Important: you will always return exactly one JSON object (the selected node). Do NOT wrap it in an array or add any commentary.

Critical Constraints (strict)
Output must be a single field object representing the selected node. Never return an array or wrapper.
No hardcoding. ALL style values, measures, and content must be taken from the Figma data or design tokens supplied. Do not invent colors, paddings, radii, font sizes, spacing, or sizes.
Use design tokens when available with priority: tokens.used → tokens.all (fuzzy match) → hex fallback. Token format mapping: token name "Primary/500" → CSS var --Primary-500 and class bg-[var(--Primary-500)] (or text-[var(--Primary-500)] etc).
Preserve Figma hierarchy exactly — keep every FRAME/GROUP/INSTANCE as a group node even if redundant.
Numeric precision: round numeric values to max 1-2 decimal places. Prefer whole numbers for font sizes where practical.
BFName: Every field must include a BFName derived from node.name: lowercase, spaces & non-alphanumeric → underscores, max 50 chars. If two BFNames would be identical, append a short sanitized id suffix (e.g., _619_1240 or last numeric segment) to guarantee distinguishability while keeping under 50 chars.
data-idbf: use a deterministic sanitized id formed from node.id:
Replace every non-alphanumeric character with underscore, collapse repeated underscores, trim leading/trailing underscores.
Prefix with idbf_g_ for groups/frames and idbf_e_ for element-level nodes (html, button, input, textarea).
Example: "60:200" → "idbf_e_60_200"; "I619:1240;20:486" → "idbf_g_I619_1240_20_486".
Ensure uniqueness across the tree.
Output Schema (unchanged but stricter)
Field types: group, button, html, input, textArea (use input/textArea only when a node clearly represents a form control).
Required root keys for every field: { "type": "...", "attributes": { "data-idbf": "idbf_g_xxx" | "idbf_e_xxx" }, "BFName": "derived_name" }
Groups must include styleClasses and fields (array of children).
Buttons must include text OR icon, buttonClasses, and actions (at least one namedAction).
HTML nodes must include html string (single-line), optional styleClasses, and any data-figma-image / data-figma-vector markers when applicable.
Return only the JSON object; omit any empty arrays/objects and do not include null values.

Sizing and Layout Mapping (NEW — critical fixes)
Sizing decisions must come from autolayout + direction. When mapping to Tailwind classes, consider autolayout.direction:

Determine primary axis:

HORIZONTAL → primary axis = width (w)
VERTICAL → primary axis = height (h)
For the primary axis:

primaryAxisSizingMode: "FIXED" → set w-[{width}px] or h-[{height}px] using the node.size value (rounded).
"AUTO" → use w-auto or h-auto (do NOT hardcode the pixel width).
"FILL" → use w-full or h-full / flex-1 depending on parent layout context (use flex-1 if node.layoutGrow=1).
For the counter axis:

counterAxisSizingMode: "FIXED" → set the opposite dimension to fixed pixel size (use node.size).
"AUTO" → use h-auto or w-auto (do NOT hardcode px).
If the node has an explicit size but autolayout says AUTO, prefer the AUTO mapping (w-auto/h-auto). Only apply explicit pixel class for counter axis when counterAxisSizingMode == FIXED.
If layoutPositioning: "ABSOLUTE" → produce absolute top/left using node.position, otherwise use flex layout rules derived from autolayout.

Spacing/padding/gap:

itemSpacing → gap-[{px}px]
padding → use px/py shortcuts only when symmetric; otherwise use pt-, pr-, pb-, pl- with exact px values.
Child alignment:

layoutAlign -> self-*
layoutGrow: 1 -> flex-1
When the Figma size for a node is 0 in a particular axis but a stroke or vector indicates a visible line, convert intelligently (e.g., w-[1px] for vertical divider). Do not assume arbitrary widths.

Visual Property Mapping (clarified)
Fills: prefer token classes (bg-[var(--Name)]) if token match exists; else bg-[#hex].
Strokes: border border-[#hex] and border-[weight] only if strokeWeight > 0 and stroke visible.
Corner radii: rounded-[8px] or per-corner if non-uniform.
Effects/shadows: map to shadow-[...] if complex; prefer single shadow-md/ shadow-sm when approximable.
Opacity: opacity-[0.8] (round to 1-2 decimals).
Gradients: produce html node with inline CSS gradient background and include styleClasses for other visual attributes. Use rounded/w/h classes derived from sizing rules (not arbitrary px).
Images: produce html <img> with placeholder src; include data-figma-image true and width/height classes per sizing rules.
Vectors: produce html placeholder comment or inline <svg> placeholder; include data-figma-vector true.
Type Detection (clarified)
BUTTON: FRAME/INSTANCE whose name or component name includes "Button" / "Btn" OR visually button-like (solid fill, corner radius, single text/icon child). Output type: "button".

If child text uses Font Awesome → icon detection rules below.
buttonClasses: include padding, rounded, width/height mapping per sizing rules, font-size and color from TEXT child.
ICON detection (Font Awesome):

textStyle.fontName.family containing "Font Awesome" and characters are a single icon name -> map to fa-class e.g., "edit" → fa-edit; style Regular → fa-regular, Solid → fa-solid.
For icon buttons produce "icon": "fa-regular fa-edit". For standalone icon nodes produce html <i class="..."></i> or button.icon.
FORM CONTROLS:

Recognize components named "Toggle", "Switch", "Radio", "Checkbox" and generate custom HTML (not BF native input types) per examples.
BFName & Action Naming (NEW)
BFName: derived from node.name by:
Lowercasing, replacing spaces and non-alphanumerics with underscores, collapse multiple underscores.
Truncate to 50 chars. If duplicates occur within the generated tree, append a sanitized short id suffix (e.g., _619_1240) to make BFName unique.
action.name for a button: "OnClick_{BFName}" (use BFName before any id suffix trimming).
idbf attribute rules (repeated for emphasis)
Prefix groups/frames with idbf_g_ and element-level nodes with idbf_e_.
Sanitize node.id exactly per rules above (non-alphanumeric -> underscore).
Ensure uniqueness.
Rounding and Formatting
Round to max 1-2 decimals for sizes and opacity. Use whole numbers for font sizes where possible.
Tailwind arbitrary values must include unit px when using exact numbers: e.g., w-[150px], gap-[12px], opacity-[0.8].
HTML strings must be inline (no newlines) and safe: escape quotes and produce single-line strings in the JSON.
Edge cases (unchanged but important)
If an element has gradient fills → type: "html" with inline gradient CSS (include accurate stop colors from Figma; prefer tokens if available).
If vector has width 0 but stroke exists → render as 1px vertical/horizontal divider with stroke color and correct height per sizing mapping.
If an image source is missing, include placeholder URL and data-figma-image true.
Validation Checklist (must meet all)
Valid JSON (single object).
Single root object representing selected node.
Every object has attributes.data-idbf unique.
Every field has BFName.
No hardcoded stylistic values — all values must be taken from Figma data or tokens.
Figma hierarchy preserved exactly.
Sizing follows autolayout sizing mode + direction rules above (AUTO->w-auto/h-auto, FILL->w-full/flex-1, FIXED->w-[px]/h-[px]).
Design tokens used when available.
Text content (characters) preserved exactly.
Omit empty arrays/objects.
Numeric precision rules followed.
Form controls are custom HTML when detected.
Inputs
You will be given two variables:

{{$figmaData}} — the selected node (single node) JSON (may include nested children)
{{$tokens}} — design tokens object (tokens.used and tokens.all)
Output Requirements (final)
Return exactly one JSON object (the selected node converted).
All styles derived strictly from Figma data or tokens.
BFName on every field (unique if necessary).
data-idbf per id rules above.
Use design tokens per priority rules.
Return only the JSON object (no explanation, no extra text).