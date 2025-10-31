# Figma2BF Test Harness

A comprehensive testing system for iterating on both the **JavaScript preprocessor** and **LLM prompts**.

## 📁 Directory Structure

```
tests/
├── test-harness.html    # Main test runner (open in browser)
├── preprocessor.js      # Standalone preprocessor logic
├── fixtures/            # Saved test cases (.json files)
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Capture Test Cases from Plugin

1. Open Figma plugin
2. Select an element
3. Click **"Send to BetterForms"** (this captures the full pipeline)
4. Go to **JSON tab**
5. Click **"💾 Save Test Case"**
6. Save the JSON file to `tests/fixtures/`

### 2. Run Tests Locally

1. Open `test-harness.html` in your browser
2. Drag & drop test case JSON files (or click to browse)
3. Run tests:
   - **"▶️ Run Preprocessor Tests"** - Test JS preprocessor changes
   - **"🤖 Test Against LLM"** - Test prompt changes (requires API key)

## 🧪 Testing Workflows

### A. Iterate on Preprocessor

**Goal:** Improve the JS preprocessor logic without hitting the API.

1. **Capture baseline test cases** from diverse Figma designs
2. **Make changes** to `preprocessor.js` or `ui.html`
3. **Run preprocessor tests** in test-harness.html
4. **Review results:**
   - ✅ **Pass** - No changes (good if you didn't intend changes)
   - ❌ **Fail** - Differences detected (review if expected)
   - ⚠️ **Manual** - Requires review (new test case, no baseline)

**What to test:**
- Complexity scoring accuracy
- Issue detection (IMAGE fills, gradients, no autolayout)
- Style class generation
- SVG/HDL handling
- Edge cases (empty nodes, missing properties)

### B. Iterate on LLM Prompts

**Goal:** Improve LLM output quality by testing prompt changes.

1. **Capture baseline test cases** with current prompt
2. **Update prompt** in `/docs/llm-prompt-gpt6-reasoning_preprocessor.md`
3. **Deploy prompt changes** to your server
4. **Run LLM tests** in test-harness.html with your API key
5. **Review differences:**
   - Side-by-side comparison of old vs new output
   - Highlighted changes (model, route, schema structure)
   - Copy outputs for detailed diff analysis

**What to test:**
- Does LLM correctly fix flagged issues?
- Are semantic improvements applied?
- Is HTML output valid and well-structured?
- Are BFName values descriptive?
- Are accessibility attributes added?

### C. Regression Testing

**Goal:** Ensure changes don't break existing functionality.

1. **Build a test suite** of diverse Figma elements:
   - Simple text
   - Buttons
   - Forms
   - Cards
   - Complex layouts
   - Edge cases
2. **Run full test suite** before/after changes
3. **Compare results** to catch regressions

## 📊 Test Case Structure

Each test case captures the complete pipeline:

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "elementName": "card_component",
  "source": {
    "figmaData": [...],        // Original Figma node tree
    "tokens": {...}            // Design tokens
  },
  "preprocessorResult": {
    "draftSchema": {...},      // Generated draft schema
    "meta": {
      "complexityScore": 35,
      "recommendedRoute": "pre",
      "issues": [...]          // Flagged issues
    }
  },
  "request": {
    "type": "element",
    "elementName": "card_component",
    "preprocessing": {...}     // Preprocessing payload sent
  },
  "response": {...}            // LLM output
}
```

## 🎯 Best Practices

### For Preprocessor Tests
- ✅ Test each change immediately
- ✅ Use diverse Figma designs (simple → complex)
- ✅ Focus on deterministic conversions only
- ✅ Document expected behavior in issues array
- ❌ Don't hardcode edge cases
- ❌ Don't rely on semantic guessing

### For LLM Tests
- ✅ Test prompt changes against entire suite
- ✅ Compare outputs side-by-side
- ✅ Check for improvements AND regressions
- ✅ Save "golden" test cases for critical flows
- ⚠️ LLM tests hit the API (costs apply)
- ⚠️ Use a test/dev API key, not production

## 🔧 Advanced Usage

### Automated Testing (Future)

```bash
# Run preprocessor tests in CI
npm test:preprocessor

# Run LLM tests (with API key)
API_KEY=xxx npm test:llm

# Generate test coverage report
npm test:coverage
```

### Custom Endpoints

Test against local/staging servers:

1. Update **API Endpoint** field in test harness
2. Examples:
   - Local: `http://localhost:3000/api/v1/figma`
   - Staging: `https://staging.fmbetterforms.com/api/v1/figma`
   - Production: `https://appdev.fmbetterforms.com/api/v1/figma`

### Batch Testing

Load multiple test cases at once:
1. Select multiple JSON files (Cmd/Ctrl+Click)
2. All tests run sequentially
3. View aggregated results

## 📈 Metrics to Track

- **Preprocessor Success Rate** - % of elements successfully preprocessed
- **Complexity Score Accuracy** - Are simple elements routed to `pre`, complex to `raw`?
- **Issue Detection Rate** - Are all non-deterministic cases flagged?
- **LLM Output Quality** - Manually review a sample for semantic improvements
- **Processing Time** - Track performance regressions

## 🐛 Troubleshooting

### Preprocessor tests fail with "undefined"
- Check if `preprocessor.js` is in the same directory as `test-harness.html`
- Open browser console for detailed errors

### LLM tests fail with CORS error
- Use a browser that allows CORS (Chrome with `--disable-web-security` flag)
- Or test via server-side script instead

### Test case missing data
- Re-capture from plugin (ensure you clicked "Send to BetterForms" first)
- Old test cases may not have all fields

## 📝 Contributing Test Cases

When adding to the test suite:

1. **Name clearly:** `testcase_button_primary_2025-01-15.json`
2. **Document edge cases:** Add comments in JSON (if tools support)
3. **Categorize:** Organize fixtures by type (simple/complex/edge-cases)
4. **Keep small:** Focus on specific scenarios, not entire pages

## 🎓 Next Steps

- [ ] Add automated visual diff for rendered HTML
- [ ] Integrate with CI/CD pipeline
- [ ] Add test coverage metrics dashboard
- [ ] Support for A/B testing prompts
- [ ] Mock LLM responses for faster iteration


