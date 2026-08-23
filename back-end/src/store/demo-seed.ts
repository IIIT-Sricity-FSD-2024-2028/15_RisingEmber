import {
  AdminProfile,
  ApplicationStatus,
  AwardDecision,
  ArbitratorApplicationRecord,
  ArbitratorProfile,
  AwardRecord,
  AwardStatus,
  BookingRecord,
  BookingStatus,
  BookingStatusEventRecord,
  CaseMessageRecord,
  CaseRecord,
  CaseStatus,
  ContactMessageRecord,
  CustomerProfile,
  DocumentRecord,
  DocumentStatus,
  DocumentType,
  EscrowStatus,
  HearingRecord,
  HearingStatus,
  HearingType,
  JobRequestRecord,
  NotificationRecord,
  NotificationTone,
  PlatformSettings,
  ProviderProfile,
  Role,
  ReviewRecord,
  ServiceRecord,
  ServiceStatus,
  StoreState,
  UserRecord,
  WaitlistEntryRecord,
} from './entities';

/**
 * Evaluation scenario seed. All timestamps derive from the supplied seed clock.
 */
export const DEMO_SEED_NOW = '2026-09-01T09:00:00.000Z';

export function demoDate(offsetHours = 0, seedNow: Date | string = DEMO_SEED_NOW): string {
  const base = seedNow instanceof Date ? seedNow.getTime() : new Date(seedNow).getTime();
  return new Date(base + offsetHours * 60 * 60 * 1000).toISOString();
}

export function createDemoState(seedNow: Date = new Date(DEMO_SEED_NOW)): StoreState {
    const normalizedSeedNow = new Date(seedNow.getTime());
    if (Number.isNaN(normalizedSeedNow.getTime())) {
      throw new Error('Invalid demo seed clock.');
    }
    const now = normalizedSeedNow.toISOString();
    const dateAt = (offsetHours: number) => demoDate(offsetHours, normalizedSeedNow);
    const stamp = <T>(id: string, input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) =>
      ({
        id,
        createdAt: now,
        updatedAt: now,
        ...(input as object),
      }) as unknown as T;

    const users: UserRecord[] = [
      stamp<UserRecord>('user_1001', {
        role: Role.ADMIN,
        name: 'Naina Kapoor',
        email: 'admin@servicehub.test',
        password: 'admin123',
        phone: '9999999991',
        avatarUrl: '',
        isActive: true,
      }),
      stamp<UserRecord>('user_2001', {
        role: Role.CUSTOMER,
        name: 'Aarav Mehta',
        email: 'aarav@servicehub.test',
        password: 'customer123',
        phone: '9999999992',
        avatarUrl: '',
        isActive: true,
      }),
      stamp<UserRecord>('user_2002', {
        role: Role.CUSTOMER,
        name: 'Siya Sharma',
        email: 'siya@servicehub.test',
        password: 'customer123',
        phone: '9999999993',
        avatarUrl: '',
        isActive: true,
      }),
      stamp<UserRecord>('user_3001', {
        role: Role.PROVIDER,
        name: 'Rohan Verma',
        email: 'rohan@servicehub.test',
        password: 'provider123',
        phone: '9999999994',
        avatarUrl: '',
        isActive: true,
      }),
      stamp<UserRecord>('user_3002', {
        role: Role.PROVIDER,
        name: 'Neha Iyer',
        email: 'neha@servicehub.test',
        password: 'provider123',
        phone: '9999999995',
        avatarUrl: '',
        isActive: true,
      }),
      stamp<UserRecord>('user_4001', {
        role: Role.ARBITRATOR,
        name: 'Kabir Malhotra',
        email: 'kabir@servicehub.test',
        password: 'arbitrator123',
        phone: '9999999996',
        avatarUrl: '',
        isActive: true,
      }),
      stamp<UserRecord>('user_4002', {
        role: Role.ARBITRATOR,
        name: 'Tara Singh',
        email: 'tara@servicehub.test',
        password: 'arbitrator123',
        phone: '9999999997',
        avatarUrl: '',
        isActive: true,
      }),
    ];

    const customerProfiles: CustomerProfile[] = [
      stamp<CustomerProfile>('profile_2001', {
        userId: 'user_2001',
        city: 'Mumbai',
        address: 'Powai, Mumbai',
        preferredCategories: ['Home Cleaning', 'Appliance Repair'],
        bio: 'Busy professional looking for dependable services.',
      }),
      stamp<CustomerProfile>('profile_2002', {
        userId: 'user_2002',
        city: 'Bengaluru',
        address: 'Indiranagar, Bengaluru',
        preferredCategories: ['Tutoring', 'Wellness'],
        bio: 'Books recurring services for family and home.',
      }),
    ];

    const providerProfiles: ProviderProfile[] = [
      stamp<ProviderProfile>('profile_3001', {
        userId: 'user_3001',
        businessName: 'Spark Home Solutions',
        category: 'Home Cleaning',
        city: 'Mumbai',
        serviceArea: 'Mumbai and Navi Mumbai',
        experienceLevel: '6 – 10 years',
        bio: 'Deep cleaning and maintenance specialists.',
        rating: 4.8,
      }),
      stamp<ProviderProfile>('profile_3002', {
        userId: 'user_3002',
        businessName: 'BrightFix Services',
        category: 'Appliance Repair',
        city: 'Bengaluru',
        serviceArea: 'Bengaluru Metro',
        experienceLevel: '3 – 5 years',
        bio: 'Fast turnaround for appliance and electrical issues.',
        rating: 4.7,
      }),
    ];

    const arbitratorProfiles: ArbitratorProfile[] = [
      stamp<ArbitratorProfile>('profile_4001', {
        userId: 'user_4001',
        specialization: 'Consumer Services',
        experienceYears: 9,
        bio: 'Handles service-quality and fulfillment disputes.',
        approvalStatus: ApplicationStatus.APPROVED,
      }),
      stamp<ArbitratorProfile>('profile_4002', {
        userId: 'user_4002',
        specialization: 'Contract Resolution',
        experienceYears: 7,
        bio: 'Focus on small business and digital service disputes.',
        approvalStatus: ApplicationStatus.APPROVED,
      }),
    ];

    const adminProfiles: AdminProfile[] = [
      stamp<AdminProfile>('profile_1001', {
        userId: 'user_1001',
        title: 'Operations Admin',
      }),
    ];

    const services: ServiceRecord[] = [
      stamp<ServiceRecord>('service_5001', {
        providerId: 'user_3001',
        title: 'Premium Home Deep Cleaning',
        description: 'A full-home cleaning package for apartments and villas.',
        category: 'Home Cleaning',
        price: 2499,
        currency: 'INR',
        durationMinutes: 180,
        location: 'Mumbai',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400',
        tags: ['deep clean', 'kitchen', 'bathroom'],
        status: ServiceStatus.ACTIVE,
        rating: 4.9,
        reviewCount: 48,
      }),
      stamp<ServiceRecord>('service_5002', {
        providerId: 'user_3001',
        title: 'Move-In Sanitization',
        description: 'One-time sanitization and polishing for new homes.',
        category: 'Home Cleaning',
        price: 3299,
        currency: 'INR',
        durationMinutes: 240,
        location: 'Mumbai',
        image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
        tags: ['sanitization', 'move-in'],
        status: ServiceStatus.ACTIVE,
        rating: 4.7,
        reviewCount: 22,
      }),
      stamp<ServiceRecord>('service_5003', {
        providerId: 'user_3002',
        title: 'Washing Machine Repair Visit',
        description: 'Diagnosis and repair for front-load and top-load machines.',
        category: 'Appliance Repair',
        price: 899,
        currency: 'INR',
        durationMinutes: 90,
        location: 'Bengaluru',
        image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400',
        tags: ['washing machine', 'repair'],
        status: ServiceStatus.ACTIVE,
        rating: 4.6,
        reviewCount: 39,
      }),
      stamp<ServiceRecord>('service_5004', {
        providerId: 'user_3002',
        title: 'AC Maintenance and Service',
        description: 'Routine AC cleaning and seasonal servicing.',
        category: 'Appliance Repair',
        price: 1299,
        currency: 'INR',
        durationMinutes: 120,
        location: 'Bengaluru',
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400',
        tags: ['air conditioner', 'maintenance'],
        status: ServiceStatus.ACTIVE,
        rating: 4.8,
        reviewCount: 31,
      }),
    ];

    const bookings: BookingRecord[] = [
      stamp<BookingRecord>('booking_6001', {
        serviceId: 'service_5001',
        customerId: 'user_2001',
        providerId: 'user_3001',
        scheduledAt: dateAt(24),
        status: BookingStatus.CONFIRMED,
        notes: 'Please focus on the kitchen and balcony.',
        address: 'Powai, Mumbai',
        totalAmount: 2499,
        currency: 'INR',
        escrowStatus: EscrowStatus.FUNDS_LOCKED,
        lastStatusNote: 'Team assigned and confirmed.',
      }),
      stamp<BookingRecord>('booking_6002', {
        serviceId: 'service_5003',
        customerId: 'user_2002',
        providerId: 'user_3002',
        scheduledAt: dateAt(12),
        status: BookingStatus.DISPUTED,
        notes: 'Machine is leaking after the previous repair.',
        address: 'Indiranagar, Bengaluru',
        totalAmount: 899,
        currency: 'INR',
        escrowStatus: EscrowStatus.FUNDS_LOCKED,
        lastStatusNote: 'Customer raised a dispute.',
      }),
      stamp<BookingRecord>('booking_6003', {
        serviceId: 'service_5004',
        customerId: 'user_2001',
        providerId: 'user_3002',
        scheduledAt: dateAt(-48),
        status: BookingStatus.COMPLETED,
        notes: 'Routine summer maintenance.',
        address: 'Powai, Mumbai',
        totalAmount: 1299,
        currency: 'INR',
        escrowStatus: EscrowStatus.RELEASED,
        lastStatusNote: 'Service completed successfully.',
      }),
    ];

    const bookingEvents: BookingStatusEventRecord[] = [
      stamp<BookingStatusEventRecord>('booking_event_7001', {
        bookingId: 'booking_6001',
        status: BookingStatus.REQUESTED,
        actorId: 'user_2001',
        actorRole: Role.CUSTOMER,
        note: 'Booking created',
      }),
      stamp<BookingStatusEventRecord>('booking_event_7002', {
        bookingId: 'booking_6001',
        status: BookingStatus.CONFIRMED,
        actorId: 'user_3001',
        actorRole: Role.PROVIDER,
        note: 'Team assigned and confirmed.',
      }),
      stamp<BookingStatusEventRecord>('booking_event_7003', {
        bookingId: 'booking_6002',
        status: BookingStatus.REQUESTED,
        actorId: 'user_2002',
        actorRole: Role.CUSTOMER,
        note: 'Booking created',
      }),
      stamp<BookingStatusEventRecord>('booking_event_7004', {
        bookingId: 'booking_6002',
        status: BookingStatus.CONFIRMED,
        actorId: 'user_3002',
        actorRole: Role.PROVIDER,
        note: 'Technician assigned',
      }),
      stamp<BookingStatusEventRecord>('booking_event_7005', {
        bookingId: 'booking_6002',
        status: BookingStatus.DISPUTED,
        actorId: 'user_2002',
        actorRole: Role.CUSTOMER,
        note: 'Customer raised a dispute',
      }),
      stamp<BookingStatusEventRecord>('booking_event_7006', {
        bookingId: 'booking_6003',
        status: BookingStatus.REQUESTED,
        actorId: 'user_2001',
        actorRole: Role.CUSTOMER,
        note: 'Booking created',
      }),
      stamp<BookingStatusEventRecord>('booking_event_7007', {
        bookingId: 'booking_6003',
        status: BookingStatus.CONFIRMED,
        actorId: 'user_3002',
        actorRole: Role.PROVIDER,
        note: 'Confirmed',
      }),
      stamp<BookingStatusEventRecord>('booking_event_7008', {
        bookingId: 'booking_6003',
        status: BookingStatus.IN_PROGRESS,
        actorId: 'user_3002',
        actorRole: Role.PROVIDER,
        note: 'Technician onsite',
      }),
      stamp<BookingStatusEventRecord>('booking_event_7009', {
        bookingId: 'booking_6003',
        status: BookingStatus.COMPLETED,
        actorId: 'user_3002',
        actorRole: Role.PROVIDER,
        note: 'Service completed',
      }),
    ];

    const cases: CaseRecord[] = [
      stamp<CaseRecord>('case_8001', {
        bookingId: 'booking_6002',
        customerId: 'user_2002',
        providerId: 'user_3002',
        arbitratorId: 'user_4001',
        createdById: 'user_2002',
        title: 'Washing machine still leaking',
        description: 'The repair visit did not resolve the issue and water leakage continued.',
        status: CaseStatus.HEARING_SCHEDULED,
        priority: 'high',
        resolutionSummary: '',
      }),
    ];

    const caseMessages: CaseMessageRecord[] = [
      stamp<CaseMessageRecord>('case_message_9001', {
        caseId: 'case_8001',
        authorId: 'user_2002',
        authorRole: Role.CUSTOMER,
        message: 'The machine started leaking again within 24 hours of the repair visit.',
      }),
      stamp<CaseMessageRecord>('case_message_9002', {
        caseId: 'case_8001',
        authorId: 'user_3002',
        authorRole: Role.PROVIDER,
        message: 'We offered a revisit, but the customer requested formal review instead.',
      }),
    ];

    const hearings: HearingRecord[] = [
      stamp<HearingRecord>('hearing_10001', {
        caseId: 'case_8001',
        arbitratorId: 'user_4001',
        scheduledAt: dateAt(48),
        type: HearingType.VIDEO,
        status: HearingStatus.SCHEDULED,
        agenda: 'Review technician report and customer evidence.',
        notes: 'Both parties confirmed attendance.',
      }),
    ];

    const documents: DocumentRecord[] = [
      stamp<DocumentRecord>('document_11001', {
        caseId: 'case_8001',
        uploadedById: 'user_2002',
        uploaderRole: Role.CUSTOMER,
        type: DocumentType.EVIDENCE,
        status: DocumentStatus.UPLOADED,
        title: 'Leakage photos',
        description: 'Photos showing water leakage after repair.',
        fileName: 'leakage-photos.zip',
        content: 'metadata-only-seed',
      }),
      stamp<DocumentRecord>('document_11002', {
        caseId: 'case_8001',
        uploadedById: 'user_3002',
        uploaderRole: Role.PROVIDER,
        type: DocumentType.INVOICE,
        status: DocumentStatus.ACCEPTED,
        title: 'Repair invoice',
        description: 'Invoice for the original repair visit.',
        fileName: 'repair-invoice.pdf',
        content: 'metadata-only-seed',
      }),
    ];

    const awards: AwardRecord[] = [
      stamp<AwardRecord>('award_12001', {
        caseId: 'case_8001',
        arbitratorId: 'user_4001',
        title: 'Interim case summary',
        summary: 'Awaiting hearing before final award is issued.',
        status: AwardStatus.DRAFT,
        decision: AwardDecision.REFUND_TO_CUSTOMER,
      }),
    ];

    const reviews: ReviewRecord[] = [];

    const notifications: NotificationRecord[] = [
      stamp<NotificationRecord>('notification_13001', {
        recipientId: 'user_2001',
        recipientRole: Role.CUSTOMER,
        title: 'Booking confirmed',
        body: 'Your deep cleaning booking is confirmed for September 2.',
        tone: NotificationTone.SUCCESS,
        read: false,
        entityType: 'booking',
        entityId: 'booking_6001',
      }),
      stamp<NotificationRecord>('notification_13002', {
        recipientId: 'user_3001',
        recipientRole: Role.PROVIDER,
        title: 'Upcoming job',
        body: 'Premium Home Deep Cleaning is scheduled for September 2.',
        tone: NotificationTone.INFO,
        read: false,
        entityType: 'booking',
        entityId: 'booking_6001',
      }),
      stamp<NotificationRecord>('notification_13003', {
        recipientId: 'user_1001',
        recipientRole: Role.ADMIN,
        title: 'Case needs review',
        body: 'Case case_8001 is scheduled for hearing.',
        tone: NotificationTone.WARNING,
        read: false,
        entityType: 'case',
        entityId: 'case_8001',
      }),
      stamp<NotificationRecord>('notification_13004', {
        recipientId: 'user_4001',
        recipientRole: Role.ARBITRATOR,
        title: 'Hearing scheduled',
        body: 'Video hearing set for case case_8001.',
        tone: NotificationTone.INFO,
        read: false,
        entityType: 'hearing',
        entityId: 'hearing_10001',
      }),
    ];

    const jobRequests: JobRequestRecord[] = [];
    const contactMessages: ContactMessageRecord[] = [];
    const waitlistEntries: WaitlistEntryRecord[] = [];
    const arbitratorApplications: ArbitratorApplicationRecord[] = [
      stamp<ArbitratorApplicationRecord>('application_14001', {
        userId: 'user_4001',
        name: 'Kabir Malhotra',
        email: 'kabir@servicehub.test',
        phone: '9999999996',
        specialization: 'Consumer Services',
        experienceYears: 9,
        bio: 'Handles service-quality and fulfillment disputes.',
        status: ApplicationStatus.APPROVED,
      }),
      stamp<ArbitratorApplicationRecord>('application_14002', {
        userId: 'user_4002',
        name: 'Tara Singh',
        email: 'tara@servicehub.test',
        phone: '9999999997',
        specialization: 'Contract Resolution',
        experienceYears: 7,
        bio: 'Focus on small business and digital service disputes.',
        status: ApplicationStatus.APPROVED,
      }),
    ];

    const settings: PlatformSettings = {
      updatedAt: now,
      general: {
        name: 'ServiceHub',
        email: 'support@servicehub.test',
        phone: '+1 555-0100',
        timezone: 'UTC+5:30 (IST)',
      },
      arbitration: {
        maxResolutionTime: 45,
        defaultHearingDuration: 2,
        maxFileSize: 25,
        allowedFileTypes: 'PDF, PNG, JPG, DOCX, XLSX',
      },
      userManagement: {
        allowNewUserRegistrations: true,
        requireEmailVerification: false,
        allowArbitratorApplications: true,
      },
      notifications: {
        emailNewCases: true,
        hearingReminders: true,
        awardIssued: true,
      },
      security: {
        minPasswordLength: 8,
        twoFactorAuth: 'Disabled',
        sessionTimeout: 60,
      },
    };

    return {
      users,
      customerProfiles,
      providerProfiles,
      arbitratorProfiles,
      adminProfiles,
      services,
      bookings,
      bookingEvents,
      cases,
      caseMessages,
      hearings,
      documents,
      awards,
      reviews,
      notifications,
      jobRequests,
      contactMessages,
      waitlistEntries,
      arbitratorApplications,
      settings,
    };
}
