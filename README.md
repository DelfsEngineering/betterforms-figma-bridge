# BetterForms Figma Bridge

A Figma plugin that converts Figma designs into BetterForms page schemas, enabling seamless translation of UI designs into functional forms.

## 🎯 What It Does

This plugin allows you to:
- Select frames, groups, or components in Figma
- Export design data as normalized JSON
- Preview selection metadata and thumbnails
- Generate BetterForms-compatible schema from your designs
- Preserve layer names and structure for accurate conversion

**Current Status:** MVP/PoC - Plugin-only functionality with selection preview and JSON export.

## 📋 Prerequisites

Before installing this plugin, ensure you have:

- **Figma Desktop App** (recommended) or Figma in a supported browser
- **Node.js** (v16 or later) and **npm** installed on your machine
- A Figma account

## 🚀 Installation Instructions

Since this plugin is not yet published to the Figma Community, you'll need to install it manually as a development plugin.

### Step 1: Clone the Repository

```bash
git clone https://github.com/DelfsEngineering/betterforms-figma-bridge.git
cd betterforms-figma-bridge/figma-plugin
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

1. **Open Figma Desktop App** (or Figma in browser)

2. **Open any Figma file** or create a new one

3. **Open the Plugins menu:**
   - Click on the menu icon (☰) in the top-left
   - Navigate to: `Plugins` → `Development` → `Import plugin from manifest...`

4. **Select the manifest file:**
   - Browse to the cloned repository
   - Navigate to: `betterforms-figma-bridge/figma-plugin/`
   - Select the `manifest.json` file
   - Click **Open**

5. **Success!** The plugin "BetterForms Figma Bridge" is now available in your development plugins.

## 🎮 How to Use

### Running the Plugin

1. In Figma, go to: `Plugins` → `Development` → `BetterForms Figma Bridge`
2. The plugin panel will open

### Exporting Selection Data

1. **Select a frame or group** in your Figma canvas
2. The plugin will automatically show:
   - A preview thumbnail of your selection
   - Node metadata (name, type, dimensions)
   - Normalized JSON data
3. **Click "Export JSON"** to download the compact node JSON
4. The downloaded file can be used for BetterForms schema conversion

### What Gets Exported

The plugin exports a normalized, compact representation of your selection:
- Node IDs and names (layer names preserved)
- Node types (FRAME, GROUP, TEXT, etc.)
- Layout information (AutoLayout properties, size, positioning)
- Styles (fills, strokes, text styles)
- Hierarchical structure (children up to a depth limit)
- Colors normalized to hex format

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

### Project Structure

```
figma-plugin/
├── manifest.json       # Plugin configuration
├── ui.html            # Plugin UI interface
├── src/
│   └── code.ts        # Main plugin logic (TypeScript)
├── dist/
│   └── code.js        # Compiled JavaScript (generated)
├── assets/
│   └── icon.png       # Plugin icon
└── docs/
    └── spec.md        # Detailed specification
```

## 📖 Features (MVP)

✅ **Selection Preview**
- Thumbnail preview of selected frames/groups
- Basic metadata display

✅ **Developer Mode**
- View normalized node JSON
- Download compact JSON for processing

✅ **Layer Name Preservation**
- Original Figma layer names preserved in exported JSON
- Useful for maintaining design intent

✅ **Depth-Limited Export**
- Handles complex nested structures
- Prevents performance issues with deep trees

## 🔮 Planned Features

- WebSocket connection to BetterForms
- Direct LLM-powered schema generation
- Push generated schemas to BetterForms API
- Real-time sync and diff detection
- Component mapping and style token support

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

## 📚 Additional Resources

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [BetterForms Documentation](https://docs.fmbetterforms.com/)
- [Full Plugin Specification](./figma-plugin/docs/spec.md)

## 🤝 Contributing

This is an internal project for DelfsEngineering/BetterForms. For questions or contributions, please contact the development team.

## 📄 License

Private - Internal use only

---

**Note:** This plugin is currently in MVP/PoC stage and not published to the Figma Community. It's designed for internal use and testing.

