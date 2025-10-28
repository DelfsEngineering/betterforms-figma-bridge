# Figma to BetterForms Schema Conversion (GPT-5 Optimized)

## Task

Convert Figma design JSON to FileMaker BetterForms schema JSON that visually matches the design using TailwindCSS utilities.

---

## Critical Constraints

1. **Output Format:** Single field object that directly represents the selected Figma node (never an array, never wrapped)
2. **No Hardcoding:** ALL styling must derive from the provided Figma data - never invent or assume values
3. **Design Tokens:** Use provided tokens when available, following the priority: `tokens.used` → `tokens.all` (fuzzy match) → hex fallback
4. **Structure Preservation:** Maintain exact Figma hierarchy - preserve all frames even if seemingly redundant
5. **Numeric Precision:** Round to 1-2 decimal places max (whole numbers preferred for font sizes)
6. **BFName Required:** Every field must include a `BFName` property derived from `node.name` (lowercase_with_underscores)

---

## Output Schema

### Field Types
- **`type: "group"`** - Containers, frames, divs (has `fields` array)
- **`type: "button"`** - Interactive buttons (has `text` or `icon`, `buttonClasses`, `actions`)
- **`type: "html"`** - Text, images, shapes, form controls (has `html` content)
- **`type: "input"`** / **`type: "textArea"`** - Form inputs (only if clearly a form field)

### Required Properties
Every field must have:
```json
{
  "type": "...",
  "attributes": {
    "data-idbf": "idbf_g_xxx" // or idbf_e_xxx for elements
  },
  "BFName": "descriptive_name" // from node.name, lowercase, underscores, max 50 chars
}
```

### Property-Specific Requirements

**Groups:**
- `styleClasses` - All layout and visual styling
- `fields` - Array of child elements

**Buttons:**
- `text` (for text buttons) OR `icon` (for icon buttons) - e.g., `"icon": "fa-regular fa-edit"`
- `buttonClasses` - All button styling
- `actions` - Array with namedAction

**HTML:**
- `html` - Raw HTML string (inline, no line breaks in JSON) (ensure all inline css quotes are escaped with \ ie: class="text .." -> class=\"test ..\")
- `styleClasses` - Wrapper styling
- For custom form controls, images, text, vectors

---

## Figma Data Structure

You will receive:

### Node Properties
```json
{
  "id": "60:123",
  "name": "Hero Section",
  "type": "FRAME" | "TEXT" | "VECTOR" | "RECTANGLE" | "INSTANCE",
  "size": {"w": 300, "h": 200},
  "position": {"x": 0, "y": 0},
  "bounds": {"x": 100, "y": 50, "width": 300, "height": 200},
  "opacity": 1,
  "visible": true,
  
  // Layout (if FRAME/GROUP)
  "autolayout": {
    "direction": "HORIZONTAL" | "VERTICAL",
    "primaryAxisSizingMode": "FIXED" | "AUTO" | "FILL", // Critical for responsive
    "counterAxisSizingMode": "FIXED" | "AUTO",
    "itemSpacing": 16,
    "padding": {"t": 12, "r": 16, "b": 12, "l": 16},
    "align": {"primary": "MIN" | "CENTER" | "MAX", "counter": "MIN" | "CENTER" | "MAX"}
  },
  "layoutPositioning": "AUTO" | "ABSOLUTE",
  "layoutAlign": "INHERIT" | "STRETCH" | "MIN" | "CENTER" | "MAX",
  "layoutGrow": 0 | 1,
  "minWidth": 100, "maxWidth": 500, "minHeight": 50, "maxHeight": 300,
  "overflow": {"direction": "NONE" | "HORIZONTAL" | "VERTICAL" | "BOTH", "clips": true},
  
  // Visual Properties
  "fills": [{"type": "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "IMAGE", "visible": true, "color": "#ffffff", ...}],
  "strokes": [{"type": "SOLID", "color": "#000000", "visible": true, ...}],
  "strokeWeight": 1,
  "strokeAlign": "INSIDE" | "OUTSIDE" | "CENTER",
  "cornerRadius": 8,
  "cornerRadiusPerCorner": {"tl": 8, "tr": 8, "br": 8, "bl": 8},
  "effects": [
    {
      "type": "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR",
      "visible": true,
      "color": "#00000026",
      "offset": {"x": 0, "y": 4},
      "radius": 8,
      "spread": 0
    }
  ],
  
  // Text Properties (if TEXT)
  "characters": "Hello World",
  "textStyle": {
    "fontSize": 16,
    "fontName": {"family": "Inter", "style": "SemiBold" | "Regular" | "Bold"},
    "alignH": "LEFT" | "CENTER" | "RIGHT",
    "alignV": "TOP" | "CENTER" | "BOTTOM",
    "letterSpacing": {"unit": "PERCENT", "value": 0},
    "lineHeight": {"unit": "AUTO" | "PERCENT", "value": 140},
    "decoration": "NONE" | "UNDERLINE" | "STRIKETHROUGH",
    "case": "ORIGINAL" | "UPPER" | "LOWER" | "TITLE"
  },
  
  // Component Metadata (if INSTANCE)
  "component": {
    "isInstance": true,
    "name": "Button/Primary/Large",
    "properties": {
      "Variant": {"value": "Primary", "type": "VARIANT"},
      "Size": {"value": "Large", "type": "VARIANT"},
      "icon-name": {"value": "edit", "type": "TEXT"}
    }
  },
  
  "children": [...] // Nested nodes
}
```

### Design Tokens
```json
{
  "tokens": {
    "all": {
      "VariableID:123": {
        "id": "VariableID:123",
        "name": "Primary/500",
        "type": "COLOR" | "FLOAT" | "STRING",
        "value": "#3B82F6" | 16,
        "scopes": ["FRAME_FILL", "TEXT_FILL"]
      }
    },
    "used": [
      {
        "id": "VariableID:123",
        "name": "Primary/500",
        "type": "COLOR",
        "value": "#3B82F6"
      }
    ]
  }
}
```

**Token Usage Strategy:**
1. Check if color exists in `tokens.used` → use `bg-[var(--Primary-500)]`
2. If not in used, check `tokens.all` for close match (Euclidean distance < 5) → use token
3. If no match → use hex: `bg-[#3B82F6]`
4. Token naming: `Primary/500` → `--Primary-500`, `Spacing/md` → `--Spacing-md`

---

## Conversion Rules (Critical)

### Layout Mapping 
The goal is for the generated betterforms schema to visually match the provided figma json. All elements in the figma json will have some positioning defining their location, you must ensure all elements in the betterforms schema have the equivalent positioning classes. To acomplish this refer to the provided mappings.

**Sizing Modes:**
- `primaryAxisSizingMode: "FIXED"` → `w-[300px]` (use exact size)
- `primaryAxisSizingMode: "AUTO"` → `w-auto` or `w-fit` (hug content) (elements with text should use variable width instead of fixed width to ensure none gets cut off)
- `primaryAxisSizingMode: "FILL"` → `w-full` or `flex-1` (fill container)

**Direction:**
- `direction: "VERTICAL"` → `flex flex-col`
- `direction: "HORIZONTAL"` → `flex flex-row`

**Spacing:**
- `itemSpacing: 16` → `gap-[16px]`
- `padding: {t:12, r:16, b:12, l:16}` → `pt-[12px] pr-[16px] pb-[12px] pl-[16px]` (or `px-[16px] py-[12px]` if symmetrical)

**Alignment:**
- `align.primary: "MIN"` → `justify-start`, `"CENTER"` → `justify-center`, `"MAX"` → `justify-end`
- `align.counter: "MIN"` → `items-start`, `"CENTER"` → `items-center`, `"MAX"` → `items-end`

**Individual Child Alignment:**
- `layoutAlign: "MIN"` → `self-start`, `"CENTER"` → `self-center`, `"MAX"` → `self-end`, `"STRETCH"` → `self-stretch`
- `layoutGrow: 1` → `flex-1`

**Absolute Positioning:**
- `layoutPositioning: "ABSOLUTE"` + `position: {x:20, y:10}` → `absolute top-[10px] left-[20px]`

### Visual Property Mapping

**Colors:**
- `fills[0].color: "#3B82F6"` → `bg-[#3B82F6]` or token if available
- `fills: []` or `fills[0].visible: false` → omit background class entirely
- `strokes[0].color: "#000000"` + `strokeWeight: 1` → `border border-[#000000]`

**Border Radius:**
- `cornerRadius: 8` → `rounded-[8px]`
- Non-uniform: Use per-corner classes if needed

**Shadows:**
- Map `effects` array to Tailwind shadows
- Single shadow: `shadow-md` or `shadow-[0_4px_8px_rgba(0,0,0,0.15)]`
- Multiple shadows: Comma-separated in arbitrary value

**Opacity:**
- `opacity: 0.8` → `opacity-[0.8]`

**Overflow:**
- `overflow.clips: true` + `direction: "VERTICAL"` → `overflow-y-auto`

### Type Detection

**Button Detection:**
- FRAME/INSTANCE with button-like naming (`"Button"`, `"Btn"`)
- Has single TEXT child or icon TEXT child
- Has solid fill and corner radius
→ Convert to `type: "button"`

**Icon Font Detection:**
- `textStyle.fontName.family` contains "Font Awesome"
- `characters` is short single word (e.g., "edit", "home")
→ If standalone: `<i class="fa-regular fa-edit"></i>`
→ If in button: `"icon": "fa-regular fa-edit"`

**Font Awesome Class Mapping:**
- Font family "Font Awesome 6 Pro" + style "Regular" → `fa-regular`
- Font family "Font Awesome 6 Pro" + style "Solid" → `fa-solid`
- Characters "edit" → `fa-edit`

**Form Control Detection:**
- Component name contains "Toggle", "Switch", "Radio", "Checkbox"
- Small shape (16-24px) with border + text label
→ Generate custom HTML with `<input>` elements (never use native BF types)

### Edge Cases

**Gradient Fills:**
```json
{
  "type": "html",
  "html": "<div style=\"background: linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%); width: 150px; height: 24px;\"></div>",
  "styleClasses": "rounded-[8px]" // other non-gradient styles
}
```

**Image Fills:**
```json
{
  "type": "html",
  "html": "<img src=\"https://via.placeholder.com/400x300\" alt=\"Hero Image\">",
  "styleClasses": "w-[400px] h-[300px] rounded-[12px] object-cover",
  "attributes": {
    "data-idbf": "idbf_e_60_200",
    "data-figma-image": "true"
  }
}
```

**Vector Graphics (Complex):**
```json
{
  "type": "html",
  "html": "<!-- SVG Vector: Logo - Replace with actual SVG -->",
  "styleClasses": "w-[150px] h-[24px]",
  "attributes": {
    "data-idbf": "idbf_e_43_635",
    "data-figma-vector": "true",
    "data-vector-name": "Logo"
  }
}
```

**Toggle Switch (Custom HTML):**
```json
{
  "type": "html",
  "html": "<label class=\"inline-flex items-center cursor-pointer\"><input type=\"checkbox\" class=\"sr-only peer\"><div class=\"relative w-[44px] h-[24px] bg-[#e5e7eb] rounded-full peer peer-checked:bg-[#3b82f6] transition-colors\"><div class=\"absolute top-[2px] left-[2px] bg-white w-[20px] h-[20px] rounded-full transition-transform peer-checked:translate-x-[20px]\"></div></div><span class=\"ml-3 text-[14px]\">Enable notifications</span></label>",
  "styleClasses": "mb-4",
  "BFName": "notifications_toggle"
}
```

---

## Complete Examples

### Example 1: Simple Button

**Input Figma Data:**
```json
{
  "id": "60:200",
  "name": "Primary CTA",
  "type": "FRAME",
  "size": {"w": 120, "h": 40},
  "autolayout": {
    "direction": "HORIZONTAL",
    "primaryAxisSizingMode": "FIXED",
    "counterAxisSizingMode": "AUTO",
    "padding": {"t": 10, "r": 24, "b": 10, "l": 24}
  },
  "fills": [{"type": "SOLID", "color": "#3B82F6", "visible": true}],
  "cornerRadius": 8,
  "children": [
    {
      "id": "60:201",
      "type": "TEXT",
      "characters": "Get Started",
      "textStyle": {
        "fontSize": 14,
        "fontName": {"family": "Inter", "style": "SemiBold"}
      },
      "fills": [{"type": "SOLID", "color": "#FFFFFF"}]
    }
  ]
}
```

**Expected Output:**
```json
{
  "type": "button",
  "text": "Get Started",
  "buttonClasses": "px-[24px] py-[10px] bg-[#3B82F6] text-[14px] font-semibold text-[#FFFFFF] rounded-[8px]",
  "actions": [
    {
      "action": "namedAction",
      "name": "OnClick_PrimaryCTA"
    }
  ],
  "attributes": {
    "data-idbf": "idbf_e_60_200"
  },
  "BFName": "primary_cta"
}
```

### Example 2: Icon Button

**Input Figma Data:**
```json
{
  "id": "43:1470",
  "name": "Edit Button",
  "type": "INSTANCE",
  "size": {"w": 28, "h": 28},
  "autolayout": {
    "direction": "HORIZONTAL",
    "padding": {"t": 4, "r": 4, "b": 4, "l": 4}
  },
  "fills": [],
  "cornerRadius": 4,
  "component": {
    "isInstance": true,
    "name": "Icon Button",
    "properties": {
      "Type": {"value": "Default"}
    }
  },
  "children": [
    {
      "id": "43:1471",
      "type": "TEXT",
      "characters": "edit",
      "textStyle": {
        "fontSize": 16,
        "fontName": {"family": "Font Awesome 6 Pro", "style": "Regular"}
      },
      "fills": [{"type": "SOLID", "color": "#0c4a6e"}]
    }
  ]
}
```

**Expected Output:**
```json
{
  "type": "button",
  "icon": "fa-regular fa-edit",
  "buttonClasses": "p-[4px] rounded-[4px] w-[28px] h-[28px] text-[16px] text-[#0c4a6e]",
  "actions": [
    {
      "action": "namedAction",
      "name": "OnClick_EditButton"
    }
  ],
  "attributes": {
    "data-idbf": "idbf_e_43_1470"
  },
  "BFName": "edit_button"
}
```

### Example 3: Container with Children

**Input Figma Data:**
```json
{
  "id": "60:123",
  "name": "Hero Section",
  "type": "FRAME",
  "size": {"w": 1200, "h": 600},
  "autolayout": {
    "direction": "VERTICAL",
    "primaryAxisSizingMode": "FIXED",
    "counterAxisSizingMode": "AUTO",
    "itemSpacing": 24,
    "padding": {"t": 48, "r": 0, "b": 48, "l": 0},
    "align": {"primary": "MIN", "counter": "CENTER"}
  },
  "fills": [{"type": "SOLID", "color": "#1A1A1A", "visible": true}],
  "children": [
    {
      "id": "60:124",
      "type": "TEXT",
      "characters": "Welcome",
      "textStyle": {
        "fontSize": 48,
        "fontName": {"family": "Inter", "style": "Bold"}
      },
      "fills": [{"type": "SOLID", "color": "#FFFFFF"}]
    },
    {
      "id": "60:125",
      "type": "TEXT",
      "characters": "Start building today",
      "textStyle": {"fontSize": 16},
      "fills": [{"type": "SOLID", "color": "#9CA3AF"}]
    }
  ]
}
```

**Expected Output:**
```json
{
  "type": "group",
  "styleClasses": "flex flex-col gap-[24px] py-[48px] bg-[#1A1A1A] w-[1200px] h-auto items-center",
  "attributes": {
    "data-idbf": "idbf_g_60_123"
  },
  "fields": [
    {
      "type": "html",
      "html": "<h1 class=\"text-[48px] font-bold text-[#FFFFFF]\">Welcome</h1>",
      "attributes": {
        "data-idbf": "idbf_e_60_124"
      },
      "BFName": "welcome_heading"
    },
    {
      "type": "html",
      "html": "<p class=\"text-[16px] text-[#9CA3AF]\">Start building today</p>",
      "attributes": {
        "data-idbf": "idbf_e_60_125"
      },
      "BFName": "tagline_text"
    }
  ],
  "BFName": "hero_section"
}
```

### Example 4: Responsive Layout with Tokens

**Input Figma Data:**
```json
{
  "id": "70:300",
  "name": "Card",
  "type": "FRAME",
  "size": {"w": 400, "h": 200},
  "autolayout": {
    "direction": "HORIZONTAL",
    "primaryAxisSizingMode": "FILL",
    "counterAxisSizingMode": "AUTO",
    "itemSpacing": 16,
    "padding": {"t": 16, "r": 16, "b": 16, "l": 16}
  },
  "fills": [{"type": "SOLID", "color": "#FFFFFF", "visible": true}],
  "cornerRadius": 12,
  "effects": [
    {
      "type": "DROP_SHADOW",
      "visible": true,
      "color": "#00000026",
      "offset": {"x": 0, "y": 4},
      "radius": 8
    }
  ],
  "children": [
    {
      "id": "70:301",
      "type": "FRAME",
      "size": {"w": 100, "h": 100},
      "layoutGrow": 0,
      "fills": [{"type": "SOLID", "color": "#3B82F6"}],
      "cornerRadius": 8
    },
    {
      "id": "70:302",
      "type": "FRAME",
      "layoutGrow": 1,
      "autolayout": {
        "direction": "VERTICAL",
        "itemSpacing": 8
      },
      "fills": [],
      "children": [
        {
          "id": "70:303",
          "type": "TEXT",
          "characters": "Title",
          "textStyle": {"fontSize": 18, "fontName": {"family": "Inter", "style": "Bold"}},
          "fills": [{"type": "SOLID", "color": "#111827"}]
        },
        {
          "id": "70:304",
          "type": "TEXT",
          "characters": "Description text goes here",
          "textStyle": {"fontSize": 14},
          "fills": [{"type": "SOLID", "color": "#6B7280"}]
        }
      ]
    }
  ]
}
```

**Expected Output:**
```json
{
  "type": "group",
  "styleClasses": "flex flex-row gap-[16px] p-[16px] bg-[#FFFFFF] rounded-[12px] shadow-md w-full h-auto",
  "attributes": {
    "data-idbf": "idbf_g_70_300"
  },
  "fields": [
    {
      "type": "html",
      "html": "<div></div>",
      "styleClasses": "w-[100px] h-[100px] bg-[#3B82F6] rounded-[8px]",
      "attributes": {
        "data-idbf": "idbf_e_70_301"
      },
      "BFName": "card_image"
    },
    {
      "type": "group",
      "styleClasses": "flex flex-col gap-[8px] flex-1",
      "attributes": {
        "data-idbf": "idbf_g_70_302"
      },
      "fields": [
        {
          "type": "html",
          "html": "<h3 class=\"text-[18px] font-bold text-[#111827]\">Title</h3>",
          "attributes": {
            "data-idbf": "idbf_e_70_303"
          },
          "BFName": "card_title"
        },
        {
          "type": "html",
          "html": "<p class=\"text-[14px] text-[#6B7280]\">Description text goes here</p>",
          "attributes": {
            "data-idbf": "idbf_e_70_304"
          },
          "BFName": "card_description"
        }
      ],
      "BFName": "card_content"
    }
  ],
  "BFName": "card"
}
```

---

## Known Limitations

The Figma data does NOT include:
1. **Boolean operations** - Vector unions, subtracts shown as single VECTOR
2. **Component variant relationships** - Only see individual instances
3. **Detailed vector paths** - No SVG path data
4. **Image source data** - Use placeholder URLs
5. **Advanced blend modes** - Only standard properties available
6. **Clipping masks** - Treat as overflow clipping
7. **Layout grids** - Infer from AutoLayout patterns
8. **Animations** - Static design only
9. **Responsive breakpoints** - Single view only
10. **Legacy style references** - Use inline values and tokens only

When encountering these, use appropriate placeholders with data attributes for developer replacement.

---

## Validation Criteria

Your output must satisfy ALL of these:

1. ✓ Valid JSON (proper quotes, no trailing commas)
2. ✓ Single root object (not array, not wrapped)
3. ✓ Every field has unique `data-idbf` attribute
4. ✓ Every field has `BFName` property
5. ✓ Zero hardcoded values - all from Figma data
6. ✓ Structure matches Figma hierarchy exactly
7. ✓ Responsive sizing used (FILL→w-full, AUTO→w-auto, FIXED→w-[px])
8. ✓ Design tokens used when available
9. ✓ Text content preserved accurately
10. ✓ Empty arrays/objects omitted
11. ✓ Numeric precision: 1-2 decimals max
12. ✓ Form controls (switches, radios, checkboxes) are custom HTML (not native types)
13. ✓ Inline CSS quotes are escaped with \
---

## Conversion Instructions

Convert the following Figma selection to BetterForms schema.

**Figma Data:**
{{$figmaData}}

**Design Tokens:**
{{$tokens}}

**Output Requirements:**
- Single field object representing the selected node
- All styles derived from Figma data
- Include BFName on every field
- Use design tokens per priority rules
- Return only the JSON object (no explanations)