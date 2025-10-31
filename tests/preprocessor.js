// Figma2BF Preprocessor - Standalone version for testing
// This file contains the same preprocessor logic as ui.html

/**
 * Preprocess Figma selection data to generate draft BetterForms schema
 * @param {Array} selectionData - Figma node tree
 * @param {Object} tokens - Design tokens (all + used)
 * @param {string} elementName - Optional element name override
 * @returns {Promise<Object>} { success, normalizedData, draftSchema, meta, error }
 */
async function preprocessSelection(selectionData, tokens, elementName = '') {
  const startTime = Date.now()
  
  try {
    // Flatten all nodes for complexity analysis
    const allNodes = flattenNodes(selectionData)
    
    // Calculate complexity metrics
    const metrics = calculateComplexityMetrics(allNodes)
    const complexityScore = calculateComplexityScore(metrics)
    
    // Always generate draft schema - let the caller decide whether to use it
    const issues = []
    const draftSchema = generateDraftSchema(selectionData, tokens, issues, elementName)
    
    // Recommend a route based on complexity (for 'auto' mode)
    const recommendedRoute = complexityScore <= 40 ? 'pre' : 'raw'
    
    // Normalize data
    const normalizedData = normalizeData(selectionData)
    
    const processingTime = Date.now() - startTime
    
    return {
      success: true,
      normalizedData,
      draftSchema,
      meta: {
        version: '0.1.0',
        complexityScore,
        metrics,
        issues,
        recommendedRoute,
        processingTime
      }
    }
  } catch (error) {
    console.error('Preprocessing failed:', error)
    return {
      success: false,
      error: error.message,
      normalizedData: selectionData,
      draftSchema: null,
      meta: null
    }
  }
}

function flattenNodes(nodes, result = []) {
  if (!Array.isArray(nodes)) return result
  
  for (const node of nodes) {
    if (!node) continue
    result.push(node)
    if (node.children && Array.isArray(node.children)) {
      flattenNodes(node.children, result)
    }
  }
  
  return result
}

function calculateComplexityMetrics(allNodes) {
  const metrics = {
    elementCount: allNodes.length,
    absoluteCount: 0,
    gradientsCount: 0,
    vectorsCount: 0,
    multiEffectsCount: 0,
    instancesCount: 0
  }
  
  for (const node of allNodes) {
    // Check for absolute positioning
    if (node.constraints && node.constraints.horizontal === 'ABSOLUTE') {
      metrics.absoluteCount++
    }
    
    // Check for gradients
    if (node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type && fill.type.includes('GRADIENT')) {
          metrics.gradientsCount++
          break
        }
      }
    }
    
    // Check for vectors
    if (node.type === 'VECTOR') {
      metrics.vectorsCount++
    }
    
    // Check for multiple effects (shadows, blurs)
    if (node.effects && Array.isArray(node.effects) && node.effects.length > 2) {
      metrics.multiEffectsCount++
    }
    
    // Check for instances
    if (node.type === 'INSTANCE') {
      metrics.instancesCount++
    }
  }
  
  return metrics
}

function calculateComplexityScore(metrics) {
  const score = 
    metrics.elementCount * 0.5 +
    metrics.absoluteCount * 2 +
    metrics.gradientsCount * 3 +
    metrics.vectorsCount * 1.5 +
    metrics.multiEffectsCount * 2 +
    metrics.instancesCount * 1
  
  return Math.min(100, Math.round(score))
}

function normalizeData(data) {
  // For now, just return a deep clone
  // Future: normalize colors, round numbers, etc.
  return JSON.parse(JSON.stringify(data))
}

function generateDraftSchema(selectionData, tokens, issues, elementName = '') {
  if (!selectionData || selectionData.length === 0) return null
  
  const rootNode = selectionData[0]
  
  // Process the root node
  const rootFields = processNodeToFields(rootNode, tokens, issues)
  
  // If elementName override is provided, set it on the root element
  if (elementName && rootFields.length > 0) {
    // Convert to lowercase with underscores
    const bfName = elementName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    rootFields[0].BFName = bfName
  }
  
  // Generate BetterForms schema
  const schema = {
    pages: [{
      schema: {
        fields: rootFields
      }
    }],
    model: {},
    options: {}
  }
  
  return schema
}

function processNodeToFields(node, tokens, issues) {
  if (!node) return []
  
  const fields = []
  
  // Process based on node type
  if (node.type === 'TEXT') {
    fields.push(processTextNode(node, tokens, issues))
  } else if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'INSTANCE') {
    fields.push(processContainerNode(node, tokens, issues))
  } else if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'VECTOR') {
    fields.push(processShapeNode(node, tokens, issues))
  }
  
  return fields
}

function processTextNode(node, tokens, issues) {
  const field = {
    type: 'html',
    html: node.characters || '',
    styleClasses: ['mb-0'],  // Default margin override (LLM can change)
    attributes: {
      formElement: {
        'data-idbf': node.id
      }
    }
  }
  
  // Add size classes
  if (node.size) {
    field.styleClasses.push(`w-[${Math.round(node.size.w)}px]`)
    field.styleClasses.push(`h-[${Math.round(node.size.h)}px]`)
  }
  
  // Add text styles
  if (node.textStyle) {
    // Font size
    if (node.textStyle.fontSize && typeof node.textStyle.fontSize === 'number') {
      field.styleClasses.push(`text-[${Math.round(node.textStyle.fontSize)}px]`)
    }
    
    // Font weight - Figma stores as string in fontName.style
    if (node.textStyle.fontName && node.textStyle.fontName.style) {
      const style = node.textStyle.fontName.style.toLowerCase()
      if (style.includes('extra bold') || style.includes('extrabold') || style.includes('black')) {
        field.styleClasses.push('font-extrabold')
      } else if (style.includes('bold')) {
        field.styleClasses.push('font-bold')
      } else if (style.includes('semibold') || style.includes('semi bold')) {
        field.styleClasses.push('font-semibold')
      } else if (style.includes('medium')) {
        field.styleClasses.push('font-medium')
      }
      // Regular/Light/Thin - no class needed (default)
    }
    
    // Store font family in a custom data attribute for LLM to use
    if (node.textStyle.fontName && node.textStyle.fontName.family) {
      field.attributes.formElement['data-figma-font'] = node.textStyle.fontName.family
    }
  }
  
  // Add TEXT COLOR (not background)
  const textColor = getTextColor(node, tokens)
  if (textColor) field.styleClasses.push(textColor)
  
  field.styleClasses = field.styleClasses.join(' ')
  
  return field
}

function processContainerNode(node, tokens, issues) {
  // Check if this GROUP has SVG export (e.g., icon groups like "ic_star")
  if (node.type === 'GROUP' && node.svg) {
    // Return as SVG using type: "html"
    const field = {
      type: 'html',  // SVG uses type: "html"
      html: node.svg,
      styleClasses: ['mb-0']  // Default margin override (LLM can change)
    }
    
    // Add size classes if available
    if (node.size) {
      field.styleClasses.push(`w-[${Math.round(node.size.w)}px]`)
      field.styleClasses.push(`h-[${Math.round(node.size.h)}px]`)
    }
    
    field.styleClasses = field.styleClasses.join(' ')
    return field
  }
  
  const field = {
    type: 'group',
    label: node.name || 'Container',
    styleClasses: ['mb-0'],  // Default margin override (LLM can change)
    schema: {
      fields: []
    }
  }
  
  // Add data-idbf attribute
  field.attributes = {
    'data-idbf': node.id
  }
  
  // Process autolayout
  if (node.autolayout && node.autolayout.direction) {
    const direction = node.autolayout.direction
    
    // Only add flex classes if has actual autolayout direction
    if (direction === 'HORIZONTAL') {
      field.styleClasses.push('flex', 'flex-row')
      
      // Add gap (Figma stores as itemSpacing)
      const gap = node.autolayout.itemSpacing || node.autolayout.gap
      if (gap) {
        field.styleClasses.push(`gap-[${Math.round(gap)}px]`)
      }
      
      // Add alignment
      if (node.autolayout.align && node.autolayout.align.counter) {
        const counterAlign = node.autolayout.align.counter
        if (counterAlign === 'CENTER') field.styleClasses.push('items-center')
        else if (counterAlign === 'MAX') field.styleClasses.push('items-end')
        // MIN is default (items-start)
      }
    } else if (direction === 'VERTICAL') {
      field.styleClasses.push('flex', 'flex-col')
      
      // Add gap (Figma stores as itemSpacing)
      const gap = node.autolayout.itemSpacing || node.autolayout.gap
      if (gap) {
        field.styleClasses.push(`gap-[${Math.round(gap)}px]`)
      }
      
      // Add alignment
      if (node.autolayout.align && node.autolayout.align.counter) {
        const counterAlign = node.autolayout.align.counter
        if (counterAlign === 'CENTER') field.styleClasses.push('items-center')
        else if (counterAlign === 'MAX') field.styleClasses.push('items-end')
        // MIN is default (items-start)
      }
    } else if (direction === 'NONE') {
      // No autolayout - note for LLM
      issues.push(`No autolayout on "${node.name}" - LLM should determine positioning strategy`)
    }
    
    // Add padding (regardless of direction)
    if (node.autolayout.padding) {
      const p = node.autolayout.padding
      // Only add padding if it's not all zeros
      if (p.t !== 0 || p.r !== 0 || p.b !== 0 || p.l !== 0) {
        if (p.t === p.r && p.r === p.b && p.b === p.l) {
          field.styleClasses.push(`p-[${Math.round(p.t)}px]`)
        } else {
          if (p.t !== 0) field.styleClasses.push(`pt-[${Math.round(p.t)}px]`)
          if (p.r !== 0) field.styleClasses.push(`pr-[${Math.round(p.r)}px]`)
          if (p.b !== 0) field.styleClasses.push(`pb-[${Math.round(p.b)}px]`)
          if (p.l !== 0) field.styleClasses.push(`pl-[${Math.round(p.l)}px]`)
        }
      }
    }
  }
  
  // Add size - check for FILL sizing mode to use flex-1
  if (node.size) {
    // Check if width should be flexible (FILL mode)
    if (node.layoutSizingHorizontal === 'FILL' || node.layoutGrow === 1) {
      field.styleClasses.push('flex-1')
      // Only add height, not width
      field.styleClasses.push(`h-[${Math.round(node.size.h)}px]`)
    } else {
      // Fixed size
      field.styleClasses.push(`w-[${Math.round(node.size.w)}px]`)
      field.styleClasses.push(`h-[${Math.round(node.size.h)}px]`)
    }
  }
  
  // Add background
  const bgClass = getBackgroundClass(node, tokens)
  if (bgClass) field.styleClasses.push(bgClass)
  
  // Add border
  const borderClasses = getBorderClasses(node, tokens)
  if (borderClasses.length > 0) {
    field.styleClasses.push(...borderClasses)
  }
  
  // Add corner radius
  const radiusClass = getCornerRadiusClass(node)
  if (radiusClass) field.styleClasses.push(radiusClass)
  
  // Check for absolute positioning
  if (node.constraints && node.constraints.horizontal === 'ABSOLUTE') {
    issues.push(`Absolute positioning on "${node.name}" - raw coordinates in absoluteTransform`)
  }
  
  // Check for complex effects
  if (node.effects && Array.isArray(node.effects) && node.effects.length > 0) {
    const visibleEffects = node.effects.filter(e => e.visible !== false)
    if (visibleEffects.length > 2) {
      issues.push(`Complex effects on "${node.name}" - raw effects data provided for LLM`)
    }
  }
  
  // Process children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const childFields = processNodeToFields(child, tokens, issues)
      field.schema.fields.push(...childFields)
    }
  }
  
  field.styleClasses = field.styleClasses.join(' ')
  
  return field
}

function processShapeNode(node, tokens, issues) {
  const field = {
    type: 'html',
    html: `<!-- ${node.type}: ${node.name} -->`,
    styleClasses: ['mb-0']  // Default margin override (LLM can change)
  }
  
  // Handle VECTOR nodes with SVG export
  if (node.type === 'VECTOR' && node.svg) {
    // Use exported SVG directly
    field.html = node.svg
    field.type = 'html' // SVG uses type: "html"
    
    // Add size classes to wrapper if needed
    if (node.size) {
      field.styleClasses.push(`w-[${Math.round(node.size.w)}px]`)
      field.styleClasses.push(`h-[${Math.round(node.size.h)}px]`)
    }
    
    field.styleClasses = field.styleClasses.join(' ')
    return field
  }
  
  // Check for IMAGE fill
  let hasImageFill = false
  if (node.fills && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === 'IMAGE') {
        hasImageFill = true
        issues.push(`IMAGE fill on "${node.name}" - LLM should convert to <img> or background-image`)
        break
      }
      if (fill.type && fill.type.includes('GRADIENT')) {
        issues.push(`GRADIENT on "${node.name}" - raw fills data provided for LLM`)
        break
      }
    }
  }
  
  // Add size - check for FILL sizing mode to use flex-1
  if (node.size) {
    // Check if width should be flexible (FILL mode)
    if (node.layoutSizingHorizontal === 'FILL' || node.layoutGrow === 1) {
      field.styleClasses.push('flex-1')
      // Only add height, not width
      field.styleClasses.push(`h-[${Math.round(node.size.h)}px]`)
    } else {
      // Fixed size
      field.styleClasses.push(`w-[${Math.round(node.size.w)}px]`)
      field.styleClasses.push(`h-[${Math.round(node.size.h)}px]`)
    }
  }
  
  // Add background (only if not IMAGE)
  if (!hasImageFill) {
    const bgClass = getBackgroundClass(node, tokens)
    if (bgClass) field.styleClasses.push(bgClass)
  }
  
  // Add border
  const borderClasses = getBorderClasses(node, tokens)
  if (borderClasses.length > 0) {
    field.styleClasses.push(...borderClasses)
  }
  
  // Add corner radius
  const radiusClass = getCornerRadiusClass(node)
  if (radiusClass) field.styleClasses.push(radiusClass)
  
  if (node.type === 'VECTOR' && !node.svg) {
    issues.push(`Vector "${node.name}" - SVG export failed, may need manual conversion`)
  }
  
  field.styleClasses = field.styleClasses.join(' ')
  
  return field
}

function getTextColor(node, tokens) {
  if (!node.fills || !Array.isArray(node.fills)) return null
  
  // Find first visible solid fill for text color
  for (const fill of node.fills) {
    if (fill.visible === false) continue
    if (fill.type !== 'SOLID') continue
    
    const color = fill.color
    if (!color) continue
    
    // Check if color matches a token
    if (tokens && tokens.used) {
      for (const token of tokens.used) {
        if (colorsMatch(color, token.value)) {
          return `text-[var(--${token.name})]`
        }
      }
    }
    
    // Return hex color
    return `text-[${color}]`
  }
  
  return null
}

function getBackgroundClass(node, tokens) {
  if (!node.fills || !Array.isArray(node.fills)) return null
  
  // Find first visible solid fill
  for (const fill of node.fills) {
    if (fill.visible === false) continue
    if (fill.type !== 'SOLID') continue
    
    const color = fill.color
    if (!color) continue
    
    // Check if color matches a token
    if (tokens && tokens.used) {
      for (const token of tokens.used) {
        if (colorsMatch(color, token.value)) {
          return `bg-[var(--${token.name})]`
        }
      }
    }
    
    // Return hex color
    return `bg-[${color}]`
  }
  
  return null
}

function getBorderClasses(node, tokens) {
  const classes = []
  
  if (!node.strokes || !Array.isArray(node.strokes) || node.strokes.length === 0) {
    return classes
  }
  
  // Add border width
  if (node.strokeWeight) {
    classes.push(`border-[${Math.round(node.strokeWeight)}px]`)
  }
  
  // Add border color
  const stroke = node.strokes[0]
  if (stroke && stroke.type === 'SOLID' && stroke.color) {
    const color = stroke.color
    
    // Check for token
    if (tokens && tokens.used) {
      for (const token of tokens.used) {
        if (colorsMatch(color, token.value)) {
          classes.push(`border-[var(--${token.name})]`)
          return classes
        }
      }
    }
    
    classes.push(`border-[${color}]`)
  }
  
  return classes
}

function getCornerRadiusClass(node) {
  if (!node.cornerRadius && typeof node.cornerRadius !== 'number') return null
  
  const radius = Math.round(node.cornerRadius)
  
  if (radius === 0) return null
  
  // Use standard Tailwind values when possible
  if (radius === 4) return 'rounded'
  if (radius === 6) return 'rounded-md'
  if (radius === 8) return 'rounded-lg'
  if (radius === 12) return 'rounded-xl'
  if (radius === 16) return 'rounded-2xl'
  if (radius === 9999) return 'rounded-full'
  
  return `rounded-[${radius}px]`
}

function colorsMatch(color1, color2) {
  // Simple string comparison for now
  return color1 === color2
}

// Export for Node.js environments (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { preprocessSelection }
}


