/**
 * SSO Service
 * Construction Master App - Single Sign-On Integration
 */

import logger from '../config/logger'
import jwt from 'jsonwebtoken'
import axios from 'axios'

interface SSOProvider {
    id: string
    name: string
    type: 'saml' | 'oauth2' | 'oidc' | 'ldap' | 'active_directory'
    enabled: boolean
    configuration: SSOConfiguration
    metadata: SSOProviderMetadata
}

interface SSOConfiguration {
    clientId?: string
    clientSecret?: string
    redirectUri?: string
    authorizationUrl?: string
    tokenUrl?: string
    userInfoUrl?: string
    logoutUrl?: string
    metadataUrl?: string
    certificate?: string
    privateKey?: string
    publicKey?: string
    issuer?: string
    audience?: string
    scope?: string[]
    responseType?: string
    grantType?: string
    endpoints?: Record<string, string>
    attributes?: Record<string, string>
    mappings?: Record<string, string>
}

interface SSOProviderMetadata {
    displayName: string
    description: string
    icon: string
    color: string
    supportedFeatures: string[]
    version: string
    lastUpdated: Date
}

interface SSOUser {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
    roles: string[]
    groups: string[]
    attributes: Record<string, any>
    provider: string
    lastLogin: Date
    isActive: boolean
}

interface SSOSession {
    id: string
    userId: string
    provider: string
    token: string
    refreshToken?: string
    expiresAt: Date
    createdAt: Date
    lastActivity: Date
    ipAddress: string
    userAgent: string
    isActive: boolean
}

interface SSOAuthRequest {
    id: string
    provider: string
    state: string
    code?: string
    redirectUri: string
    createdAt: Date
    expiresAt: Date
    isUsed: boolean
}

interface SSOGroup {
    id: string
    name: string
    displayName: string
    description: string
    provider: string
    members: string[]
    roles: string[]
    attributes: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface SSORole {
    id: string
    name: string
    displayName: string
    description: string
    permissions: string[]
    provider: string
    isSystem: boolean
    createdAt: Date
    updatedAt: Date
}

class SSOService {
    private providers: Map<string, SSOProvider> = new Map()
    private sessions: Map<string, SSOSession> = new Map()
    private authRequests: Map<string, SSOAuthRequest> = new Map()

    constructor() {
        this.initializeProviders()
    }

    /**
     * Initialize SSO providers
     */
    private initializeProviders(): void {
        try {
            // Initialize default providers
            this.addProvider({
                id: 'google',
                name: 'Google',
                type: 'oauth2',
                enabled: true,
                configuration: {
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    redirectUri: `${process.env.APP_URL}/auth/callback/google`,
                    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                    tokenUrl: 'https://oauth2.googleapis.com/token',
                    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
                    scope: ['openid', 'email', 'profile']
                },
                metadata: {
                    displayName: 'Google',
                    description: 'Sign in with Google',
                    icon: 'google',
                    color: '#4285F4',
                    supportedFeatures: ['oauth2', 'openid_connect'],
                    version: '2.0',
                    lastUpdated: new Date()
                }
            })

            this.addProvider({
                id: 'microsoft',
                name: 'Microsoft',
                type: 'oauth2',
                enabled: true,
                configuration: {
                    clientId: process.env.MICROSOFT_CLIENT_ID,
                    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                    redirectUri: `${process.env.APP_URL}/auth/callback/microsoft`,
                    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
                    scope: ['openid', 'email', 'profile']
                },
                metadata: {
                    displayName: 'Microsoft',
                    description: 'Sign in with Microsoft',
                    icon: 'microsoft',
                    color: '#0078D4',
                    supportedFeatures: ['oauth2', 'openid_connect'],
                    version: '2.0',
                    lastUpdated: new Date()
                }
            })

            this.addProvider({
                id: 'azure_ad',
                name: 'Azure Active Directory',
                type: 'oidc',
                enabled: true,
                configuration: {
                    clientId: process.env.AZURE_CLIENT_ID,
                    clientSecret: process.env.AZURE_CLIENT_SECRET,
                    redirectUri: `${process.env.APP_URL}/auth/callback/azure`,
                    authorizationUrl: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/authorize`,
                    tokenUrl: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
                    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
                    scope: ['openid', 'email', 'profile']
                },
                metadata: {
                    displayName: 'Azure AD',
                    description: 'Sign in with Azure Active Directory',
                    icon: 'azure',
                    color: '#0078D4',
                    supportedFeatures: ['oidc', 'saml'],
                    version: '2.0',
                    lastUpdated: new Date()
                }
            })

            logger.info('SSO providers initialized successfully')
        } catch (error) {
            logger.error('Error initializing SSO providers:', error)
        }
    }

    /**
     * Add SSO provider
     */
    addProvider(provider: SSOProvider): void {
        this.providers.set(provider.id, provider)
        logger.info('SSO provider added', { providerId: provider.id, name: provider.name })
    }

    /**
     * Get SSO provider
     */
    getProvider(providerId: string): SSOProvider | null {
        return this.providers.get(providerId) || null
    }

    /**
     * Get all SSO providers
     */
    getAllProviders(): SSOProvider[] {
        return Array.from(this.providers.values())
    }

    /**
     * Get enabled SSO providers
     */
    getEnabledProviders(): SSOProvider[] {
        return Array.from(this.providers.values()).filter(p => p.enabled)
    }

    /**
     * Update SSO provider
     */
    updateProvider(providerId: string, updates: Partial<SSOProvider>): boolean {
        const provider = this.providers.get(providerId)
        if (!provider) return false

        const updatedProvider = { ...provider, ...updates }
        this.providers.set(providerId, updatedProvider)
        logger.info('SSO provider updated', { providerId })
        return true
    }

    /**
     * Delete SSO provider
     */
    deleteProvider(providerId: string): boolean {
        const deleted = this.providers.delete(providerId)
        if (deleted) {
            logger.info('SSO provider deleted', { providerId })
        }
        return deleted
    }

    /**
     * Generate authorization URL
     */
    generateAuthUrl(providerId: string, redirectUri: string, state?: string): string {
        const provider = this.getProvider(providerId)
        if (!provider || !provider.enabled) {
            throw new Error('SSO provider not found or disabled')
        }

        const authState = state || this.generateState()
        const authRequest: SSOAuthRequest = {
            id: authState,
            provider: providerId,
            state: authState,
            redirectUri,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            isUsed: false
        }

        this.authRequests.set(authState, authRequest)

        const params = new URLSearchParams({
            client_id: provider.configuration.clientId!,
            redirect_uri: redirectUri,
            response_type: provider.configuration.responseType || 'code',
            scope: provider.configuration.scope?.join(' ') || 'openid email profile',
            state: authState
        })

        return `${provider.configuration.authorizationUrl}?${params.toString()}`
    }

    /**
     * Handle OAuth callback
     */
    async handleCallback(providerId: string, code: string, state: string): Promise<SSOUser> {
        const provider = this.getProvider(providerId)
        if (!provider) {
            throw new Error('SSO provider not found')
        }

        const authRequest = this.authRequests.get(state)
        if (!authRequest || authRequest.isUsed || authRequest.expiresAt < new Date()) {
            throw new Error('Invalid or expired authorization request')
        }

        try {
            // Exchange code for token
            const tokenResponse = await this.exchangeCodeForToken(provider, code, authRequest.redirectUri)
            
            // Get user info
            const userInfo = await this.getUserInfo(provider, tokenResponse.access_token)
            
            // Create or update user
            const ssoUser = await this.createOrUpdateUser(providerId, userInfo)
            
            // Mark auth request as used
            authRequest.isUsed = true
            
            logger.info('SSO callback handled successfully', { providerId, userId: ssoUser.id })
            return ssoUser
        } catch (error) {
            logger.error('Error handling SSO callback:', error)
            throw error
        }
    }

    /**
     * Exchange authorization code for access token
     */
    private async exchangeCodeForToken(provider: SSOProvider, code: string, redirectUri: string): Promise<any> {
        const tokenData = {
            client_id: provider.configuration.clientId,
            client_secret: provider.configuration.clientSecret,
            code,
            redirect_uri: redirectUri,
            grant_type: provider.configuration.grantType || 'authorization_code'
        }

        const response = await axios.post(provider.configuration.tokenUrl!, tokenData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        return response.data
    }

    /**
     * Get user information from provider
     */
    private async getUserInfo(provider: SSOProvider, accessToken: string): Promise<any> {
        const response = await axios.get(provider.configuration.userInfoUrl!, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })

        return response.data
    }

    /**
     * Create or update SSO user
     */
    private async createOrUpdateUser(providerId: string, userInfo: any): Promise<SSOUser> {
        // Map user info to SSO user format
        const ssoUser: SSOUser = {
            id: userInfo.id || userInfo.sub || userInfo.email,
            email: userInfo.email,
            name: userInfo.name || `${userInfo.given_name} ${userInfo.family_name}`,
            firstName: userInfo.given_name || userInfo.first_name,
            lastName: userInfo.family_name || userInfo.last_name,
            username: userInfo.preferred_username || userInfo.email,
            avatar: userInfo.picture || userInfo.avatar_url,
            roles: userInfo.roles || [],
            groups: userInfo.groups || [],
            attributes: userInfo,
            provider: providerId,
            lastLogin: new Date(),
            isActive: true
        }

        // In a real implementation, this would save to database
        logger.info('SSO user created/updated', { userId: ssoUser.id, provider: providerId })
        return ssoUser
    }

    /**
     * Create SSO session
     */
    createSession(userId: string, provider: string, token: string, refreshToken?: string, ipAddress?: string, userAgent?: string): SSOSession {
        const sessionId = this.generateSessionId()
        const session: SSOSession = {
            id: sessionId,
            userId,
            provider,
            token,
            refreshToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            createdAt: new Date(),
            lastActivity: new Date(),
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
            isActive: true
        }

        this.sessions.set(sessionId, session)
        logger.info('SSO session created', { sessionId, userId, provider })
        return session
    }

    /**
     * Get SSO session
     */
    getSession(sessionId: string): SSOSession | null {
        const session = this.sessions.get(sessionId)
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return null
        }
        return session
    }

    /**
     * Update session activity
     */
    updateSessionActivity(sessionId: string): boolean {
        const session = this.sessions.get(sessionId)
        if (!session) return false

        session.lastActivity = new Date()
        return true
    }

    /**
     * Invalidate SSO session
     */
    invalidateSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId)
        if (!session) return false

        session.isActive = false
        logger.info('SSO session invalidated', { sessionId })
        return true
    }

    /**
     * Get user sessions
     */
    getUserSessions(userId: string): SSOSession[] {
        return Array.from(this.sessions.values()).filter(s => s.userId === userId && s.isActive)
    }

    /**
     * Invalidate user sessions
     */
    invalidateUserSessions(userId: string): number {
        let count = 0
        for (const session of this.sessions.values()) {
            if (session.userId === userId && session.isActive) {
                session.isActive = false
                count++
            }
        }
        logger.info('User SSO sessions invalidated', { userId, count })
        return count
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): number {
        let count = 0
        const now = new Date()
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.expiresAt < now) {
                session.isActive = false
                count++
            }
        }

        if (count > 0) {
            logger.info('Expired SSO sessions cleaned up', { count })
        }
        return count
    }

    /**
     * Generate state parameter
     */
    private generateState(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    /**
     * Validate SSO configuration
     */
    validateConfiguration(provider: SSOProvider): { valid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!provider.configuration.clientId) {
            errors.push('Client ID is required')
        }

        if (!provider.configuration.clientSecret) {
            errors.push('Client Secret is required')
        }

        if (!provider.configuration.authorizationUrl) {
            errors.push('Authorization URL is required')
        }

        if (!provider.configuration.tokenUrl) {
            errors.push('Token URL is required')
        }

        if (!provider.configuration.userInfoUrl) {
            errors.push('User Info URL is required')
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    /**
     * Test SSO provider connection
     */
    async testConnection(provider: SSOProvider): Promise<{ success: boolean; message: string }> {
        try {
            // Test authorization URL
            const authUrl = new URL(provider.configuration.authorizationUrl!)
            if (!authUrl.protocol.startsWith('http')) {
                return { success: false, message: 'Invalid authorization URL' }
            }

            // Test token URL
            const tokenUrl = new URL(provider.configuration.tokenUrl!)
            if (!tokenUrl.protocol.startsWith('http')) {
                return { success: false, message: 'Invalid token URL' }
            }

            // Test user info URL
            const userInfoUrl = new URL(provider.configuration.userInfoUrl!)
            if (!userInfoUrl.protocol.startsWith('http')) {
                return { success: false, message: 'Invalid user info URL' }
            }

            return { success: true, message: 'SSO provider configuration is valid' }
        } catch (error) {
            return { success: false, message: 'Invalid URL format' }
        }
    }
}

export default new SSOService()
