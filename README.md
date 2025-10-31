# BetterForms Figma Bridge

A Figma plugin that converts Figma designs into BetterForms page schemas, enabling seamless translation of UI designs into functional forms.

## 🎯 What It Does

This plugin bridges Figma designs with FileMaker BetterForms, enabling automated conversion of UI designs into functional forms.

**How it works:**
1. Select frames, groups, or components in Figma
2. The plugin captures normalized design data (layout, styles, structure)
3. Send the data to BetterForms with one click
4. BetterForms processes the design and converts it into a working form schema

**Features:**
- Real-time selection preview with thumbnails
- Intelligent preprocessing for faster conversions
- Customizable element naming
- Advanced export settings (SVG handling, width controls)
- Normalized JSON data structure
- Automatic updates as you change selections
- Secure API key storage
- Direct integration with BetterForms conversion pipeline

**Current Status:** Active development - Full conversion pipeline with preprocessing and optimization.

## 📋 Prerequisites

Before installing this plugin, ensure you have:

 - **Figma Desktop App** (required for development; dev plugin import/reload is not supported in the browser)
- **Node.js** (v16 or later) and **npm** installed on your machine
- A Figma account

## 🚀 Installation Instructions

Since this plugin is not yet published to the Figma Community, you'll need to install it manually as a development plugin.

### Step 1: Clone the Repository

```bash
git clone https://github.com/DelfsEngineering/betterforms-figma-bridge.git
cd betterforms-figma-bridge
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Plugin

```bash
npm run build
```

This compiles the TypeScript source code (`src/code.ts`) into JavaScript (`dist/code.js`) that Figma can execute.

> **Note:** During development, you can use `npm run watch` to automatically rebuild when you make changes to the source code.

### Step 4: Load the Plugin in Figma

 1. **Open Figma Desktop App** (required for development)

2. **Open any Figma file** or create a new one

3. **Open the Plugins menu:**
   - Click on the menu icon (☰) in the top-left
   - Navigate to: `Plugins` → `Development` → `Import plugin from manifest...`

4. **Select the manifest file:**
   - Browse to the cloned repository folder: `betterforms-figma-bridge/`
   - Select the `manifest.json` file
   - Click **Open**

5. **Success!** The plugin "BetterForms Figma Bridge" is now available in your development plugins.

## 🎮 How to Use

### Running the Plugin

1. In Figma, go to: `Plugins` → `Development` → `BetterForms Figma Bridge`
2. The plugin panel will open with three tabs: **Preview**, **JSON**, and **Settings**

### Setting Up Your API Key (First Time)

1. Click the **Settings** tab
2. Get your API key from BetterForms:
   - Open the FileMaker BetterForms Editor
   - Go to **Account / Users** tab
   - Copy your API key
3. Paste the API key into the plugin
4. Click **Save**

Your API key is stored securely in Figma's client storage.

### Converting Designs to BetterForms

1. **Select a frame, group, or component** in your Figma canvas
2. The plugin automatically captures and displays your selection:
   - **Preview tab**: Shows a thumbnail image of your selection with element name field
   - **JSON tab**: Shows the complete normalized JSON data structure
3. **Customize the element name** (optional): Enter a custom name for your element in the input field
4. **Adjust export settings** (optional): Click the ⋮ button to configure:
   - **Outer Element 100% Width**: Controls if the outer element uses full width (recommended ON)
   - **Strip All SVG Exports**: Remove large SVG data to reduce payload size (OFF by default, auto-strips SVGs over 30KB)
5. Click **Send to BetterForms** to push the design data to BetterForms
6. BetterForms processes the data and completes the conversion into a working form schema

The plugin automatically updates the preview and data whenever you change your selection, making it easy to iterate on your design before sending.

### Preprocessing Feature

The plugin includes intelligent preprocessing that converts basic Figma properties locally:
- **Speeds up conversions** by handling simple transformations locally
- **Optimizes data** before sending to BetterForms
- **Three modes available** in Account tab:
  - **Auto (recommended)**: Preprocesses simple designs, skips complex ones
  - **Always**: Forces preprocessing (may reduce quality on complex designs)
  - **Never**: Sends raw data (slower but highest quality)

The preprocessor handles layout (flexbox), colors, borders, padding, text styles, and more automatically.

### What Gets Sent to BetterForms

The plugin captures and sends an optimized representation of your selection:

**When preprocessing is enabled (recommended):**
- **Draft BetterForms schema**: Pre-converted layout, styles, and structure
- **Complexity metrics**: Helps determine best conversion approach
- **Figma source data**: Included as reference for complex cases
- **Optimized payload**: Smaller, faster data transfer

**Data always included:**
- **Node IDs and names**: Original Figma layer names preserved
- **Node types**: FRAME, GROUP, TEXT, and other element types
- **Layout information**: AutoLayout properties, dimensions, positioning, padding, gaps
- **Styles**: Fills, strokes, effects, corner radius, text styles
- **Hierarchical structure**: Complete child tree (depth-limited to 6 levels, max 200 children per node)
- **Colors**: Normalized to hex format for consistency
- **SVG exports**: Vector graphics (automatically optimized, strips >30KB by default)
- **Preview image**: Thumbnail PNG (base64-encoded) of the first selected node
- **Design tokens**: Detected color variables and styles

This optimized data is processed by BetterForms to generate the corresponding form schema.

## 🔧 Development Workflow

### Building

```bash
# One-time build
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch
```

### Reloading After Changes

After making code changes and rebuilding:

1. In Figma, right-click on the canvas
2. Select: `Plugins` → `Development` → `Reload plugin from manifest`
3. Or close and reopen the plugin



## 📖 Features

✅ **Real-Time Selection Preview**
- Automatic thumbnail generation of selected nodes
- Live updates as you change selections
- Visual confirmation before sending
- Customizable element naming

✅ **Intelligent Preprocessing**
- Converts basic Figma properties locally for faster processing
- Three modes: Auto (recommended), Always, or Never
- Handles layout, colors, text styles, borders, padding automatically
- Optimizes data before sending to BetterForms

✅ **Export Settings**
- Accessible via ⋮ button next to element name
- **Outer Element Width Control**: Choose between 100% width or fixed Figma dimensions
- **SVG Handling**: Auto-strips SVGs over 30KB, optional to strip all
- Settings persist across sessions

✅ **Normalized JSON View**
- Complete design data in structured JSON format
- Debug tools for testing preprocessing
- Export test data for development
- Copy JSON to clipboard

✅ **Direct BetterForms Integration**
- One-click "Send to BetterForms" button
- Secure API key authentication
- Real-time feedback on conversion status
- Support for elements, components, and pages

✅ **Smart Data Capture**
- Depth-limited export (6 levels deep, 200 children max)
- Handles complex nested structures efficiently
- Includes AutoLayout, styles, effects, and positioning
- SVG export for vector graphics (icons, shapes)
- Design tokens detection and usage

## 🔮 Planned Features

- **Enhanced Preprocessing**: More intelligent detection of buttons, inputs, and common patterns
- **Schema Preview**: View the generated BetterForms schema before applying
- **Round-Trip Sync**: Update Figma designs from BetterForms changes
- **Component Library**: Reusable component mapping and templates
- **Advanced Design Token Support**: Full variable import/export
- **Multi-Selection Processing**: Batch convert multiple frames at once
- **Version History**: Track conversion iterations and improvements

## 🐛 Troubleshooting

### Plugin won't load
- Ensure you've run `npm run build` before importing
- Check that `dist/code.js` exists
- Verify the `manifest.json` is valid JSON

### Changes not appearing
- Make sure to rebuild: `npm run build`
- Reload the plugin from the Figma Development menu

### TypeScript errors
- Ensure you have the correct TypeScript version: `npm install`
- Check that `@figma/plugin-typings` is installed

### Plugin appears but nothing happens
- Open the browser console in Figma (Figma → View → Developer Console)
- Check for error messages
- Make sure you have something selected in Figma

### Preprocessing not working
- Ensure you have a layer selected in Figma before clicking the debug button
- Check the console for detailed error messages
- Try disabling preprocessing in Settings and sending raw data instead

## 📚 Additional Resources

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [BetterForms Documentation](https://docs.fmbetterforms.com/)
- [Full Plugin Specification](./docs/spec.md)

## 🤝 Contributing

This is an internal project for DelfsEngineering/BetterForms. For questions or contributions, please contact the development team.

## 📄 License

Private - Internal use only

---

**Note:** This plugin is currently in active development and not published to the Figma Community. It features a complete conversion pipeline with intelligent preprocessing and is designed for internal use at DelfsEngineering/BetterForms.

