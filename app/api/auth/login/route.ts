/**
 * POST /api/auth/login
 * 
 * Authenticates a user and returns JWT tokens
 * 
 * Request Body:
 * {
 *   email: string
 *   password: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     user: {
 *       id: string
 *       name: string
 *       email: string
 *       role: 'customer' | 'mechanic' | 'admin'
 *     },
 *     accessToken: string
 *     refreshToken: string
 *   }
 * }
 */
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // TODO: Replace with actual database query
    // const user = await db.users.where('email', email).first()
    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    //     { status: 401 }
    //   )
    // }
    
    // const isValid = await bcrypt.compare(password, user.passwordHash)
    // if (!isValid) {
    //   return NextResponse.json(
    //     { success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    //     { status: 401 }
    //   )
    // }

    // const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' })
    // const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    // For now, return mock data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: email,
          role: 'customer' // This should come from database
        },
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token'
      }
    })
  } catch (error) {
    console.error('[API] Login error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
