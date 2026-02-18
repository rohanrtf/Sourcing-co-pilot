/**
 * Authentication Service
 * 
 * JWT-based authentication with bcrypt password hashing
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production'
const JWT_EXPIRES_IN = '7d'

/**
 * Hash password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

/**
 * Verify password
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Extract token from request headers
 */
export function extractToken(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request) {
  const token = extractToken(request)
  if (!token) return null
  
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true }
    })
    return user
  } catch (error) {
    console.error('Error fetching auth user:', error)
    return null
  }
}

/**
 * Register new company and admin user
 */
export async function registerCompany(companyName, userName, email, password) {
  const passwordHash = await hashPassword(password)
  
  // Create company and admin user in transaction
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName
      }
    })
    
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name: userName,
        role: 'ADMIN',
        companyId: company.id
      }
    })
    
    return { company, user }
  })
  
  const token = generateToken(result.user)
  
  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role
    },
    company: {
      id: result.company.id,
      name: result.company.name
    },
    token
  }
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true }
  })
  
  if (!user || !user.isActive) {
    throw new Error('Invalid credentials')
  }
  
  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    throw new Error('Invalid credentials')
  }
  
  const token = generateToken(user)
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    company: {
      id: user.company.id,
      name: user.company.name
    },
    token
  }
}

/**
 * Create user (by admin)
 */
export async function createUser(companyId, name, email, password, role) {
  const passwordHash = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      companyId
    }
  })
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user, requiredRoles) {
  if (!user) return false
  if (!Array.isArray(requiredRoles)) requiredRoles = [requiredRoles]
  return requiredRoles.includes(user.role)
}

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractToken,
  getAuthUser,
  registerCompany,
  loginUser,
  createUser,
  hasRole
}
