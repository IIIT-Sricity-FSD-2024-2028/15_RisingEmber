export enum Role {
  CUSTOMER = 'customer',
  PROVIDER = 'provider',
  ADMIN = 'admin',
  ARBITRATOR = 'arbitrator',
}

export enum ServiceStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum BookingStatus {
  REQUESTED = 'requested',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum EscrowStatus {
  NOT_LOCKED = 'not_locked',
  FUNDS_LOCKED = 'funds_locked',
  RELEASED = 'released',
  REFUNDED = 'refunded',
}

export enum CaseStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  ASSIGNED = 'assigned',
  HEARING_SCHEDULED = 'hearing_scheduled',
  EVIDENCE_REVIEW = 'evidence_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum HearingType {
  VIDEO = 'video',
  PHONE = 'phone',
  IN_PERSON = 'in_person',
}

export enum HearingStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DocumentType {
  EVIDENCE = 'evidence',
  INVOICE = 'invoice',
  IDENTITY = 'identity',
  CONTRACT = 'contract',
  AWARD_ATTACHMENT = 'award_attachment',
  OTHER = 'other',
}

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum AwardStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  AMENDED = 'amended',
}

export enum AwardDecision {
  RELEASE_TO_PROVIDER = 'release_to_provider',
  REFUND_TO_CUSTOMER = 'refund_to_customer',
}

export enum NotificationTone {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord extends BaseRecord {
  role: Role;
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface CustomerProfile extends BaseRecord {
  userId: string;
  city?: string;
  address?: string;
  preferredCategories: string[];
  bio?: string;
}

export interface ProviderProfile extends BaseRecord {
  userId: string;
  businessName: string;
  category: string;
  city?: string;
  serviceArea?: string;
  experienceLevel?: string;
  bio?: string;
  rating: number;
}

export interface ArbitratorProfile extends BaseRecord {
  userId: string;
  specialization: string;
  experienceYears: number;
  bio?: string;
  approvalStatus: ApplicationStatus;
}

export interface AdminProfile extends BaseRecord {
  userId: string;
  title: string;
}

export interface ServiceRecord extends BaseRecord {
  providerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  durationMinutes: number;
  location: string;
  image?: string;
  tags: string[];
  status: ServiceStatus;
  rating: number;
  reviewCount: number;
}

export interface BookingRecord extends BaseRecord {
  serviceId: string;
  customerId: string;
  providerId: string;
  scheduledAt: string;
  status: BookingStatus;
  notes?: string;
  address?: string;
  totalAmount: number;
  currency: string;
  escrowStatus: EscrowStatus;
  cancellationReason?: string;
  lastStatusNote?: string;
}

export interface BookingStatusEventRecord extends BaseRecord {
  bookingId: string;
  status: BookingStatus;
  actorId: string;
  actorRole: Role;
  note?: string;
}

export interface CaseRecord extends BaseRecord {
  bookingId: string;
  customerId: string;
  providerId: string;
  arbitratorId?: string;
  createdById: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high';
  resolutionSummary?: string;
}

export interface CaseMessageRecord extends BaseRecord {
  caseId: string;
  authorId: string;
  authorRole: Role;
  message: string;
  flagged?: boolean;
  reviewed?: boolean;
}

export interface HearingRecord extends BaseRecord {
  caseId: string;
  arbitratorId: string;
  scheduledAt: string;
  type: HearingType;
  status: HearingStatus;
  agenda: string;
  notes?: string;
}

export interface DocumentRecord extends BaseRecord {
  caseId: string;
  uploadedById: string;
  uploaderRole: Role;
  type: DocumentType;
  status: DocumentStatus;
  title: string;
  description?: string;
  fileName: string;
  content?: string;
}

export interface AwardRecord extends BaseRecord {
  caseId: string;
  arbitratorId: string;
  title: string;
  summary: string;
  status: AwardStatus;
  decision?: AwardDecision;
  decisionDate?: string;
}

export interface ReviewRecord extends BaseRecord {
  bookingId: string;
  serviceId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment?: string;
}

export interface NotificationRecord extends BaseRecord {
  recipientId: string;
  recipientRole: Role;
  title: string;
  body: string;
  tone: NotificationTone;
  read: boolean;
  entityType: 'service' | 'booking' | 'case' | 'hearing' | 'document' | 'award' | 'profile' | 'application';
  entityId: string;
}

export interface JobRequestRecord extends BaseRecord {
  name: string;
  email: string;
  phone?: string;
  serviceCategory: string;
  description: string;
  budget?: number;
}

export interface ContactMessageRecord extends BaseRecord {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface WaitlistEntryRecord extends BaseRecord {
  name?: string;
  email: string;
  city?: string;
  serviceCategory?: string;
}

export interface ArbitratorApplicationRecord extends BaseRecord {
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  experienceYears: number;
  bio?: string;
  status: ApplicationStatus;
}

export interface PlatformSettings {
  updatedAt: string;
  general: {
    name: string;
    email: string;
    phone: string;
    timezone: string;
  };
  arbitration: {
    maxResolutionTime: number;
    defaultHearingDuration: number;
    maxFileSize: number;
    allowedFileTypes: string;
  };
  userManagement: {
    allowNewUserRegistrations: boolean;
    requireEmailVerification: boolean;
    allowArbitratorApplications: boolean;
  };
  notifications: {
    emailNewCases: boolean;
    hearingReminders: boolean;
    awardIssued: boolean;
  };
  security: {
    minPasswordLength: number;
    twoFactorAuth: 'Enabled' | 'Disabled';
    sessionTimeout: number;
  };
}

export interface StoreState {
  users: UserRecord[];
  customerProfiles: CustomerProfile[];
  providerProfiles: ProviderProfile[];
  arbitratorProfiles: ArbitratorProfile[];
  adminProfiles: AdminProfile[];
  services: ServiceRecord[];
  bookings: BookingRecord[];
  bookingEvents: BookingStatusEventRecord[];
  cases: CaseRecord[];
  caseMessages: CaseMessageRecord[];
  hearings: HearingRecord[];
  documents: DocumentRecord[];
  awards: AwardRecord[];
  reviews: ReviewRecord[];
  notifications: NotificationRecord[];
  jobRequests: JobRequestRecord[];
  contactMessages: ContactMessageRecord[];
  waitlistEntries: WaitlistEntryRecord[];
  arbitratorApplications: ArbitratorApplicationRecord[];
  settings: PlatformSettings;
}
