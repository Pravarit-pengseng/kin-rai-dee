// Types for Kin-Rai-Dee Admin & Moderation System

export type ContentType = 'post' | 'comment' | 'image' | 'user';

export type ReportStatus = 
  | 'pending'       // รอตรวจสอบ
  | 'in_review'     // กำลังตรวจสอบ
  | 'action_taken'  // ดำเนินการแล้ว
  | 'dismissed'     // ไม่พบการละเมิด / ยกเลิก
  | 'appealed'      // อุทธรณ์
  | 'closed';       // ปิดเคส

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type ModerationActionType = 
  | 'keep'          // คงเนื้อหาไว้
  | 'hide'          // ซ่อนเนื้อหา
  | 'remove'        // ลบเนื้อหา
  | 'warn'          // ตักเตือนเจ้าของเนื้อหา
  | 'restrict'      // ระงับผู้ใช้ชั่วคราว
  | 'escalate';     // ส่งต่อผู้ดูแลระดับสูง

export type ReasonCode = 
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE'
  | 'PRIVACY'
  | 'HARMFUL'
  | 'OTHER';

export interface CommunityRule {
  id: number;
  code: ReasonCode;
  name: string;
  description: string;
  isActive: boolean;
}

export interface AuthorProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  status?: 'active' | 'warned' | 'suspended';
  postCount?: number;
  violationCount?: number;
}

export interface UGCContent {
  id: number | string;
  type: ContentType;
  title?: string; // food_name
  text?: string;  // description or comment content
  imageUrl?: string | null;
  restaurantUrl?: string | null;
  createdAt: string;
  author: AuthorProfile;
  parentPostId?: number; // for comments
  parentPostTitle?: string;
  visibility: 'published' | 'hidden' | 'removed';
}

export interface ModerationReport {
  id: string; // e.g. "RPT-1001"
  targetType: ContentType;
  targetId: number | string;
  reasonCode: ReasonCode;
  reasonLabel: string;
  explanation?: string;
  reportCount: number;
  reporterUsername: string;
  reporterId: string;
  priority: PriorityLevel;
  status: ReportStatus;
  assignedTo?: string | null; // Moderator name or ID
  assignedToName?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  targetContent: UGCContent;
  isDemo?: boolean; // Flag to indicate if this report was generated or loaded from live DB
}

export interface ModerationDecision {
  reportId: string;
  actionType: ModerationActionType;
  reasonCode: ReasonCode;
  internalNote?: string;
  notifyUser: boolean;
  moderatorId: string;
  moderatorName: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actionType: string;
  targetType: ContentType;
  targetId: string | number;
  reasonCode?: string;
  note?: string;
  metadata?: Record<string, any>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'moderator' | 'support';
  avatar?: string;
}
