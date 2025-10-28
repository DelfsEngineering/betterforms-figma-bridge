General Info:
-Model: gpt5-mini
-Reasoning: medium

What it got right:
-Text
-Colouring styles (but color is not visible in editor)

What it got wrong:
-Text centering
-Didn't escape all quotes
-Colour doesn't render

Deep Dive:
-[#ffc700] doesn't render but when replaced by yellow-400 it does
-ai added justify-start and items-start which forced all children to top left corner
-corner uses w-[22px] which doesn't render but w-6 does

AI generated fixed prompt (failed on same test case):
Task
Convert a selected Figma node (JSON) to a single BetterForms schema JSON object that visually matches the design using TailwindCSS utilities.

Important: This prompt replaces and augments the prior instructions. Use ALL original rules unless explicitly overridden here.

Critical Constraints (no exceptions)
Output must be a single JSON object representing the selected Figma node (never an array or wrapper).
No hardcoding: every numeric or color value must come from the provided Figma node or tokens.
Use design tokens per the priority: tokens.used → fuzzy match in tokens.all → hex fallback.
Maintain exact Figma hierarchy — preserve every frame/group node and original child order.
Numeric precision: round to 1–2 decimals max (prefer whole numbers for font sizes).
Every field must include BFName derived from node.name: lowercase_with_underscores, max 50 chars. If a name repeats among siblings, append a numeric suffix _1, _2, ... to make BFName unique within the produced object.
Unique data-idbf: each field must have a unique attributes.data-idbf. Use idbf_g_<id> for groups and idbf_e_<id> for element nodes.
Output Schema (unchanged types & required properties)
Every field MUST contain at least:
{
"type": "...",
"attributes": { "data-idbf": "idbf_g_60_123" },
"BFName": "derived_name"
}

Field types and property semantics remain as before (group, button, html, input, textArea).

Return only the JSON object (no extra text).

New / Corrective Rules (must implement)
Escape HTML and produce valid JSON

HTML values must be single-line JSON strings with internal attribute quotes safe for JSON.
Use single quotes for attributes inside the HTML string (e.g. "<h1 class='text-[24px]'>Hi</h1>") OR escape double quotes properly. Never emit raw unescaped double quotes inside a JSON string.
No line breaks inside the html string.
Absolute-positioned children → keep absolute positions

If a child is positioned outside the parent's AutoLayout flow (child.layoutPositioning === "ABSOLUTE" OR the child’s absoluteTransform indicates it is not part of the AutoLayout flow), do NOT include it in the parent's flex flow.

Instead:

Parent must include "relative" in styleClasses.
Child becomes a field (type: html) with absolute positioning classes computed relative to the parent's origin: left = child.absoluteTransform[0][2] - parent.absoluteTransform[0][2] top = child.absoluteTransform[1][2] - parent.absoluteTransform[1][2]
Use classes: "absolute left-[Xpx] top-[Ypx]" in styleClasses (rounded to 1–2 decimals).
Include width/height as w-[Xpx] h-[Ypx] and any fills/strokes as other classes.
If parent absoluteTransform is not provided, treat parent's origin as (0,0) and compute absolute positions using raw child absoluteTransform values.

For AutoLayout children that are in-flow, keep them in the parent's flex classes (gap, padding, direction, alignments). For out-of-flow children (absolute) follow rule #2.

Parent sizing mapping (reconfirm)

primaryAxisSizingMode: FIXED → w-[<size>px]
AUTO → w-auto (or w-fit if hugging content is explicit)
FILL → w-full or flex-1 (if layoutGrow indicates fill)
For height, apply h-[px] only if counterAxisSizingMode is FIXED or explicit size provided and not auto; otherwise h-auto.

Strokes and strokeAlign

If strokes exist and strokeWeight > 0, produce a border class: border-[<strokeWeight>px] border-[#hex].
If strokeAlign is OUTSIDE: keep the border class (do not alter size calculation). Add a data attribute "data-figma-stroke-align":"OUTSIDE".
For TEXT nodes with strokeWeight set, use inline CSS in the html string to represent text-stroke (e.g., style='-webkit-text-stroke:4px #000000;') — still keep numeric precision.
Rectangles / simple shapes

Use type: "html" with html '<div></div>' (single-line) and styleClasses with w/h/bg/rounded/border as shown.
Include attribute "data-figma-rectangle": "true" for rectangles (and "data-figma-vector": "true" for vectors).
Text nodes → html strings

Create semantic tags where appropriate: headings h1/h2/h3 if font size and style indicate, otherwise p or span.
The string must preserve characters exactly.
Use class-based Tailwind utilities in the tag for text size, font weight, color, and alignment OR place classes in a wrapper property styleClasses; but ensure the html string is single-line and all quotes inside are single quotes.
If Figma text has letterSpacing (percent) or lineHeight (percent), include them inline as style attributes using the same unit (e.g., style='letter-spacing:-3%;line-height:100%').
Buttons & Icon detection (unchanged) — but ensure the produced JSON for buttons uses BFName derived from node.name and buttonClasses include padding matching autolayout padding exactly.

Duplicate node names & BFName uniqueness

BFName is node.name lowercased and underscores. If multiple siblings yield the same BFName, append _1, _2, etc. Ensure BFName remains <=50 chars.
Data attributes for dev handoff

For images, vectors, custom controls add appropriate data attributes:
data-figma-image: "true"
data-figma-vector: "true"
data-figma-rectangle: "true"
StyleClasses composition

Compose styleClasses from all applicable layout and visual classes only (padding, gap, flex, bg, border, rounded, shadow, opacity, overflow).
If parent must be "relative" to host absolute children, include it as the first class in styleClasses.
HTML structure & quoting example (must follow)

Correctly escaped example for a centered H1: html: "<h1 class='text-[132px] font-bold text-[#000000] text-center' style='letter-spacing:-3%;line-height:100%'>Figma basics</h1>"
Validation checklist (enforced)

Valid JSON (no unescaped quotes, no trailing commas).
Single root object.
Every field has attributes.data-idbf unique.
Every field has BFName.
Zero hardcoded values not present in Figma or tokens.
Figma hierarchy preserved exactly (all frames preserved).
Sizing modes mapped correctly (FILL→w-full, AUTO→w-auto, FIXED→w-[px]).
Tokens used when available.
Text content preserved exactly.
Empty arrays/objects omitted.
Numeric precision: 1–2 decimals max.
Form controls rendered as custom HTML (not native BF types).
Helpful implementation notes
When computing relative absolute positions, subtract parent absoluteTransform translation. Round to 1 decimal if necessary.
If tokens are available, prefer token class syntax (bg-[var(--Primary-500)] or bg-[--Primary-500] depending on your project token naming style). If token present in tokens.used use that.
Always set attributes.data-idbf to "idbf_g_<id>" for groups/frames and "idbf_e_<id>" for elements (use Figma id with colons replaced by underscores if needed).
When producing html strings, use single quotes inside HTML for attributes to avoid JSON escaping issues.
For any property you cannot derive (e.g., image src) include a placeholder and add a data-figma-* attribute for developer replacement.