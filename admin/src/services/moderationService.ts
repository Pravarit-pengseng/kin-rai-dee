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
  UGCContent
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
  { id: 'mod-1', name: 'แอดมินสุภพ (Super Admin)', email: 'admin.supap@kinraidee.app' },
  { id: 'mod-2', name: 'แอดมินเอก (Moderator)', email: 'mod.aek@kinraidee.app' },
  { id: 'mod-3', name: 'แอดมินปอนด์ (Support)', email: 'support.pond@kinraidee.app' },
];

const LOCAL_STORAGE_REPORTS_KEY = 'kinraidee_admin_reports_v3';
const LOCAL_STORAGE_AUDIT_KEY = 'kinraidee_admin_audit_logs_v1';

class ModerationService {
  private reportsCache: ModerationReport[] = [];
  private auditLogsCache: AuditLogItem[] = [];
  private isLiveConnected = false;
  private hasInitialized = false;
  private userCount = 5;

  public async initialize(): Promise<{ isLive: boolean; reportCount: number }> {
    if (this.hasInitialized && this.reportsCache.length > 0) {
      return { isLive: this.isLiveConnected, reportCount: this.reportsCache.length };
    }

    // Try loading persisted changes from localStorage first
    const savedReports = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    const savedAudit = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (savedAudit) {
      try {
        this.auditLogsCache = JSON.parse(savedAudit);
      } catch (e) {
        console.error('Failed to parse audit logs', e);
      }
    }

    try {
      // 1. Fetch real posts, comments, profiles from Supabase
      const [postsRes, commentsRes, profilesRes] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('profiles').select('*').limit(50)
      ]);

      const realPosts = postsRes.data || [];
      const realComments = commentsRes.data || [];
      const realProfiles = profilesRes.data || [];
      if (realProfiles.length > 0) {
        this.userCount = realProfiles.length;
      }

      // Create a profile lookup map
      const profileMap = new Map<string, AuthorProfile>();
      realProfiles.forEach((p: any) => {
        profileMap.set(p.id, {
          id: p.id,
          username: p.username || 'user',
          displayName: p.display_name || p.username || 'ผู้ใช้ Kin-Rai-Dee',
          avatarUrl: p.avatar_url,
          bio: p.bio,
          status: 'active',
          postCount: realPosts.filter((post: any) => post.user_id === p.id).length,
          violationCount: 0
        });
      });

      // Try reading live reports table if it exists in Supabase
      const liveReportsRes = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50);
      let liveReports: ModerationReport[] = [];
      if (liveReportsRes.data && !liveReportsRes.error && liveReportsRes.data.length > 0) {
        this.isLiveConnected = true;
        liveReports = this.mapLiveReports(liveReportsRes.data, realPosts, realComments, profileMap);
      }

      // If we already have saved reports in localStorage, use them (preserves state during moderation testing)
      if (savedReports) {
        const cached = JSON.parse(savedReports) as ModerationReport[];
        // Merge any new live reports that aren't already in cache
        const existingIds = new Set(cached.map(c => c.id));
        const newReports = liveReports.filter(lr => !existingIds.has(lr.id));
        this.reportsCache = [...newReports, ...cached];
        this.hasInitialized = true;
        return { isLive: realPosts.length > 0, reportCount: this.reportsCache.length };
      }

      // Seed realistic moderation queue using REAL posts and comments from Supabase!
      const fallbackReports = this.buildConnectedReports(realPosts, realComments, profileMap);
      this.reportsCache = [...liveReports, ...fallbackReports];
      this.persistReports();
      this.hasInitialized = true;
      return { isLive: realPosts.length > 0, reportCount: this.reportsCache.length };

    } catch (err) {
      console.warn('Supabase connection note:', err);
      if (savedReports) {
        this.reportsCache = JSON.parse(savedReports);
      } else {
        this.reportsCache = this.buildFallbackReports();
      }
      this.hasInitialized = true;
      return { isLive: false, reportCount: this.reportsCache.length };
    }
  }

  private mapLiveReports(
    dbReports: any[],
    realPosts: any[],
    realComments: any[],
    profileMap: Map<string, AuthorProfile>
  ): ModerationReport[] {
    const getAuthor = (userId: string, defaultName = 'สมาชิกชุมชน'): AuthorProfile => {
      if (profileMap.has(userId)) return profileMap.get(userId)!;
      return {
        id: userId || 'unknown-user',
        username: 'user_' + (userId ? userId.substring(0, 6) : 'anon'),
        displayName: defaultName,
        avatarUrl: null,
        status: 'active',
        postCount: 1,
        violationCount: 0
      };
    };

    const getRuleLabel = (code: string): string => {
      const rule = COMMUNITY_RULES.find(r => r.code === code);
      return rule ? rule.name : (code || 'รายงานปัญหา');
    };

    return dbReports.map(r => {
      const targetType = r.target_type || 'post';
      const targetId = r.target_id;
      let targetContent: any;

      if (targetType === 'user') {
        const targetAuthor = getAuthor(String(targetId), 'ผู้ใช้ที่ถูกรายงาน');
        targetContent = {
          id: targetId,
          type: 'user',
          title: `โปรไฟล์ผู้ใช้: @${targetAuthor.username}`,
          text: targetAuthor.bio || 'ไม่มีคำแนะนำตัว',
          imageUrl: targetAuthor.avatarUrl,
          createdAt: r.created_at,
          author: targetAuthor,
          visibility: 'published'
        };
      } else if (targetType === 'comment') {
        const foundComment = realComments.find(c => String(c.id) === String(targetId));
        targetContent = {
          id: targetId,
          type: 'comment',
          title: 'ความคิดเห็นบนโพสต์',
          text: foundComment?.content || r.explanation || 'ความคิดเห็นที่ถูกรายงาน',
          createdAt: foundComment?.created_at || r.created_at,
          author: getAuthor(foundComment?.user_id, 'ผู้เขียนความคิดเห็น'),
          visibility: 'published'
        };
      } else {
        const foundPost = realPosts.find(p => String(p.id) === String(targetId));
        targetContent = {
          id: targetId,
          type: 'post',
          title: foundPost?.food_name || 'โพสต์ที่ถูกรายงาน',
          text: foundPost?.description || r.explanation || 'ไม่มีคำบรรยาย',
          imageUrl: foundPost?.image_url,
          restaurantUrl: foundPost?.restaurant_url,
          createdAt: foundPost?.created_at || r.created_at,
          author: getAuthor(foundPost?.user_id, 'ผู้โพสต์'),
          visibility: 'published'
        };
      }

      const reporter = getAuthor(r.reporter_id, 'ผู้รายงาน');

      return {
        id: `RPT-LIVE-${r.id}`,
        targetType: targetType as any,
        targetId: targetId,
        reasonCode: (r.reason_code || 'OTHER') as any,
        reasonLabel: getRuleLabel(r.reason_code),
        explanation: r.explanation,
        reportCount: 1,
        reporterUsername: reporter.username,
        reporterId: r.reporter_id || 'unknown',
        priority: (r.priority || 'medium') as any,
        status: (r.status || 'pending') as any,
        assignedTo: r.assigned_to,
        assignedToName: null,
        createdAt: r.created_at || new Date().toISOString(),
        resolvedAt: r.resolved_at,
        targetContent,
        isDemo: false
      };
    });
  }

  private buildConnectedReports(
    realPosts: any[],
    realComments: any[],
    profileMap: Map<string, AuthorProfile>
  ): ModerationReport[] {
    const reports: ModerationReport[] = [];

    // Helper to find or fallback author
    const getAuthor = (userId: string, defaultName = 'สมาชิกชุมชน'): AuthorProfile => {
      if (profileMap.has(userId)) {
        return profileMap.get(userId)!;
      }
      return {
        id: userId || 'unknown-user',
        username: 'user_' + (userId ? userId.substring(0, 6) : 'anon'),
        displayName: defaultName,
        avatarUrl: null,
        status: 'active',
        postCount: 1,
        violationCount: 0
      };
    };

    // Report 1: Connected to a real post
    if (realPosts.length > 0) {
      const p1 = realPosts[0];
      reports.push({
        id: 'RPT-2026-001',
        targetType: 'post',
        targetId: p1.id,
        reasonCode: 'INAPPROPRIATE',
        reasonLabel: 'เนื้อหาไม่เหมาะสมหรือไม่เกี่ยวกับอาหาร',
        reportCount: 3,
        reporterUsername: 'somchai_k',
        reporterId: 'rep-01',
        priority: 'high',
        status: 'pending',
        assignedTo: null,
        assignedToName: null,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        isDemo: false,
        targetContent: {
          id: p1.id,
          type: 'post',
          title: p1.food_name || 'เมนูอาหาร',
          text: p1.description || 'ไม่มีคำบรรยาย',
          imageUrl: p1.image_url,
          restaurantUrl: p1.restaurant_url,
          createdAt: p1.created_at || new Date().toISOString(),
          author: getAuthor(p1.user_id, 'ผู้โพสต์เมนูอาหาร'),
          visibility: 'published'
        }
      });
    }

    // Report 2: Connected to a real comment (if available)
    if (realComments.length > 0) {
      const c1 = realComments[realComments.length - 1]; // e.g. "Hdkansgjakkshdhkakbdhak"
      reports.push({
        id: 'RPT-2026-002',
        targetType: 'comment',
        targetId: c1.id,
        reasonCode: 'SPAM',
        reasonLabel: 'สแปมหรือโฆษณาไม่พึงประสงค์',
        reportCount: 4,
        reporterUsername: 'nong_foodie',
        reporterId: 'rep-02',
        priority: 'urgent',
        status: 'pending',
        assignedTo: null,
        assignedToName: null,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        isDemo: false,
        targetContent: {
          id: c1.id,
          type: 'comment',
          text: c1.content || 'ข้อความคอมเมนต์',
          createdAt: c1.created_at || new Date().toISOString(),
          parentPostId: c1.post_id,
          parentPostTitle: 'โพสต์รหัส #' + c1.post_id,
          author: getAuthor(c1.user_id, 'ผู้เขียนความคิดเห็น'),
          visibility: 'published'
        }
      });
    }

    // Report 3: Connected to second real post
    if (realPosts.length > 1) {
      const p2 = realPosts[1];
      reports.push({
        id: 'RPT-2026-003',
        targetType: 'post',
        targetId: p2.id,
        reasonCode: 'HARMFUL',
        reasonLabel: 'เนื้อหาที่เป็นอันตรายหรือผิดกฎหมาย',
        reportCount: 2,
        reporterUsername: 'foodlover_99',
        reporterId: 'rep-03',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        isDemo: false,
        targetContent: {
          id: p2.id,
          type: 'post',
          title: p2.food_name || 'รูปภาพประกอบโพสต์',
          text: p2.description,
          imageUrl: p2.image_url,
          restaurantUrl: p2.restaurant_url,
          createdAt: p2.created_at || new Date().toISOString(),
          author: getAuthor(p2.user_id, 'ผู้ใช้เจ้าของรูปภาพ'),
          visibility: 'published'
        }
      });
    }

    // Report 4: Another real post with lower priority
    if (realPosts.length > 2) {
      const p3 = realPosts[2];
      reports.push({
        id: 'RPT-2026-004',
        targetType: 'post',
        targetId: p3.id,
        reasonCode: 'HARASSMENT',
        reasonLabel: 'การคุกคามหรือกลั่นแกล้ง',
        reportCount: 1,
        reporterUsername: 'chef_ton',
        reporterId: 'rep-04',
        priority: 'low',
        status: 'action_taken',
        assignedTo: 'mod-2',
        assignedToName: 'แอดมินเอก (Moderator)',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        isDemo: false,
        targetContent: {
          id: p3.id,
          type: 'post',
          title: p3.food_name,
          text: p3.description,
          imageUrl: p3.image_url,
          createdAt: p3.created_at || new Date().toISOString(),
          author: getAuthor(p3.user_id, 'ผู้ใช้ทั่วไป'),
          visibility: 'hidden'
        }
      });
    }

    // Report 5: Another comment if exists
    if (realComments.length > 1) {
      const c2 = realComments[0];
      reports.push({
        id: 'RPT-2026-005',
        targetType: 'comment',
        targetId: c2.id,
        reasonCode: 'PRIVACY',
        reasonLabel: 'ละเมิดความเป็นส่วนตัว',
        reportCount: 1,
        reporterUsername: 'anon_guard',
        reporterId: 'rep-05',
        priority: 'medium',
        status: 'dismissed',
        assignedTo: 'mod-1',
        assignedToName: 'แอดมินสุภพ (Super Admin)',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        isDemo: false,
        targetContent: {
          id: c2.id,
          type: 'comment',
          text: c2.content,
          createdAt: c2.created_at || new Date().toISOString(),
          parentPostId: c2.post_id,
          author: getAuthor(c2.user_id, 'ผู้แสดงความคิดเห็น'),
          visibility: 'published'
        }
      });
    }

    // Report 6: Reported user profile
    const profilesList = Array.from(profileMap.values());
    if (profilesList.length > 0) {
      const targetUser = profilesList[profilesList.length - 1];
      reports.push({
        id: 'RPT-2026-006',
        targetType: 'user',
        targetId: targetUser.id,
        reasonCode: 'HARASSMENT',
        reasonLabel: 'การคุกคามหรือกลั่นแกล้ง',
        explanation: 'ผู้ใช้รายนี้ส่งข้อความหรือคอมเมนต์ไม่เหมาะสมในระบบ',
        reportCount: 2,
        reporterUsername: 'safety_guard',
        reporterId: 'rep-06',
        priority: 'high',
        status: 'pending',
        assignedTo: null,
        assignedToName: null,
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        isDemo: false,
        targetContent: {
          id: targetUser.id,
          type: 'user',
          title: `โปรไฟล์ผู้ใช้: @${targetUser.username}`,
          text: targetUser.bio || `บัญชีผู้ใช้ ${targetUser.displayName} (@${targetUser.username}) มีพฤติกรรมขัดต่อกฎชุมชน`,
          imageUrl: targetUser.avatarUrl,
          createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
          author: targetUser,
          visibility: 'published'
        }
      });
    }

    return reports;
  }

  private buildFallbackReports(): ModerationReport[] {
    return [
      {
        id: 'RPT-2026-001',
        targetType: 'post',
        targetId: 3,
        reasonCode: 'INAPPROPRIATE',
        reasonLabel: 'เนื้อหาไม่เหมาะสมหรือไม่เกี่ยวกับอาหาร',
        explanation: 'ข้อความไม่เกี่ยวกับอาหารและมีลิงก์น่าสงสัย',
        reportCount: 2,
        reporterUsername: 'user_review',
        reporterId: 'rep-01',
        priority: 'high',
        status: 'pending',
        assignedTo: null,
        createdAt: new Date().toISOString(),
        isDemo: true,
        targetContent: {
          id: 3,
          type: 'post',
          title: 'ข้าวกะเพราหมูกรอบสูตรพิเศษ',
          text: 'อาหารอร่อยมาก แต่สนใจกู้เงินด่วนคลิก bit.ly/spam-test',
          imageUrl: null,
          createdAt: new Date().toISOString(),
          author: {
            id: 'demo-user-1',
            username: 'spam_tester',
            displayName: 'Spam Tester',
            status: 'active'
          },
          visibility: 'published'
        }
      },
      {
        id: 'RPT-2026-002',
        targetType: 'user',
        targetId: 'demo-user-2',
        reasonCode: 'SPAM',
        reasonLabel: 'สแปมหรือโฆษณาไม่พึงประสงค์',
        explanation: 'บัญชีนี้สร้างขึ้นเพื่อสแปมข้อความและโฆษณาในหลายโพสต์',
        reportCount: 3,
        reporterUsername: 'somchai_k',
        reporterId: 'rep-02',
        priority: 'medium',
        status: 'pending',
        assignedTo: null,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        isDemo: true,
        targetContent: {
          id: 'demo-user-2',
          type: 'user',
          title: 'โปรไฟล์ผู้ใช้: @bot_promoter',
          text: 'รับปั๊มยอดไลก์ รีวิวร้านอาหาร ติดต่อ line @pump_fast',
          createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
          author: {
            id: 'demo-user-2',
            username: 'bot_promoter',
            displayName: 'Bot Promoter 24hr',
            status: 'active',
            postCount: 0,
            violationCount: 1
          },
          visibility: 'published'
        }
      }
    ];
  }

  private persistReports() {
    try {
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(this.reportsCache));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  private persistAuditLogs() {
    try {
      localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(this.auditLogsCache));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
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
      result = result.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.reasonLabel.toLowerCase().includes(q) ||
        r.targetContent.author.username.toLowerCase().includes(q) ||
        r.targetContent.author.displayName.toLowerCase().includes(q) ||
        (r.targetContent.title && r.targetContent.title.toLowerCase().includes(q)) ||
        (r.targetContent.text && r.targetContent.text.toLowerCase().includes(q))
      );
    }

    if (filters.contentType && filters.contentType !== 'all') {
      result = result.filter(r => r.targetType === filters.contentType);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(r => r.status === filters.status);
    }

    if (filters.reasonCode && filters.reasonCode !== 'all') {
      result = result.filter(r => r.reasonCode === filters.reasonCode);
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter(r => r.priority === filters.priority);
    }

    if (filters.assignedTo && filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'unassigned') {
        result = result.filter(r => !r.assignedTo);
      } else {
        result = result.filter(r => r.assignedTo === filters.assignedTo);
      }
    }

    // Sorting
    const priorityWeight: Record<PriorityLevel, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    if (filters.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters.sortBy === 'priority') {
      result.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    } else if (filters.sortBy === 'reportCount') {
      result.sort((a, b) => b.reportCount - a.reportCount);
    } else {
      // Default: newest
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }

  public getReportById(id: string): ModerationReport | undefined {
    return this.reportsCache.find(r => r.id === id);
  }

  public assignReport(reportId: string, moderatorId: string | null): boolean {
    const report = this.reportsCache.find(r => r.id === reportId);
    if (!report) return false;

    report.assignedTo = moderatorId;
    if (moderatorId) {
      const mod = AVAILABLE_MODERATORS.find(m => m.id === moderatorId);
      report.assignedToName = mod ? mod.name : moderatorId;
      if (report.status === 'pending') {
        report.status = 'in_review';
      }
    } else {
      report.assignedToName = null;
    }

    // Add Audit Log
    this.addAuditLog({
      actorId: 'admin-current',
      actorName: 'แอดมิน (ผู้ใช้งานปัจจุบัน)',
      actionType: 'ASSIGN_REPORT',
      targetType: report.targetType,
      targetId: report.targetId,
      reasonCode: report.reasonCode,
      note: moderatorId ? `มอบหมายงานให้ ${report.assignedToName}` : 'ยกเลิกการมอบหมายงาน',
      metadata: { reportId, assignedTo: moderatorId }
    });

    this.persistReports();
    return true;
  }

  public applyDecision(decision: ModerationDecision): { success: boolean; message: string } {
    const report = this.reportsCache.find(r => r.id === decision.reportId);
    if (!report) {
      return { success: false, message: 'ไม่พบรายงานที่ระบุ' };
    }

    const prevStatus = report.status;
    const prevVisibility = report.targetContent.visibility;

    // Execute decision logic based on actionType
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
        report.targetContent.author.violationCount = (report.targetContent.author.violationCount || 0) + 1;
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

    // Record Audit Log
    this.addAuditLog({
      actorId: decision.moderatorId,
      actorName: decision.moderatorName,
      actionType: `MODERATION_${decision.actionType.toUpperCase()}`,
      targetType: report.targetType,
      targetId: report.targetId,
      reasonCode: decision.reasonCode,
      note: decision.internalNote || `ดำเนินการ ${decision.actionType} สำหรับรายงาน ${report.id}`,
      metadata: {
        reportId: report.id,
        previousStatus: prevStatus,
        newStatus: report.status,
        previousVisibility: prevVisibility,
        newVisibility: report.targetContent.visibility,
        userNotified: decision.notifyUser
      }
    });

    this.persistReports();

    return {
      success: true,
      message: `บันทึกคำตัดสินเรียบร้อยแล้ว (${this.getActionTitle(decision.actionType)})`
    };
  }

  public getStats() {
    const total = this.reportsCache.length;
    const pending = this.reportsCache.filter(r => r.status === 'pending').length;
    const actionTaken = this.reportsCache.filter(r => r.status === 'action_taken').length;
    const dismissed = this.reportsCache.filter(r => r.status === 'dismissed').length;
    const highPriority = this.reportsCache.filter(r =>
      (r.priority === 'high' || r.priority === 'urgent') &&
      r.status === 'pending'
    ).length;

    return {
      total,
      pending,
      inReview: 0,
      actionTaken,
      dismissed,
      highPriority,
      userCount: this.userCount
    };
  }

  public getUserCount(): number {
    return this.userCount;
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogsCache];
  }

  public addAuditLog(item: Omit<AuditLogItem, 'id' | 'timestamp'>) {
    const newLog: AuditLogItem = {
      id: 'AUD-' + Date.now(),
      timestamp: new Date().toISOString(),
      ...item
    };
    this.auditLogsCache.unshift(newLog);
    this.persistAuditLogs();
  }

  public resetDemoData() {
    localStorage.removeItem(LOCAL_STORAGE_REPORTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_AUDIT_KEY);
    this.hasInitialized = false;
    return this.initialize();
  }

  public getActionTitle(action: string): string {
    const map: Record<string, string> = {
      keep: 'คงเนื้อหาไว้ (ไม่พบการละเมิด)',
      hide: 'ซ่อนเนื้อหา',
      remove: 'ลบเนื้อหาถาวร',
      restrict: 'ระงับบัญชีผู้ใช้ชั่วคราว'
    };
    return map[action] || action;
  }
}

export const moderationService = new ModerationService();
