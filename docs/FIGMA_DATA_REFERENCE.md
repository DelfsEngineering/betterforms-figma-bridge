# Figma Data Extraction Reference

Complete guide to all data extracted from Figma nodes and research findings on additional properties.

---

## Current Extraction

### Serialization Function
**Location:** `src/code.ts` → `serializeNode(node, depth, boundTokenIds)`

This function recursively traverses the Figma selection and extracts properties into JSON.

---

## Extracted Properties

### Basic Properties (All Nodes)
```typescript
{
  id: string,              // "53:1412"
  name: string,            // "Header Component"
  type: string,            // "FRAME" | "INSTANCE" | "TEXT" | "RECTANGLE" | etc.
  visible: boolean,
  locked: boolean,
  isTopLevel: boolean      // true if direct child of selection
}
```

### Dimensions & Transform
```typescript
{
  size: { w: number, h: number },
  position: { x: number, y: number },
  bounds: { x, y, width, height },
  absoluteTransform: [[1, 0, x], [0, 1, y]],  // 2x3 matrix
  rotation: number,
  opacity: number
}
```

### Layout Constraints
```typescript
{
  constraints: {
    horizontal: "MIN" | "MAX" | "CENTER" | "STRETCH" | "SCALE",
    vertical: "MIN" | "MAX" | "CENTER" | "STRETCH" | "SCALE"
  }
}
```

### AutoLayout Properties
```typescript
{
  autolayout: {
    direction: "HORIZONTAL" | "VERTICAL",
    primaryAxisSizingMode: "FIXED" | "AUTO",
    counterAxisSizingMode: "FIXED" | "AUTO",
    itemSpacing: number,
    padding: { t, r, b, l },
    align: {
      primary: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN",
      counter: "MIN" | "CENTER" | "MAX"
    }
  }
}
```

### Individual Layout Properties
```typescript
{
  layoutPositioning: "AUTO" | "ABSOLUTE",
  layoutAlign: "INHERIT" | "MIN" | "CENTER" | "MAX" | "STRETCH",
  layoutGrow: 0 | 1
}
```

### Size Constraints
```typescript
{
  minWidth: number | null,
  maxWidth: number | null,
  minHeight: number | null,
  maxHeight: number | null
}
```

### Overflow Behavior
```typescript
{
  overflow: {
    direction: "NONE" | "HORIZONTAL" | "VERTICAL" | "BOTH",
    clips: boolean
  }
}
```

### Fills (Backgrounds)
```typescript
{
  fills: [
    {
      type: "SOLID",
      visible: boolean,
      opacity: number,
      color: "#RRGGBB"
    }
    // OR GRADIENT_LINEAR, GRADIENT_RADIAL
    {
      type: "GRADIENT_LINEAR",
      visible: boolean,
      opacity: number,
      gradientStops: [
        { position: 0-1, color: "#RRGGBB" }
      ]
    }
    // OR IMAGE
    {
      type: "IMAGE",
      visible: boolean,
      opacity: number
      // NOTE: Image data NOT extracted - use placeholders
    }
  ]
}
```

### Strokes (Borders)
```typescript
{
  strokes: [
    {
      type: "SOLID",
      visible: boolean,
      opacity: number,
      color: "#RRGGBB"
    }
  ],
  strokeWeight: number,
  strokeAlign: "INSIDE" | "OUTSIDE" | "CENTER"
}
```

### Effects (Shadows, Blurs)
```typescript
{
  effects: [
    {
      type: "DROP_SHADOW",
      visible: boolean,
      color: "#RRGGBBAA",
      offset: { x, y },
      radius: number,
      spread: number
    }
    // OR INNER_SHADOW, LAYER_BLUR, BACKGROUND_BLUR
  ]
}
```

### Corner Radius
```typescript
{
  cornerRadius: number,
  cornerRadiusPerCorner: { tl, tr, br, bl }
}
```

### Text Properties
```typescript
{
  characters: string,
  textStyle: {
    fontSize: number,
    fontName: { family, style },
    alignH: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED",
    alignV: "TOP" | "CENTER" | "BOTTOM",
    autoResize: "WIDTH_AND_HEIGHT" | "HEIGHT" | "NONE",
    letterSpacing: { unit, value },
    lineHeight: { unit, value? },
    decoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH",
    case: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE"
  }
}
```

### Component Metadata
```typescript
{
  component: {
    isInstance: boolean,
    name?: string,
    properties?: {
      "Property Name": {
        value: string | boolean,
        type: "VARIANT" | "TEXT" | "BOOLEAN" | "INSTANCE_SWAP",
        boundVariables: {}
      }
    }
  }
}
```

### Children Array
```typescript
{
  children: [ /* Recursive */ ]
}
```

---

## Design Tokens Structure

```typescript
{
  tokens: {
    all: {
      "variableId": {
        id: string,
        name: string,              // "Primary/500"
        type: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN",
        value: string | number,
        scopes: string[]           // ["ALL_FILLS", "STROKE_COLOR"]
      }
    },
    used: [
      // Only variables bound to selection
      { id, name, type, value, scopes }
    ]
  }
}
```

---

## Research Findings - Additional Data Available

### High Priority (Not Extracted)

#### 1. Image Data ⭐⭐⭐⭐
**API Fields:** `fills[].imageHash`, `getImageBytesAsync()`
**Impact:** Could extract actual images as base64
**Current:** Use placeholders only

#### 2. Component Overrides ⭐⭐⭐⭐
**API Fields:** `componentProperties`, `componentPropertyReferences`
**Impact:** Detect which properties are overridden vs defaults
**Current:** Extract properties as-is, no override detection

#### 3. Style References ⭐⭐
**API Fields:** `textStyleId`, `fillStyleId`, `strokeStyleId`
**Impact:** Named style system for documentation
**Current:** Focus on Variables/Tokens only

#### 4. Vector Paths ⭐⭐
**API Fields:** `vectorNetwork`, `booleanOperation`
**Impact:** Export custom icons/logos as SVG
**Current:** Use placeholders

#### 5. Layout Grids ⭐⭐
**API Fields:** `layoutGrids[]`
**Impact:** CSS Grid vs Flexbox decision
**Current:** LLM infers from AutoLayout

#### 6. Blend Modes ⭐
**API Fields:** `blendMode`, `isMask`, `clipsContent`
**Impact:** Advanced visual effects
**Current:** Not used

#### 7. Interactive States ⭐⭐
**API Fields:** `reactions`, `componentSetId`, `variantProperties`
**Impact:** Link component variants, prototype interactions
**Current:** Convert selected state only

---

## Known Limitations (By Design)

### Not Supported
1. **Boolean Operations** - Use placeholders
2. **Advanced Vector Paths** - Use placeholders  
3. **Image Source Data** - Use via.placeholder.com
4. **Legacy Style References** - Use Variables instead
5. **Advanced Blend Modes** - Convert standard properties only
6. **Clipping Masks** - Use overflow-hidden
7. **Layout Grids** - Infer from AutoLayout
8. **Animations & Transitions** - Static output only
9. **Responsive Breakpoints** - Single selection only
10. **Component Variants** - Selected state only

---

## Code Modification Guide

### To Add New Property Extraction

**File:** `src/code.ts`
**Function:** `serializeNode(node, depth, boundTokenIds)`

**Pattern:**
```typescript
if ('propertyName' in node) {
  const typedNode = node as FrameNode;
  out.propertyName = typedNode.propertyName;
}
```

### Testing New Extractions
1. Add code to `serializeNode()`
2. Run `npm run build`
3. Reload plugin in Figma
4. Select element → check JSON in UI
5. Send to API → verify LLM output

---

## Priority Matrix

| Feature | Impact | Effort | Status |
|---------|--------|--------|--------|
| Effects & Shadows | ⚡ Medium | ⚙️ Low | ✅ Done (prompt only) |
| Vector Placeholders | ⚡ Medium | ⚙️ Low | ✅ Done (prompt only) |
| Image Extraction | 🔥 High | ⚙️ Medium | ❌ Future (needs backend) |
| Component Overrides | 🔥 High | ⚙️ High | ❌ Future (complex) |
| Boolean Ops | ⚡ Medium | ⚙️ Medium | ❌ Ignored |
| Style References | ⚡ Medium | ⚙️ Low | ❌ Not needed |
| Grid Layout | ⚡ Medium | ⚙️ High | ❌ LLM infers |
| Interactive States | ⚡ Medium | ⚙️ High | ❌ Future |

---

## Real Example

### Input (Figma):
```json
{
  "id": "53:1412",
  "type": "INSTANCE",
  "component": {
    "name": "History Open=off",
    "properties": { "History Open": { "value": "off" } }
  },
  "autolayout": {
    "direction": "HORIZONTAL",
    "primaryAxisSizingMode": "FIXED",
    "itemSpacing": 12
  },
  "fills": [{ "type": "SOLID", "color": "#ffffff" }],
  "strokes": [{ "type": "SOLID", "color": "#e5e7eb" }]
}
```

### Output (BetterForms):
```json
{
  "type": "group",
  "styleClasses": "flex flex-row gap-[12px] bg-[#ffffff] border border-[#e5e7eb]",
  "BFName": "header"
}
```

---

## Questions for Investigation

For each Figma feature:
1. Is it in the public API?
2. What's the property name?
3. What's the data type?
4. When is it available?
5. How should LLM use it?
6. Is it common?

---

**Use this reference to understand what data is available vs. what we currently extract.**

