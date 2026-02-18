/**
 * Email Service Abstraction Layer
 * 
 * MOCK IMPLEMENTATION for MVP
 * Logs email content instead of sending
 * 
 * Replace with real SMTP integration when ready
 */

// Email log storage (in-memory for MVP)
const emailLog = []

/**
 * Send email (MOCK - logs only)
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body text
 * @param {Array} options.attachments - Optional attachments
 * @returns {Promise<Object>} - Send result
 * 
 * TODO: Replace with real SMTP implementation:
 * const transporter = nodemailer.createTransport({ ... })
 * await transporter.sendMail({ to, subject, text: body, attachments })
 */
export async function sendEmail({ to, subject, body, attachments = [] }) {
  const emailEntry = {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    to,
    subject,
    body,
    attachments: attachments.map(a => ({ name: a.name, size: a.size })),
    status: 'LOGGED', // Would be 'SENT' in real implementation
    timestamp: new Date().toISOString(),
    mock: true
  }
  
  // Log to console for debugging
  console.log('\n========== EMAIL LOG ==========')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body:\n${body}`)
  if (attachments.length > 0) {
    console.log(`Attachments: ${attachments.map(a => a.name).join(', ')}`)
  }
  console.log('================================\n')
  
  // Store in memory log
  emailLog.push(emailEntry)
  
  return {
    success: true,
    messageId: emailEntry.id,
    mock: true,
    message: 'Email logged (MOCK MODE - not actually sent)'
  }
}

/**
 * Get email log
 * 
 * @param {number} limit - Max entries to return
 * @returns {Array} - Email log entries
 */
export function getEmailLog(limit = 100) {
  return emailLog.slice(-limit)
}

/**
 * Clear email log
 */
export function clearEmailLog() {
  emailLog.length = 0
}

/**
 * Generate RFQ email draft
 * 
 * @param {Object} rfq - RFQ data
 * @param {Object} vendor - Vendor data
 * @param {Array} items - Line items
 * @returns {Object} - Email draft { subject, body }
 */
export function generateRFQEmailDraft(rfq, vendor, items) {
  const subject = `RFQ ${rfq.rfqNumber}: ${rfq.title}`
  
  const itemsList = items.map((item, idx) => 
    `  ${idx + 1}. ${item.rawDescription || item.description}\n` +
    `     Qty: ${item.quantity} ${item.unit || 'NOS'}`
  ).join('\n')
  
  const body = `Dear ${vendor.name},

We are pleased to invite you to submit your quotation for the following items.

------------------------------------------------------------
RFQ Reference: ${rfq.rfqNumber}
Title: ${rfq.title}
${rfq.dueDate ? `Response Due: ${new Date(rfq.dueDate).toLocaleDateString()}` : ''}
------------------------------------------------------------

ITEMS REQUIRED:

${itemsList}

------------------------------------------------------------

Please provide your quotation with:
• Unit Price (excluding GST)
• GST percentage
• Freight charges (if applicable)
• Delivery lead time
• Payment terms
• Brand/Make offered
• Country of origin

${rfq.notes ? `\nAdditional Notes:\n${rfq.notes}` : ''}

Kindly submit your response by the due date.

Best regards,
Purchase Department
`

  return { subject, body }
}

export default {
  sendEmail,
  getEmailLog,
  clearEmailLog,
  generateRFQEmailDraft
}
