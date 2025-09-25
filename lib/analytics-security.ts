import { prisma } from './prisma'
import crypto from 'crypto'

export interface SecurityConfig {
  encryption: {
    algorithm: string
    keyLength: number
    ivLength: number
  }
  privacy: {
    gdprCompliant: boolean
    ccpaCompliant: boolean
    dataRetentionDays: number
    anonymization: boolean
  }
  access: {
    auditLogging: boolean
    roleBasedAccess: boolean
    ipWhitelist?: string[]
    requireMFA: boolean
  }
}

export interface DataAccessLog {
  id: string
  userId: string
  organizationId: string
  action: 'READ' | 'WRITE' | 'DELETE' | 'EXPORT'
  resource: string
  dataType: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  approved: boolean
  reason?: string
}

export interface PrivacyConsent {
  userId: string
  organizationId: string
  consentType: 'ANALYTICS_TRACKING' | 'DATA_PROCESSING' | 'MARKETING_INSIGHTS'
  granted: boolean
  grantedAt?: Date
  revokedAt?: Date
  version: string
  ipAddress?: string
}

export class AnalyticsSecurityManager {
  private readonly ENCRYPTION_KEY = process.env.ANALYTICS_ENCRYPTION_KEY || this.generateKey()
  private readonly SECURITY_CONFIG: SecurityConfig = {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16
    },
    privacy: {
      gdprCompliant: true,
      ccpaCompliant: true,
      dataRetentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '730'), // 2 years default
      anonymization: true
    },
    access: {
      auditLogging: true,
      roleBasedAccess: true,
      requireMFA: process.env.NODE_ENV === 'production'
    }
  }

  // Encrypt sensitive analytics data
  encryptAnalyticsData(data: any): { encrypted: string; iv: string; tag: string } {
    try {
      const iv = crypto.randomBytes(this.SECURITY_CONFIG.encryption.ivLength)
      const cipher = crypto.createCipher(this.SECURITY_CONFIG.encryption.algorithm, this.ENCRYPTION_KEY)
      cipher.setAAD(Buffer.from('analytics_data'))
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag().toString('hex')
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag
      }
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt analytics data')
    }
  }

  // Decrypt analytics data
  decryptAnalyticsData(encrypted: string, iv: string, tag: string): any {
    try {
      const decipher = crypto.createDecipher(this.SECURITY_CONFIG.encryption.algorithm, this.ENCRYPTION_KEY)
      decipher.setAAD(Buffer.from('analytics_data'))
      decipher.setAuthTag(Buffer.from(tag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt analytics data')
    }
  }

  // Check user permissions for analytics data access
  async checkDataAccess(
    userId: string,
    organizationId: string,
    action: DataAccessLog['action'],
    dataType: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Get user permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      })

      if (!user) {
        return { allowed: false, reason: 'User not found' }
      }

      if (user.organizationId !== organizationId) {
        return { allowed: false, reason: 'Organization access denied' }
      }

      // Check role-based permissions
      const hasAnalyticsAccess = user.permissions.includes('analytics_access') ||
                                user.permissions.includes('trinity_agent_full') ||
                                user.role === 'ORG_ADMIN' ||
                                user.role === 'SUPER_ADMIN'

      if (!hasAnalyticsAccess) {
        return { allowed: false, reason: 'Insufficient permissions for analytics data' }
      }

      // Check action-specific permissions
      if (action === 'DELETE' || action === 'EXPORT') {
        const hasAdminAccess = user.role === 'ORG_ADMIN' || user.role === 'SUPER_ADMIN'
        if (!hasAdminAccess) {
          return { allowed: false, reason: 'Admin access required for data deletion/export' }
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Access check failed:', error)
      return { allowed: false, reason: 'Access check failed' }
    }
  }

  // Log data access for audit trail
  async logDataAccess(
    userId: string,
    organizationId: string,
    action: DataAccessLog['action'],
    resource: string,
    dataType: string,
    ipAddress?: string,
    userAgent?: string,
    approved = true
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action: `ANALYTICS_${action}`,
          resource: 'analytics_data',
          resourceId: resource,
          metadata: {
            dataType,
            approved,
            securityContext: {
              ipAddress,
              userAgent,
              timestamp: new Date().toISOString()
            }
          },
          ipAddress,
          userAgent
        }
      })
    } catch (error) {
      console.error('Failed to log data access:', error)
    }
  }

  // Privacy compliance: Get user consent status
  async getPrivacyConsent(userId: string, consentType: PrivacyConsent['consentType']): Promise<PrivacyConsent | null> {
    try {
      const consent = await prisma.systemConfig.findUnique({
        where: { key: `privacy_consent_${userId}_${consentType}` }
      })

      return consent ? consent.value as PrivacyConsent : null
    } catch (error) {
      console.error('Failed to get privacy consent:', error)
      return null
    }
  }

  // Record privacy consent
  async recordPrivacyConsent(
    userId: string,
    organizationId: string,
    consentType: PrivacyConsent['consentType'],
    granted: boolean,
    ipAddress?: string
  ): Promise<void> {
    try {
      const consent: PrivacyConsent = {
        userId,
        organizationId,
        consentType,
        granted,
        grantedAt: granted ? new Date() : undefined,
        revokedAt: !granted ? new Date() : undefined,
        version: '1.0',
        ipAddress
      }

      await prisma.systemConfig.upsert({
        where: { key: `privacy_consent_${userId}_${consentType}` },
        update: { value: consent },
        create: {
          key: `privacy_consent_${userId}_${consentType}`,
          value: consent,
          description: `Privacy consent for ${consentType}`,
          category: 'privacy_compliance'
        }
      })

      // Log consent action
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action: granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
          resource: 'privacy_consent',
          resourceId: consentType,
          metadata: {
            consentType,
            granted,
            version: consent.version,
            ipAddress
          },
          ipAddress
        }
      })
    } catch (error) {
      console.error('Failed to record privacy consent:', error)
      throw error
    }
  }

  // Anonymize analytics data for privacy compliance
  anonymizeAnalyticsData(data: any): any {
    const anonymized = JSON.parse(JSON.stringify(data))

    // Remove or hash personally identifiable information
    if (anonymized.userInfo) {
      anonymized.userInfo = {
        id: this.hashPII(anonymized.userInfo.id || ''),
        email: this.hashPII(anonymized.userInfo.email || ''),
        anonymized: true
      }
    }

    // Anonymize IP addresses
    if (anonymized.sessions) {
      anonymized.sessions = anonymized.sessions.map((session: any) => ({
        ...session,
        ipAddress: session.ipAddress ? this.anonymizeIP(session.ipAddress) : undefined
      }))
    }

    // Remove detailed tracking data
    delete anonymized.detailedUserBehavior
    delete anonymized.personalizedTracking

    return anonymized
  }

  // Handle "Right to be Forgotten" requests (GDPR)
  async deleteUserData(userId: string, organizationId: string): Promise<void> {
    try {
      // Delete analytics data containing user information
      await prisma.systemConfig.deleteMany({
        where: {
          key: { contains: userId },
          category: { in: ['analytics_data', 'user_tracking'] }
        }
      })

      // Anonymize audit logs instead of deleting (maintain compliance records)
      await prisma.auditLog.updateMany({
        where: { userId },
        data: {
          metadata: { anonymized: true, originalUserId: this.hashPII(userId) }
        }
      })

      // Log the deletion request
      await prisma.auditLog.create({
        data: {
          organizationId,
          action: 'USER_DATA_DELETED',
          resource: 'user_data',
          resourceId: userId,
          metadata: {
            reason: 'right_to_be_forgotten',
            gdprCompliance: true,
            deletedAt: new Date().toISOString()
          }
        }
      })

      console.log(`User data deleted for GDPR compliance: ${userId}`)
    } catch (error) {
      console.error('Failed to delete user data:', error)
      throw error
    }
  }

  // Data retention policy enforcement
  async enforceDataRetention(): Promise<void> {
    try {
      const retentionDate = new Date(Date.now() - this.SECURITY_CONFIG.privacy.dataRetentionDays * 24 * 60 * 60 * 1000)

      // Delete old analytics snapshots
      await prisma.systemConfig.deleteMany({
        where: {
          category: 'analytics_data',
          createdAt: { lt: retentionDate }
        }
      })

      // Clean up old audit logs (keep for longer period for compliance)
      const auditRetentionDate = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000) // 7 years
      await prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: auditRetentionDate }
        }
      })

      console.log(`Data retention policy enforced - deleted data older than ${this.SECURITY_CONFIG.privacy.dataRetentionDays} days`)
    } catch (error) {
      console.error('Data retention enforcement failed:', error)
    }
  }

  // Generate data processing report for compliance
  async generatePrivacyReport(organizationId: string): Promise<{
    dataTypes: string[]
    retentionPolicies: any[]
    consentStatus: any[]
    dataProcessingActivities: any[]
    securityMeasures: string[]
  }> {
    try {
      // Get data types processed
      const dataTypes = await this.getProcessedDataTypes(organizationId)
      
      // Get consent status for users
      const consentStatus = await this.getOrganizationConsentStatus(organizationId)
      
      // Get recent data processing activities
      const processingActivities = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: { startsWith: 'ANALYTICS_' },
          timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        take: 100,
        orderBy: { timestamp: 'desc' }
      })

      return {
        dataTypes,
        retentionPolicies: [{
          type: 'analytics_data',
          retentionDays: this.SECURITY_CONFIG.privacy.dataRetentionDays,
          anonymizationEnabled: this.SECURITY_CONFIG.privacy.anonymization
        }],
        consentStatus,
        dataProcessingActivities: processingActivities.map(activity => ({
          action: activity.action,
          timestamp: activity.timestamp,
          resource: activity.resource,
          approved: true
        })),
        securityMeasures: [
          'AES-256-GCM encryption for data at rest',
          'Role-based access control',
          'Comprehensive audit logging',
          'Data anonymization capabilities',
          'Automated data retention enforcement',
          'Privacy consent management'
        ]
      }
    } catch (error) {
      console.error('Failed to generate privacy report:', error)
      throw error
    }
  }

  // Helper methods
  private generateKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  private hashPII(data: string): string {
    return crypto.createHash('sha256').update(data + this.ENCRYPTION_KEY).digest('hex').substring(0, 16)
  }

  private anonymizeIP(ipAddress: string): string {
    const parts = ipAddress.split('.')
    if (parts.length === 4) {
      // IPv4: Replace last octet with 0
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
    return 'anonymized'
  }

  private async getProcessedDataTypes(organizationId: string): Promise<string[]> {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: `analytics_provider_${organizationId}` },
        category: 'analytics_integration'
      }
    })

    const dataTypes = new Set<string>()
    
    configs.forEach(config => {
      const provider = config.value as any
      if (provider.config?.metrics) {
        provider.config.metrics.forEach((metric: string) => dataTypes.add(metric))
      }
    })

    return Array.from(dataTypes)
  }

  private async getOrganizationConsentStatus(organizationId: string): Promise<any[]> {
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true, email: true, name: true }
    })

    const consentStatus = []

    for (const user of users) {
      const analyticsConsent = await this.getPrivacyConsent(user.id, 'ANALYTICS_TRACKING')
      const processingConsent = await this.getPrivacyConsent(user.id, 'DATA_PROCESSING')

      consentStatus.push({
        userId: user.id,
        email: user.email,
        name: user.name,
        analyticsConsent: analyticsConsent?.granted || false,
        dataProcessingConsent: processingConsent?.granted || false,
        lastUpdated: analyticsConsent?.grantedAt || processingConsent?.grantedAt
      })
    }

    return consentStatus
  }
}

// Analytics data access middleware
export async function withAnalyticsAccessControl(
  userId: string,
  organizationId: string,
  action: DataAccessLog['action'],
  dataType: string,
  request: any
) {
  const securityManager = new AnalyticsSecurityManager()
  
  // Check access permissions
  const accessCheck = await securityManager.checkDataAccess(userId, organizationId, action, dataType)
  
  if (!accessCheck.allowed) {
    throw new Error(`Access denied: ${accessCheck.reason}`)
  }

  // Log data access
  await securityManager.logDataAccess(
    userId,
    organizationId,
    action,
    'analytics_data',
    dataType,
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    request.headers.get('user-agent'),
    true
  )

  return true
}

// Privacy compliance utilities
export class PrivacyComplianceManager {
  private securityManager: AnalyticsSecurityManager

  constructor() {
    this.securityManager = new AnalyticsSecurityManager()
  }

  // Handle GDPR data request
  async handleGDPRRequest(
    userId: string,
    requestType: 'access' | 'portability' | 'deletion' | 'rectification'
  ): Promise<any> {
    try {
      switch (requestType) {
        case 'access':
          return await this.exportUserData(userId)
        
        case 'portability':
          return await this.exportUserDataPortable(userId)
        
        case 'deletion':
          await this.securityManager.deleteUserData(userId, '')
          return { deleted: true, timestamp: new Date().toISOString() }
        
        case 'rectification':
          return { message: 'Contact support for data rectification requests' }
        
        default:
          throw new Error(`Unsupported GDPR request type: ${requestType}`)
      }
    } catch (error) {
      console.error('GDPR request handling failed:', error)
      throw error
    }
  }

  // Export user data for GDPR compliance
  private async exportUserData(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        aiInteractions: true,
        auditLogs: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      personalData: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        jobTitle: user.jobTitle,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      organizationData: {
        name: user.organization?.name,
        industry: user.organization?.industry
      },
      analyticsInteractions: user.aiInteractions.map(interaction => ({
        id: interaction.id,
        query: interaction.query,
        timestamp: interaction.createdAt,
        agent: interaction.agentId
      })),
      accessLogs: user.auditLogs.slice(0, 100), // Recent access logs
      exportedAt: new Date().toISOString(),
      gdprCompliant: true
    }
  }

  // Export user data in portable format
  private async exportUserDataPortable(userId: string): Promise<any> {
    const userData = await this.exportUserData(userId)
    
    return {
      format: 'JSON',
      version: '1.0',
      exported: userData,
      instructions: 'This data export contains all personal information processed by x3o.ai Trinity Agents',
      portableFormat: true
    }
  }
}

export default AnalyticsSecurityManager