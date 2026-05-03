import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { RequestActor } from '../common/interfaces/request-actor.interface';

type ServiceFilters = {
  category?: string;
  providerId?: string;
  status?: ServiceStatus;
  q?: string;
};

type BookingFilters = {
  status?: BookingStatus;
  serviceId?: string;
  caseLinked?: boolean;
};

type CaseFilters = {
  status?: CaseStatus;
  bookingId?: string;
  arbitratorId?: string;
};

type HearingFilters = {
  caseId?: string;
  status?: HearingStatus;
};

type DocumentFilters = {
  caseId?: string;
  status?: DocumentStatus;
  type?: DocumentType;
};

type AwardFilters = {
  caseId?: string;
  status?: AwardStatus;
};

type ReviewFilters = {
  serviceId?: string;
  providerId?: string;
  customerId?: string;
};

type UserFilters = {
  role?: Role;
  q?: string;
};

type SettingsPatch = {
  general?: Partial<PlatformSettings['general']>;
  arbitration?: Partial<PlatformSettings['arbitration']>;
  userManagement?: Partial<PlatformSettings['userManagement']>;
  notifications?: Partial<PlatformSettings['notifications']>;
  security?: Partial<PlatformSettings['security']>;
};

@Injectable()
export class StoreService {
  private readonly counters = new Map<string, number>([
    ['user', 5000],
    ['profile', 6000],
    ['service', 7000],
    ['booking', 8000],
    ['booking_event', 9000],
    ['case', 10000],
    ['case_message', 11000],
    ['hearing', 12000],
    ['document', 13000],
    ['award', 14000],
    ['notification', 15000],
    ['job_request', 16000],
    ['contact', 17000],
    ['waitlist', 18000],
    ['application', 19000],
    ['review', 20000],
  ]);

  private readonly escrowAutoReleaseHours = 72;
  private readonly requestedBookingExpiryHours = 24;

  private state: StoreState = this.createSeedState();

  findUserById(id: string): UserRecord | undefined {
    return this.state.users.find((user) => user.id === id);
  }

  login(role: Role, email: string, password: string) {
    const user = this.state.users.find(
      (entry) => entry.role === role && entry.email.toLowerCase() === email.toLowerCase().trim(),
    );

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid role, email, or password.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('This account is not active.');
    }

    return {
      actorId: user.id,
      role: user.role,
      profileSummary: this.serializeUser(user),
    };
  }

  resetPassword(role: Role, identifier: string, nextPassword: string) {
    const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
    const normalizedDigits = String(identifier || '').replace(/\D/g, '');
    const user = this.state.users.find((entry) => {
      if (entry.role !== role) return false;
      const emailMatches = entry.email.toLowerCase() === normalizedIdentifier;
      const phoneMatches = String(entry.phone || '').replace(/\D/g, '') === normalizedDigits;
      return emailMatches || (normalizedDigits.length >= 10 && phoneMatches);
    });

    if (!user) {
      throw new NotFoundException('No account was found for that role and identifier.');
    }

    user.password = String(nextPassword || '');
    user.updatedAt = this.now();

    return {
      actorId: user.id,
      role: user.role,
      profileSummary: this.serializeUser(user),
    };
  }

  registerCustomer(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    city?: string;
    address?: string;
    preferredCategories?: string[];
    bio?: string;
  }) {
    this.assertEmailAvailable(payload.email);

    const user = this.createUser({
      role: Role.CUSTOMER,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      isActive: true,
    });

    const profile = this.createCustomerProfile({
      userId: user.id,
      city: payload.city,
      address: payload.address,
      preferredCategories: payload.preferredCategories ?? [],
      bio: payload.bio,
    });

    this.appendNotification(
      user.id,
      'Customer account created',
      'Your ServiceHub customer profile is ready.',
      NotificationTone.SUCCESS,
      'profile',
      user.id,
    );

    return {
      actorId: user.id,
      role: user.role,
      profileSummary: this.serializeUser(user),
      profile,
    };
  }

  registerProvider(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    businessName: string;
    category: string;
    city?: string;
    serviceArea?: string;
    experienceLevel?: string;
    bio?: string;
  }) {
    this.assertEmailAvailable(payload.email);

    const user = this.createUser({
      role: Role.PROVIDER,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      isActive: true,
    });

    const profile = this.createProviderProfile({
      userId: user.id,
      businessName: payload.businessName,
      category: payload.category,
      city: payload.city,
      serviceArea: payload.serviceArea || payload.city,
      experienceLevel: payload.experienceLevel,
      bio: payload.bio,
      rating: 4.7,
    });

    this.getUsersByRole(Role.ADMIN).forEach((admin) => {
      this.appendNotification(
        admin.id,
        'New provider registered',
        `${user.name} has joined as a provider.`,
        NotificationTone.INFO,
        'profile',
        user.id,
      );
    });

    return {
      actorId: user.id,
      role: user.role,
      profileSummary: this.serializeUser(user),
      profile,
    };
  }

  applyArbitrator(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    specialization: string;
    experienceYears: number;
    bio?: string;
  }) {
    this.assertEmailAvailable(payload.email);

    const user = this.createUser({
      role: Role.ARBITRATOR,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      isActive: true,
    });

    const profile = this.createArbitratorProfile({
      userId: user.id,
      specialization: payload.specialization,
      experienceYears: payload.experienceYears,
      bio: payload.bio,
      approvalStatus: ApplicationStatus.PENDING,
    });

    const application = this.createArbitratorApplication({
      userId: user.id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      specialization: payload.specialization,
      experienceYears: payload.experienceYears,
      bio: payload.bio,
      status: ApplicationStatus.PENDING,
    });

    this.getUsersByRole(Role.ADMIN).forEach((admin) => {
      this.appendNotification(
        admin.id,
        'Arbitrator application received',
        `${payload.name} submitted an arbitrator application.`,
        NotificationTone.INFO,
        'application',
        application.id,
      );
    });

    return {
      actorId: user.id,
      role: user.role,
      profileSummary: this.serializeUser(user),
      profile,
      application,
    };
  }

  getMe(actor: RequestActor) {
    return this.serializeUser(this.requireUser(actor.id));
  }

  listUsers(actor: RequestActor, filters: UserFilters = {}) {
    this.assertRoles(actor, [Role.ADMIN]);

    const query = (filters.q || '').trim().toLowerCase();

    return this.state.users
      .filter((user) => !filters.role || user.role === filters.role)
      .filter((user) => {
        if (!query) return true;
        return [user.name, user.email, user.phone || ''].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .map((user) => this.serializeUser(user));
  }

  updateMe(
    actor: RequestActor,
    payload: Partial<{
      name: string;
      email: string;
      phone: string;
      avatarUrl: string;
      city: string;
      address: string;
      preferredCategories: string[];
      bio: string;
      businessName: string;
      category: string;
      serviceArea: string;
      experienceLevel: string;
      specialization: string;
      experienceYears: number;
      title: string;
    }>,
  ) {
    return this.updateUserInternal(actor, actor.id, payload, false);
  }

  updateUser(
    actor: RequestActor,
    userId: string,
    payload: Partial<{
      name: string;
      email: string;
      phone: string;
      avatarUrl: string;
      password: string;
      isActive: boolean;
      city: string;
      address: string;
      preferredCategories: string[];
      bio: string;
      businessName: string;
      category: string;
      serviceArea: string;
      experienceLevel: string;
      specialization: string;
      experienceYears: number;
      approvalStatus: ApplicationStatus;
      title: string;
    }>,
  ) {
    return this.updateUserInternal(actor, userId, payload, true);
  }

  listServices(filters: ServiceFilters = {}, actor?: RequestActor) {
    const query = (filters.q || '').trim().toLowerCase();

    return this.state.services
      .filter((service) => {
        if (!actor || actor.role === Role.CUSTOMER) {
          return service.status === ServiceStatus.ACTIVE;
        }
        if (!filters.status) return true;
        return service.status === filters.status;
      })
      .filter((service) => !filters.category || service.category.toLowerCase() === filters.category.toLowerCase())
      .filter((service) => !filters.providerId || service.providerId === filters.providerId)
      .filter((service) => {
        if (!query) return true;
        const haystack = [service.title, service.description, service.category, service.location, service.tags.join(' ')]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .map((service) => this.serializeService(service));
  }

  getServiceById(serviceId: string) {
    const service = this.requireService(serviceId);
    if (service.status !== ServiceStatus.ACTIVE) {
      throw new NotFoundException(`Service ${serviceId} was not found.`);
    }
    return this.serializeService(service);
  }

  createService(
    actor: RequestActor,
    payload: {
      providerId?: string;
      title: string;
      description: string;
      category: string;
      price: number;
      durationMinutes: number;
      location: string;
      image?: string;
      tags?: string[];
      status?: ServiceStatus;
    },
  ) {
    this.assertRoles(actor, [Role.PROVIDER, Role.ADMIN]);

    const providerId = actor.role === Role.ADMIN ? payload.providerId || '' : actor.id;
    if (!providerId) {
      throw new BadRequestException('providerId is required when an admin creates a service.');
    }

    const provider = this.requireUser(providerId);
    if (provider.role !== Role.PROVIDER) {
      throw new BadRequestException('Services can only belong to provider accounts.');
    }

    const service = this.createServiceRecord({
      providerId,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      price: payload.price,
      currency: 'INR',
      durationMinutes: payload.durationMinutes,
      location: payload.location,
      image: payload.image,
      tags: payload.tags ?? [],
      status: payload.status ?? ServiceStatus.ACTIVE,
      rating: 4.8,
      reviewCount: 0,
    });

    this.appendNotification(
      provider.id,
      'Service published',
      `${service.title} is now available in your provider catalog.`,
      NotificationTone.SUCCESS,
      'service',
      service.id,
    );

    if (service.status === ServiceStatus.ACTIVE) {
      this.state.customerProfiles
        .filter((profile) =>
          !profile.preferredCategories.length ||
          profile.preferredCategories.some((category) => category.toLowerCase() === service.category.toLowerCase()),
        )
        .forEach((profile) => {
          this.appendNotification(
            profile.userId,
            'New service available',
            `${service.title} is now available in ${service.category}.`,
            NotificationTone.INFO,
            'service',
            service.id,
          );
        });
    }

    return this.serializeService(service);
  }

  updateService(
    actor: RequestActor,
    serviceId: string,
    payload: Partial<{
      title: string;
      description: string;
      category: string;
      price: number;
      durationMinutes: number;
      location: string;
      image: string;
      tags: string[];
      status: ServiceStatus;
    }>,
  ) {
    const service = this.requireService(serviceId);
    this.assertServiceEditable(actor, service);

    Object.assign(service, this.compactObject(payload));
    service.updatedAt = this.now();

    return this.serializeService(service);
  }

  deleteService(actor: RequestActor, serviceId: string) {
    const service = this.requireService(serviceId);
    this.assertServiceEditable(actor, service);

    if (this.state.bookings.some((booking) => booking.serviceId === service.id)) {
      throw new ConflictException('This service has related bookings and cannot be deleted.');
    }

    this.state.services = this.state.services.filter((entry) => entry.id !== service.id);
    return { id: service.id, deleted: true };
  }

  listBookings(actor: RequestActor, filters: BookingFilters = {}) {
    return this.state.bookings
      .filter((booking) => this.canSeeBooking(actor, booking))
      .filter((booking) => !filters.status || booking.status === filters.status)
      .filter((booking) => !filters.serviceId || booking.serviceId === filters.serviceId)
      .filter((booking) => {
        if (filters.caseLinked === undefined) return true;
        const hasCase = this.state.cases.some((caseRecord) => caseRecord.bookingId === booking.id);
        return filters.caseLinked ? hasCase : !hasCase;
      })
      .map((booking) => this.serializeBooking(booking));
  }

  getBooking(actor: RequestActor, bookingId: string) {
    const booking = this.requireBooking(bookingId);
    if (!this.canSeeBooking(actor, booking)) {
      throw new ForbiddenException('You cannot view this booking.');
    }
    return this.serializeBooking(booking);
  }

  createBooking(
    actor: RequestActor,
    payload: {
      serviceId: string;
      scheduledAt: string;
      notes?: string;
      address?: string;
    },
  ) {
    this.assertRoles(actor, [Role.CUSTOMER]);

    const service = this.requireService(payload.serviceId);
    if (service.status !== ServiceStatus.ACTIVE) {
      throw new ConflictException('Only active services can be booked.');
    }

    const scheduledAt = new Date(payload.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('scheduledAt must be a valid ISO datetime string.');
    }

    const booking = this.createBookingRecord({
      serviceId: service.id,
      customerId: actor.id,
      providerId: service.providerId,
      scheduledAt: scheduledAt.toISOString(),
      status: BookingStatus.REQUESTED,
      notes: payload.notes,
      address: payload.address,
      totalAmount: service.price,
      currency: service.currency,
      escrowStatus: EscrowStatus.NOT_LOCKED,
    });

    this.createBookingEvent(booking.id, BookingStatus.REQUESTED, actor.id, actor.role, 'Booking created');

    const customer = this.requireUser(actor.id);
    const provider = this.requireUser(service.providerId);

    this.appendNotification(
      provider.id,
      'New booking request',
      `${customer.name} requested ${service.title}.`,
      NotificationTone.INFO,
      'booking',
      booking.id,
    );

    this.appendNotification(
      customer.id,
      'Booking requested',
      `Your booking request for ${service.title} has been sent.`,
      NotificationTone.SUCCESS,
      'booking',
      booking.id,
    );

    return this.serializeBooking(booking);
  }

  updateBooking(
    actor: RequestActor,
    bookingId: string,
    payload: Partial<{
      status: BookingStatus;
      note: string;
      scheduledAt: string;
      cancellationReason: string;
    }>,
  ) {
    const booking = this.requireBooking(bookingId);
    if (!this.canSeeBooking(actor, booking)) {
      throw new ForbiddenException('You cannot update this booking.');
    }

    if (payload.scheduledAt) {
      const nextDate = new Date(payload.scheduledAt);
      if (Number.isNaN(nextDate.getTime())) {
        throw new BadRequestException('scheduledAt must be a valid ISO datetime string.');
      }

      if (![Role.ADMIN, Role.CUSTOMER].includes(actor.role) && actor.id !== booking.providerId) {
        throw new ForbiddenException('Only the booking parties can reschedule a booking.');
      }

      booking.scheduledAt = nextDate.toISOString();
    }

    if (payload.status) {
      this.assertBookingStatusTransition(actor, booking, payload.status);
      this.applyEscrowTransition(booking, payload.status);
      booking.status = payload.status;
      booking.lastStatusNote = payload.note || booking.lastStatusNote;
      booking.cancellationReason = payload.cancellationReason || booking.cancellationReason;
      this.createBookingEvent(booking.id, booking.status, actor.id, actor.role, payload.note);

      const customer = this.requireUser(booking.customerId);
      const provider = this.requireUser(booking.providerId);
      const service = this.requireService(booking.serviceId);
      const message = `${service.title} is now ${this.humanizeToken(booking.status)}.`;

      [customer, provider].forEach((user) => {
        this.appendNotification(
          user.id,
          'Booking updated',
          message,
          booking.status === BookingStatus.CANCELLED ? NotificationTone.WARNING : NotificationTone.INFO,
          'booking',
          booking.id,
        );
      });
    }

    booking.updatedAt = this.now();
    return this.serializeBooking(booking);
  }

  deleteBooking(actor: RequestActor, bookingId: string) {
    const booking = this.requireBooking(bookingId);
    if (!this.canSeeBooking(actor, booking)) {
      throw new ForbiddenException('You cannot delete this booking.');
    }

    const hasCase = this.state.cases.some((caseRecord) => caseRecord.bookingId === booking.id);
    if (hasCase) {
      throw new ConflictException('Bookings linked to dispute cases cannot be deleted.');
    }

    if (actor.role !== Role.ADMIN && booking.status !== BookingStatus.CANCELLED) {
      throw new ConflictException('Only cancelled bookings can be deleted by booking parties.');
    }

    this.state.bookingEvents = this.state.bookingEvents.filter((event) => event.bookingId !== booking.id);
    this.state.notifications = this.state.notifications.filter(
      (notification) => !(notification.entityType === 'booking' && notification.entityId === booking.id),
    );
    this.state.bookings = this.state.bookings.filter((entry) => entry.id !== booking.id);

    return { id: booking.id, deleted: true };
  }

  listCases(actor: RequestActor, filters: CaseFilters = {}) {
    return this.state.cases
      .filter((caseRecord) => this.canSeeCase(actor, caseRecord))
      .filter((caseRecord) => !filters.status || caseRecord.status === filters.status)
      .filter((caseRecord) => !filters.bookingId || caseRecord.bookingId === filters.bookingId)
      .filter((caseRecord) => !filters.arbitratorId || caseRecord.arbitratorId === filters.arbitratorId)
      .map((caseRecord) => this.serializeCase(caseRecord));
  }

  getCase(actor: RequestActor, caseId: string) {
    const caseRecord = this.requireCase(caseId);
    if (!this.canSeeCase(actor, caseRecord)) {
      throw new ForbiddenException('You cannot view this case.');
    }
    return this.serializeCase(caseRecord);
  }

  createCase(
    actor: RequestActor,
    payload: {
      bookingId: string;
      title: string;
      description: string;
      priority?: 'low' | 'medium' | 'high';
    },
  ) {
    this.assertRoles(actor, [Role.CUSTOMER, Role.PROVIDER, Role.ADMIN]);

    const booking = this.requireBooking(payload.bookingId);
    if (!this.canSeeBooking(actor, booking) && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only raise a dispute for a booking you are involved in.');
    }

    if (
      booking.escrowStatus !== EscrowStatus.FUNDS_LOCKED ||
      ![BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status)
    ) {
      throw new ConflictException('Disputes can only be raised while escrow funds are locked.');
    }

    const activeCase = this.state.cases.find(
      (caseRecord) => caseRecord.bookingId === booking.id && caseRecord.status !== CaseStatus.CLOSED,
    );
    if (activeCase) {
      throw new ConflictException('An active case already exists for this booking.');
    }

    const arbitrator = this.findAvailableArbitrator();
    if (!arbitrator) {
      throw new ConflictException('No approved arbitrator is available for automatic case assignment.');
    }

    const caseRecord = this.createCaseRecord({
      bookingId: booking.id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      arbitratorId: arbitrator.id,
      createdById: actor.id,
      title: payload.title,
      description: payload.description,
      status: CaseStatus.ASSIGNED,
      priority: payload.priority || 'medium',
    });

    booking.status = BookingStatus.DISPUTED;
    booking.updatedAt = this.now();
    this.createBookingEvent(booking.id, BookingStatus.DISPUTED, actor.id, actor.role, 'Dispute raised');

    this.createCaseMessage(caseRecord.id, actor.id, actor.role, payload.description);

    const adminUsers = this.getUsersByRole(Role.ADMIN);
    const customer = this.requireUser(booking.customerId);
    const provider = this.requireUser(booking.providerId);

    [...adminUsers, customer, provider, arbitrator].forEach((user) => {
      if (user.id === actor.id && user.role !== Role.ADMIN) return;
      this.appendNotification(
        user.id,
        user.id === arbitrator.id ? 'Case assigned' : 'New dispute case',
        user.id === arbitrator.id
          ? `You have been assigned to case ${caseRecord.id}.`
          : `${payload.title} has been opened for booking ${booking.id}.`,
        NotificationTone.WARNING,
        'case',
        caseRecord.id,
      );
    });

    return this.serializeCase(caseRecord);
  }

  updateCase(
    actor: RequestActor,
    caseId: string,
    payload: Partial<{
      status: CaseStatus;
      arbitratorId: string;
      message: string;
      resolutionSummary: string;
      priority: 'low' | 'medium' | 'high';
    }>,
  ) {
    const caseRecord = this.requireCase(caseId);
    if (!this.canSeeCase(actor, caseRecord)) {
      throw new ForbiddenException('You cannot update this case.');
    }

    if (payload.priority) {
      this.assertRoles(actor, [Role.ADMIN]);
      caseRecord.priority = payload.priority;
    }

    if (payload.arbitratorId !== undefined) {
      this.assertRoles(actor, [Role.ADMIN]);
      const arbitrator = this.requireUser(payload.arbitratorId);
      if (arbitrator.role !== Role.ARBITRATOR) {
        throw new BadRequestException('arbitratorId must refer to an arbitrator.');
      }
      caseRecord.arbitratorId = arbitrator.id;
      caseRecord.status = CaseStatus.ASSIGNED;
      this.appendNotification(
        arbitrator.id,
        'Case assigned',
        `You have been assigned to case ${caseRecord.id}.`,
        NotificationTone.INFO,
        'case',
        caseRecord.id,
      );
    }

    if (payload.status) {
      if (actor.role === Role.ARBITRATOR) {
        if (caseRecord.arbitratorId !== actor.id) {
          throw new ForbiddenException('Only the assigned arbitrator can update this case.');
        }
      } else if (actor.role !== Role.ADMIN) {
        throw new ForbiddenException('Only admins and the assigned arbitrator can update case status.');
      }
      caseRecord.status = payload.status;
    }

    if (payload.resolutionSummary !== undefined) {
      if (actor.role === Role.ARBITRATOR && caseRecord.arbitratorId !== actor.id) {
        throw new ForbiddenException('Only the assigned arbitrator can resolve this case.');
      }
      if (![Role.ADMIN, Role.ARBITRATOR].includes(actor.role)) {
        throw new ForbiddenException('Only admins and arbitrators can add a resolution summary.');
      }
      caseRecord.resolutionSummary = payload.resolutionSummary;
    }

    if (payload.message) {
      this.createCaseMessage(caseRecord.id, actor.id, actor.role, payload.message);
    }

    caseRecord.updatedAt = this.now();

    const audience = [caseRecord.customerId, caseRecord.providerId, caseRecord.arbitratorId].filter(Boolean) as string[];
    audience.forEach((recipientId) => {
      if (recipientId === actor.id) return;
      this.appendNotification(
        recipientId,
        'Case updated',
        `Case ${caseRecord.id} has new activity.`,
        NotificationTone.INFO,
        'case',
        caseRecord.id,
      );
    });

    return this.serializeCase(caseRecord);
  }

  deleteCase(actor: RequestActor, caseId: string) {
    const caseRecord = this.requireCase(caseId);
    this.assertCaseManagementAccess(actor, caseRecord);

    const awards = this.state.awards.filter((award) => award.caseId === caseRecord.id);
    if (awards.some((award) => award.status === AwardStatus.ISSUED)) {
      throw new ConflictException('Cases with issued awards cannot be deleted.');
    }

    this.state.hearings = this.state.hearings.filter((hearing) => hearing.caseId !== caseRecord.id);
    this.state.documents = this.state.documents.filter((document) => document.caseId !== caseRecord.id);
    this.state.awards = this.state.awards.filter((award) => award.caseId !== caseRecord.id);
    this.state.caseMessages = this.state.caseMessages.filter((message) => message.caseId !== caseRecord.id);
    this.state.notifications = this.state.notifications.filter(
      (notification) => !(notification.entityType === 'case' && notification.entityId === caseRecord.id),
    );
    this.state.cases = this.state.cases.filter((entry) => entry.id !== caseRecord.id);

    return { id: caseRecord.id, deleted: true };
  }

  updateCaseMessage(
    actor: RequestActor,
    caseId: string,
    messageId: string,
    payload: Partial<{ flagged: boolean; reviewed: boolean }>,
  ) {
    this.assertRoles(actor, [Role.ADMIN]);
    this.requireCase(caseId);

    const message = this.state.caseMessages.find((entry) => entry.caseId === caseId && entry.id === messageId);
    if (!message) {
      throw new NotFoundException(`Case message ${messageId} was not found.`);
    }

    Object.assign(message, this.compactObject({
      flagged: payload.flagged,
      reviewed: payload.reviewed,
    }));
    message.updatedAt = this.now();
    return { ...message };
  }

  deleteCaseMessage(actor: RequestActor, caseId: string, messageId: string) {
    this.assertRoles(actor, [Role.ADMIN]);
    this.requireCase(caseId);

    const message = this.state.caseMessages.find((entry) => entry.caseId === caseId && entry.id === messageId);
    if (!message) {
      throw new NotFoundException(`Case message ${messageId} was not found.`);
    }

    this.state.caseMessages = this.state.caseMessages.filter((entry) => entry.id !== messageId);
    return { id: messageId, deleted: true };
  }

  listHearings(actor: RequestActor, filters: HearingFilters = {}) {
    return this.state.hearings
      .filter((hearing) => !filters.caseId || hearing.caseId === filters.caseId)
      .filter((hearing) => !filters.status || hearing.status === filters.status)
      .filter((hearing) => this.canSeeCase(actor, this.requireCase(hearing.caseId)))
      .map((hearing) => this.serializeHearing(hearing));
  }

  createHearing(
    actor: RequestActor,
    payload: {
      caseId: string;
      scheduledAt: string;
      type: HearingType;
      agenda: string;
      notes?: string;
    },
  ) {
    const caseRecord = this.requireCase(payload.caseId);
    this.assertCaseManagementAccess(actor, caseRecord);

    if (!caseRecord.arbitratorId) {
      throw new ConflictException('Assign an arbitrator before scheduling a hearing.');
    }

    const hearing = this.createHearingRecord({
      caseId: caseRecord.id,
      arbitratorId: caseRecord.arbitratorId,
      scheduledAt: new Date(payload.scheduledAt).toISOString(),
      type: payload.type,
      status: HearingStatus.SCHEDULED,
      agenda: payload.agenda,
      notes: payload.notes,
    });

    caseRecord.status = CaseStatus.HEARING_SCHEDULED;
    caseRecord.updatedAt = this.now();

    [caseRecord.customerId, caseRecord.providerId, caseRecord.arbitratorId].forEach((recipientId) => {
      this.appendNotification(
        recipientId,
        'Hearing scheduled',
        `A ${this.humanizeToken(payload.type)} hearing is scheduled for case ${caseRecord.id}.`,
        NotificationTone.INFO,
        'hearing',
        hearing.id,
      );
    });

    return this.serializeHearing(hearing);
  }

  updateHearing(
    actor: RequestActor,
    hearingId: string,
    payload: Partial<{
      scheduledAt: string;
      type: HearingType;
      status: HearingStatus;
      agenda: string;
      notes: string;
    }>,
  ) {
    const hearing = this.requireHearing(hearingId);
    const caseRecord = this.requireCase(hearing.caseId);
    this.assertCaseManagementAccess(actor, caseRecord);

    if (payload.scheduledAt) {
      hearing.scheduledAt = new Date(payload.scheduledAt).toISOString();
    }

    Object.assign(hearing, this.compactObject({
      type: payload.type,
      status: payload.status,
      agenda: payload.agenda,
      notes: payload.notes,
    }));

    hearing.updatedAt = this.now();
    return this.serializeHearing(hearing);
  }

  deleteHearing(actor: RequestActor, hearingId: string) {
    const hearing = this.requireHearing(hearingId);
    const caseRecord = this.requireCase(hearing.caseId);
    this.assertCaseManagementAccess(actor, caseRecord);
    this.state.hearings = this.state.hearings.filter((entry) => entry.id !== hearing.id);
    return { id: hearing.id, deleted: true };
  }

  listDocuments(actor: RequestActor, filters: DocumentFilters = {}) {
    return this.state.documents
      .filter((document) => !filters.caseId || document.caseId === filters.caseId)
      .filter((document) => !filters.status || document.status === filters.status)
      .filter((document) => !filters.type || document.type === filters.type)
      .filter((document) => this.canSeeCase(actor, this.requireCase(document.caseId)))
      .map((document) => this.serializeDocument(document));
  }

  createDocument(
    actor: RequestActor,
    payload: {
      caseId: string;
      title: string;
      description?: string;
      type: DocumentType;
      fileName: string;
      content?: string;
    },
  ) {
    const caseRecord = this.requireCase(payload.caseId);
    if (!this.canSeeCase(actor, caseRecord)) {
      throw new ForbiddenException('You cannot attach documents to this case.');
    }

    const document = this.createDocumentRecord({
      caseId: caseRecord.id,
      uploadedById: actor.id,
      uploaderRole: actor.role,
      type: payload.type,
      status: DocumentStatus.UPLOADED,
      title: payload.title,
      description: payload.description,
      fileName: payload.fileName,
      content: payload.content,
    });

    if (caseRecord.status === CaseStatus.OPEN || caseRecord.status === CaseStatus.ASSIGNED) {
      caseRecord.status = CaseStatus.EVIDENCE_REVIEW;
      caseRecord.updatedAt = this.now();
    }

    [caseRecord.customerId, caseRecord.providerId, caseRecord.arbitratorId].filter(Boolean).forEach((recipientId) => {
      if (recipientId === actor.id) return;
      this.appendNotification(
        recipientId as string,
        'New case document',
        `${payload.title} was added to case ${caseRecord.id}.`,
        NotificationTone.INFO,
        'document',
        document.id,
      );
    });

    return this.serializeDocument(document);
  }

  updateDocument(
    actor: RequestActor,
    documentId: string,
    payload: Partial<{
      title: string;
      description: string;
      type: DocumentType;
      status: DocumentStatus;
      fileName: string;
      content: string;
    }>,
  ) {
    const document = this.requireDocument(documentId);
    const caseRecord = this.requireCase(document.caseId);
    this.assertDocumentEditable(actor, caseRecord, document);

    Object.assign(document, this.compactObject(payload));
    document.updatedAt = this.now();
    return this.serializeDocument(document);
  }

  deleteDocument(actor: RequestActor, documentId: string) {
    const document = this.requireDocument(documentId);
    const caseRecord = this.requireCase(document.caseId);
    this.assertDocumentEditable(actor, caseRecord, document);
    this.state.documents = this.state.documents.filter((entry) => entry.id !== document.id);
    return { id: document.id, deleted: true };
  }

  listAwards(actor: RequestActor, filters: AwardFilters = {}) {
    return this.state.awards
      .filter((award) => !filters.caseId || award.caseId === filters.caseId)
      .filter((award) => !filters.status || award.status === filters.status)
      .filter((award) => this.canSeeCase(actor, this.requireCase(award.caseId)))
      .map((award) => this.serializeAward(award));
  }

  createAward(
    actor: RequestActor,
    payload: {
      caseId: string;
      title: string;
      summary: string;
      status?: AwardStatus;
      decision?: AwardDecision;
    },
  ) {
    const caseRecord = this.requireCase(payload.caseId);
    this.assertCaseManagementAccess(actor, caseRecord);

    if (!caseRecord.arbitratorId) {
      throw new ConflictException('Assign an arbitrator before issuing an award.');
    }

    if (payload.status === AwardStatus.ISSUED) {
      if (!payload.decision) {
        throw new BadRequestException('decision is required when issuing an award.');
      }

      const issuableStatuses = [
        CaseStatus.HEARING_SCHEDULED,
        CaseStatus.EVIDENCE_REVIEW,
        CaseStatus.UNDER_REVIEW,
      ];

      if (!issuableStatuses.includes(caseRecord.status)) {
        throw new ConflictException('Award can only be issued after review or hearing.');
      }
    }

    const award = this.createAwardRecord({
      caseId: caseRecord.id,
      arbitratorId: caseRecord.arbitratorId,
      title: payload.title,
      summary: payload.summary,
      status: payload.status || AwardStatus.DRAFT,
      decision: payload.decision,
      decisionDate: payload.status === AwardStatus.ISSUED ? this.now() : undefined,
    });

    if (award.status === AwardStatus.ISSUED) {
      this.applyAwardDecision(caseRecord, award.decision, actor);
      caseRecord.status = CaseStatus.RESOLVED;
      caseRecord.resolutionSummary = payload.summary;
      caseRecord.updatedAt = this.now();
    }

    [caseRecord.customerId, caseRecord.providerId, caseRecord.arbitratorId].filter(Boolean).forEach((recipientId) => {
      this.appendNotification(
        recipientId as string,
        'Award updated',
        `${payload.title} was recorded for case ${caseRecord.id}.`,
        NotificationTone.INFO,
        'award',
        award.id,
      );
    });

    return this.serializeAward(award);
  }

  updateAward(
    actor: RequestActor,
    awardId: string,
    payload: Partial<{
      title: string;
      summary: string;
      status: AwardStatus;
      decision: AwardDecision;
    }>,
  ) {
    const award = this.requireAward(awardId);
    const caseRecord = this.requireCase(award.caseId);
    this.assertCaseManagementAccess(actor, caseRecord);

    if (payload.status === AwardStatus.ISSUED && !award.decisionDate) {
      const decision = payload.decision || award.decision;
      if (!decision) {
        throw new BadRequestException('decision is required when issuing an award.');
      }

      const issuableStatuses = [
        CaseStatus.HEARING_SCHEDULED,
        CaseStatus.EVIDENCE_REVIEW,
        CaseStatus.UNDER_REVIEW,
      ];

      if (!issuableStatuses.includes(caseRecord.status)) {
        throw new ConflictException('Award can only be issued after review or hearing.');
      }
    }

    if (payload.decision && award.decisionDate) {
      throw new ConflictException('Award decision cannot be changed after escrow is finalized.');
    }

    Object.assign(award, this.compactObject({
      title: payload.title,
      summary: payload.summary,
      status: payload.status,
      decision: payload.decision,
    }));

    if (payload.status === AwardStatus.ISSUED && !award.decisionDate) {
      this.applyAwardDecision(caseRecord, award.decision, actor);
      award.decisionDate = this.now();
      caseRecord.status = CaseStatus.RESOLVED;
      caseRecord.resolutionSummary = award.summary;
      caseRecord.updatedAt = this.now();
    }

    award.updatedAt = this.now();
    return this.serializeAward(award);
  }

  deleteAward(actor: RequestActor, awardId: string) {
    const award = this.requireAward(awardId);
    const caseRecord = this.requireCase(award.caseId);
    this.assertCaseManagementAccess(actor, caseRecord);

    if (award.status === AwardStatus.ISSUED || award.decisionDate) {
      throw new ConflictException('Issued awards cannot be deleted after escrow is finalized.');
    }

    this.state.notifications = this.state.notifications.filter(
      (notification) => !(notification.entityType === 'award' && notification.entityId === award.id),
    );
    this.state.awards = this.state.awards.filter((entry) => entry.id !== award.id);

    return { id: award.id, deleted: true };
  }

  listReviews(actor: RequestActor | undefined, filters: ReviewFilters = {}) {
    return this.state.reviews
      .filter((review) => !filters.serviceId || review.serviceId === filters.serviceId)
      .filter((review) => !filters.providerId || review.providerId === filters.providerId)
      .filter((review) => !filters.customerId || review.customerId === filters.customerId)
      .filter((review) => {
        if (!actor) return true;
        if (actor.role === Role.ADMIN) return true;
        if (actor.role === Role.CUSTOMER) return review.customerId === actor.id;
        if (actor.role === Role.PROVIDER) return review.providerId === actor.id;
        return false;
      })
      .map((review) => this.serializeReview(review));
  }

  createReview(
    actor: RequestActor,
    payload: {
      bookingId: string;
      rating: number;
      comment?: string;
    },
  ) {
    this.assertRoles(actor, [Role.CUSTOMER]);

    const booking = this.requireBooking(payload.bookingId);
    if (booking.customerId !== actor.id) {
      throw new ForbiddenException('You can only review your own booking.');
    }

    if (booking.status !== BookingStatus.COMPLETED || booking.escrowStatus !== EscrowStatus.RELEASED) {
      throw new ConflictException('Reviews are allowed only after completed bookings with released escrow.');
    }

    if (this.state.reviews.some((review) => review.bookingId === booking.id)) {
      throw new ConflictException('This booking has already been reviewed.');
    }

    const review = this.createReviewRecord({
      bookingId: booking.id,
      serviceId: booking.serviceId,
      customerId: booking.customerId,
      providerId: booking.providerId,
      rating: payload.rating,
      comment: payload.comment,
    });

    this.recalculateServiceRating(booking.serviceId);
    this.recalculateProviderRating(booking.providerId);

    this.appendNotification(
      booking.providerId,
      'New service review',
      `A customer rated booking ${booking.id}.`,
      NotificationTone.INFO,
      'service',
      booking.serviceId,
    );

    return this.serializeReview(review);
  }

  deleteReview(actor: RequestActor, reviewId: string) {
    const review = this.state.reviews.find((entry) => entry.id === reviewId);
    if (!review) {
      throw new NotFoundException(`Review ${reviewId} was not found.`);
    }

    if (actor.role !== Role.ADMIN && review.customerId !== actor.id) {
      throw new ForbiddenException('You can only delete your own reviews.');
    }

    this.state.reviews = this.state.reviews.filter((entry) => entry.id !== review.id);
    this.recalculateServiceRating(review.serviceId);
    this.recalculateProviderRating(review.providerId);

    return { id: review.id, deleted: true };
  }

  runWorkflowCleanup(actor: RequestActor) {
    this.assertRoles(actor, [Role.ADMIN]);

    const now = Date.now();
    const summary = {
      abandonedBookingsCancelled: 0,
      escrowBookingsAutoReleased: 0,
    };

    this.state.bookings.forEach((booking) => {
      const scheduledAt = new Date(booking.scheduledAt).getTime();
      const updatedAt = new Date(booking.updatedAt).getTime();

      if (
        booking.status === BookingStatus.REQUESTED &&
        booking.escrowStatus === EscrowStatus.NOT_LOCKED &&
        now - updatedAt > this.requestedBookingExpiryHours * 60 * 60 * 1000
      ) {
        booking.status = BookingStatus.CANCELLED;
        booking.cancellationReason = 'Auto-cancelled because provider did not confirm in time.';
        booking.updatedAt = this.now();
        this.createBookingEvent(booking.id, BookingStatus.CANCELLED, 'system', Role.ADMIN, booking.cancellationReason);
        summary.abandonedBookingsCancelled += 1;
      }

      if (
        booking.status === BookingStatus.CONFIRMED &&
        booking.escrowStatus === EscrowStatus.FUNDS_LOCKED &&
        now - scheduledAt > this.escrowAutoReleaseHours * 60 * 60 * 1000
      ) {
        booking.status = BookingStatus.COMPLETED;
        booking.escrowStatus = EscrowStatus.RELEASED;
        booking.lastStatusNote = 'Auto-released after service completion timeout.';
        booking.updatedAt = this.now();
        this.createBookingEvent(booking.id, BookingStatus.COMPLETED, 'system', Role.ADMIN, booking.lastStatusNote);
        summary.escrowBookingsAutoReleased += 1;
      }
    });

    return summary;
  }

  getSettings(actor: RequestActor) {
    this.assertRoles(actor, [Role.ADMIN]);
    return this.cloneSettings();
  }

  updateSettings(actor: RequestActor, payload: SettingsPatch) {
    this.assertRoles(actor, [Role.ADMIN]);
    const nextSettings = this.cloneSettings();

    if (payload.general) {
      Object.assign(nextSettings.general, this.compactObject(payload.general));
    }
    if (payload.arbitration) {
      Object.assign(nextSettings.arbitration, this.compactObject(payload.arbitration));
    }
    if (payload.userManagement) {
      Object.assign(nextSettings.userManagement, this.compactObject(payload.userManagement));
    }
    if (payload.notifications) {
      Object.assign(nextSettings.notifications, this.compactObject(payload.notifications));
    }
    if (payload.security) {
      Object.assign(nextSettings.security, this.compactObject(payload.security));
    }

    nextSettings.updatedAt = this.now();
    this.state.settings = nextSettings;
    return this.cloneSettings();
  }

  listNotifications(actor: RequestActor) {
    return this.state.notifications
      .filter((notification) => notification.recipientId === actor.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((notification) => ({ ...notification }));
  }

  updateNotification(actor: RequestActor, notificationId: string, read: boolean) {
    const notification = this.state.notifications.find((entry) => entry.id === notificationId);
    if (!notification || notification.recipientId !== actor.id) {
      throw new NotFoundException('Notification not found.');
    }
    notification.read = read;
    notification.updatedAt = this.now();
    return { ...notification };
  }

  bulkUpdateNotifications(actor: RequestActor, read: boolean, ids?: string[]) {
    const set = new Set(ids || []);
    const notifications = this.state.notifications.filter((notification) => {
      if (notification.recipientId !== actor.id) return false;
      if (!set.size) return true;
      return set.has(notification.id);
    });

    notifications.forEach((notification) => {
      notification.read = read;
      notification.updatedAt = this.now();
    });

    return notifications.map((notification) => ({ ...notification }));
  }

  getDashboard(actor: RequestActor) {
    switch (actor.role) {
      case Role.CUSTOMER:
        return this.getCustomerDashboard(actor);
      case Role.PROVIDER:
        return this.getProviderDashboard(actor);
      case Role.ADMIN:
        return this.getAdminDashboard();
      case Role.ARBITRATOR:
        return this.getArbitratorDashboard(actor);
      default:
        throw new ForbiddenException('Unsupported role.');
    }
  }

  createJobRequest(payload: {
    name: string;
    email: string;
    phone?: string;
    serviceCategory: string;
    description: string;
    budget?: number;
  }) {
    return this.createJobRequestRecord(payload);
  }

  createContactMessage(payload: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) {
    return this.createContactMessageRecord(payload);
  }

  createWaitlistEntry(payload: {
    name?: string;
    email: string;
    city?: string;
    serviceCategory?: string;
  }) {
    return this.createWaitlistEntryRecord({
      name: payload.name || 'Interested User',
      email: payload.email,
      city: payload.city || 'Unspecified',
      serviceCategory: payload.serviceCategory,
    });
  }

  private updateUserInternal(
    actor: RequestActor,
    userId: string,
    payload: Partial<{
      name: string;
      email: string;
      phone: string;
      avatarUrl: string;
      password: string;
      isActive: boolean;
      city: string;
      address: string;
      preferredCategories: string[];
      bio: string;
      businessName: string;
      category: string;
      serviceArea: string;
      experienceLevel: string;
      specialization: string;
      experienceYears: number;
      approvalStatus: ApplicationStatus;
      title: string;
    }>,
    isAdminPath: boolean,
  ) {
    if (isAdminPath) {
      this.assertRoles(actor, [Role.ADMIN]);
    } else if (actor.id !== userId) {
      throw new ForbiddenException('You can only update your own profile.');
    }

    const user = this.requireUser(userId);

    if (payload.email && payload.email.toLowerCase() !== user.email.toLowerCase()) {
      this.assertEmailAvailable(payload.email, user.id);
      user.email = payload.email.trim().toLowerCase();
    }

    Object.assign(
      user,
      this.compactObject({
        name: payload.name,
        phone: payload.phone,
        avatarUrl: payload.avatarUrl,
        password: payload.password,
        isActive: payload.isActive,
      }),
    );
    user.updatedAt = this.now();

    if (user.role === Role.CUSTOMER) {
      const profile = this.requireCustomerProfile(user.id);
      Object.assign(
        profile,
        this.compactObject({
          city: payload.city,
          address: payload.address,
          preferredCategories: payload.preferredCategories,
          bio: payload.bio,
        }),
      );
      profile.updatedAt = this.now();
    }

    if (user.role === Role.PROVIDER) {
      const profile = this.requireProviderProfile(user.id);
      Object.assign(
        profile,
        this.compactObject({
          businessName: payload.businessName,
          category: payload.category,
          city: payload.city,
          serviceArea: payload.serviceArea,
          experienceLevel: payload.experienceLevel,
          bio: payload.bio,
        }),
      );
      profile.updatedAt = this.now();
    }

    if (user.role === Role.ARBITRATOR) {
      const profile = this.requireArbitratorProfile(user.id);
      Object.assign(
        profile,
        this.compactObject({
          specialization: payload.specialization,
          experienceYears: payload.experienceYears,
          bio: payload.bio,
          approvalStatus: payload.approvalStatus,
        }),
      );
      profile.updatedAt = this.now();

      if (payload.approvalStatus) {
        const application = this.state.arbitratorApplications.find((entry) => entry.userId === user.id);
        if (application) {
          application.status = payload.approvalStatus;
          application.updatedAt = this.now();
        }
      }
    }

    if (user.role === Role.ADMIN) {
      const profile = this.requireAdminProfile(user.id);
      Object.assign(profile, this.compactObject({ title: payload.title }));
      profile.updatedAt = this.now();
    }

    return this.serializeUser(user);
  }

  private getCustomerDashboard(actor: RequestActor) {
    const bookings = this.state.bookings.filter((booking) => booking.customerId === actor.id);
    const cases = this.state.cases.filter((caseRecord) => caseRecord.customerId === actor.id);
    const notifications = this.listNotifications(actor);

    return {
      metrics: {
        totalBookings: bookings.length,
        upcomingBookings: bookings.filter((booking) =>
          [BookingStatus.REQUESTED, BookingStatus.CONFIRMED].includes(booking.status),
        ).length,
        openCases: cases.filter((caseRecord) => caseRecord.status !== CaseStatus.CLOSED).length,
        unreadNotifications: notifications.filter((notification) => !notification.read).length,
      },
      recentBookings: bookings.slice(-5).reverse().map((booking) => this.serializeBooking(booking)),
      recentCases: cases.slice(-5).reverse().map((caseRecord) => this.serializeCase(caseRecord)),
      recommendedServices: this.listServices({}, actor).slice(0, 6),
    };
  }

  private getProviderDashboard(actor: RequestActor) {
    const services = this.state.services.filter((service) => service.providerId === actor.id);
    const bookings = this.state.bookings.filter((booking) => booking.providerId === actor.id);
    const cases = this.state.cases.filter((caseRecord) => caseRecord.providerId === actor.id);
    const earnings = bookings
      .filter((booking) => booking.status === BookingStatus.COMPLETED)
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return {
      metrics: {
        totalServices: services.length,
        openBookings: bookings.filter((booking) =>
          [BookingStatus.REQUESTED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status),
        ).length,
        completedBookings: bookings.filter((booking) => booking.status === BookingStatus.COMPLETED).length,
        openCases: cases.filter((caseRecord) => caseRecord.status !== CaseStatus.CLOSED).length,
        earnings,
      },
      services: services.map((service) => this.serializeService(service)),
      recentBookings: bookings.slice(-5).reverse().map((booking) => this.serializeBooking(booking)),
      recentCases: cases.slice(-5).reverse().map((caseRecord) => this.serializeCase(caseRecord)),
    };
  }

  private getAdminDashboard() {
    const pendingApplications = this.state.arbitratorApplications.filter(
      (application) => application.status === ApplicationStatus.PENDING,
    );

    return {
      metrics: {
        totalUsers: this.state.users.length,
        totalServices: this.state.services.length,
        totalBookings: this.state.bookings.length,
        openCases: this.state.cases.filter((caseRecord) => caseRecord.status !== CaseStatus.CLOSED).length,
        pendingApplications: pendingApplications.length,
      },
      recentCases: this.state.cases.slice(-5).reverse().map((caseRecord) => this.serializeCase(caseRecord)),
      pendingApplications,
      recentBookings: this.state.bookings.slice(-5).reverse().map((booking) => this.serializeBooking(booking)),
    };
  }

  private getArbitratorDashboard(actor: RequestActor) {
    const cases = this.state.cases.filter((caseRecord) => caseRecord.arbitratorId === actor.id);
    const hearings = this.state.hearings.filter((hearing) => hearing.arbitratorId === actor.id);
    const awards = this.state.awards.filter((award) => award.arbitratorId === actor.id);
    const notifications = this.listNotifications(actor);

    return {
      metrics: {
        assignedCases: cases.length,
        hearingsScheduled: hearings.filter((hearing) => hearing.status === HearingStatus.SCHEDULED).length,
        draftAwards: awards.filter((award) => award.status === AwardStatus.DRAFT).length,
        unreadNotifications: notifications.filter((notification) => !notification.read).length,
      },
      cases: cases.slice(-5).reverse().map((caseRecord) => this.serializeCase(caseRecord)),
      hearings: hearings.slice(-5).reverse().map((hearing) => this.serializeHearing(hearing)),
      awards: awards.slice(-5).reverse().map((award) => this.serializeAward(award)),
    };
  }

  private serializeUser(user: UserRecord) {
    return {
      ...user,
      profile: this.getProfileForUser(user.id, user.role),
    };
  }

  private serializeService(service: ServiceRecord) {
    const provider = this.requireUser(service.providerId);
    const profile = this.requireProviderProfile(service.providerId);
    return {
      ...service,
      providerName: provider.name,
      providerEmail: provider.email,
      providerPhone: provider.phone,
      businessName: profile.businessName,
      providerCategory: profile.category,
    };
  }

  private serializeBooking(booking: BookingRecord) {
    const service = this.requireService(booking.serviceId);
    const customer = this.requireUser(booking.customerId);
    const provider = this.requireUser(booking.providerId);

    return {
      ...booking,
      service: this.serializeService(service),
      customer: this.serializeUser(customer),
      provider: this.serializeUser(provider),
      events: this.state.bookingEvents
        .filter((event) => event.bookingId === booking.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((event) => ({ ...event })),
    };
  }

  private serializeCase(caseRecord: CaseRecord) {
    const booking = this.requireBooking(caseRecord.bookingId);
    const customer = this.requireUser(caseRecord.customerId);
    const provider = this.requireUser(caseRecord.providerId);
    const arbitrator = caseRecord.arbitratorId ? this.requireUser(caseRecord.arbitratorId) : null;

    return {
      ...caseRecord,
      booking: this.serializeBooking(booking),
      customer: this.serializeUser(customer),
      provider: this.serializeUser(provider),
      arbitrator: arbitrator ? this.serializeUser(arbitrator) : null,
      messages: this.state.caseMessages
        .filter((message) => message.caseId === caseRecord.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((message) => ({ ...message })),
    };
  }

  private serializeHearing(hearing: HearingRecord) {
    const arbitrator = this.requireUser(hearing.arbitratorId);
    return {
      ...hearing,
      case: this.serializeCase(this.requireCase(hearing.caseId)),
      arbitrator: this.serializeUser(arbitrator),
    };
  }

  private serializeDocument(document: DocumentRecord) {
    const uploader = this.requireUser(document.uploadedById);
    return {
      ...document,
      uploader: this.serializeUser(uploader),
      case: this.serializeCase(this.requireCase(document.caseId)),
    };
  }

  private serializeAward(award: AwardRecord) {
    const arbitrator = this.requireUser(award.arbitratorId);
    return {
      ...award,
      arbitrator: this.serializeUser(arbitrator),
      case: this.serializeCase(this.requireCase(award.caseId)),
    };
  }

  private serializeReview(review: ReviewRecord) {
    return {
      ...review,
      service: this.serializeService(this.requireService(review.serviceId)),
      customer: this.serializeUser(this.requireUser(review.customerId)),
      provider: this.serializeUser(this.requireUser(review.providerId)),
    };
  }

  private getProfileForUser(userId: string, role: Role) {
    switch (role) {
      case Role.CUSTOMER:
        return this.requireCustomerProfile(userId);
      case Role.PROVIDER:
        return this.requireProviderProfile(userId);
      case Role.ARBITRATOR:
        return this.requireArbitratorProfile(userId);
      case Role.ADMIN:
        return this.requireAdminProfile(userId);
      default:
        return null;
    }
  }

  private assertBookingStatusTransition(actor: RequestActor, booking: BookingRecord, nextStatus: BookingStatus) {
    if (actor.role === Role.ADMIN) return;

    if (actor.role === Role.CUSTOMER) {
      if (booking.customerId !== actor.id) {
        throw new ForbiddenException('You cannot change another customer’s booking.');
      }
      if (nextStatus !== BookingStatus.CANCELLED) {
        throw new ForbiddenException('Customers can only cancel their bookings.');
      }
      if (![BookingStatus.REQUESTED, BookingStatus.CONFIRMED].includes(booking.status)) {
        throw new ConflictException('Only requested or confirmed bookings can be cancelled.');
      }
      return;
    }

    if (actor.role === Role.PROVIDER) {
      if (booking.providerId !== actor.id) {
        throw new ForbiddenException('You cannot change another provider’s booking.');
      }

      const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
        [BookingStatus.REQUESTED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
        [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
        [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
        [BookingStatus.COMPLETED]: [],
        [BookingStatus.CANCELLED]: [],
        [BookingStatus.DISPUTED]: [],
      };

      if (!allowedTransitions[booking.status].includes(nextStatus)) {
        throw new ConflictException('This booking status change is not allowed.');
      }
      return;
    }

    throw new ForbiddenException('This role cannot change booking status.');
  }

  private applyEscrowTransition(booking: BookingRecord, nextStatus: BookingStatus) {
    if ([EscrowStatus.RELEASED, EscrowStatus.REFUNDED].includes(booking.escrowStatus)) {
      if (booking.status !== nextStatus) {
        throw new ConflictException('Escrow has already been finalized for this booking.');
      }
      return;
    }

    if (nextStatus === BookingStatus.CONFIRMED) {
      booking.escrowStatus = EscrowStatus.FUNDS_LOCKED;
      return;
    }

    if (nextStatus === BookingStatus.COMPLETED) {
      if (booking.escrowStatus !== EscrowStatus.FUNDS_LOCKED) {
        throw new ConflictException('Funds must be locked before completion.');
      }
      booking.escrowStatus = EscrowStatus.RELEASED;
      return;
    }

    if (nextStatus === BookingStatus.CANCELLED && booking.escrowStatus === EscrowStatus.FUNDS_LOCKED) {
      booking.escrowStatus = EscrowStatus.REFUNDED;
    }
  }

  private applyAwardDecision(caseRecord: CaseRecord, decision: AwardDecision | undefined, actor: RequestActor) {
    if (!decision) {
      throw new BadRequestException('decision is required when issuing an award.');
    }

    const booking = this.requireBooking(caseRecord.bookingId);
    if (booking.escrowStatus !== EscrowStatus.FUNDS_LOCKED) {
      throw new ConflictException('Escrow must be locked before an award decision can finalize funds.');
    }

    if (decision === AwardDecision.RELEASE_TO_PROVIDER) {
      booking.escrowStatus = EscrowStatus.RELEASED;
      booking.status = BookingStatus.COMPLETED;
      booking.lastStatusNote = 'Funds released by arbitrator award.';
      this.createBookingEvent(booking.id, BookingStatus.COMPLETED, actor.id, actor.role, booking.lastStatusNote);
    }

    if (decision === AwardDecision.REFUND_TO_CUSTOMER) {
      booking.escrowStatus = EscrowStatus.REFUNDED;
      booking.status = BookingStatus.CANCELLED;
      booking.cancellationReason = 'Refunded by arbitrator award.';
      this.createBookingEvent(booking.id, BookingStatus.CANCELLED, actor.id, actor.role, booking.cancellationReason);
    }

    booking.updatedAt = this.now();
  }

  private assertCaseManagementAccess(actor: RequestActor, caseRecord: CaseRecord) {
    if (actor.role === Role.ADMIN) return;
    if (actor.role === Role.ARBITRATOR && caseRecord.arbitratorId === actor.id) return;
    throw new ForbiddenException('Only admins and the assigned arbitrator can manage this case.');
  }

  private assertDocumentEditable(actor: RequestActor, caseRecord: CaseRecord, document: DocumentRecord) {
    if (actor.role === Role.ADMIN) return;
    if (document.uploadedById === actor.id) return;
    if (actor.role === Role.ARBITRATOR && caseRecord.arbitratorId === actor.id) return;
    throw new ForbiddenException('You cannot edit this document.');
  }

  private assertServiceEditable(actor: RequestActor, service: ServiceRecord) {
    if (actor.role === Role.ADMIN) return;
    if (actor.role === Role.PROVIDER && service.providerId === actor.id) return;
    throw new ForbiddenException('You cannot manage this service.');
  }

  private canSeeBooking(actor: RequestActor, booking: BookingRecord) {
    if (actor.role === Role.ADMIN) return true;
    if (actor.role === Role.CUSTOMER) return booking.customerId === actor.id;
    if (actor.role === Role.PROVIDER) return booking.providerId === actor.id;
    if (actor.role === Role.ARBITRATOR) {
      return this.state.cases.some(
        (caseRecord) => caseRecord.bookingId === booking.id && caseRecord.arbitratorId === actor.id,
      );
    }
    return false;
  }

  private canSeeCase(actor: RequestActor, caseRecord: CaseRecord) {
    if (actor.role === Role.ADMIN) return true;
    if (actor.role === Role.CUSTOMER) return caseRecord.customerId === actor.id;
    if (actor.role === Role.PROVIDER) return caseRecord.providerId === actor.id;
    if (actor.role === Role.ARBITRATOR) return caseRecord.arbitratorId === actor.id;
    return false;
  }

  private requireUser(userId: string) {
    const user = this.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`);
    }
    return user;
  }

  private requireService(serviceId: string) {
    const service = this.state.services.find((entry) => entry.id === serviceId);
    if (!service) {
      throw new NotFoundException(`Service ${serviceId} was not found.`);
    }
    return service;
  }

  private requireBooking(bookingId: string) {
    const booking = this.state.bookings.find((entry) => entry.id === bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} was not found.`);
    }
    return booking;
  }

  private requireCase(caseId: string) {
    const caseRecord = this.state.cases.find((entry) => entry.id === caseId);
    if (!caseRecord) {
      throw new NotFoundException(`Case ${caseId} was not found.`);
    }
    return caseRecord;
  }

  private requireHearing(hearingId: string) {
    const hearing = this.state.hearings.find((entry) => entry.id === hearingId);
    if (!hearing) {
      throw new NotFoundException(`Hearing ${hearingId} was not found.`);
    }
    return hearing;
  }

  private requireDocument(documentId: string) {
    const document = this.state.documents.find((entry) => entry.id === documentId);
    if (!document) {
      throw new NotFoundException(`Document ${documentId} was not found.`);
    }
    return document;
  }

  private requireAward(awardId: string) {
    const award = this.state.awards.find((entry) => entry.id === awardId);
    if (!award) {
      throw new NotFoundException(`Award ${awardId} was not found.`);
    }
    return award;
  }

  private requireCustomerProfile(userId: string) {
    const profile = this.state.customerProfiles.find((entry) => entry.userId === userId);
    if (!profile) {
      throw new NotFoundException(`Customer profile ${userId} was not found.`);
    }
    return profile;
  }

  private requireProviderProfile(userId: string) {
    const profile = this.state.providerProfiles.find((entry) => entry.userId === userId);
    if (!profile) {
      throw new NotFoundException(`Provider profile ${userId} was not found.`);
    }
    return profile;
  }

  private requireArbitratorProfile(userId: string) {
    const profile = this.state.arbitratorProfiles.find((entry) => entry.userId === userId);
    if (!profile) {
      throw new NotFoundException(`Arbitrator profile ${userId} was not found.`);
    }
    return profile;
  }

  private requireAdminProfile(userId: string) {
    const profile = this.state.adminProfiles.find((entry) => entry.userId === userId);
    if (!profile) {
      throw new NotFoundException(`Admin profile ${userId} was not found.`);
    }
    return profile;
  }

  private assertRoles(actor: RequestActor, roles: Role[]) {
    if (!roles.includes(actor.role)) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
  }

  private assertEmailAvailable(email: string, ignoreUserId?: string) {
    const exists = this.state.users.some(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.id !== ignoreUserId,
    );
    if (exists) {
      throw new ConflictException('An account with that email already exists.');
    }
  }

  private getUsersByRole(role: Role) {
    return this.state.users.filter((user) => user.role === role);
  }

  private findAvailableArbitrator() {
    const approvedArbitrators = this.state.users.filter((user) => {
      if (user.role !== Role.ARBITRATOR || !user.isActive) return false;
      const profile = this.state.arbitratorProfiles.find((entry) => entry.userId === user.id);
      return profile?.approvalStatus === ApplicationStatus.APPROVED;
    });

    return approvedArbitrators
      .map((user) => ({
        user,
        openCaseCount: this.state.cases.filter(
          (caseRecord) => caseRecord.arbitratorId === user.id && ![CaseStatus.RESOLVED, CaseStatus.CLOSED].includes(caseRecord.status),
        ).length,
      }))
      .sort((left, right) => left.openCaseCount - right.openCaseCount)[0]?.user;
  }

  private recalculateServiceRating(serviceId: string) {
    const service = this.requireService(serviceId);
    const reviews = this.state.reviews.filter((review) => review.serviceId === serviceId);
    if (!reviews.length) return;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    service.rating = Number((total / reviews.length).toFixed(1));
    service.reviewCount = reviews.length;
    service.updatedAt = this.now();
  }

  private recalculateProviderRating(providerId: string) {
    const profile = this.requireProviderProfile(providerId);
    const reviews = this.state.reviews.filter((review) => review.providerId === providerId);
    if (!reviews.length) return;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    profile.rating = Number((total / reviews.length).toFixed(1));
    profile.updatedAt = this.now();
  }

  private appendNotification(
    recipientId: string,
    title: string,
    body: string,
    tone: NotificationTone,
    entityType: NotificationRecord['entityType'],
    entityId: string,
  ) {
    const user = this.requireUser(recipientId);
    const notification = this.buildRecord<NotificationRecord>('notification', {
      recipientId,
      recipientRole: user.role,
      title,
      body,
      tone,
      read: false,
      entityType,
      entityId,
    });
    this.state.notifications.push(notification);
    this.state.notifications = this.trimCollection(this.state.notifications, 500);
    return notification;
  }

  private createBookingEvent(
    bookingId: string,
    status: BookingStatus,
    actorId: string,
    actorRole: Role,
    note?: string,
  ) {
    const event = this.buildRecord<BookingStatusEventRecord>('booking_event', {
      bookingId,
      status,
      actorId,
      actorRole,
      note,
    });
    this.state.bookingEvents.push(event);
    this.state.bookingEvents = this.trimCollection(this.state.bookingEvents, 1000);
    return event;
  }

  private createCaseMessage(caseId: string, authorId: string, authorRole: Role, message: string) {
    const entry = this.buildRecord<CaseMessageRecord>('case_message', {
      caseId,
      authorId,
      authorRole,
      message,
    });
    this.state.caseMessages.push(entry);
    this.state.caseMessages = this.trimCollection(this.state.caseMessages, 1000);
    return entry;
  }

  private createUser(input: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const user = this.buildRecord<UserRecord>('user', input);
    this.state.users.push(user);
    return user;
  }

  private createCustomerProfile(input: Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const profile = this.buildRecord<CustomerProfile>('profile', input);
    this.state.customerProfiles.push(profile);
    return profile;
  }

  private createProviderProfile(input: Omit<ProviderProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const profile = this.buildRecord<ProviderProfile>('profile', input);
    this.state.providerProfiles.push(profile);
    return profile;
  }

  private createArbitratorProfile(input: Omit<ArbitratorProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const profile = this.buildRecord<ArbitratorProfile>('profile', input);
    this.state.arbitratorProfiles.push(profile);
    return profile;
  }

  private createAdminProfile(input: Omit<AdminProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const profile = this.buildRecord<AdminProfile>('profile', input);
    this.state.adminProfiles.push(profile);
    return profile;
  }

  private createServiceRecord(input: Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<ServiceRecord>('service', input);
    this.state.services.push(record);
    return record;
  }

  private createBookingRecord(input: Omit<BookingRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<BookingRecord>('booking', input);
    this.state.bookings.push(record);
    return record;
  }

  private createCaseRecord(input: Omit<CaseRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<CaseRecord>('case', input);
    this.state.cases.push(record);
    return record;
  }

  private createHearingRecord(input: Omit<HearingRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<HearingRecord>('hearing', input);
    this.state.hearings.push(record);
    return record;
  }

  private createDocumentRecord(input: Omit<DocumentRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<DocumentRecord>('document', input);
    this.state.documents.push(record);
    return record;
  }

  private createAwardRecord(input: Omit<AwardRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<AwardRecord>('award', input);
    this.state.awards.push(record);
    return record;
  }

  private createReviewRecord(input: Omit<ReviewRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<ReviewRecord>('review', input);
    this.state.reviews.push(record);
    return record;
  }

  private createJobRequestRecord(input: Omit<JobRequestRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<JobRequestRecord>('job_request', input);
    this.state.jobRequests.push(record);
    this.state.jobRequests = this.trimCollection(this.state.jobRequests, 500);
    return record;
  }

  private createContactMessageRecord(input: Omit<ContactMessageRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<ContactMessageRecord>('contact', input);
    this.state.contactMessages.push(record);
    this.state.contactMessages = this.trimCollection(this.state.contactMessages, 500);
    return record;
  }

  private createWaitlistEntryRecord(input: Omit<WaitlistEntryRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<WaitlistEntryRecord>('waitlist', input);
    this.state.waitlistEntries.push(record);
    this.state.waitlistEntries = this.trimCollection(this.state.waitlistEntries, 500);
    return record;
  }

  private createArbitratorApplication(input: Omit<ArbitratorApplicationRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const record = this.buildRecord<ArbitratorApplicationRecord>('application', input);
    this.state.arbitratorApplications.push(record);
    return record;
  }

  private buildRecord<T>(prefix: string, input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const timestamp = this.now();
    return {
      id: this.nextId(prefix),
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(input as object),
    } as unknown as T;
  }

  private nextId(prefix: string) {
    const current = this.counters.get(prefix) || 1;
    this.counters.set(prefix, current + 1);
    return `${prefix}_${current}`;
  }

  private now() {
    return new Date().toISOString();
  }

  private humanizeToken(value: string) {
    return value.replace(/_/g, ' ');
  }

  private compactObject<T extends object>(payload: T) {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
  }

  private trimCollection<T>(items: T[], maxSize = 500) {
    if (items.length <= maxSize) return items;
    return items.slice(items.length - maxSize);
  }

  private cloneSettings() {
    return JSON.parse(JSON.stringify(this.state.settings)) as PlatformSettings;
  }

  private createSeedState(): StoreState {
    const now = new Date('2026-04-24T09:00:00.000Z').toISOString();
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
        scheduledAt: '2026-04-28T09:30:00.000Z',
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
        scheduledAt: '2026-04-20T10:00:00.000Z',
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
        scheduledAt: '2026-04-18T13:30:00.000Z',
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
        scheduledAt: '2026-04-30T11:00:00.000Z',
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
      }),
    ];

    const reviews: ReviewRecord[] = [];

    const notifications: NotificationRecord[] = [
      stamp<NotificationRecord>('notification_13001', {
        recipientId: 'user_2001',
        recipientRole: Role.CUSTOMER,
        title: 'Booking confirmed',
        body: 'Your deep cleaning booking is confirmed for April 28.',
        tone: NotificationTone.SUCCESS,
        read: false,
        entityType: 'booking',
        entityId: 'booking_6001',
      }),
      stamp<NotificationRecord>('notification_13002', {
        recipientId: 'user_3001',
        recipientRole: Role.PROVIDER,
        title: 'Upcoming job',
        body: 'Premium Home Deep Cleaning is scheduled for April 28.',
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
}
