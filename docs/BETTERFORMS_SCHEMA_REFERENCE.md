# BetterForms Schema Reference

## For LLM: Understanding the Target Output

When converting Figma designs, you generate **BetterForms schema** - a JSON structure that FileMaker BetterForms uses to render UI components.

---

## Core Concepts

### 1. Fields and Groups
- Everything is a **field** with a `type` property
- **Groups** (`type: "group"`) are containers with a `fields` array
- Fields can be nested infinitely

### 2. Data Binding with `model`
- The `model` property binds a field to data
- Example: `"model": "user.email"` binds to `user.email` in the data object
- Groups typically don't have models (they're layout containers)

### 3. Styling with TailwindCSS
- `styleClasses` - Classes applied to the field wrapper
- `buttonClasses` - Classes for button elements
- `labelClasses` - Classes for label elements
- Use TailwindCSS v3+ utility classes

### 4. Attributes and `data-idbf`
Every element must have a unique identifier in `attributes`:

**For Groups:**
```json
"attributes": {
  "formGroup": {
    "data-idbf": "idbf_g_xxxxxx"
  }
}
```

**For Elements:**
```json
"attributes": {
  "formElement": {
    "data-idbf": "idbf_e_xxxxxx"
  }
}
```

**Legacy Format (also valid):**
```json
"attributes": {
  "data-idbf": "idbf_e_xxxxxx"
}
```

### 5. Computed Properties (`_calc` suffix)
Any property can be computed using JavaScript by adding `_calc` suffix:
- `label_calc` - Dynamic label
- `styleClasses_calc` - Dynamic classes
- `visible_calc` - Conditional visibility
- Value is a JavaScript expression string

**Example:**
```json
{
  "label_calc": "'Hello ' + model.userName",
  "styleClasses_calc": "model.isActive ? 'bg-green-100' : 'bg-gray-100'",
  "visible_calc": "model.showField === true"
}
```

**Note:** For Figma exports, use static properties (no `_calc`) since designs are static.

### 6. BFName Property
Every field should include a `BFName` for tree readability:
```json
{
  "BFName": "submit_button",
  "type": "button",
  ...
}
```

---

## Field Types Reference

### Container: `type: "group"`
**Use for:** Divs, sections, containers, layout wrappers

```json
{
  "type": "group",
  "BFName": "hero_section",
  "styleClasses": "flex flex-col gap-4 p-6 bg-white rounded-lg",
  "attributes": {
    "formGroup": {
      "data-idbf": "idbf_g_abc123"
    }
  },
  "fields": [
    // Child fields here
  ]
}
```

**Key Properties:**
- `styleClasses` - Layout and styling
- `fields` - Array of child fields
- `attributes` - Must include `formGroup` with `data-idbf`

---

### Button: `type: "button"`
**Use for:** Clickable buttons, CTAs

**Text Button:**
```json
{
  "type": "button",
  "BFName": "submit_button",
  "text": "Submit Form",
  "buttonClasses": "px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600",
  "actions": [
    {
      "action": "namedAction",
      "name": "OnClick_SubmitForm"
    }
  ],
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_btn001"
    }
  }
}
```

**Icon Button:**
```json
{
  "type": "button",
  "BFName": "edit_button",
  "icon": "fa-regular fa-edit",
  "buttonClasses": "p-2 text-gray-700 hover:bg-gray-100 rounded-md",
  "actions": [
    {
      "action": "namedAction",
      "name": "OnClick_EditRecord"
    }
  ],
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_btn002"
    }
  }
}
```

**Button with Icon and Text:**
```json
{
  "type": "button",
  "BFName": "add_user_button",
  "text": "Add User",
  "icon": "fa-solid fa-plus",
  "buttonClasses": "px-4 py-2 bg-green-500 text-white rounded-md flex items-center gap-2",
  "actions": [
    {
      "action": "namedAction",
      "name": "OnClick_AddUser"
    }
  ],
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_btn003"
    }
  }
}
```

**Key Properties:**
- `text` - Button label (for text buttons)
- `icon` - Font Awesome classes (for icon buttons)
- `buttonClasses` - Styling for the button itself
- `styleClasses` - Styling for the button's wrapper
- `actions` - Array of action objects

---

### HTML Element: `type: "html"`
**Use for:** Text, images, custom HTML, decorative elements

```json
{
  "type": "html",
  "BFName": "page_title",
  "html": "<h1 class=\"text-3xl font-bold text-gray-900\">Dashboard</h1>",
  "styleClasses": "mb-6",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_html001"
    }
  }
}
```

**With Dynamic Content (using model):**
```json
{
  "type": "html",
  "html": "<p class=\"text-gray-600\">Welcome, {{model.userName}}!</p>",
  "styleClasses": "mb-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_html002"
    }
  }
}
```

**Image:**
```json
{
  "type": "html",
  "html": "<img src=\"https://via.placeholder.com/400x300\" alt=\"Hero Image\" class=\"w-full h-auto rounded-lg object-cover\">",
  "styleClasses": "mb-6",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_img001"
    },
    "data-figma-image": "true"
  }
}
```

**Key Properties:**
- `html` - Raw HTML string (use Vue template syntax for dynamic content)
- `styleClasses` - Wrapper styling
- **Important:** HTML must be valid and single-line in JSON (no line breaks)

**Available in HTML:**
- `model` - Access to data model
- Vue.js directives (v-if, v-for, etc.)
- TailwindCSS classes
- Font Awesome icons
- Moment.js for dates
- Lodash utilities
- Numeral.js for numbers

---

### Text Input: `type: "input"`
**Use for:** Single-line text inputs, email, password, etc.

```json
{
  "type": "input",
  "BFName": "email_field",
  "inputType": "email",
  "label": "Email Address",
  "model": "user.email",
  "placeholder": "you@example.com",
  "required": true,
  "validator": "email",
  "hint": "We'll never share your email",
  "styleClasses": "mb-4",
  "labelClasses": "text-sm font-medium text-gray-700",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_input001"
    }
  }
}
```

**Input Types:**
- `text` - Default text input
- `email` - Email input with validation
- `password` - Password input (masked)
- `number` - Numeric input
- `tel` - Phone number
- `url` - URL input
- `search` - Search input

**Key Properties:**
- `inputType` - Type of input (see above)
- `label` - Field label
- `model` - Data binding path
- `placeholder` - Placeholder text
- `required` - Boolean, shows * and validates
- `validator` - Validation type (email, url, string, number, required, regexp)
- `pattern` - Regex pattern (if validator is 'regexp')
- `hint` - Help text below field
- `styleClasses` - Input wrapper styling
- `labelClasses` - Label styling

---

### Text Area: `type: "textArea"`
**Use for:** Multi-line text inputs

```json
{
  "type": "textArea",
  "BFName": "description_field",
  "label": "Description",
  "model": "product.description",
  "placeholder": "Enter product description...",
  "rows": 5,
  "styleClasses": "mb-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_textarea001"
    }
  }
}
```

**Key Properties:**
- `rows` - Number of visible rows
- All standard input properties apply

---

### Multi-Select: `type: "vueMultiSelect"`
**Use for:** Dropdowns, multi-select fields

**Single Select:**
```json
{
  "type": "vueMultiSelect",
  "BFName": "country_select",
  "label": "Country",
  "model": "user.country",
  "placeholder": "Select a country",
  "required": true,
  "values": ["USA", "Canada", "Mexico", "UK", "France"],
  "selectOptions": {
    "multiSelect": false,
    "closeOnSelect": true,
    "searchable": true,
    "showLabels": false
  },
  "validator": "required",
  "styleClasses": "mb-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_select001"
    }
  }
}
```

**Multi-Select with Objects:**
```json
{
  "type": "vueMultiSelect",
  "BFName": "libraries_select",
  "label": "Select Libraries",
  "model": "user.libraries",
  "placeholder": "Select your favorite libraries",
  "values": [
    { "id": 0, "name": "Vue.js", "language": "JavaScript" },
    { "id": 1, "name": "Rails", "language": "Ruby" },
    { "id": 2, "name": "Django", "language": "Python" }
  ],
  "selectOptions": {
    "multiple": true,
    "closeOnSelect": false,
    "searchable": true,
    "trackBy": "id",
    "label": "name"
  },
  "styleClasses": "mb-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_select002"
    }
  }
}
```

**Key Properties:**
- `values` - Array of strings or objects
- `selectOptions` - Configuration object:
  - `multiSelect` / `multiple` - Allow multiple selections
  - `closeOnSelect` - Close dropdown after selection
  - `searchable` - Enable search
  - `showLabels` - Show selected labels
  - `trackBy` - Key to track objects by (when using objects)
  - `label` - Key to display for objects (when using objects)

---

### Date/Time Picker: `type: "dateTimePicker"`
**Use for:** Date and time selection

```json
{
  "type": "dateTimePicker",
  "BFName": "start_date",
  "label": "Start Date",
  "model": "event.startDate",
  "required": true,
  "format": "MM/DD/YYYY",
  "dateTimePickerOptions": {
    "format": "ddd, MMM D, YYYY",
    "showTodayButton": true,
    "icons": {
      "today": "fa fa-star"
    }
  },
  "styleClasses": "mb-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_date001"
    }
  }
}
```

**Key Properties:**
- `format` - Date format string
- `dateTimePickerOptions` - Configuration for picker

---

### Tabs: `type: "tabs_form2"`
**Use for:** Tabbed interfaces with different content per tab

```json
{
  "type": "tabs_form2",
  "BFName": "profile_tabs",
  "label": "User Profile",
  "modelActiveTab": "activeTabIndex",
  "styleClasses": "mb-6",
  "styleClassesTabs": "flex border-b",
  "styleClassesTab": "flex-1 px-4 py-2 text-center",
  "styleClassesTabActive": "border-b-2 border-blue-500 font-bold text-blue-600",
  "styleClassesBody": "p-6 bg-white",
  "schema": [
    {
      "tabLabel": "Personal Info",
      "tabIcon": "fa fa-user",
      "fields": [
        {
          "type": "input",
          "inputType": "text",
          "label": "First Name",
          "model": "nameFirst",
          "styleClasses": "mb-4"
        }
      ]
    },
    {
      "tabLabel": "Settings",
      "tabIcon": "fa fa-cog",
      "fields": [
        {
          "type": "input",
          "inputType": "text",
          "label": "Display Name",
          "model": "displayName",
          "styleClasses": "mb-4"
        }
      ]
    }
  ],
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_tabs001"
    }
  }
}
```

**Key Properties:**
- `modelActiveTab` - Model property to store active tab index
- `schema` - Array of tab objects, each with:
  - `tabLabel` - Tab label text
  - `tabIcon` - Font Awesome icon
  - `fields` - Fields for this tab
- `styleClassesTabs` - Wrapper around tab labels
- `styleClassesTab` - Individual tab label
- `styleClassesTabActive` - Active tab label
- `styleClassesBody` - Tab content area

---

### Formatted Input: `type: "cleave"`
**Use for:** Credit cards, phone numbers, formatted inputs

**Credit Card:**
```json
{
  "type": "cleave",
  "BFName": "card_number",
  "label": "Credit Card Number",
  "model": "payment.cardNumber",
  "placeholder": "xxxx xxxx xxxx xxxx",
  "required": true,
  "cleaveOptions": {
    "creditCard": true
  },
  "styleClasses": "mb-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_cleave001"
    }
  }
}
```

**Phone Number:**
```json
{
  "type": "cleave",
  "BFName": "phone_number",
  "label": "Phone Number",
  "model": "user.phone",
  "cleaveOptions": {
    "phone": true,
    "phoneRegionCode": "US"
  },
  "styleClasses": "mb-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_cleave002"
    }
  }
}
```

**Key Properties:**
- `cleaveOptions` - Formatting configuration:
  - `creditCard: true` - Credit card formatting
  - `phone: true` + `phoneRegionCode` - Phone formatting

---

### Rich Text Editor: `type: "quilleditor"`
**Use for:** Rich text editing with formatting

```json
{
  "type": "quilleditor",
  "BFName": "content_editor",
  "label": "Content",
  "model": "article.content",
  "editorOptions": {},
  "hint": "Use .ql-editor class to set height",
  "styleClasses": "mb-6",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_quill001"
    }
  }
}
```

**Key Properties:**
- `editorOptions` - Quill editor configuration

---

### Google Places: `type: "googleAddress"`
**Use for:** Address autocomplete using Google Places API

```json
{
  "type": "googleAddress",
  "BFName": "address_field",
  "label": "Address",
  "model": "user.address",
  "placeholder": "Start typing an address...",
  "required": true,
  "onPlaceChanged": "true",
  "styleClasses": "mb-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_gaddress001"
    }
  }
}
```

**Note:** Requires Google Places API key configured in app settings.

---

### BF Component: `type: "bfcomponent"`
**Use for:** Custom BetterForms components

```json
{
  "type": "bfcomponent",
  "BFName": "header_component",
  "name": "Header",
  "logoUrl": "https://example.com/logo.png",
  "userName": "{{model.user.name}}",
  "styleClasses": "mb-6",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_bfcomp001"
    }
  }
}
```

**Key Properties:**
- `name` - Component name (required)
- Additional properties depend on the specific component

---

### Layout Helper: `type: "clearfix"`
**Use for:** Clearing floats, adding space

```json
{
  "type": "clearfix",
  "BFName": "spacer",
  "styleClasses": "clearfix my-4",
  "attributes": {
    "formElement": {
      "data-idbf": "idbf_e_clear001"
    }
  }
}
```

---

## Validation System

BetterForms supports multiple validation types:

### Validator Types
- `email` - Valid email address
- `url` - Valid URL
- `string` - Non-empty string
- `number` - Numeric value
- `required` - Field must have value
- `regexp` - Custom regex pattern

**Example with Regex:**
```json
{
  "type": "input",
  "label": "Username",
  "model": "user.username",
  "required": true,
  "validator": "regexp",
  "pattern": "^[a-zA-Z0-9_]{3,20}$",
  "hint": "3-20 characters, letters, numbers, and underscores only"
}
```

---

## Actions System

### Named Actions
Actions are referenced by name and trigger server-side or client-side behavior:

```json
{
  "actions": [
    {
      "action": "namedAction",
      "name": "OnClick_SubmitForm"
    }
  ]
}
```

**Common Action Types:**
- `namedAction` - Call a named action script
- `navigate` - Navigate to another page
- `runScript` - Execute inline script
- `toggle` - Toggle a boolean value

**Note:** For Figma exports, use generic action names that describe the intent (e.g., `OnClick_SubmitButton`, `OnClick_EditUser`).

---

## TailwindCSS Patterns

### Layout (Flexbox)
```
flex flex-row          → Horizontal layout
flex flex-col          → Vertical layout
gap-4                  → Gap between items
justify-start          → Align to start
justify-center         → Center items
justify-between        → Space between
items-center           → Vertical center
items-start            → Align to top
```

### Sizing
```
w-full                → 100% width
w-[500px]             → Fixed 500px width
h-auto                → Auto height
min-w-[200px]         → Minimum width
max-w-[1200px]        → Maximum width
flex-1                → Grow to fill space
```

### Spacing
```
p-4                   → Padding all sides
px-6                  → Padding left/right
py-3                  → Padding top/bottom
m-4                   → Margin all sides
mb-6                  → Margin bottom
gap-4                 → Gap between flex/grid items
```

### Colors
```
bg-white              → White background
bg-[#ff0000]          → Hex color background
text-gray-700         → Text color
border-blue-500       → Border color
```

### Borders & Radius
```
border                → 1px border
border-2              → 2px border
rounded-md            → Medium border radius
rounded-full          → Fully rounded (circle/pill)
```

### Effects
```
shadow-md             → Medium shadow
shadow-lg             → Large shadow
opacity-50            → 50% opacity
blur-sm               → Small blur
```

### Typography
```
text-xl               → Extra large text
font-bold             → Bold weight
leading-relaxed       → Line height
tracking-wide         → Letter spacing
uppercase             → Text transform
```

---

## Common Patterns

### Card Component
```json
{
  "type": "group",
  "BFName": "user_card",
  "styleClasses": "bg-white rounded-lg shadow-md p-6 border border-gray-200",
  "fields": [
    {
      "type": "html",
      "html": "<h3 class=\"text-xl font-semibold mb-2\">{{model.user.name}}</h3>",
      "BFName": "card_title"
    },
    {
      "type": "html",
      "html": "<p class=\"text-gray-600 mb-4\">{{model.user.bio}}</p>",
      "BFName": "card_description"
    },
    {
      "type": "button",
      "text": "View Profile",
      "buttonClasses": "px-4 py-2 bg-blue-500 text-white rounded-md",
      "BFName": "view_button"
    }
  ]
}
```

### Form Field with Label
```json
{
  "type": "group",
  "BFName": "email_group",
  "styleClasses": "mb-4",
  "fields": [
    {
      "type": "input",
      "inputType": "email",
      "label": "Email Address",
      "model": "user.email",
      "placeholder": "you@example.com",
      "required": true,
      "validator": "email",
      "styleClasses": "w-full",
      "BFName": "email_input"
    }
  ]
}
```

### Navigation Bar
```json
{
  "type": "group",
  "BFName": "navigation",
  "styleClasses": "flex flex-row justify-between items-center px-6 py-4 bg-white border-b border-gray-200",
  "fields": [
    {
      "type": "html",
      "html": "<img src=\"/logo.png\" class=\"h-8\">",
      "BFName": "logo"
    },
    {
      "type": "group",
      "styleClasses": "flex flex-row gap-4",
      "BFName": "nav_links",
      "fields": [
        {
          "type": "button",
          "text": "Home",
          "buttonClasses": "text-gray-700 hover:text-blue-500",
          "BFName": "home_link"
        },
        {
          "type": "button",
          "text": "About",
          "buttonClasses": "text-gray-700 hover:text-blue-500",
          "BFName": "about_link"
        }
      ]
    }
  ]
}
```

### Grid Layout
```json
{
  "type": "group",
  "BFName": "card_grid",
  "styleClasses": "grid grid-cols-3 gap-6",
  "fields": [
    {
      "type": "group",
      "styleClasses": "bg-white p-4 rounded-lg shadow",
      "BFName": "card_1",
      "fields": [...]
    },
    {
      "type": "group",
      "styleClasses": "bg-white p-4 rounded-lg shadow",
      "BFName": "card_2",
      "fields": [...]
    },
    {
      "type": "group",
      "styleClasses": "bg-white p-4 rounded-lg shadow",
      "BFName": "card_3",
      "fields": [...]
    }
  ]
}
```

---

## Best Practices for Figma-to-BetterForms Conversion

### 1. Use Appropriate Field Types
- Static text → `type: "html"`
- Buttons → `type: "button"`
- Containers → `type: "group"`
- Form inputs → Use specific input types

### 2. Preserve Visual Hierarchy
- Maintain nesting from Figma layers
- Use groups for logical containers
- Don't flatten unnecessarily

### 3. Styling Guidelines
- Use TailwindCSS classes from Figma properties
- Apply `styleClasses` to wrappers
- Apply `buttonClasses` to buttons
- Use tokens when available

### 4. Data Attributes
- Every field needs `attributes` with `data-idbf`
- Use `formElement` for elements
- Use `formGroup` for groups
- Generate unique IDs from Figma node IDs

### 5. BFName Convention
- Descriptive, lowercase with underscores
- Max 50 characters
- Derived from Figma layer names

### 6. Actions
- All buttons should have `actions` array
- Use `namedAction` type
- Name format: `OnClick_{DescriptiveName}`

### 7. Placeholders
- Images: Use `https://via.placeholder.com/{w}x{h}`
- Mark with `data-figma-image: "true"`
- Vectors: Use HTML comment with `data-figma-vector: "true"`

---

## Field Type Quick Reference

| Figma Element | BetterForms Type | Use Case |
|---------------|------------------|----------|
| Frame/Group | `group` | Containers, sections |
| Button | `button` | Clickable buttons |
| Text | `html` | Headings, paragraphs, labels |
| Image | `html` | Images (with placeholder) |
| Vector | `html` | Icons, logos (with placeholder) |
| Rectangle | `html` or `group` | Shapes, decorative |
| Input placeholder | `input` | Text inputs (if detected) |

---

## Reference Links

- **BetterForms Docs:** docs.fmbetterforms.com
- **TailwindCSS Docs:** tailwindcss.com
- **Font Awesome Icons:** fontawesome.com
- **Vue.js Template Syntax:** vuejs.org

---

**This reference is comprehensive but may include field types that don't apply to Figma exports. Focus on `group`, `button`, `html`, and `input` for most conversions.**
