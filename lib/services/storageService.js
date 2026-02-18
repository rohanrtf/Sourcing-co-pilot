/**
 * Supabase Storage Service
 * 
 * Handles file uploads to Supabase Storage bucket
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client for storage operations
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Bucket name for uploads
const BUCKET_NAME = 'uploads'

/**
 * Upload file to Supabase Storage
 * 
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Folder path (e.g., 'indents', 'quotes')
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<Object>} - Upload result with URL
 */
export async function uploadFile(fileBuffer, fileName, folder = 'general', contentType = 'application/octet-stream') {
  try {
    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${folder}/${timestamp}_${sanitizedName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      success: true,
      path: filePath,
      url: urlData.publicUrl,
      fileName: sanitizedName,
      originalName: fileName,
      contentType,
      size: fileBuffer.length
    }
  } catch (error) {
    console.error('Storage service error:', error)
    throw error
  }
}

/**
 * Delete file from Supabase Storage
 * 
 * @param {string} filePath - Path of file to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFile(filePath) {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete file error:', error)
    return false
  }
}

/**
 * Download file from Supabase Storage
 * 
 * @param {string} filePath - Path of file to download
 * @returns {Promise<Blob>} - File blob
 */
export async function downloadFile(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath)

    if (error) {
      console.error('Storage download error:', error)
      throw new Error(`Download failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Download file error:', error)
    throw error
  }
}

/**
 * Get signed URL for private files
 * 
 * @param {string} filePath - Path of file
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<string>} - Signed URL
 */
export async function getSignedUrl(filePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      throw new Error(`Signed URL failed: ${error.message}`)
    }

    return data.signedUrl
  } catch (error) {
    console.error('Get signed URL error:', error)
    throw error
  }
}

/**
 * Detect content type from file extension
 * 
 * @param {string} fileName - File name with extension
 * @returns {string} - MIME type
 */
export function getContentType(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  const mimeTypes = {
    'pdf': 'application/pdf',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

export default {
  uploadFile,
  deleteFile,
  downloadFile,
  getSignedUrl,
  getContentType,
  BUCKET_NAME
}
