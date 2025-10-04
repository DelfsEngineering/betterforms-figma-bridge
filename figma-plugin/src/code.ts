// Show UI specified in manifest (ui.html)
figma.showUI(__html__, { width: 420, height: 520 });

// ---------- Helpers for serialization (full-ish, safe, depth-limited) ----------
function toHex(rgb: RGB): string {
	function c(v: number): string { return Math.round(v * 255).toString(16).padStart(2, '0'); }
	return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`;
}

function serializePaint(paint: Paint): any {
	const out: any = { type: paint.type };
	if (typeof (paint as any).visible === 'boolean') out.visible = (paint as any).visible;
	if (typeof (paint as any).opacity === 'number') out.opacity = (paint as any).opacity;
	if (paint.type === 'SOLID' && (paint as SolidPaint).color) {
		out.color = toHex((paint as SolidPaint).color);
	}
	if ((paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') && (paint as GradientPaint).gradientStops) {
		out.gradientStops = (paint as GradientPaint).gradientStops.map(gs => ({ position: gs.position, color: toHex(gs.color) }));
	}
	return out;
}

function serializeEffects(effects: ReadonlyArray<Effect>): any[] {
	return effects.map(e => {
		const base: any = { type: e.type, visible: (e as any).visible !== false, blendMode: (e as any).blendMode };
		if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
			const s = e as (DropShadowEffect | InnerShadowEffect);
			base.offset = s.offset;
			base.radius = s.radius;
			base.spread = (s as any).spread;
			base.color = s.color ? toHex(s.color) : undefined;
		}
		if (e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR') {
			base.radius = (e as BlurEffect).radius;
		}
		return base;
	});
}

function serializeNode(node: SceneNode, depth: number): any {
	const out: any = {
		id: node.id,
		name: node.name,
		type: node.type,
		visible: (node as any).visible !== false,
		locked: (node as any).locked === true
	};

	if ('width' in node && 'height' in node) {
		out.size = { w: (node as any).width, h: (node as any).height };
	}
	out.absoluteTransform = node.absoluteTransform;
	if (typeof (node as any).rotation === 'number') out.rotation = (node as any).rotation;

	if ('constraints' in node) {
		out.constraints = (node as any).constraints;
	}

	if ('layoutMode' in (node as any)) {
		out.autolayout = {
			direction: (node as any).layoutMode,
			primaryAxisSizingMode: (node as any).primaryAxisSizingMode,
			counterAxisSizingMode: (node as any).counterAxisSizingMode,
			itemSpacing: (node as any).itemSpacing,
			padding: {
				t: (node as any).paddingTop,
				r: (node as any).paddingRight,
				b: (node as any).paddingBottom,
				l: (node as any).paddingLeft
			},
			align: {
				primary: (node as any).primaryAxisAlignItems,
				counter: (node as any).counterAxisAlignItems
			}
		};
	}

	if ('fills' in (node as any) && Array.isArray((node as any).fills)) {
		try { out.fills = ((node as any).fills as ReadonlyArray<Paint>).map(serializePaint); } catch {}
	}
	if ('strokes' in (node as any) && Array.isArray((node as any).strokes)) {
		try {
			out.strokes = ((node as any).strokes as ReadonlyArray<Paint>).map(serializePaint);
			if (typeof (node as any).strokeWeight === 'number') out.strokeWeight = (node as any).strokeWeight;
			if (typeof (node as any).strokeAlign === 'string') out.strokeAlign = (node as any).strokeAlign;
		} catch {}
	}
	if ('effects' in (node as any) && Array.isArray((node as any).effects)) {
		try { out.effects = serializeEffects((node as any).effects as ReadonlyArray<Effect>); } catch {}
	}

	if (node.type === 'TEXT') {
		const t = node as TextNode;
		out.characters = t.characters;
		const textStyle: any = {};
		if (typeof t.fontSize === 'number') textStyle.fontSize = t.fontSize; else textStyle.fontSize = 'mixed';
		if (typeof (t as any).fontName === 'object') textStyle.fontName = (t as any).fontName; else textStyle.fontName = 'mixed';
		if (typeof t.textAlignHorizontal === 'string') textStyle.alignH = t.textAlignHorizontal;
		if (typeof t.textAlignVertical === 'string') textStyle.alignV = t.textAlignVertical;
		if (typeof t.textAutoResize === 'string') textStyle.autoResize = t.textAutoResize;
		if (typeof t.letterSpacing === 'object') textStyle.letterSpacing = t.letterSpacing;
		if (typeof t.lineHeight === 'object' || typeof t.lineHeight === 'number') textStyle.lineHeight = t.lineHeight as any;
		out.textStyle = textStyle;
	}

	if ('cornerRadius' in (node as any)) {
		const cr: any = (node as any).cornerRadius;
		if (typeof cr === 'number') out.cornerRadius = cr;
		if (typeof (node as any).topLeftRadius === 'number') {
			out.cornerRadiusPerCorner = {
				tl: (node as any).topLeftRadius,
				tr: (node as any).topRightRadius,
				br: (node as any).bottomRightRadius,
				bl: (node as any).bottomLeftRadius
			};
		}
	}

	if (depth > 0 && 'children' in (node as any) && Array.isArray((node as any).children)) {
		const kids = (node as any).children as ReadonlyArray<SceneNode>;
		out.children = kids.slice(0, 200).map(c => serializeNode(c, depth - 1));
	}

	return out;
}

function uint8ToBase64(bytes: Uint8Array): string {
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
    const data = sel.map(n => serializeNode(n, 6));
    if (sel[0]) {
        try {
            const png = await sel[0].exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 0.25 } });
            const b64 = uint8ToBase64(png);
            (data[0] as any).previewUrl = `data:image/png;base64,${b64}`;
            console.log('Preview generated successfully, length:', b64.length);
        } catch (e) {
            console.error('Preview export failed:', e);
        }
    }
    figma.ui.postMessage({ type: 'selection.full', selection: data });
}

// On launch, load saved settings and send to UI
(async () => {
    const savedApiKey = (await figma.clientStorage.getAsync('bf.apiKey')) || (await figma.clientStorage.getAsync('bf_apiKey'));
	figma.ui.postMessage({
		type: 'init',
		apiKey: savedApiKey || ''
	});
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
        figma.ui.postMessage({ type: 'init', apiKey: savedApiKey || '' });
		return;
	}
    if (msg && msg.type === 'logout') {
		await figma.clientStorage.deleteAsync('bf.apiKey');
        await figma.clientStorage.deleteAsync('bf_apiKey');
		figma.notify('Signed out');
		figma.ui.postMessage({ type: 'init', apiKey: '' });
		return;
	}
    if (msg && msg.type === 'ui-ready') {
        const savedApiKey = (await figma.clientStorage.getAsync('bf.apiKey')) || (await figma.clientStorage.getAsync('bf_apiKey'));
        figma.ui.postMessage({ type: 'init', apiKey: savedApiKey || '' });
        await postSelectionFull();
        return;
    }
};

// Update selection JSON on changes (debounced)
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
figma.on('selectionchange', () => {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		postSelectionFull();
	}, 300);
});


