// Enterprise Dashboard Collaboration System
// Advanced sharing, commenting, and version control for business intelligence dashboards

import { prisma } from './prisma'

export interface DashboardCollaboration {
  dashboardId: string
  collaborators: Collaborator[]
  comments: Comment[]
  versions: DashboardVersion[]
  shareSettings: ShareSettings
  reviewWorkflow: ReviewWorkflow
}

export interface Collaborator {
  userId: string
  role: CollaboratorRole
  permissions: CollaboratorPermissions
  invitedAt: Date
  lastActive?: Date
  invitedBy: string
}

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COMMENTER = 'commenter',
  REVIEWER = 'reviewer'
}

export interface CollaboratorPermissions {
  canView: boolean
  canEdit: boolean
  canComment: boolean
  canShare: boolean
  canDelete: boolean
  canManageVersions: boolean
  canApprove: boolean
  canExport: boolean
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  type: 'general' | 'widget_specific' | 'suggestion' | 'approval_request'
  widgetId?: string
  position?: { x: number; y: number }
  parentCommentId?: string
  replies: Comment[]
  reactions: CommentReaction[]
  status: 'active' | 'resolved' | 'archived'
  createdAt: Date
  updatedAt: Date
  mentionedUsers: string[]
  attachments?: CommentAttachment[]
}

export interface CommentReaction {
  userId: string
  type: 'like' | 'helpful' | 'question' | 'concern'
  createdAt: Date
}

export interface CommentAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  uploadedAt: Date
}

export interface DashboardVersion {
  id: string
  version: string
  name: string
  description: string
  layout: any
  createdBy: string
  createdAt: Date
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived'
  changes: VersionChange[]
  reviewers: string[]
  approvals: VersionApproval[]
  isCurrentVersion: boolean
}

export interface VersionChange {
  type: 'widget_added' | 'widget_removed' | 'widget_modified' | 'layout_changed' | 'config_updated'
  widgetId?: string
  description: string
  oldValue?: any
  newValue?: any
  timestamp: Date
}

export interface VersionApproval {
  reviewerId: string
  reviewerName: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  reviewedAt?: Date
}

export interface ShareSettings {
  isPublic: boolean
  allowAnonymousView: boolean
  passwordProtected: boolean
  password?: string
  expirationDate?: Date
  allowEmbedding: boolean
  embeddingDomains: string[]
  shareUrl: string
  accessCount: number
}

export interface ReviewWorkflow {
  enabled: boolean
  requiresApproval: boolean
  requiredApprovers: number
  approvers: string[]
  autoPublishOnApproval: boolean
  notifyOnChanges: boolean
}

// Dashboard Collaboration Manager
export class DashboardCollaborationManager {
  private dashboardId: string
  private userId: string

  constructor(dashboardId: string, userId: string) {
    this.dashboardId = dashboardId
    this.userId = userId
  }

  // Add collaborator to dashboard
  async addCollaborator(
    inviteeEmail: string, 
    role: CollaboratorRole,
    customPermissions?: Partial<CollaboratorPermissions>
  ): Promise<Collaborator> {
    try {
      // Find user by email
      const inviteeUser = await prisma.user.findUnique({
        where: { email: inviteeEmail }
      })

      if (!inviteeUser) {
        throw new Error('User not found')
      }

      // Check if already a collaborator
      const existingCollaborator = await this.getCollaborator(inviteeUser.id)
      if (existingCollaborator) {
        throw new Error('User is already a collaborator')
      }

      // Create collaborator permissions
      const permissions = customPermissions || this.getDefaultPermissions(role)

      const collaborator: Collaborator = {
        userId: inviteeUser.id,
        role,
        permissions,
        invitedAt: new Date(),
        invitedBy: this.userId
      }

      // Save to database
      await prisma.systemConfig.create({
        data: {
          key: `dashboard_collaborator_${this.dashboardId}_${inviteeUser.id}`,
          value: collaborator,
          description: `Dashboard collaborator: ${inviteeUser.name || inviteeUser.email}`,
          category: 'dashboard_collaboration'
        }
      })

      // Send invitation email
      await this.sendCollaborationInvite(inviteeUser, role)

      // Log activity
      await this.logCollaborationActivity('collaborator_added', {
        inviteeId: inviteeUser.id,
        inviteeEmail: inviteeEmail,
        role
      })

      return collaborator
    } catch (error) {
      console.error('Failed to add collaborator:', error)
      throw error
    }
  }

  // Add comment to dashboard
  async addComment(
    content: string,
    type: Comment['type'] = 'general',
    widgetId?: string,
    position?: { x: number; y: number },
    parentCommentId?: string,
    mentionedUsers: string[] = []
  ): Promise<Comment> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: this.userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const comment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.userId,
        userName: user.name || user.email,
        userAvatar: user.image,
        content,
        type,
        widgetId,
        position,
        parentCommentId,
        replies: [],
        reactions: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        mentionedUsers
      }

      // Save comment to database
      await prisma.systemConfig.create({
        data: {
          key: `dashboard_comment_${comment.id}`,
          value: comment,
          description: `Dashboard comment by ${user.name || user.email}`,
          category: 'dashboard_comments'
        }
      })

      // Notify mentioned users
      if (mentionedUsers.length > 0) {
        await this.notifyMentionedUsers(comment, mentionedUsers)
      }

      // Notify collaborators
      await this.notifyCollaborators('comment_added', {
        commentId: comment.id,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        widgetId
      })

      return comment
    } catch (error) {
      console.error('Failed to add comment:', error)
      throw error
    }
  }

  // Create new dashboard version
  async createVersion(
    name: string,
    description: string,
    layout: any,
    changes: VersionChange[]
  ): Promise<DashboardVersion> {
    try {
      // Get current version number
      const currentVersions = await this.getDashboardVersions()
      const versionNumber = `v${currentVersions.length + 1}.0`

      const version: DashboardVersion = {
        id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: versionNumber,
        name,
        description,
        layout,
        createdBy: this.userId,
        createdAt: new Date(),
        status: 'draft',
        changes,
        reviewers: [],
        approvals: [],
        isCurrentVersion: false
      }

      // Save version to database
      await prisma.systemConfig.create({
        data: {
          key: `dashboard_version_${version.id}`,
          value: version,
          description: `Dashboard version: ${name}`,
          category: 'dashboard_versions'
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: this.userId,
          action: 'DASHBOARD_VERSION_CREATED',
          resource: 'dashboard_version',
          resourceId: version.id,
          metadata: {
            dashboardId: this.dashboardId,
            versionNumber,
            changesCount: changes.length
          }
        }
      })

      return version
    } catch (error) {
      console.error('Failed to create version:', error)
      throw error
    }
  }

  // Submit version for review
  async submitForReview(versionId: string, reviewers: string[]): Promise<void> {
    try {
      const version = await this.getDashboardVersion(versionId)
      if (!version) {
        throw new Error('Version not found')
      }

      // Update version status
      version.status = 'review'
      version.reviewers = reviewers
      version.approvals = reviewers.map(reviewerId => ({
        reviewerId,
        reviewerName: '', // Would fetch from database
        status: 'pending'
      }))

      await this.updateDashboardVersion(version)

      // Notify reviewers
      await this.notifyReviewers(version, reviewers)

      // Log activity
      await this.logCollaborationActivity('version_submitted_for_review', {
        versionId,
        reviewers
      })
    } catch (error) {
      console.error('Failed to submit for review:', error)
      throw error
    }
  }

  // Approve or reject version
  async reviewVersion(
    versionId: string,
    status: 'approved' | 'rejected',
    comments?: string
  ): Promise<void> {
    try {
      const version = await this.getDashboardVersion(versionId)
      if (!version) {
        throw new Error('Version not found')
      }

      // Update approval status
      const approval = version.approvals.find(a => a.reviewerId === this.userId)
      if (approval) {
        approval.status = status
        approval.comments = comments
        approval.reviewedAt = new Date()
      }

      // Check if all approvals are complete
      const allApproved = version.approvals.every(a => a.status === 'approved')
      const hasRejection = version.approvals.some(a => a.status === 'rejected')

      if (hasRejection) {
        version.status = 'draft'
      } else if (allApproved) {
        version.status = 'approved'
        
        // Auto-publish if configured
        const workflow = await this.getReviewWorkflow()
        if (workflow.autoPublishOnApproval) {
          await this.publishVersion(versionId)
        }
      }

      await this.updateDashboardVersion(version)

      // Notify stakeholders
      await this.notifyVersionReviewComplete(version, status)
    } catch (error) {
      console.error('Failed to review version:', error)
      throw error
    }
  }

  // Publish approved version
  async publishVersion(versionId: string): Promise<void> {
    try {
      const version = await this.getDashboardVersion(versionId)
      if (!version || version.status !== 'approved') {
        throw new Error('Version not approved for publishing')
      }

      // Mark current version as not current
      await this.markAllVersionsAsNotCurrent()

      // Update version status
      version.status = 'published'
      version.isCurrentVersion = true
      
      await this.updateDashboardVersion(version)

      // Update main dashboard with new layout
      await prisma.dashboard.update({
        where: { id: this.dashboardId },
        data: {
          layout: version.layout,
          updatedAt: new Date()
        }
      })

      // Notify collaborators
      await this.notifyCollaborators('version_published', {
        versionId,
        versionName: version.name
      })
    } catch (error) {
      console.error('Failed to publish version:', error)
      throw error
    }
  }

  // Share dashboard publicly
  async createPublicShare(settings: Partial<ShareSettings>): Promise<ShareSettings> {
    try {
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/dashboard/${this.dashboardId}/${this.generateShareToken()}`
      
      const shareSettings: ShareSettings = {
        isPublic: true,
        allowAnonymousView: settings.allowAnonymousView || false,
        passwordProtected: settings.passwordProtected || false,
        password: settings.password,
        expirationDate: settings.expirationDate,
        allowEmbedding: settings.allowEmbedding || false,
        embeddingDomains: settings.embeddingDomains || [],
        shareUrl,
        accessCount: 0
      }

      // Save share settings
      await prisma.systemConfig.upsert({
        where: { key: `dashboard_share_${this.dashboardId}` },
        update: { value: shareSettings },
        create: {
          key: `dashboard_share_${this.dashboardId}`,
          value: shareSettings,
          description: 'Dashboard public share settings',
          category: 'dashboard_sharing'
        }
      })

      return shareSettings
    } catch (error) {
      console.error('Failed to create public share:', error)
      throw error
    }
  }

  // Real-time collaboration events
  async broadcastCollaborationEvent(
    eventType: 'user_joined' | 'user_left' | 'comment_added' | 'widget_modified' | 'cursor_moved',
    eventData: any
  ): Promise<void> {
    try {
      // Get all active collaborators
      const collaborators = await this.getDashboardCollaborators()
      
      // Broadcast to WebSocket connections (would integrate with real-time service)
      await fetch('/api/dashboard/collaboration/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId: this.dashboardId,
          eventType,
          eventData,
          recipients: collaborators.map(c => c.userId),
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to broadcast collaboration event:', error)
    }
  }

  // Get dashboard collaborators
  async getDashboardCollaborators(): Promise<Collaborator[]> {
    try {
      const collaboratorConfigs = await prisma.systemConfig.findMany({
        where: {
          key: { startsWith: `dashboard_collaborator_${this.dashboardId}` },
          category: 'dashboard_collaboration'
        }
      })

      return collaboratorConfigs.map(config => config.value as Collaborator)
    } catch (error) {
      console.error('Failed to get collaborators:', error)
      return []
    }
  }

  // Get dashboard comments
  async getDashboardComments(widgetId?: string): Promise<Comment[]> {
    try {
      const commentConfigs = await prisma.systemConfig.findMany({
        where: {
          key: { startsWith: 'dashboard_comment_' },
          category: 'dashboard_comments'
        },
        orderBy: { createdAt: 'desc' }
      })

      let comments = commentConfigs.map(config => config.value as Comment)

      // Filter by widget if specified
      if (widgetId) {
        comments = comments.filter(c => c.widgetId === widgetId)
      }

      // Organize replies
      return this.organizeCommentReplies(comments)
    } catch (error) {
      console.error('Failed to get comments:', error)
      return []
    }
  }

  // Get dashboard versions
  async getDashboardVersions(): Promise<DashboardVersion[]> {
    try {
      const versionConfigs = await prisma.systemConfig.findMany({
        where: {
          key: { startsWith: `dashboard_version_` },
          category: 'dashboard_versions'
        },
        orderBy: { createdAt: 'desc' }
      })

      return versionConfigs
        .map(config => config.value as DashboardVersion)
        .filter(version => version.layout) // Ensure valid versions
    } catch (error) {
      console.error('Failed to get versions:', error)
      return []
    }
  }

  // Compare dashboard versions
  async compareVersions(versionId1: string, versionId2: string): Promise<{
    changes: VersionChange[]
    summary: {
      widgetsAdded: number
      widgetsRemoved: number
      widgetsModified: number
      layoutChanges: number
    }
  }> {
    try {
      const version1 = await this.getDashboardVersion(versionId1)
      const version2 = await this.getDashboardVersion(versionId2)

      if (!version1 || !version2) {
        throw new Error('One or both versions not found')
      }

      const changes = this.calculateVersionDifferences(version1.layout, version2.layout)
      
      const summary = {
        widgetsAdded: changes.filter(c => c.type === 'widget_added').length,
        widgetsRemoved: changes.filter(c => c.type === 'widget_removed').length,
        widgetsModified: changes.filter(c => c.type === 'widget_modified').length,
        layoutChanges: changes.filter(c => c.type === 'layout_changed').length
      }

      return { changes, summary }
    } catch (error) {
      console.error('Failed to compare versions:', error)
      throw error
    }
  }

  // Calculate differences between versions
  private calculateVersionDifferences(layout1: any, layout2: any): VersionChange[] {
    const changes: VersionChange[] = []

    // Compare widgets
    const widgets1 = layout1.widgets || []
    const widgets2 = layout2.widgets || []

    // Find added widgets
    widgets2.forEach((widget2: any) => {
      const exists = widgets1.find((w1: any) => w1.id === widget2.id)
      if (!exists) {
        changes.push({
          type: 'widget_added',
          widgetId: widget2.id,
          description: `Added widget: ${widget2.config?.title || widget2.id}`,
          newValue: widget2,
          timestamp: new Date()
        })
      }
    })

    // Find removed widgets
    widgets1.forEach((widget1: any) => {
      const exists = widgets2.find((w2: any) => w2.id === widget1.id)
      if (!exists) {
        changes.push({
          type: 'widget_removed',
          widgetId: widget1.id,
          description: `Removed widget: ${widget1.config?.title || widget1.id}`,
          oldValue: widget1,
          timestamp: new Date()
        })
      }
    })

    // Find modified widgets
    widgets1.forEach((widget1: any) => {
      const widget2 = widgets2.find((w2: any) => w2.id === widget1.id)
      if (widget2 && JSON.stringify(widget1) !== JSON.stringify(widget2)) {
        changes.push({
          type: 'widget_modified',
          widgetId: widget1.id,
          description: `Modified widget: ${widget1.config?.title || widget1.id}`,
          oldValue: widget1,
          newValue: widget2,
          timestamp: new Date()
        })
      }
    })

    return changes
  }

  // Utility methods
  private getDefaultPermissions(role: CollaboratorRole): CollaboratorPermissions {
    const permissionMap: Record<CollaboratorRole, CollaboratorPermissions> = {
      [CollaboratorRole.OWNER]: {
        canView: true,
        canEdit: true,
        canComment: true,
        canShare: true,
        canDelete: true,
        canManageVersions: true,
        canApprove: true,
        canExport: true
      },
      [CollaboratorRole.EDITOR]: {
        canView: true,
        canEdit: true,
        canComment: true,
        canShare: false,
        canDelete: false,
        canManageVersions: true,
        canApprove: false,
        canExport: true
      },
      [CollaboratorRole.VIEWER]: {
        canView: true,
        canEdit: false,
        canComment: false,
        canShare: false,
        canDelete: false,
        canManageVersions: false,
        canApprove: false,
        canExport: false
      },
      [CollaboratorRole.COMMENTER]: {
        canView: true,
        canEdit: false,
        canComment: true,
        canShare: false,
        canDelete: false,
        canManageVersions: false,
        canApprove: false,
        canExport: false
      },
      [CollaboratorRole.REVIEWER]: {
        canView: true,
        canEdit: false,
        canComment: true,
        canShare: false,
        canDelete: false,
        canManageVersions: false,
        canApprove: true,
        canExport: false
      }
    }

    return permissionMap[role]
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substr(2, 16)
  }

  private organizeCommentReplies(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // Create comment map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Organize replies
    comments.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId)
        if (parent) {
          parent.replies.push(commentMap.get(comment.id)!)
        }
      } else {
        rootComments.push(commentMap.get(comment.id)!)
      }
    })

    return rootComments
  }

  private async getCollaborator(userId: string): Promise<Collaborator | null> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: `dashboard_collaborator_${this.dashboardId}_${userId}` }
      })

      return config ? config.value as Collaborator : null
    } catch {
      return null
    }
  }

  private async getDashboardVersion(versionId: string): Promise<DashboardVersion | null> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: `dashboard_version_${versionId}` }
      })

      return config ? config.value as DashboardVersion : null
    } catch {
      return null
    }
  }

  private async updateDashboardVersion(version: DashboardVersion): Promise<void> {
    await prisma.systemConfig.update({
      where: { key: `dashboard_version_${version.id}` },
      data: { value: version }
    })
  }

  private async markAllVersionsAsNotCurrent(): Promise<void> {
    const versions = await this.getDashboardVersions()
    
    for (const version of versions) {
      if (version.isCurrentVersion) {
        version.isCurrentVersion = false
        await this.updateDashboardVersion(version)
      }
    }
  }

  private async getReviewWorkflow(): Promise<ReviewWorkflow> {
    const config = await prisma.systemConfig.findUnique({
      where: { key: `dashboard_workflow_${this.dashboardId}` }
    })

    return config ? config.value as ReviewWorkflow : {
      enabled: false,
      requiresApproval: false,
      requiredApprovers: 1,
      approvers: [],
      autoPublishOnApproval: false,
      notifyOnChanges: true
    }
  }

  private async sendCollaborationInvite(user: any, role: CollaboratorRole): Promise<void> {
    // Integration with email service
    console.log(`Sending collaboration invite to ${user.email} as ${role}`)
  }

  private async notifyMentionedUsers(comment: Comment, mentionedUsers: string[]): Promise<void> {
    // Send notifications to mentioned users
    console.log(`Notifying mentioned users: ${mentionedUsers.join(', ')}`)
  }

  private async notifyCollaborators(eventType: string, eventData: any): Promise<void> {
    // Send notifications to all collaborators
    console.log(`Notifying collaborators of ${eventType}:`, eventData)
  }

  private async notifyReviewers(version: DashboardVersion, reviewers: string[]): Promise<void> {
    // Send review request notifications
    console.log(`Notifying reviewers for version ${version.name}:`, reviewers)
  }

  private async notifyVersionReviewComplete(version: DashboardVersion, status: string): Promise<void> {
    // Notify when version review is complete
    console.log(`Version review complete: ${version.name} - ${status}`)
  }

  private async logCollaborationActivity(activity: string, data: any): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: this.userId,
        action: `DASHBOARD_${activity.toUpperCase()}`,
        resource: 'dashboard_collaboration',
        resourceId: this.dashboardId,
        metadata: data
      }
    })
  }
}

export default DashboardCollaborationManager