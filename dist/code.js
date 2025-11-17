"use strict";
// Show UI specified in manifest (ui.html)
figma.showUI(__html__, { width: 420, height: 520 });
// ---------- Helpers for serialization (full-ish, safe, depth-limited) ----------
function toHex(rgb) {
    function c(v) { return Math.round(v * 255).toString(16).padStart(2, '0'); }
    return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`;
}
function serializePaint(paint) {
    const out = { type: paint.type };
    if (typeof paint.visible === 'boolean')
        out.visible = paint.visible;
    if (typeof paint.opacity === 'number')
        out.opacity = paint.opacity;
    if (paint.type === 'SOLID' && paint.color) {
        out.color = toHex(paint.color);
    }
    if ((paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') && paint.gradientStops) {
        out.gradientStops = paint.gradientStops.map(gs => ({ position: gs.position, color: toHex(gs.color) }));
    }
    if (paint.type === 'IMAGE') {
        const img = paint;
        if (img.imageHash)
            out.imageHash = img.imageHash;
        if (img.scaleMode)
            out.scaleMode = img.scaleMode;
    }
    return out;
}
function serializeEffects(effects) {
    return effects.map(e => {
        const base = { type: e.type, visible: e.visible !== false, blendMode: e.blendMode };
        if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
            const s = e;
            base.offset = s.offset;
            base.radius = s.radius;
            base.spread = s.spread;
            base.color = s.color ? toHex(s.color) : undefined;
        }
        if (e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR') {
            base.radius = e.radius;
        }
        return base;
    });
}
async function serializeNode(node, depth) {
    var _a;
    const out = {
        id: node.id,
        name: node.name,
        type: node.type,
        visible: node.visible !== false,
        locked: node.locked === true
    };
    // Mark whether this node is directly under the page (top-level frame/component/etc.)
    out.isTopLevel = !!(node.parent && node.parent.type === 'PAGE');
    if ('width' in node && 'height' in node) {
        out.size = { w: node.width, h: node.height };
    }
    out.absoluteTransform = node.absoluteTransform;
    if (typeof node.rotation === 'number')
        out.rotation = node.rotation;
    if ('constraints' in node) {
        out.constraints = node.constraints;
    }
    // Capture node-level opacity (separate from fill opacity)
    if ('opacity' in node && typeof node.opacity === 'number') {
        out.opacity = node.opacity;
    }
    // Capture layout sizing for flex-grow detection
    if ('layoutGrow' in node)
        out.layoutGrow = node.layoutGrow;
    if ('layoutAlign' in node)
        out.layoutAlign = node.layoutAlign;
    if ('layoutSizingHorizontal' in node)
        out.layoutSizingHorizontal = node.layoutSizingHorizontal;
    if ('layoutSizingVertical' in node)
        out.layoutSizingVertical = node.layoutSizingVertical;
    // Capture component variant properties (for interactive states)
    if (node.type === 'INSTANCE') {
        const instanceNode = node;
        // Get component properties (variant selections like State=Hover, Type=Primary)
        if ('componentProperties' in instanceNode && instanceNode.componentProperties) {
            out.componentProperties = {};
            // Filter for interactive state properties only (not design system configs like padding/scale)
            const interactiveStateKeys = ['state', 'hover', 'active', 'disabled', 'toggle', 'pressed', 'selected', 'focus'];
            for (const [propName, propValue] of Object.entries(instanceNode.componentProperties)) {
                const keyLower = propName.toLowerCase();
                const isInteractiveState = interactiveStateKeys.some(stateKey => keyLower.includes(stateKey));
                if (isInteractiveState) {
                    out.componentProperties[propName] = {
                        type: propValue.type,
                        value: propValue.value
                    };
                }
            }
        }
        // Only capture variant combinations if there are interactive state properties
        if (out.componentProperties && Object.keys(out.componentProperties).length > 0) {
            const mainComponent = instanceNode.mainComponent;
            if (mainComponent && 'parent' in mainComponent && ((_a = mainComponent.parent) === null || _a === void 0 ? void 0 : _a.type) === 'COMPONENT_SET') {
                const componentSet = mainComponent.parent;
                out.componentSetName = componentSet.name;
                // Get unique combinations of ONLY interactive state properties
                const stateVariants = new Set();
                for (const variant of componentSet.children) {
                    if (variant.type === 'COMPONENT') {
                        const componentVariant = variant;
                        if ('variantProperties' in componentVariant && componentVariant.variantProperties) {
                            // Extract only interactive state properties
                            const stateProps = {};
                            for (const [key, value] of Object.entries(componentVariant.variantProperties)) {
                                if (out.componentProperties[key]) {
                                    stateProps[key] = value;
                                }
                            }
                            // Create a stable key for this state combination
                            const stateKey = JSON.stringify(stateProps);
                            if (!stateVariants.has(stateKey)) {
                                stateVariants.add(stateKey);
                            }
                        }
                    }
                }
                // Convert back to array format
                out.availableVariants = Array.from(stateVariants).map(key => JSON.parse(key));
            }
        }
    }
    if ('layoutMode' in node) {
        out.autolayout = {
            direction: node.layoutMode,
            primaryAxisSizingMode: node.primaryAxisSizingMode,
            counterAxisSizingMode: node.counterAxisSizingMode,
            itemSpacing: node.itemSpacing,
            padding: {
                t: node.paddingTop,
                r: node.paddingRight,
                b: node.paddingBottom,
                l: node.paddingLeft
            },
            align: {
                primary: node.primaryAxisAlignItems,
                counter: node.counterAxisAlignItems
            }
        };
    }
    if ('fills' in node && Array.isArray(node.fills)) {
        try {
            out.fills = node.fills.map(serializePaint);
        }
        catch (_b) { }
    }
    if ('strokes' in node && Array.isArray(node.strokes)) {
        try {
            out.strokes = node.strokes.map(serializePaint);
            // Export strokeWeight - check individual side weights first, then general strokeWeight
            const n = node;
            if (typeof n.strokeBottomWeight === 'number')
                out.strokeWeight = n.strokeBottomWeight;
            else if (typeof n.strokeTopWeight === 'number')
                out.strokeWeight = n.strokeTopWeight;
            else if (typeof n.strokeLeftWeight === 'number')
                out.strokeWeight = n.strokeLeftWeight;
            else if (typeof n.strokeRightWeight === 'number')
                out.strokeWeight = n.strokeRightWeight;
            else if (typeof n.strokeWeight === 'number')
                out.strokeWeight = n.strokeWeight;
            else
                out.strokeWeight = 1; // Fallback
            if (typeof node.strokeAlign === 'string')
                out.strokeAlign = node.strokeAlign;
        }
        catch (_c) { }
    }
    if ('effects' in node && Array.isArray(node.effects)) {
        try {
            out.effects = serializeEffects(node.effects);
        }
        catch (_d) { }
    }
    if (node.type === 'TEXT') {
        const t = node;
        out.characters = t.characters;
        const textStyle = {};
        if (typeof t.fontSize === 'number')
            textStyle.fontSize = t.fontSize;
        else
            textStyle.fontSize = 'mixed';
        if (typeof t.fontName === 'object')
            textStyle.fontName = t.fontName;
        else
            textStyle.fontName = 'mixed';
        if (typeof t.textAlignHorizontal === 'string')
            textStyle.alignH = t.textAlignHorizontal;
        if (typeof t.textAlignVertical === 'string')
            textStyle.alignV = t.textAlignVertical;
        if (typeof t.textAutoResize === 'string')
            textStyle.autoResize = t.textAutoResize;
        if (typeof t.letterSpacing === 'object')
            textStyle.letterSpacing = t.letterSpacing;
        if (typeof t.lineHeight === 'object' || typeof t.lineHeight === 'number')
            textStyle.lineHeight = t.lineHeight;
        out.textStyle = textStyle;
    }
    // Export vectors and groups as SVG (will be used as type: "html" in BetterForms)
    // GROUPs are better for complete icons (e.g., "ic_star")
    // VECTORs only if they have visible fills
    const shouldExportSvg = (node.type === 'GROUP' ||
        (node.type === 'VECTOR' && 'fills' in node &&
            Array.isArray(node.fills) &&
            node.fills.length > 0));
    if (shouldExportSvg && 'exportAsync' in node) {
        try {
            const svgBytes = await node.exportAsync({
                format: 'SVG',
                svgIdAttribute: true
            });
            // Convert Uint8Array to string without TextDecoder (not available in Figma sandbox)
            let svgString = '';
            for (let i = 0; i < svgBytes.length; i++) {
                svgString += String.fromCharCode(svgBytes[i]);
            }
            out.svg = svgString;
        }
        catch (e) {
            console.warn('SVG export failed for:', node.name, e);
        }
    }
    if ('cornerRadius' in node) {
        const cr = node.cornerRadius;
        if (typeof cr === 'number')
            out.cornerRadius = cr;
        if (typeof node.topLeftRadius === 'number') {
            out.cornerRadiusPerCorner = {
                tl: node.topLeftRadius,
                tr: node.topRightRadius,
                br: node.bottomRightRadius,
                bl: node.bottomLeftRadius
            };
        }
    }
    if (depth > 0 && 'children' in node && Array.isArray(node.children)) {
        const kids = node.children;
        out.children = await Promise.all(kids.slice(0, 200).map(c => serializeNode(c, depth - 1)));
    }
    return out;
}
function uint8ToBase64(bytes) {
    const base64abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = '', i;
    const l = bytes.length;
    for (i = 2; i < l; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3F];
    }
    if (i === l + 1) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[(bytes[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[(bytes[i - 1] & 0x0F) << 2];
        result += "=";
    }
    return result;
}
async function postSelectionFull() {
    const sel = figma.currentPage.selection;
    // Notify UI that we're starting (show loading spinner)
    if (sel.length > 0) {
        figma.ui.postMessage({ type: 'selection.loading' });
        // Brief delay to allow UI to render spinner before heavy export work
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    const data = await Promise.all(sel.map(n => serializeNode(n, 6)));
    if (sel[0]) {
        try {
            const node = sel[0];
            const exportNode = node;
            const w = exportNode.width;
            const h = exportNode.height;
            // Generate a higher‑quality preview by targeting a larger longest edge.
            // This improves visual crispness in the ~400px tall preview panel.
            // 1400px provides good quality while keeping export speed reasonable.
            const targetLongestPx = 1400;
            let constraint = { type: 'SCALE', value: 3 };
            if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
                if (w >= h) {
                    constraint = { type: 'WIDTH', value: targetLongestPx };
                }
                else {
                    constraint = { type: 'HEIGHT', value: targetLongestPx };
                }
            }
            // Additionally export a small thumbnail for downstream apps (e.g., BetterForms UI lists).
            // Strategy:
            // - For tiny nodes (<= 180px on longest edge), export at 2x for sharpness
            // - Otherwise clamp longest edge to ~360px to keep file size small
            const targetThumbLongestPx = 100;
            let thumbConstraint = { type: 'SCALE', value: 1 };
            if (typeof w === 'number' && typeof h === 'number') {
                if (w >= h)
                    thumbConstraint = { type: 'WIDTH', value: targetThumbLongestPx };
                else
                    thumbConstraint = { type: 'HEIGHT', value: targetThumbLongestPx };
            }
            const png = await exportNode.exportAsync({ format: 'PNG', constraint });
            const b64 = uint8ToBase64(png);
            data[0].previewUrl = `data:image/png;base64,${b64}`;
            // Export thumbnail
            try {
                const thumbPng = await exportNode.exportAsync({ format: 'PNG', constraint: thumbConstraint });
                const thumbB64 = uint8ToBase64(thumbPng);
                data[0].thumbnailUrl = `data:image/png;base64,${thumbB64}`;
            }
            catch (thumbErr) {
                console.warn('Thumbnail export failed:', thumbErr);
            }
        }
        catch (e) {
            console.error('Preview export failed:', e);
        }
    }
    figma.ui.postMessage({ type: 'selection.full', selection: data });
}
// On launch, load saved settings and send to UI
(async () => {
    const savedApiKey = (await figma.clientStorage.getAsync('bf.apiKey')) || (await figma.clientStorage.getAsync('bf_apiKey'));
    const preprocessEnabled = await figma.clientStorage.getAsync('bf.preprocessing.enabled');
    const preprocessMode = await figma.clientStorage.getAsync('bf.preprocessing.mode');
    const stripAllSvg = await figma.clientStorage.getAsync('bf.export.stripAllSvg');
    const outerElementFullWidth = await figma.clientStorage.getAsync('bf.export.outerElementFullWidth');
    const stripRedundantChildFills = await figma.clientStorage.getAsync('bf.export.stripRedundantChildFills');
    const applyOverflowHidden = await figma.clientStorage.getAsync('bf.export.applyOverflowHidden');
    figma.ui.postMessage({
        type: 'init',
        apiKey: savedApiKey || '',
        preprocessEnabled: preprocessEnabled !== false,
        preprocessMode: preprocessMode || 'auto',
        stripAllSvg: stripAllSvg === true,
        outerElementFullWidth: outerElementFullWidth !== false,
        stripRedundantChildFills: stripRedundantChildFills !== false,
        applyOverflowHidden: applyOverflowHidden !== false
    });
    // Send initial selection (if any)
    if (figma.currentPage.selection.length > 0) {
        figma.ui.postMessage({ type: 'selection.loading' });
    }
    postSelectionFull();
})();
// Handle UI messages
figma.ui.onmessage = async (msg) => {
    if (msg && msg.type === 'save-settings') {
        if (typeof msg.apiKey === 'string') {
            await figma.clientStorage.setAsync('bf.apiKey', msg.apiKey);
            await figma.clientStorage.setAsync('bf_apiKey', msg.apiKey);
        }
        figma.notify('Settings saved');
        const savedApiKey = (await figma.clientStorage.getAsync('bf.apiKey')) || (await figma.clientStorage.getAsync('bf_apiKey'));
        const preprocessEnabled = await figma.clientStorage.getAsync('bf.preprocessing.enabled');
        const preprocessMode = await figma.clientStorage.getAsync('bf.preprocessing.mode');
        const stripAllSvg = await figma.clientStorage.getAsync('bf.export.stripAllSvg');
        const outerElementFullWidth = await figma.clientStorage.getAsync('bf.export.outerElementFullWidth');
        const stripRedundantChildFills = await figma.clientStorage.getAsync('bf.export.stripRedundantChildFills');
        const applyOverflowHidden = await figma.clientStorage.getAsync('bf.export.applyOverflowHidden');
        figma.ui.postMessage({
            type: 'init',
            apiKey: savedApiKey || '',
            preprocessEnabled: preprocessEnabled !== false,
            preprocessMode: preprocessMode || 'auto',
            stripAllSvg: stripAllSvg === true,
            outerElementFullWidth: outerElementFullWidth !== false,
            stripRedundantChildFills: stripRedundantChildFills !== false,
            applyOverflowHidden: applyOverflowHidden !== false
        });
        return;
    }
    if (msg && msg.type === 'save-preprocessing') {
        await figma.clientStorage.setAsync('bf.preprocessing.enabled', msg.enabled);
        await figma.clientStorage.setAsync('bf.preprocessing.mode', msg.mode);
        figma.notify('Preprocessing settings saved');
        return;
    }
    if (msg && msg.type === 'save-dev-mode') {
        await figma.clientStorage.setAsync('bf.devMode', msg.devMode);
        figma.notify(msg.devMode ? 'Developer mode enabled' : 'Developer mode disabled');
        return;
    }
    if (msg && msg.type === 'save-export-settings') {
        await figma.clientStorage.setAsync('bf.export.stripAllSvg', msg.stripAllSvg);
        await figma.clientStorage.setAsync('bf.export.outerElementFullWidth', msg.outerElementFullWidth);
        await figma.clientStorage.setAsync('bf.export.stripRedundantChildFills', msg.stripRedundantChildFills);
        await figma.clientStorage.setAsync('bf.export.applyOverflowHidden', msg.applyOverflowHidden);
        figma.notify('Export settings saved');
        return;
    }
    if (msg && msg.type === 'logout') {
        await figma.clientStorage.deleteAsync('bf.apiKey');
        await figma.clientStorage.deleteAsync('bf_apiKey');
        figma.notify('Signed out');
        const preprocessEnabled = await figma.clientStorage.getAsync('bf.preprocessing.enabled');
        const preprocessMode = await figma.clientStorage.getAsync('bf.preprocessing.mode');
        const stripAllSvg = await figma.clientStorage.getAsync('bf.export.stripAllSvg');
        const outerElementFullWidth = await figma.clientStorage.getAsync('bf.export.outerElementFullWidth');
        const stripRedundantChildFills = await figma.clientStorage.getAsync('bf.export.stripRedundantChildFills');
        const applyOverflowHidden = await figma.clientStorage.getAsync('bf.export.applyOverflowHidden');
        figma.ui.postMessage({
            type: 'init',
            apiKey: '',
            preprocessEnabled: preprocessEnabled !== false,
            preprocessMode: preprocessMode || 'auto',
            stripAllSvg: stripAllSvg === true,
            outerElementFullWidth: outerElementFullWidth !== false,
            stripRedundantChildFills: stripRedundantChildFills !== false,
            applyOverflowHidden: applyOverflowHidden !== false
        });
        return;
    }
    if (msg && msg.type === 'ui-ready') {
        const savedApiKey = (await figma.clientStorage.getAsync('bf.apiKey')) || (await figma.clientStorage.getAsync('bf_apiKey'));
        const preprocessEnabled = await figma.clientStorage.getAsync('bf.preprocessing.enabled');
        const preprocessMode = await figma.clientStorage.getAsync('bf.preprocessing.mode');
        const stripAllSvg = await figma.clientStorage.getAsync('bf.export.stripAllSvg');
        const outerElementFullWidth = await figma.clientStorage.getAsync('bf.export.outerElementFullWidth');
        const stripRedundantChildFills = await figma.clientStorage.getAsync('bf.export.stripRedundantChildFills');
        const applyOverflowHidden = await figma.clientStorage.getAsync('bf.export.applyOverflowHidden');
        const devMode = await figma.clientStorage.getAsync('bf.devMode');
        figma.ui.postMessage({
            type: 'init',
            apiKey: savedApiKey || '',
            preprocessEnabled: preprocessEnabled !== false,
            preprocessMode: preprocessMode || 'auto',
            stripAllSvg: stripAllSvg === true,
            outerElementFullWidth: outerElementFullWidth !== false,
            stripRedundantChildFills: stripRedundantChildFills !== false,
            applyOverflowHidden: applyOverflowHidden !== false,
            devMode: devMode === true
        });
        // Send loading message if there's a selection
        if (figma.currentPage.selection.length > 0) {
            figma.ui.postMessage({ type: 'selection.loading' });
        }
        await postSelectionFull();
        return;
    }
};
// Update selection JSON on changes (debounced)
let debounceTimer = null;
figma.on('selectionchange', () => {
    if (debounceTimer)
        clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        // Notify UI we're starting (show loading spinner)
        figma.ui.postMessage({ type: 'selection.loading' });
        await postSelectionFull();
    }, 300);
});
