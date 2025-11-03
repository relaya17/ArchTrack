/**
 * Auth Routes Tests
 * Construction Master App - API Testing
 */

import request from 'supertest'
import express from 'express'
import authRoutes from '../auth'
import { connectDatabase } from '../../config/database'
import User from '../../models/User'

// Mock database connection
jest.mock('../../config/database', () => ({
    connectDatabase: jest.fn(),
}))

// Mock User model
jest.mock('../../models/User', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}))

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'architect'
            }

            const mockUser = {
                _id: 'user123',
                ...userData,
                password: 'hashedPassword'
            }

                ; (User.findOne as jest.Mock).mockResolvedValue(null)
                ; (User.create as jest.Mock).mockResolvedValue(mockUser)

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)

            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.data.user.email).toBe(userData.email)
            expect(response.body.data.user.name).toBe(userData.name)
        })

        it('should return error if user already exists', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'architect'
            }

                ; (User.findOne as jest.Mock).mockResolvedValue({ email: userData.email })

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toContain('משתמש כבר קיים')
        })

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({})

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
        })
    })

    describe('POST /api/auth/login', () => {
        it('should login user successfully', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            }

            const mockUser = {
                _id: 'user123',
                email: loginData.email,
                password: 'hashedPassword',
                name: 'Test User',
                role: 'architect',
                isActive: true
            }

                ; (User.findOne as jest.Mock).mockResolvedValue(mockUser)
            const bcrypt = require('bcryptjs')
                ; (bcrypt.compare as jest.Mock).mockResolvedValue(true)

            const jwt = require('jsonwebtoken')
                ; (jwt.sign as jest.Mock).mockReturnValue('mockToken')

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data.accessToken).toBe('mockToken')
            expect(response.body.data.user.email).toBe(loginData.email)
        })

        it('should return error for invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            }

                ; (User.findOne as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)

            expect(response.status).toBe(401)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toContain('פרטי התחברות לא תקינים')
        })

        it('should return error for inactive user', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            }

            const mockUser = {
                _id: 'user123',
                email: loginData.email,
                password: 'hashedPassword',
                isActive: false
            }

                ; (User.findOne as jest.Mock).mockResolvedValue(mockUser)

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)

            expect(response.status).toBe(401)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toContain('חשבון לא פעיל')
        })
    })

    describe('GET /api/auth/me', () => {
        it('should return user profile with valid token', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'architect'
            }

                ; (User.findById as jest.Mock).mockResolvedValue(mockUser)

            const jwt = require('jsonwebtoken')
                ; (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' })

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer mockToken')

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data.user.email).toBe(mockUser.email)
        })

        it('should return error without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')

            expect(response.status).toBe(401)
            expect(response.body.success).toBe(false)
        })

        it('should return error with invalid token', async () => {
            const jwt = require('jsonwebtoken')
                ; (jwt.verify as jest.Mock).mockImplementation(() => {
                    throw new Error('Invalid token')
                })

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalidToken')

            expect(response.status).toBe(403)
            expect(response.body.success).toBe(false)
        })
    })

    describe('POST /api/auth/logout', () => {
        it('should logout user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer mockToken')

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toContain('התנתקות בוצעה בהצלחה')
        })
    })
})

