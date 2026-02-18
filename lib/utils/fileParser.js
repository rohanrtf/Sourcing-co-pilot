/**
 * File Parser Utilities
 * 
 * Handles PDF, Excel, and Text file parsing
 */

import * as XLSX from 'xlsx'

/**
 * Parse Excel file buffer to text
 */
export function parseExcelToText(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const lines = []
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      
      for (const row of data) {
        if (Array.isArray(row) && row.length > 0) {
          lines.push(row.filter(cell => cell !== null && cell !== undefined).join(' | '))
        }
      }
    }
    
    return lines.join('\n')
  } catch (error) {
    console.error('Excel parsing error:', error)
    throw new Error('Failed to parse Excel file')
  }
}

/**
 * Parse PDF buffer to text (simplified - uses raw text extraction)
 * 
 * Note: For production, consider using pdf-parse or similar library
 */
export async function parsePdfToText(buffer) {
  try {
    // Dynamic import for pdf-parse (handles server-side only)
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    console.error('PDF parsing error:', error)
    // Fallback: return empty string if pdf-parse fails
    return ''
  }
}

/**
 * Detect file type from filename or MIME type
 */
export function detectFileType(filename, mimeType) {
  const ext = filename?.split('.').pop()?.toLowerCase()
  
  if (ext === 'xlsx' || ext === 'xls' || mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return 'excel'
  }
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf'
  }
  if (ext === 'txt' || ext === 'csv' || mimeType?.startsWith('text/')) {
    return 'text'
  }
  
  return 'unknown'
}

/**
 * Parse file buffer based on type
 */
export async function parseFile(buffer, filename, mimeType) {
  const fileType = detectFileType(filename, mimeType)
  
  switch (fileType) {
    case 'excel':
      return parseExcelToText(buffer)
    case 'pdf':
      return await parsePdfToText(buffer)
    case 'text':
      return buffer.toString('utf-8')
    default:
      throw new Error(`Unsupported file type: ${filename}`)
  }
}

/**
 * Generate indent number
 */
export function generateIndentNumber(prefix = 'IND') {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${year}${month}-${random}`
}

/**
 * Generate RFQ number
 */
export function generateRFQNumber(prefix = 'RFQ') {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${year}${month}-${random}`
}

/**
 * Calculate landed cost
 */
export function calculateLandedCost(unitPrice, quantity, gstPercent = 18, freight = 0) {
  const baseAmount = unitPrice * quantity
  const gstAmount = baseAmount * (gstPercent / 100)
  return baseAmount + gstAmount + freight
}

export default {
  parseExcelToText,
  parsePdfToText,
  detectFileType,
  parseFile,
  generateIndentNumber,
  generateRFQNumber,
  calculateLandedCost
}
