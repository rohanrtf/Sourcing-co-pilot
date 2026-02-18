/**
 * AI Service Abstraction Layer
 * 
 * MOCK IMPLEMENTATION for MVP
 * Replace with real OpenAI calls when ready
 * 
 * All functions are designed to be easily swappable with real AI implementations
 */

// Categories supported for deep normalization
const SUPPORTED_CATEGORIES = {
  BEARINGS: ['bearing', 'ball bearing', 'roller bearing', 'skf', 'fag', 'nsk', 'ntn', 'timken'],
  MOTORS: ['motor', 'electric motor', 'ac motor', 'dc motor', 'servo', 'gearbox'],
  VALVES: ['valve', 'gate valve', 'globe valve', 'ball valve', 'butterfly valve', 'check valve'],
  INSTRUMENTATION: ['sensor', 'gauge', 'transmitter', 'controller', 'plc'],
  GENERIC: []
}

// Detect category from description
function detectCategory(text) {
  const lowerText = text.toLowerCase()
  
  for (const [category, keywords] of Object.entries(SUPPORTED_CATEGORIES)) {
    if (category === 'GENERIC') continue
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category
      }
    }
  }
  return 'GENERIC'
}

// Parse bearing attributes from description
function parseBearingAttributes(text) {
  const attributes = {
    series: null,
    bore: null,
    outerDiameter: null,
    width: null,
    sealType: null,
    clearance: null,
    brand: null
  }
  
  // Extract bearing number pattern (e.g., 6205-2RS, 6308ZZ, NU210)
  const bearingPatterns = [
    /\b(6[0-9]{3})[-]?([2Z]{2}|2RS|RS|ZZ)?\b/i,  // Deep groove
    /\b(NU?[0-9]{3,4})\b/i,  // Cylindrical roller
    /\b(22[0-9]{2,3})\b/i,   // Spherical roller
    /\b(30[0-9]{2,3})\b/i,   // Tapered roller
  ]
  
  for (const pattern of bearingPatterns) {
    const match = text.match(pattern)
    if (match) {
      attributes.series = match[1]
      if (match[2]) {
        attributes.sealType = match[2].toUpperCase()
      }
      break
    }
  }
  
  // Extract brand
  const brands = ['SKF', 'FAG', 'NSK', 'NTN', 'TIMKEN', 'INA', 'KOYO', 'NACHI']
  for (const brand of brands) {
    if (text.toUpperCase().includes(brand)) {
      attributes.brand = brand
      break
    }
  }
  
  // Extract dimensions if present (e.g., 25x52x15)
  const dimMatch = text.match(/(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/)
  if (dimMatch) {
    attributes.bore = parseInt(dimMatch[1])
    attributes.outerDiameter = parseInt(dimMatch[2])
    attributes.width = parseInt(dimMatch[3])
  }
  
  return attributes
}

/**
 * Extract line items from uploaded file text
 * 
 * @param {string} fileText - Raw text extracted from PDF/Excel/Text input
 * @returns {Promise<Array>} - Array of extracted line items
 * 
 * TODO: Replace with OpenAI call:
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [{ role: "system", content: EXTRACTION_PROMPT }, { role: "user", content: fileText }]
 * })
 */
export async function extractIndentLines(fileText) {
  // MOCK: Simple line-by-line parsing
  const lines = fileText.split('\n').filter(line => line.trim())
  const items = []
  
  let lineNumber = 1
  for (const line of lines) {
    // Skip headers and empty lines
    if (line.toLowerCase().includes('description') || 
        line.toLowerCase().includes('item') && line.toLowerCase().includes('qty') ||
        line.trim().length < 5) {
      continue
    }
    
    // Extract quantity pattern (number followed by unit)
    const qtyMatch = line.match(/(\d+(?:\.\d+)?)\s*(nos|pcs|kg|mtr|set|pair|ltr)?/i)
    
    items.push({
      lineNumber: lineNumber++,
      rawDescription: line.trim(),
      quantity: qtyMatch ? parseFloat(qtyMatch[1]) : 1,
      unit: qtyMatch && qtyMatch[2] ? qtyMatch[2].toUpperCase() : 'NOS',
      remarks: null
    })
  }
  
  return items
}

/**
 * Normalize a single line item
 * 
 * @param {string} lineText - Raw description text
 * @returns {Promise<Object>} - Normalized item with category and attributes
 * 
 * TODO: Replace with OpenAI call for intelligent normalization
 */
export async function normalizeItem(lineText) {
  const category = detectCategory(lineText)
  let attributes = {}
  let confidence = 0.5
  
  // Clean description - remove extra spaces, normalize case
  let cleanDescription = lineText
    .replace(/\s+/g, ' ')
    .trim()
  
  // Category-specific normalization
  if (category === 'BEARINGS') {
    attributes = parseBearingAttributes(lineText)
    confidence = attributes.series ? 0.85 : 0.6
    
    // Generate cleaner description for bearings
    if (attributes.series) {
      const parts = [attributes.series]
      if (attributes.sealType) parts.push(attributes.sealType)
      if (attributes.brand) parts.unshift(attributes.brand)
      cleanDescription = parts.join(' ')
    }
  } else {
    // Generic normalization
    attributes = {
      rawCategory: category,
      keywords: lineText.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    }
    confidence = 0.4
  }
  
  return {
    category,
    cleanDescription,
    attributes,
    confidence
  }
}

/**
 * Parse quote file text into structured lines
 * 
 * @param {string} fileText - Raw text from quote file
 * @returns {Promise<Array>} - Array of parsed quote lines
 * 
 * TODO: Replace with OpenAI call for intelligent parsing
 */
export async function parseQuote(fileText) {
  const lines = fileText.split('\n').filter(line => line.trim())
  const quoteLines = []
  
  let lineNumber = 1
  for (const line of lines) {
    // Skip headers
    if (line.toLowerCase().includes('description') && 
        (line.toLowerCase().includes('price') || line.toLowerCase().includes('rate'))) {
      continue
    }
    
    // Try to extract price patterns
    const priceMatch = line.match(/(?:Rs\.?|INR|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)(?:\/\-)?/)
    const qtyMatch = line.match(/(\d+(?:\.\d+)?)\s*(nos|pcs|kg|mtr)?/i)
    
    if (priceMatch) {
      quoteLines.push({
        lineNumber: lineNumber++,
        description: line.replace(priceMatch[0], '').trim(),
        quantity: qtyMatch ? parseFloat(qtyMatch[1]) : 1,
        unit: qtyMatch && qtyMatch[2] ? qtyMatch[2].toUpperCase() : 'NOS',
        unitPrice: parseFloat(priceMatch[1].replace(/,/g, '')),
        gstPercent: 18, // Default GST
        freight: 0,
        leadTimeDays: null,
        paymentTerms: null,
        brand: null,
        origin: null
      })
    }
  }
  
  return quoteLines
}

/**
 * Match quote line to indent line using similarity
 * 
 * @param {Object} quoteLine - Quote line object
 * @param {Object} indentLine - Indent line object
 * @returns {Promise<number>} - Match score between 0 and 1
 * 
 * TODO: Replace with embedding-based similarity using OpenAI
 */
export async function matchQuoteToIndent(quoteLine, indentLine) {
  const quoteDesc = quoteLine.description.toLowerCase()
  const indentDesc = indentLine.rawDescription.toLowerCase()
  
  // Simple word overlap scoring
  const quoteWords = new Set(quoteDesc.split(/\s+/).filter(w => w.length > 2))
  const indentWords = new Set(indentDesc.split(/\s+/).filter(w => w.length > 2))
  
  let matchCount = 0
  for (const word of quoteWords) {
    if (indentWords.has(word)) matchCount++
  }
  
  const totalWords = Math.max(quoteWords.size, indentWords.size)
  if (totalWords === 0) return 0
  
  return matchCount / totalWords
}

/**
 * Generate RFQ email content
 * 
 * @param {Object} rfq - RFQ object with indent lines
 * @param {Object} vendor - Vendor object
 * @returns {Promise<Object>} - { subject, body }
 */
export async function generateRFQEmail(rfq, vendor, indentLines) {
  const subject = `RFQ ${rfq.rfqNumber}: ${rfq.title}`
  
  const itemsList = indentLines.map((line, idx) => 
    `${idx + 1}. ${line.rawDescription} - Qty: ${line.quantity} ${line.unit}`
  ).join('\n')
  
  const body = `Dear ${vendor.name},

We are pleased to send you the following Request for Quotation.

RFQ Number: ${rfq.rfqNumber}
Title: ${rfq.title}
${rfq.dueDate ? `Due Date: ${new Date(rfq.dueDate).toLocaleDateString()}` : ''}

Items Required:
${itemsList}

Please provide your best quote with the following details:
- Unit Price
- GST %
- Freight charges (if any)
- Lead time
- Payment terms
- Brand/Make

Kindly respond at the earliest.

Best regards,
Purchase Team`

  return { subject, body }
}

export default {
  extractIndentLines,
  normalizeItem,
  parseQuote,
  matchQuoteToIndent,
  generateRFQEmail
}
