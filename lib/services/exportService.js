/**
 * Excel Export Service
 * 
 * Generates Excel files for comparison reports and other exports
 */

import * as XLSX from 'xlsx'

/**
 * Generate comparison report as Excel workbook
 * 
 * @param {Object} comparisonData - Comparison data from API
 * @param {Object} indent - Indent details
 * @returns {Buffer} - Excel file buffer
 */
export function generateComparisonExcel(comparisonData, indent) {
  const workbook = XLSX.utils.book_new()
  
  // Get unique vendors
  const vendorMap = new Map()
  comparisonData.comparison.forEach(line => {
    Object.entries(line.vendors || {}).forEach(([vendorId, data]) => {
      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, data.vendorName)
      }
    })
  })
  const vendors = Array.from(vendorMap.entries())

  // === Sheet 1: Summary ===
  const summaryData = [
    ['COMPARISON REPORT'],
    [''],
    ['Indent Number', indent.indentNumber || ''],
    ['Indent Title', indent.title || ''],
    ['Generated On', new Date().toLocaleString()],
    ['Total Line Items', comparisonData.comparison.length],
    ['Vendors Compared', vendors.length],
    ['']
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // === Sheet 2: Detailed Comparison ===
  // Build header row
  const headers = ['Line #', 'Description', 'Qty', 'Unit']
  vendors.forEach(([vendorId, vendorName]) => {
    headers.push(`${vendorName} - Unit Price`)
    headers.push(`${vendorName} - GST %`)
    headers.push(`${vendorName} - Freight`)
    headers.push(`${vendorName} - Landed Cost`)
    headers.push(`${vendorName} - Lead Time`)
    headers.push(`${vendorName} - Payment Terms`)
    headers.push(`${vendorName} - Brand`)
  })
  headers.push('Best Vendor (Cost)')
  headers.push('Lowest Cost')

  // Build data rows
  const detailRows = [headers]
  
  comparisonData.comparison.forEach(line => {
    const row = [
      line.lineNumber,
      line.description,
      line.quantity,
      line.unit
    ]

    let lowestCost = Infinity
    let bestVendor = ''

    vendors.forEach(([vendorId, vendorName]) => {
      const vendorData = line.vendors?.[vendorId]
      if (vendorData) {
        row.push(vendorData.unitPrice || '')
        row.push(vendorData.gstPercent || '')
        row.push(vendorData.freight || 0)
        row.push(vendorData.landedCost || '')
        row.push(vendorData.leadTimeDays ? `${vendorData.leadTimeDays} days` : '')
        row.push(vendorData.paymentTerms || '')
        row.push(vendorData.brand || '')

        if (vendorData.landedCost && vendorData.landedCost < lowestCost) {
          lowestCost = vendorData.landedCost
          bestVendor = vendorName
        }
      } else {
        row.push('', '', '', '', '', '', '') // Empty cells for vendor without quote
      }
    })

    row.push(bestVendor || 'N/A')
    row.push(lowestCost === Infinity ? 'N/A' : lowestCost)

    detailRows.push(row)
  })

  const detailSheet = XLSX.utils.aoa_to_sheet(detailRows)
  
  // Set column widths
  detailSheet['!cols'] = [
    { wch: 8 },   // Line #
    { wch: 40 },  // Description
    { wch: 8 },   // Qty
    { wch: 8 },   // Unit
    ...vendors.flatMap(() => [
      { wch: 12 }, // Unit Price
      { wch: 8 },  // GST
      { wch: 10 }, // Freight
      { wch: 14 }, // Landed Cost
      { wch: 12 }, // Lead Time
      { wch: 15 }, // Payment Terms
      { wch: 12 }, // Brand
    ]),
    { wch: 18 },  // Best Vendor
    { wch: 14 },  // Lowest Cost
  ]

  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed Comparison')

  // === Sheet 3: Vendor Summary ===
  const vendorSummaryData = [
    ['VENDOR SUMMARY'],
    [''],
    ['Vendor Name', 'Items Quoted', 'Best Price Count', 'Total Landed Value']
  ]

  const vendorStats = {}
  vendors.forEach(([vendorId, vendorName]) => {
    vendorStats[vendorId] = {
      name: vendorName,
      itemsQuoted: 0,
      bestPriceCount: 0,
      totalLandedValue: 0
    }
  })

  comparisonData.comparison.forEach(line => {
    let lowestCost = Infinity
    let lowestVendorId = null

    Object.entries(line.vendors || {}).forEach(([vendorId, data]) => {
      if (data) {
        vendorStats[vendorId].itemsQuoted++
        vendorStats[vendorId].totalLandedValue += data.landedCost || 0
        
        if (data.landedCost && data.landedCost < lowestCost) {
          lowestCost = data.landedCost
          lowestVendorId = vendorId
        }
      }
    })

    if (lowestVendorId) {
      vendorStats[lowestVendorId].bestPriceCount++
    }
  })

  Object.values(vendorStats).forEach(stats => {
    vendorSummaryData.push([
      stats.name,
      stats.itemsQuoted,
      stats.bestPriceCount,
      stats.totalLandedValue.toFixed(2)
    ])
  })

  const vendorSheet = XLSX.utils.aoa_to_sheet(vendorSummaryData)
  vendorSheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 }
  ]
  XLSX.utils.book_append_sheet(workbook, vendorSheet, 'Vendor Summary')

  // === Sheet 4: Recommended Selections ===
  const recommendedData = [
    ['RECOMMENDED SELECTIONS (Lowest Cost)'],
    [''],
    ['Line #', 'Description', 'Qty', 'Recommended Vendor', 'Landed Cost', 'Lead Time', 'Brand']
  ]

  comparisonData.comparison.forEach(line => {
    const bestVendorId = line.lowestCostVendor
    const bestVendorData = bestVendorId ? line.vendors?.[bestVendorId] : null

    recommendedData.push([
      line.lineNumber,
      line.description,
      `${line.quantity} ${line.unit}`,
      bestVendorData?.vendorName || 'No Quote',
      bestVendorData?.landedCost || 'N/A',
      bestVendorData?.leadTimeDays ? `${bestVendorData.leadTimeDays} days` : 'N/A',
      bestVendorData?.brand || 'N/A'
    ])
  })

  const recommendedSheet = XLSX.utils.aoa_to_sheet(recommendedData)
  recommendedSheet['!cols'] = [
    { wch: 8 },
    { wch: 40 },
    { wch: 12 },
    { wch: 20 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 }
  ]
  XLSX.utils.book_append_sheet(workbook, recommendedSheet, 'Recommended')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

/**
 * Generate indent export as Excel
 * 
 * @param {Object} indent - Indent with lines
 * @returns {Buffer} - Excel file buffer
 */
export function generateIndentExcel(indent) {
  const workbook = XLSX.utils.book_new()

  const data = [
    ['INDENT EXPORT'],
    [''],
    ['Indent Number', indent.indentNumber],
    ['Title', indent.title],
    ['Status', indent.status],
    ['Created', new Date(indent.createdAt).toLocaleString()],
    [''],
    ['LINE ITEMS'],
    ['Line #', 'Description', 'Qty', 'Unit', 'Category', 'Normalized Description', 'Confidence']
  ]

  indent.lines?.forEach(line => {
    data.push([
      line.lineNumber,
      line.rawDescription,
      line.quantity,
      line.unit,
      line.normalizedItem?.category || '',
      line.normalizedItem?.cleanDescription || '',
      line.normalizedItem?.confidence ? `${Math.round(line.normalizedItem.confidence * 100)}%` : ''
    ])
  })

  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [
    { wch: 8 },
    { wch: 45 },
    { wch: 10 },
    { wch: 8 },
    { wch: 15 },
    { wch: 30 },
    { wch: 12 }
  ]
  XLSX.utils.book_append_sheet(workbook, sheet, 'Indent')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

export default {
  generateComparisonExcel,
  generateIndentExcel
}
