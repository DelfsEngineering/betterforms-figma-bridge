# Future Features

## Automatic Image URL Resolution

### Overview
Currently, when Figma elements have IMAGE fills, the plugin exports placeholder HTML comments and the LLM generates `<img>` tags with placeholder URLs (e.g., `https://source.unsplash.com/random/...`). Users must manually replace these with their hosted image URLs.

### Proposed Enhancement
Automatically fetch real, usable image URLs from Figma's REST API during export.

### Implementation Details

**1. Export `imageHash` from Figma** ✅ (Already implemented in v0.8.4)
```typescript
if (paint.type === 'IMAGE') {
  const img = paint as ImagePaint;
  if (img.imageHash) out.imageHash = img.imageHash;
  if (img.scaleMode) out.scaleMode = img.scaleMode;
}
```

**2. Add Figma Token UI Field**
```javascript
// Add to plugin UI (next to existing API key field)
<input 
  type="password" 
  placeholder="Figma Personal Access Token (for images)"
  v-model="state.figmaToken"
/>

// Store securely
await figma.clientStorage.setAsync('figmaToken', token);
```

**3. Fetch Image URLs via Figma REST API**
```javascript
// During export, for each IMAGE fill:
const fileKey = figma.fileKey; // Current file
const nodeId = node.id; // Image node ID

const response = await fetch(
  `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}`,
  {
    headers: {
      'X-Figma-Token': state.figmaToken
    }
  }
);

const data = await response.json();
const imageUrl = data.images[nodeId];
// Returns: "https://s3-us-west-2.amazonaws.com/figma-alpha-api/img/..."
```

**4. Use in Schema Output**
```javascript
// LLM generates:
<img src="https://s3-us-west-2.amazonaws.com/figma-alpha-api/img/abc123..." 
     class="w-full h-full object-cover">
```

### User Setup (One-Time)
1. User goes to Figma → Settings → Personal Access Tokens
2. Clicks "Generate new token"
3. Pastes token into plugin UI
4. Plugin stores token for future exports

### Benefits
- ✅ **Immediate preview** - Images display right away in BetterForms
- ✅ **No manual work** - No need to replace placeholder URLs
- ✅ **Great for prototyping** - Quick iteration and testing
- ✅ **Standard workflow** - Similar to existing API key management

### Limitations
- ❌ **30-day expiration** - Figma image URLs expire after 30 days
- ❌ **Requires setup** - User must generate and provide Figma token
- ❌ **Async complexity** - Makes export process slower (API calls)
- ❌ **Not production-ready** - For production, users should host images permanently

### Recommended Use Case
**Best for:** Prototyping, testing, and rapid iteration
**Not for:** Production deployments (images expire)

### Production Workflow (Current)
For production use, users should:
1. Export assets from Figma (File → Export)
2. Host on CDN/server/local assets
3. Replace placeholder URLs with permanent paths
4. Images never expire

### References
- [Figma REST API - Images Endpoint](https://developers.figma.com/docs/rest-api/file-endpoints/)
- [Figma Plugin API - ImagePaint](https://www.figma.com/plugin-docs/api/Paint/#imagepaint)

### Status
📋 **Documented** - Not yet implemented
🎯 **Priority** - Medium (nice-to-have for prototyping)
⏱️ **Estimate** - 2-3 hours implementation

