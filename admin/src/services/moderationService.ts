import { adminApi, AdminStats } from './adminApi';
import { supabase } from './supabaseClient';
import {
  ModerationReport,
  ModerationDecision,
  AuditLogItem,
  CommunityRule,
  ContentType,
  ReportStatus,
  PriorityLevel,
  ReasonCode,
  AuthorProfile,
} from '../types/moderation';

export const COMMUNITY_RULES: CommunityRule[] = [
  { id: 1, code: 'INAPPROPRIATE', name: 'เนื้อหาไม่เหมาะสมหรือไม่เกี่ยวข้องกับอาหาร', description: 'รูปภาพลามกอนาจาร ความรุนแรง คำหยาบคาย หรือภาพที่ไม่เกี่ยวข้องกับอาหาร', isActive: true },
  { id: 2, code: 'HARASSMENT', name: 'การคุกคามหรือกลั่นแกล้ง', description: 'การใช้ถ้อยคำดูถูก ข่มขู่ หรือล้อเลียนผู้อื่นให้เกิดความเสียหายหรืออับอาย', isActive: true },
  { id: 3, code: 'SPAM', name: 'สแปมหรือสิ่งผิดกฎหมาย', description: 'โพสต์ข้อความซ้ำซ้อน สแปมลิงก์ โฆษณาเว็บพนัน หรือสิ่งผิดกฎหมาย', isActive: true },
  { id: 4, code: 'COPYRIGHT', name: 'การละเมิดลิขสิทธิ์', description: 'นำรูปภาพ ข้อความ หรือผลงานของผู้อื่นมาแอบอ้างโดยไม่ได้รับอนุญาต', isActive: true },
  { id: 5, code: 'PRIVACY', name: 'ละเมิดความเป็นส่วนตัว', description: 'การเปิดเผยข้อมูลส่วนบุคคล เบอร์โทรศัพท์ หรือภาพบุคคลอื่นโดยไม่ได้รับอนุญาต', isActive: true },
  { id: 6, code: 'OTHER', name: 'อื่นๆ', description: 'พฤติกรรมที่ไม่เหมาะสมอื่นๆ ที่ขัดต่อแนวทางปฏิบัติของชุมชน', isActive: true },
];

export const AVAILABLE_MODERATORS = [
  { id: '8f7e4451-d3c7-4d41-918c-f7e9978d83dd', name: 'ผู้ดูแลระบบ (Super Admin)', email: 'admin@kinraidee.app' },
  { id: '0be804ac-eaa7-492c-aba9-61b2c4d26641', name: 'แอดมินเอก (Moderator)', email: 'mod.aek@kinraidee.app' },
  { id: '89007a14-c289-4e0b-828f-54c78928aa82', name: 'แอดมินปอนด์ (Support)', email: 'support.pond@kinraidee.app' },
];

class ModerationService {
  private reportsCache: ModerationReport[] = [];
  private auditLogsCache: AuditLogItem[] = [];
  private isLiveConnected = false;
  private hasInitialized = false;
  private userCount = 0;
  private liveStats: AdminStats | null = null;

  public async initialize(): Promise<{ isLive: boolean; reportCount: number }> {
    // Clear legacy mock localStorage if any exists
    try {
      localStorage.removeItem('kinraidee_admin_reports_v3');
      localStorage.removeItem('kinraidee_admin_audit_logs_v1');
    } catch {
      // ignore
    }

    // 1. Primary: Direct Supabase Fetch (Instant, zero cold-start latency)
    try {
      const [repRes, profRes, auditRes] = await Promise.all([
        supabase.from('reports').select('id, target_type, target_id, reason_code, explanation, reporter_id, priority, status, assigned_to, created_at, resolved_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('id, created_at, actor_id, actor_name, event_type, target_type, target_id, metadata').order('created_at', { ascending: false }).limit(100),
      ]);

      const rawReports = repRes.data || [];
      const postIds = rawReports.filter(r => r.target_type === 'post').map(r => Number(r.target_id)).filter(Boolean);
      const commentIds = rawReports.filter(r => r.target_type === 'comment').map(r => Number(r.target_id)).filter(Boolean);
      const userTargetIds = rawReports.filter(r => r.target_type === 'user').map(r => String(r.target_id)).filter(Boolean);
      const reporterIds = rawReports.map(r => r.reporter_id).filter(Boolean);

      let pData: any[] = [];
      let cData: any[] = [];

      if (postIds.length > 0) {
        const { data } = await supabase.from('posts').select('id, user_id, food_name, description, image_url, restaurant_url, created_at, is_hidden').in('id', postIds);
        pData = data || [];
      }
      if (commentIds.length > 0) {
        const { data } = await supabase.from('comments').select('id, user_id, post_id, content, created_at, is_hidden').in('id', commentIds);
        cData = data || [];
      }

      // Collect all author IDs across posts, comments, user targets, and reporters
      const allUserIds = Array.from(new Set([
        ...reporterIds,
        ...userTargetIds,
        ...pData.map(p => p.user_id),
        ...cData.map(c => c.user_id),
      ])).filter(Boolean);

      let profilesMap: Record<string, any> = {};
      if (allUserIds.length > 0) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, bio, is_suspended')
          .in('id', allUserIds);
        (profData || []).forEach(p => { profilesMap[p.id] = p; });
      }

      let postsMap: Record<number, any> = {};
      let commentsMap: Record<number, any> = {};

      pData.forEach(p => {
        postsMap[p.id] = { ...p, profiles: profilesMap[p.user_id] };
      });
      cData.forEach(c => {
        commentsMap[c.id] = { ...c, profiles: profilesMap[c.user_id] };
      });

      const enrichedReports = rawReports.map(r => {
        let tc = null;
        if (r.target_type === 'post') tc = postsMap[Number(r.target_id)];
        else if (r.target_type === 'comment') tc = commentsMap[Number(r.target_id)];
        else if (r.target_type === 'user') tc = profilesMap[String(r.target_id)];

        const rep = profilesMap[r.reporter_id] || { username: 'user', display_name: 'ผู้ใช้ทั่วไป' };
        return { ...r, target_content: tc, reporter: rep };
      });

      this.reportsCache = this.mapLiveReports(enrichedReports);
      this.userCount = profRes.count ?? 0;
      this.auditLogsCache = (auditRes.data || []).map((l: any) => ({
        id: String(l.id),
        timestamp: l.created_at,
        actorId: String(l.actor_id || 'admin'),
        actorName: l.actor_name || 'ผู้ดูแลระบบ',
        actionType: l.event_type || 'MODERATION',
        targetType: l.target_type || 'content',
        targetId: String(l.target_id || ''),
        reasonCode: l.metadata?.action || 'MODERATION',
        note: l.metadata?.note || '',
      }));
      this.isLiveConnected = true;
      this.hasInitialized = true;
      return { isLive: true, reportCount: this.reportsCache.length };
    } catch (err) {
      console.warn('Direct Supabase fetch error, trying backend API:', err);
      try {
        const [reportsRes, statsRes, auditRes] = await Promise.all([
          adminApi.getReportsQueue({ limit: 100 }),
          adminApi.getStats(),
          adminApi.getAuditLogs(100),
        ]);

        this.liveStats = statsRes;
        this.userCount = statsRes.total_users;
        this.isLiveConnected = true;
        this.reportsCache = this.mapLiveReports(reportsRes.data || []);
        this.auditLogsCache = auditRes.data || [];
        this.hasInitialized = true;

        return {
          isLive: true,
          reportCount: this.reportsCache.length,
        };
      } catch (backendErr) {
        console.error('All moderation data loading attempts failed:', backendErr);
        this.reportsCache = [];
        this.auditLogsCache = [];
        this.hasInitialized = true;
        return { isLive: false, reportCount: 0 };
      }
    }
  }

  private mapLiveReports(dbReports: any[]): ModerationReport[] {
    const getRuleLabel = (code: string): string => {
      const rule = COMMUNITY_RULES.find((r) => r.code === code);
      return rule ? rule.name : code || 'รายงานปัญหา';
    };

    return dbReports.map((r: any) => {
      const targetType = (r.target_type || 'post') as ContentType;
      const targetId = r.target_id;

      // Extract enriched target content from API response or Supabase fallback
      const tc = r.target_content;
      const rep = r.reporter || {};

      // Determine author object from tc.profiles, or tc itself (for user reports)
      const author = tc?.profiles || (targetType === 'user' ? tc : null);

      const authorProfile: AuthorProfile = {
        id: author?.id || tc?.user_id || (targetType === 'user' ? targetId : 'unknown'),
        username: author?.username || tc?.username || 'user',
        displayName: author?.display_name || author?.username || tc?.display_name || tc?.username || 'ผู้ใช้งาน',
        avatarUrl: author?.avatar_url || tc?.avatar_url || null,
        status: (author?.is_suspended ?? tc?.is_suspended ?? false) ? 'suspended' : 'active',
        postCount: 1,
        violationCount: author?.violation_count || 0,
      };

      let targetContent: any;
      if (targetType === 'user') {
        targetContent = {
          id: targetId,
          type: 'user',
          title: `โปรไฟล์ผู้ใช้: @${authorProfile.username}`,
          text: tc?.bio || 'ไม่มีคำแนะนำตัว',
          imageUrl: authorProfile.avatarUrl,
          createdAt: r.created_at,
          author: authorProfile,
          visibility: 'published',
        };
      } else if (targetType === 'comment') {
        targetContent = {
          id: targetId,
          type: 'comment',
          title: 'ความคิดเห็นบนโพสต์',
          text: tc?.content || r.explanation || 'ความคิดเห็นที่ถูกรายงาน',
          createdAt: tc?.created_at || r.created_at,
          parentPostId: tc?.post_id,
          author: authorProfile,
          visibility: tc?.is_hidden ? 'hidden' : 'published',
        };
      } else {
        // Post
        targetContent = {
          id: targetId,
          type: 'post',
          title: tc?.food_name || 'โพสต์ที่ถูกรายงาน',
          text: tc?.description || r.explanation || 'ไม่มีคำบรรยาย',
          imageUrl: tc?.image_url,
          restaurantUrl: tc?.restaurant_url,
          createdAt: tc?.created_at || r.created_at,
          author: authorProfile,
          visibility: tc?.is_hidden ? 'hidden' : 'published',
        };
      }

      return {
        id: `RPT-LIVE-${r.id}`,
        targetType,
        targetId,
        reasonCode: (r.reason_code || 'OTHER') as ReasonCode,
        reasonLabel: getRuleLabel(r.reason_code),
        explanation: r.explanation,
        reportCount: 1,
        reporterUsername: rep.username || 'user',
        reporterId: r.reporter_id || 'unknown',
        priority: (r.priority || 'medium') as PriorityLevel,
        status: (r.status || 'pending') as ReportStatus,
        assignedTo: r.assigned_to,
        assignedToName: r.assigned_to ? 'ผู้ดูแลระบบ' : null,
        createdAt: r.created_at || new Date().toISOString(),
        resolvedAt: r.resolved_at,
        targetContent,
        isDemo: false,
      };
    });
  }

  public getReports(filters?: {
    search?: string;
    contentType?: ContentType | 'all';
    status?: ReportStatus | 'all';
    reasonCode?: ReasonCode | 'all';
    priority?: PriorityLevel | 'all';
    assignedTo?: string | 'all';
    sortBy?: 'newest' | 'oldest' | 'priority' | 'reportCount';
  }): ModerationReport[] {
    let result = [...this.reportsCache];

    if (!filters) return result;

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.reasonLabel.toLowerCase().includes(q) ||
          r.targetContent?.author?.username?.toLowerCase().includes(q) ||
          r.targetContent?.author?.displayName?.toLowerCase().includes(q) ||
          (r.targetContent?.title && r.targetContent.title.toLowerCase().includes(q)) ||
          (r.targetContent?.text && r.targetContent.text.toLowerCase().includes(q))
      );
    }

    if (filters.contentType && filters.contentType !== 'all') {
      result = result.filter((r) => r.targetType === filters.contentType);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters.reasonCode && filters.reasonCode !== 'all') {
      result = result.filter((r) => r.reasonCode === filters.reasonCode);
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter((r) => r.priority === filters.priority);
    }

    if (filters.assignedTo && filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'unassigned') {
        result = result.filter((r) => !r.assignedTo);
      } else {
        result = result.filter((r) => r.assignedTo === filters.assignedTo);
      }
    }

    // Sorting
    const priorityWeight: Record<PriorityLevel, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    if (filters.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters.sortBy === 'priority') {
      result.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    } else if (filters.sortBy === 'reportCount') {
      result.sort((a, b) => b.reportCount - a.reportCount);
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }

  public getReportById(id: string): ModerationReport | undefined {
    return this.reportsCache.find((r) => r.id === id);
  }

  public async assignReport(reportId: string, moderatorId: string | null): Promise<boolean> {
    const report = this.reportsCache.find((r) => r.id === reportId);
    if (!report) return false;

    try {
      const match = reportId.match(/\d+/);
      if (match) {
        const numId = parseInt(match[0], 10);
        try {
          await adminApi.assignReport(numId, {
            moderator_id: moderatorId || undefined,
            moderator_name: moderatorId ? 'ผู้ดูแลระบบ' : undefined,
          });
        } catch (apiErr) {
          console.warn('API assignReport failed, falling back to direct Supabase:', apiErr);
          await supabase.from('reports').update({
            assigned_to: moderatorId,
            status: moderatorId ? 'in_review' : 'pending',
          }).eq('id', numId);
        }
      }
    } catch (e) {
      console.warn('API assignReport warning:', e);
    }

    report.assignedTo = moderatorId;
    if (moderatorId) {
      const mod = AVAILABLE_MODERATORS.find((m) => m.id === moderatorId);
      report.assignedToName = mod ? mod.name : moderatorId;
      if (report.status === 'pending') {
        report.status = 'in_review';
      }
    } else {
      report.assignedToName = null;
    }

    return true;
  }

  public applyDecision(decision: ModerationDecision): { success: boolean; message: string } {
    const report = this.reportsCache.find((r) => r.id === decision.reportId);
    if (!report) {
      return { success: false, message: 'ไม่พบรายงานที่ระบุ' };
    }

    // Execute decision logic
    switch (decision.actionType) {
      case 'keep':
        report.status = 'dismissed';
        report.resolvedAt = new Date().toISOString();
        report.targetContent.visibility = 'published';
        break;

      case 'hide':
        report.status = 'action_taken';
        report.resolvedAt = new Date().toISOString();
        report.targetContent.visibility = 'hidden';
        break;

      case 'remove':
        report.status = 'action_taken';
        report.resolvedAt = new Date().toISOString();
        report.targetContent.visibility = 'removed';
        break;

      case 'warn':
        report.status = 'action_taken';
        report.resolvedAt = new Date().toISOString();
        report.targetContent.author.status = 'warned';
        report.targetContent.author.violationCount =
          (report.targetContent.author.violationCount || 0) + 1;
        break;

      case 'restrict':
        report.status = 'action_taken';
        report.resolvedAt = new Date().toISOString();
        report.targetContent.author.status = 'suspended';
        report.targetContent.visibility = 'hidden';
        break;

      case 'escalate':
        report.status = 'in_review';
        report.priority = 'urgent';
        report.assignedTo = 'mod-1';
        report.assignedToName = 'แอดมินสุภพ (Super Admin)';
        break;
    }

    return {
      success: true,
      message: `บันทึกคำตัดสินเรียบร้อยแล้ว (${this.getActionTitle(decision.actionType)})`,
    };
  }

  public getStats() {
    if (this.liveStats) {
      return {
        total: this.liveStats.total_reports,
        pending: this.liveStats.pending_reports,
        inReview: this.liveStats.in_review,
        actionTaken: this.liveStats.action_taken,
        dismissed: this.liveStats.dismissed,
        highPriority: this.liveStats.urgent_reports,
        userCount: this.liveStats.total_users,
      };
    }

    const total = this.reportsCache.length;
    const pending = this.reportsCache.filter((r) => r.status === 'pending').length;
    const actionTaken = this.reportsCache.filter((r) => r.status === 'action_taken').length;
    const dismissed = this.reportsCache.filter((r) => r.status === 'dismissed').length;
    const highPriority = this.reportsCache.filter(
      (r) => (r.priority === 'high' || r.priority === 'urgent') && r.status === 'pending'
    ).length;

    return {
      total,
      pending,
      inReview: 0,
      actionTaken,
      dismissed,
      highPriority,
      userCount: this.userCount,
    };
  }

  public getUserCount(): number {
    return this.userCount;
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogsCache];
  }

  public getActionTitle(action: string): string {
    const map: Record<string, string> = {
      keep: 'คงเนื้อหาไว้ (ไม่พบการละเมิด)',
      hide: 'ซ่อนเนื้อหา',
      remove: 'ลบเนื้อหาถาวร',
      restrict: 'ระงับบัญชีผู้ใช้ชั่วคราว',
      escalate: 'ส่งต่อให้ผู้ดูแลระดับสูง',
      warn: 'ตักเตือนผู้ใช้',
    };
    return map[action] || action;
  }
}

export const moderationService = new ModerationService();
