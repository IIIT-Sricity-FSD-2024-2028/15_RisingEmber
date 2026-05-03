"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const common_1 = require("@nestjs/common");
const entities_1 = require("./entities");
let StoreService = class StoreService {
    constructor() {
        this.counters = new Map([
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
        this.escrowAutoReleaseHours = 72;
        this.requestedBookingExpiryHours = 24;
        this.state = this.createSeedState();
    }
    findUserById(id) {
        return this.state.users.find((user) => user.id === id);
    }
    login(role, email, password) {
        const user = this.state.users.find((entry) => entry.role === role && entry.email.toLowerCase() === email.toLowerCase().trim());
        if (!user || user.password !== password) {
            throw new common_1.UnauthorizedException('Invalid role, email, or password.');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('This account is not active.');
        }
        return {
            actorId: user.id,
            role: user.role,
            profileSummary: this.serializeUser(user),
        };
    }
    resetPassword(role, identifier, nextPassword) {
        const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
        const normalizedDigits = String(identifier || '').replace(/\D/g, '');
        const user = this.state.users.find((entry) => {
            if (entry.role !== role)
                return false;
            const emailMatches = entry.email.toLowerCase() === normalizedIdentifier;
            const phoneMatches = String(entry.phone || '').replace(/\D/g, '') === normalizedDigits;
            return emailMatches || (normalizedDigits.length >= 10 && phoneMatches);
        });
        if (!user) {
            throw new common_1.NotFoundException('No account was found for that role and identifier.');
        }
        user.password = String(nextPassword || '');
        user.updatedAt = this.now();
        return {
            actorId: user.id,
            role: user.role,
            profileSummary: this.serializeUser(user),
        };
    }
    registerCustomer(payload) {
        this.assertEmailAvailable(payload.email);
        const user = this.createUser({
            role: entities_1.Role.CUSTOMER,
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
        this.appendNotification(user.id, 'Customer account created', 'Your ServiceHub customer profile is ready.', entities_1.NotificationTone.SUCCESS, 'profile', user.id);
        return {
            actorId: user.id,
            role: user.role,
            profileSummary: this.serializeUser(user),
            profile,
        };
    }
    registerProvider(payload) {
        this.assertEmailAvailable(payload.email);
        const user = this.createUser({
            role: entities_1.Role.PROVIDER,
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
        this.getUsersByRole(entities_1.Role.ADMIN).forEach((admin) => {
            this.appendNotification(admin.id, 'New provider registered', `${user.name} has joined as a provider.`, entities_1.NotificationTone.INFO, 'profile', user.id);
        });
        return {
            actorId: user.id,
            role: user.role,
            profileSummary: this.serializeUser(user),
            profile,
        };
    }
    applyArbitrator(payload) {
        this.assertEmailAvailable(payload.email);
        const user = this.createUser({
            role: entities_1.Role.ARBITRATOR,
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
            approvalStatus: entities_1.ApplicationStatus.PENDING,
        });
        const application = this.createArbitratorApplication({
            userId: user.id,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            specialization: payload.specialization,
            experienceYears: payload.experienceYears,
            bio: payload.bio,
            status: entities_1.ApplicationStatus.PENDING,
        });
        this.getUsersByRole(entities_1.Role.ADMIN).forEach((admin) => {
            this.appendNotification(admin.id, 'Arbitrator application received', `${payload.name} submitted an arbitrator application.`, entities_1.NotificationTone.INFO, 'application', application.id);
        });
        return {
            actorId: user.id,
            role: user.role,
            profileSummary: this.serializeUser(user),
            profile,
            application,
        };
    }
    getMe(actor) {
        return this.serializeUser(this.requireUser(actor.id));
    }
    listUsers(actor, filters = {}) {
        this.assertRoles(actor, [entities_1.Role.ADMIN]);
        const query = (filters.q || '').trim().toLowerCase();
        return this.state.users
            .filter((user) => !filters.role || user.role === filters.role)
            .filter((user) => {
            if (!query)
                return true;
            return [user.name, user.email, user.phone || ''].some((value) => value.toLowerCase().includes(query));
        })
            .map((user) => this.serializeUser(user));
    }
    updateMe(actor, payload) {
        return this.updateUserInternal(actor, actor.id, payload, false);
    }
    updateUser(actor, userId, payload) {
        return this.updateUserInternal(actor, userId, payload, true);
    }
    listServices(filters = {}, actor) {
        const query = (filters.q || '').trim().toLowerCase();
        return this.state.services
            .filter((service) => {
            if (!actor || actor.role === entities_1.Role.CUSTOMER) {
                return service.status === entities_1.ServiceStatus.ACTIVE;
            }
            if (!filters.status)
                return true;
            return service.status === filters.status;
        })
            .filter((service) => !filters.category || service.category.toLowerCase() === filters.category.toLowerCase())
            .filter((service) => !filters.providerId || service.providerId === filters.providerId)
            .filter((service) => {
            if (!query)
                return true;
            const haystack = [service.title, service.description, service.category, service.location, service.tags.join(' ')]
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        })
            .map((service) => this.serializeService(service));
    }
    getServiceById(serviceId) {
        const service = this.requireService(serviceId);
        if (service.status !== entities_1.ServiceStatus.ACTIVE) {
            throw new common_1.NotFoundException(`Service ${serviceId} was not found.`);
        }
        return this.serializeService(service);
    }
    createService(actor, payload) {
        this.assertRoles(actor, [entities_1.Role.PROVIDER, entities_1.Role.ADMIN]);
        const providerId = actor.role === entities_1.Role.ADMIN ? payload.providerId || '' : actor.id;
        if (!providerId) {
            throw new common_1.BadRequestException('providerId is required when an admin creates a service.');
        }
        const provider = this.requireUser(providerId);
        if (provider.role !== entities_1.Role.PROVIDER) {
            throw new common_1.BadRequestException('Services can only belong to provider accounts.');
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
            status: payload.status ?? entities_1.ServiceStatus.ACTIVE,
            rating: 4.8,
            reviewCount: 0,
        });
        this.appendNotification(provider.id, 'Service published', `${service.title} is now available in your provider catalog.`, entities_1.NotificationTone.SUCCESS, 'service', service.id);
        if (service.status === entities_1.ServiceStatus.ACTIVE) {
            this.state.customerProfiles
                .filter((profile) => !profile.preferredCategories.length ||
                profile.preferredCategories.some((category) => category.toLowerCase() === service.category.toLowerCase()))
                .forEach((profile) => {
                this.appendNotification(profile.userId, 'New service available', `${service.title} is now available in ${service.category}.`, entities_1.NotificationTone.INFO, 'service', service.id);
            });
        }
        return this.serializeService(service);
    }
    updateService(actor, serviceId, payload) {
        const service = this.requireService(serviceId);
        this.assertServiceEditable(actor, service);
        Object.assign(service, this.compactObject(payload));
        service.updatedAt = this.now();
        return this.serializeService(service);
    }
    deleteService(actor, serviceId) {
        const service = this.requireService(serviceId);
        this.assertServiceEditable(actor, service);
        if (this.state.bookings.some((booking) => booking.serviceId === service.id)) {
            throw new common_1.ConflictException('This service has related bookings and cannot be deleted.');
        }
        this.state.services = this.state.services.filter((entry) => entry.id !== service.id);
        return { id: service.id, deleted: true };
    }
    listBookings(actor, filters = {}) {
        return this.state.bookings
            .filter((booking) => this.canSeeBooking(actor, booking))
            .filter((booking) => !filters.status || booking.status === filters.status)
            .filter((booking) => !filters.serviceId || booking.serviceId === filters.serviceId)
            .filter((booking) => {
            if (filters.caseLinked === undefined)
                return true;
            const hasCase = this.state.cases.some((caseRecord) => caseRecord.bookingId === booking.id);
            return filters.caseLinked ? hasCase : !hasCase;
        })
            .map((booking) => this.serializeBooking(booking));
    }
    getBooking(actor, bookingId) {
        const booking = this.requireBooking(bookingId);
        if (!this.canSeeBooking(actor, booking)) {
            throw new common_1.ForbiddenException('You cannot view this booking.');
        }
        return this.serializeBooking(booking);
    }
    createBooking(actor, payload) {
        this.assertRoles(actor, [entities_1.Role.CUSTOMER]);
        const service = this.requireService(payload.serviceId);
        if (service.status !== entities_1.ServiceStatus.ACTIVE) {
            throw new common_1.ConflictException('Only active services can be booked.');
        }
        const scheduledAt = new Date(payload.scheduledAt);
        if (Number.isNaN(scheduledAt.getTime())) {
            throw new common_1.BadRequestException('scheduledAt must be a valid ISO datetime string.');
        }
        const booking = this.createBookingRecord({
            serviceId: service.id,
            customerId: actor.id,
            providerId: service.providerId,
            scheduledAt: scheduledAt.toISOString(),
            status: entities_1.BookingStatus.REQUESTED,
            notes: payload.notes,
            address: payload.address,
            totalAmount: service.price,
            currency: service.currency,
            escrowStatus: entities_1.EscrowStatus.NOT_LOCKED,
        });
        this.createBookingEvent(booking.id, entities_1.BookingStatus.REQUESTED, actor.id, actor.role, 'Booking created');
        const customer = this.requireUser(actor.id);
        const provider = this.requireUser(service.providerId);
        this.appendNotification(provider.id, 'New booking request', `${customer.name} requested ${service.title}.`, entities_1.NotificationTone.INFO, 'booking', booking.id);
        this.appendNotification(customer.id, 'Booking requested', `Your booking request for ${service.title} has been sent.`, entities_1.NotificationTone.SUCCESS, 'booking', booking.id);
        return this.serializeBooking(booking);
    }
    updateBooking(actor, bookingId, payload) {
        const booking = this.requireBooking(bookingId);
        if (!this.canSeeBooking(actor, booking)) {
            throw new common_1.ForbiddenException('You cannot update this booking.');
        }
        if (payload.scheduledAt) {
            const nextDate = new Date(payload.scheduledAt);
            if (Number.isNaN(nextDate.getTime())) {
                throw new common_1.BadRequestException('scheduledAt must be a valid ISO datetime string.');
            }
            if (![entities_1.Role.ADMIN, entities_1.Role.CUSTOMER].includes(actor.role) && actor.id !== booking.providerId) {
                throw new common_1.ForbiddenException('Only the booking parties can reschedule a booking.');
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
                this.appendNotification(user.id, 'Booking updated', message, booking.status === entities_1.BookingStatus.CANCELLED ? entities_1.NotificationTone.WARNING : entities_1.NotificationTone.INFO, 'booking', booking.id);
            });
        }
        booking.updatedAt = this.now();
        return this.serializeBooking(booking);
    }
    listCases(actor, filters = {}) {
        return this.state.cases
            .filter((caseRecord) => this.canSeeCase(actor, caseRecord))
            .filter((caseRecord) => !filters.status || caseRecord.status === filters.status)
            .filter((caseRecord) => !filters.bookingId || caseRecord.bookingId === filters.bookingId)
            .filter((caseRecord) => !filters.arbitratorId || caseRecord.arbitratorId === filters.arbitratorId)
            .map((caseRecord) => this.serializeCase(caseRecord));
    }
    getCase(actor, caseId) {
        const caseRecord = this.requireCase(caseId);
        if (!this.canSeeCase(actor, caseRecord)) {
            throw new common_1.ForbiddenException('You cannot view this case.');
        }
        return this.serializeCase(caseRecord);
    }
    createCase(actor, payload) {
        this.assertRoles(actor, [entities_1.Role.CUSTOMER, entities_1.Role.PROVIDER, entities_1.Role.ADMIN]);
        const booking = this.requireBooking(payload.bookingId);
        if (!this.canSeeBooking(actor, booking) && actor.role !== entities_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('You can only raise a dispute for a booking you are involved in.');
        }
        if (booking.escrowStatus !== entities_1.EscrowStatus.FUNDS_LOCKED ||
            ![entities_1.BookingStatus.CONFIRMED, entities_1.BookingStatus.IN_PROGRESS].includes(booking.status)) {
            throw new common_1.ConflictException('Disputes can only be raised while escrow funds are locked.');
        }
        const activeCase = this.state.cases.find((caseRecord) => caseRecord.bookingId === booking.id && caseRecord.status !== entities_1.CaseStatus.CLOSED);
        if (activeCase) {
            throw new common_1.ConflictException('An active case already exists for this booking.');
        }
        const arbitrator = this.findAvailableArbitrator();
        if (!arbitrator) {
            throw new common_1.ConflictException('No approved arbitrator is available for automatic case assignment.');
        }
        const caseRecord = this.createCaseRecord({
            bookingId: booking.id,
            customerId: booking.customerId,
            providerId: booking.providerId,
            arbitratorId: arbitrator.id,
            createdById: actor.id,
            title: payload.title,
            description: payload.description,
            status: entities_1.CaseStatus.ASSIGNED,
            priority: payload.priority || 'medium',
        });
        booking.status = entities_1.BookingStatus.DISPUTED;
        booking.updatedAt = this.now();
        this.createBookingEvent(booking.id, entities_1.BookingStatus.DISPUTED, actor.id, actor.role, 'Dispute raised');
        this.createCaseMessage(caseRecord.id, actor.id, actor.role, payload.description);
        const adminUsers = this.getUsersByRole(entities_1.Role.ADMIN);
        const customer = this.requireUser(booking.customerId);
        const provider = this.requireUser(booking.providerId);
        [...adminUsers, customer, provider, arbitrator].forEach((user) => {
            if (user.id === actor.id && user.role !== entities_1.Role.ADMIN)
                return;
            this.appendNotification(user.id, user.id === arbitrator.id ? 'Case assigned' : 'New dispute case', user.id === arbitrator.id
                ? `You have been assigned to case ${caseRecord.id}.`
                : `${payload.title} has been opened for booking ${booking.id}.`, entities_1.NotificationTone.WARNING, 'case', caseRecord.id);
        });
        return this.serializeCase(caseRecord);
    }
    updateCase(actor, caseId, payload) {
        const caseRecord = this.requireCase(caseId);
        if (!this.canSeeCase(actor, caseRecord)) {
            throw new common_1.ForbiddenException('You cannot update this case.');
        }
        if (payload.priority) {
            this.assertRoles(actor, [entities_1.Role.ADMIN]);
            caseRecord.priority = payload.priority;
        }
        if (payload.arbitratorId !== undefined) {
            this.assertRoles(actor, [entities_1.Role.ADMIN]);
            const arbitrator = this.requireUser(payload.arbitratorId);
            if (arbitrator.role !== entities_1.Role.ARBITRATOR) {
                throw new common_1.BadRequestException('arbitratorId must refer to an arbitrator.');
            }
            caseRecord.arbitratorId = arbitrator.id;
            caseRecord.status = entities_1.CaseStatus.ASSIGNED;
            this.appendNotification(arbitrator.id, 'Case assigned', `You have been assigned to case ${caseRecord.id}.`, entities_1.NotificationTone.INFO, 'case', caseRecord.id);
        }
        if (payload.status) {
            if (actor.role === entities_1.Role.ARBITRATOR) {
                if (caseRecord.arbitratorId !== actor.id) {
                    throw new common_1.ForbiddenException('Only the assigned arbitrator can update this case.');
                }
            }
            else if (actor.role !== entities_1.Role.ADMIN) {
                throw new common_1.ForbiddenException('Only admins and the assigned arbitrator can update case status.');
            }
            caseRecord.status = payload.status;
        }
        if (payload.resolutionSummary !== undefined) {
            if (actor.role === entities_1.Role.ARBITRATOR && caseRecord.arbitratorId !== actor.id) {
                throw new common_1.ForbiddenException('Only the assigned arbitrator can resolve this case.');
            }
            if (![entities_1.Role.ADMIN, entities_1.Role.ARBITRATOR].includes(actor.role)) {
                throw new common_1.ForbiddenException('Only admins and arbitrators can add a resolution summary.');
            }
            caseRecord.resolutionSummary = payload.resolutionSummary;
        }
        if (payload.message) {
            this.createCaseMessage(caseRecord.id, actor.id, actor.role, payload.message);
        }
        caseRecord.updatedAt = this.now();
        const audience = [caseRecord.customerId, caseRecord.providerId, caseRecord.arbitratorId].filter(Boolean);
        audience.forEach((recipientId) => {
            if (recipientId === actor.id)
                return;
            this.appendNotification(recipientId, 'Case updated', `Case ${caseRecord.id} has new activity.`, entities_1.NotificationTone.INFO, 'case', caseRecord.id);
        });
        return this.serializeCase(caseRecord);
    }
    updateCaseMessage(actor, caseId, messageId, payload) {
        this.assertRoles(actor, [entities_1.Role.ADMIN]);
        this.requireCase(caseId);
        const message = this.state.caseMessages.find((entry) => entry.caseId === caseId && entry.id === messageId);
        if (!message) {
            throw new common_1.NotFoundException(`Case message ${messageId} was not found.`);
        }
        Object.assign(message, this.compactObject({
            flagged: payload.flagged,
            reviewed: payload.reviewed,
        }));
        message.updatedAt = this.now();
        return { ...message };
    }
    deleteCaseMessage(actor, caseId, messageId) {
        this.assertRoles(actor, [entities_1.Role.ADMIN]);
        this.requireCase(caseId);
        const message = this.state.caseMessages.find((entry) => entry.caseId === caseId && entry.id === messageId);
        if (!message) {
            throw new common_1.NotFoundException(`Case message ${messageId} was not found.`);
        }
        this.state.caseMessages = this.state.caseMessages.filter((entry) => entry.id !== messageId);
        return { id: messageId, deleted: true };
    }
    listHearings(actor, filters = {}) {
        return this.state.hearings
            .filter((hearing) => !filters.caseId || hearing.caseId === filters.caseId)
            .filter((hearing) => !filters.status || hearing.status === filters.status)
            .filter((hearing) => this.canSeeCase(actor, this.requireCase(hearing.caseId)))
            .map((hearing) => this.serializeHearing(hearing));
    }
    createHearing(actor, payload) {
        const caseRecord = this.requireCase(payload.caseId);
        this.assertCaseManagementAccess(actor, caseRecord);
        if (!caseRecord.arbitratorId) {
            throw new common_1.ConflictException('Assign an arbitrator before scheduling a hearing.');
        }
        const hearing = this.createHearingRecord({
            caseId: caseRecord.id,
            arbitratorId: caseRecord.arbitratorId,
            scheduledAt: new Date(payload.scheduledAt).toISOString(),
            type: payload.type,
            status: entities_1.HearingStatus.SCHEDULED,
            agenda: payload.agenda,
            notes: payload.notes,
        });
        caseRecord.status = entities_1.CaseStatus.HEARING_SCHEDULED;
        caseRecord.updatedAt = this.now();
        [caseRecord.customerId, caseRecord.providerId, caseRecord.arbitratorId].forEach((recipientId) => {
            this.appendNotification(recipientId, 'Hearing scheduled', `A ${this.humanizeToken(payload.type)} hearing is scheduled for case ${caseRecord.id}.`, entities_1.NotificationTone.INFO, 'hearing', hearing.id);
        });
        return this.serializeHearing(hearing);
    }
    updateHearing(actor, hearingId, payload) {
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
    deleteHearing(actor, hearingId) {
        const hearing = this.requireHearing(hearingId);
        const caseRecord = this.requireCase(hearing.caseId);
        this.assertCaseManagementAccess(actor, caseRecord);
        this.state.hearings = this.state.hearings.filter((entry) => entry.id !== hearing.id);
        return { id: hearing.id, deleted: true };
    }
    listDocuments(actor, filters = {}) {
        return this.state.documents
            .filter((document) => !filters.caseId || document.caseId === filters.caseId)
            .filter((document) => !filters.status || document.status === filters.status)
            .filter((document) => !filters.type || document.type === filters.type)
            .filter((document) => this.canSeeCase(actor, this.requireCase(document.caseId)))
            .map((document) => this.serializeDocument(document));
    }
    createDocument(actor, payload) {
        const caseRecord = this.requireCase(payload.caseId);
        if (!this.canSeeCase(actor, caseRecord)) {
            throw new common_1.ForbiddenException('You cannot attach documents to this case.');
        }
        const document = this.createDocumentRecord({
            caseId: caseRecord.id,
            uploadedById: actor.id,
            uploaderRole: actor.role,
            type: payload.type,
            status: entities_1.DocumentStatus.UPLOADED,
            title: payload.title,
            description: payload.description,
            fileName: payload.fileName,
            content: payload.content,
        });
        if (caseRecord.status === entities_1.CaseStatus.OPEN || caseRecord.status === entities_1.CaseStatus.ASSIGNED) {
            caseRecord.status = entities_1.CaseStatus.EVIDENCE_REVIEW;
            caseRecord.updatedAt = this.now();
        }
        [caseRecord.customerId, caseRecord.providerId, caseRecord.arbitratorId].filter(Boolean).forEach((recipientId) => {
            if (recipientId === actor.id)
                return;
            this.appendNotification(recipientId, 'New case document', `${payload.title} was added to case ${caseRecord.id}.`, entities_1.NotificationTone.INFO, 'document', document.id);
        });
        return this.serializeDocument(document);
    }
    updateDocument(actor, documentId, payload) {
        const document = this.requireDocument(documentId);
        const caseRecord = this.requireCase(document.caseId);
        this.assertDocumentEditable(actor, caseRecord, document);
        Object.assign(document, this.compactObject(payload));
        document.updatedAt = this.now();
        return this.serializeDocument(document);
    }
    deleteDocument(actor, documentId) {
        const document = this.requireDocument(documentId);
        const caseRecord = this.requireCase(document.caseId);
        this.assertDocumentEditable(actor, caseRecord, document);
        this.state.documents = this.state.documents.filter((entry) => entry.id !== document.id);
        return { id: document.id, deleted: true };
    }
    listAwards(actor, filters = {}) {
        return this.state.awards
            .filter((award) => !filters.caseId || award.caseId === filters.caseId)
            .filter((award) => !filters.status || award.status === filters.status)
            .filter((award) => this.canSeeCase(actor, this.requireCase(award.caseId)))
            .map((award) => this.serializeAward(award));
    }
    createAward(actor, payload) {
        const caseRecord = this.requireCase(payload.caseId);
        this.assertCaseManagementAccess(actor, caseRecord);
        if (!caseRecord.arbitratorId) {
            throw new common_1.ConflictException('Assign an arbitrator before issuing an award.');
        }
        if (payload.status === entities_1.AwardStatus.ISSUED) {
            if (!payload.decision) {
                throw new common_1.BadRequestException('decision is required when issuing an award.');
            }
            const issuableStatuses = [
                entities_1.CaseStatus.HEARING_SCHEDULED,
                entities_1.CaseStatus.EVIDENCE_REVIEW,
                entities_1.CaseStatus.UNDER_REVIEW,
            ];
            if (!issuableStatuses.includes(caseRecord.status)) {
                throw new common_1.ConflictException('Award can only be issued after review or hearing.');
            }
        }
        const award = this.createAwardRecord({
            caseId: caseRecord.id,
            arbitratorId: caseRecord.arbitratorId,
            title: payload.title,
            summary: payload.summary,
            status: payload.status || entities_1.AwardStatus.DRAFT,
            decision: payload.decision,
            decisionDate: payload.status === entities_1.AwardStatus.ISSUED ? this.now() : undefined,
        });
        if (award.status === entities_1.AwardStatus.ISSUED) {
            this.applyAwardDecision(caseRecord, award.decision, actor);
            caseRecord.status = entities_1.CaseStatus.RESOLVED;
            caseRecord.resolutionSummary = payload.summary;
            caseRecord.updatedAt = this.now();
        }
        [caseRecord.customerId, caseRecord.providerId, caseRecord.arbitratorId].filter(Boolean).forEach((recipientId) => {
            this.appendNotification(recipientId, 'Award updated', `${payload.title} was recorded for case ${caseRecord.id}.`, entities_1.NotificationTone.INFO, 'award', award.id);
        });
        return this.serializeAward(award);
    }
    updateAward(actor, awardId, payload) {
        const award = this.requireAward(awardId);
        const caseRecord = this.requireCase(award.caseId);
        this.assertCaseManagementAccess(actor, caseRecord);
        if (payload.status === entities_1.AwardStatus.ISSUED && !award.decisionDate) {
            const decision = payload.decision || award.decision;
            if (!decision) {
                throw new common_1.BadRequestException('decision is required when issuing an award.');
            }
            const issuableStatuses = [
                entities_1.CaseStatus.HEARING_SCHEDULED,
                entities_1.CaseStatus.EVIDENCE_REVIEW,
                entities_1.CaseStatus.UNDER_REVIEW,
            ];
            if (!issuableStatuses.includes(caseRecord.status)) {
                throw new common_1.ConflictException('Award can only be issued after review or hearing.');
            }
        }
        if (payload.decision && award.decisionDate) {
            throw new common_1.ConflictException('Award decision cannot be changed after escrow is finalized.');
        }
        Object.assign(award, this.compactObject({
            title: payload.title,
            summary: payload.summary,
            status: payload.status,
            decision: payload.decision,
        }));
        if (payload.status === entities_1.AwardStatus.ISSUED && !award.decisionDate) {
            this.applyAwardDecision(caseRecord, award.decision, actor);
            award.decisionDate = this.now();
            caseRecord.status = entities_1.CaseStatus.RESOLVED;
            caseRecord.resolutionSummary = award.summary;
            caseRecord.updatedAt = this.now();
        }
        award.updatedAt = this.now();
        return this.serializeAward(award);
    }
    listReviews(actor, filters = {}) {
        return this.state.reviews
            .filter((review) => !filters.serviceId || review.serviceId === filters.serviceId)
            .filter((review) => !filters.providerId || review.providerId === filters.providerId)
            .filter((review) => !filters.customerId || review.customerId === filters.customerId)
            .filter((review) => {
            if (actor.role === entities_1.Role.ADMIN)
                return true;
            if (actor.role === entities_1.Role.CUSTOMER)
                return review.customerId === actor.id;
            if (actor.role === entities_1.Role.PROVIDER)
                return review.providerId === actor.id;
            return false;
        })
            .map((review) => this.serializeReview(review));
    }
    createReview(actor, payload) {
        this.assertRoles(actor, [entities_1.Role.CUSTOMER]);
        const booking = this.requireBooking(payload.bookingId);
        if (booking.customerId !== actor.id) {
            throw new common_1.ForbiddenException('You can only review your own booking.');
        }
        if (booking.status !== entities_1.BookingStatus.COMPLETED || booking.escrowStatus !== entities_1.EscrowStatus.RELEASED) {
            throw new common_1.ConflictException('Reviews are allowed only after completed bookings with released escrow.');
        }
        if (this.state.reviews.some((review) => review.bookingId === booking.id)) {
            throw new common_1.ConflictException('This booking has already been reviewed.');
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
        this.appendNotification(booking.providerId, 'New service review', `A customer rated booking ${booking.id}.`, entities_1.NotificationTone.INFO, 'service', booking.serviceId);
        return this.serializeReview(review);
    }
    runWorkflowCleanup(actor) {
        this.assertRoles(actor, [entities_1.Role.ADMIN]);
        const now = Date.now();
        const summary = {
            abandonedBookingsCancelled: 0,
            escrowBookingsAutoReleased: 0,
        };
        this.state.bookings.forEach((booking) => {
            const scheduledAt = new Date(booking.scheduledAt).getTime();
            const updatedAt = new Date(booking.updatedAt).getTime();
            if (booking.status === entities_1.BookingStatus.REQUESTED &&
                booking.escrowStatus === entities_1.EscrowStatus.NOT_LOCKED &&
                now - updatedAt > this.requestedBookingExpiryHours * 60 * 60 * 1000) {
                booking.status = entities_1.BookingStatus.CANCELLED;
                booking.cancellationReason = 'Auto-cancelled because provider did not confirm in time.';
                booking.updatedAt = this.now();
                this.createBookingEvent(booking.id, entities_1.BookingStatus.CANCELLED, 'system', entities_1.Role.ADMIN, booking.cancellationReason);
                summary.abandonedBookingsCancelled += 1;
            }
            if (booking.status === entities_1.BookingStatus.CONFIRMED &&
                booking.escrowStatus === entities_1.EscrowStatus.FUNDS_LOCKED &&
                now - scheduledAt > this.escrowAutoReleaseHours * 60 * 60 * 1000) {
                booking.status = entities_1.BookingStatus.COMPLETED;
                booking.escrowStatus = entities_1.EscrowStatus.RELEASED;
                booking.lastStatusNote = 'Auto-released after service completion timeout.';
                booking.updatedAt = this.now();
                this.createBookingEvent(booking.id, entities_1.BookingStatus.COMPLETED, 'system', entities_1.Role.ADMIN, booking.lastStatusNote);
                summary.escrowBookingsAutoReleased += 1;
            }
        });
        return summary;
    }
    getSettings(actor) {
        this.assertRoles(actor, [entities_1.Role.ADMIN]);
        return this.cloneSettings();
    }
    updateSettings(actor, payload) {
        this.assertRoles(actor, [entities_1.Role.ADMIN]);
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
    listNotifications(actor) {
        return this.state.notifications
            .filter((notification) => notification.recipientId === actor.id)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
            .map((notification) => ({ ...notification }));
    }
    updateNotification(actor, notificationId, read) {
        const notification = this.state.notifications.find((entry) => entry.id === notificationId);
        if (!notification || notification.recipientId !== actor.id) {
            throw new common_1.NotFoundException('Notification not found.');
        }
        notification.read = read;
        notification.updatedAt = this.now();
        return { ...notification };
    }
    bulkUpdateNotifications(actor, read, ids) {
        const set = new Set(ids || []);
        const notifications = this.state.notifications.filter((notification) => {
            if (notification.recipientId !== actor.id)
                return false;
            if (!set.size)
                return true;
            return set.has(notification.id);
        });
        notifications.forEach((notification) => {
            notification.read = read;
            notification.updatedAt = this.now();
        });
        return notifications.map((notification) => ({ ...notification }));
    }
    getDashboard(actor) {
        switch (actor.role) {
            case entities_1.Role.CUSTOMER:
                return this.getCustomerDashboard(actor);
            case entities_1.Role.PROVIDER:
                return this.getProviderDashboard(actor);
            case entities_1.Role.ADMIN:
                return this.getAdminDashboard();
            case entities_1.Role.ARBITRATOR:
                return this.getArbitratorDashboard(actor);
            default:
                throw new common_1.ForbiddenException('Unsupported role.');
        }
    }
    createJobRequest(payload) {
        return this.createJobRequestRecord(payload);
    }
    createContactMessage(payload) {
        return this.createContactMessageRecord(payload);
    }
    createWaitlistEntry(payload) {
        return this.createWaitlistEntryRecord({
            name: payload.name || 'Interested User',
            email: payload.email,
            city: payload.city || 'Unspecified',
            serviceCategory: payload.serviceCategory,
        });
    }
    updateUserInternal(actor, userId, payload, isAdminPath) {
        if (isAdminPath) {
            this.assertRoles(actor, [entities_1.Role.ADMIN]);
        }
        else if (actor.id !== userId) {
            throw new common_1.ForbiddenException('You can only update your own profile.');
        }
        const user = this.requireUser(userId);
        if (payload.email && payload.email.toLowerCase() !== user.email.toLowerCase()) {
            this.assertEmailAvailable(payload.email, user.id);
            user.email = payload.email.trim().toLowerCase();
        }
        Object.assign(user, this.compactObject({
            name: payload.name,
            phone: payload.phone,
            avatarUrl: payload.avatarUrl,
            password: payload.password,
            isActive: payload.isActive,
        }));
        user.updatedAt = this.now();
        if (user.role === entities_1.Role.CUSTOMER) {
            const profile = this.requireCustomerProfile(user.id);
            Object.assign(profile, this.compactObject({
                city: payload.city,
                address: payload.address,
                preferredCategories: payload.preferredCategories,
                bio: payload.bio,
            }));
            profile.updatedAt = this.now();
        }
        if (user.role === entities_1.Role.PROVIDER) {
            const profile = this.requireProviderProfile(user.id);
            Object.assign(profile, this.compactObject({
                businessName: payload.businessName,
                category: payload.category,
                city: payload.city,
                serviceArea: payload.serviceArea,
                experienceLevel: payload.experienceLevel,
                bio: payload.bio,
            }));
            profile.updatedAt = this.now();
        }
        if (user.role === entities_1.Role.ARBITRATOR) {
            const profile = this.requireArbitratorProfile(user.id);
            Object.assign(profile, this.compactObject({
                specialization: payload.specialization,
                experienceYears: payload.experienceYears,
                bio: payload.bio,
                approvalStatus: payload.approvalStatus,
            }));
            profile.updatedAt = this.now();
            if (payload.approvalStatus) {
                const application = this.state.arbitratorApplications.find((entry) => entry.userId === user.id);
                if (application) {
                    application.status = payload.approvalStatus;
                    application.updatedAt = this.now();
                }
            }
        }
        if (user.role === entities_1.Role.ADMIN) {
            const profile = this.requireAdminProfile(user.id);
            Object.assign(profile, this.compactObject({ title: payload.title }));
            profile.updatedAt = this.now();
        }
        return this.serializeUser(user);
    }
    getCustomerDashboard(actor) {
        const bookings = this.state.bookings.filter((booking) => booking.customerId === actor.id);
        const cases = this.state.cases.filter((caseRecord) => caseRecord.customerId === actor.id);
        const notifications = this.listNotifications(actor);
        return {
            metrics: {
                totalBookings: bookings.length,
                upcomingBookings: bookings.filter((booking) => [entities_1.BookingStatus.REQUESTED, entities_1.BookingStatus.CONFIRMED].includes(booking.status)).length,
                openCases: cases.filter((caseRecord) => caseRecord.status !== entities_1.CaseStatus.CLOSED).length,
                unreadNotifications: notifications.filter((notification) => !notification.read).length,
            },
            recentBookings: bookings.slice(-5).reverse().map((booking) => this.serializeBooking(booking)),
            recentCases: cases.slice(-5).reverse().map((caseRecord) => this.serializeCase(caseRecord)),
            recommendedServices: this.listServices({}, actor).slice(0, 6),
        };
    }
    getProviderDashboard(actor) {
        const services = this.state.services.filter((service) => service.providerId === actor.id);
        const bookings = this.state.bookings.filter((booking) => booking.providerId === actor.id);
        const cases = this.state.cases.filter((caseRecord) => caseRecord.providerId === actor.id);
        const earnings = bookings
            .filter((booking) => booking.status === entities_1.BookingStatus.COMPLETED)
            .reduce((sum, booking) => sum + booking.totalAmount, 0);
        return {
            metrics: {
                totalServices: services.length,
                openBookings: bookings.filter((booking) => [entities_1.BookingStatus.REQUESTED, entities_1.BookingStatus.CONFIRMED, entities_1.BookingStatus.IN_PROGRESS].includes(booking.status)).length,
                completedBookings: bookings.filter((booking) => booking.status === entities_1.BookingStatus.COMPLETED).length,
                openCases: cases.filter((caseRecord) => caseRecord.status !== entities_1.CaseStatus.CLOSED).length,
                earnings,
            },
            services: services.map((service) => this.serializeService(service)),
            recentBookings: bookings.slice(-5).reverse().map((booking) => this.serializeBooking(booking)),
            recentCases: cases.slice(-5).reverse().map((caseRecord) => this.serializeCase(caseRecord)),
        };
    }
    getAdminDashboard() {
        const pendingApplications = this.state.arbitratorApplications.filter((application) => application.status === entities_1.ApplicationStatus.PENDING);
        return {
            metrics: {
                totalUsers: this.state.users.length,
                totalServices: this.state.services.length,
                totalBookings: this.state.bookings.length,
                openCases: this.state.cases.filter((caseRecord) => caseRecord.status !== entities_1.CaseStatus.CLOSED).length,
                pendingApplications: pendingApplications.length,
            },
            recentCases: this.state.cases.slice(-5).reverse().map((caseRecord) => this.serializeCase(caseRecord)),
            pendingApplications,
            recentBookings: this.state.bookings.slice(-5).reverse().map((booking) => this.serializeBooking(booking)),
        };
    }
    getArbitratorDashboard(actor) {
        const cases = this.state.cases.filter((caseRecord) => caseRecord.arbitratorId === actor.id);
        const hearings = this.state.hearings.filter((hearing) => hearing.arbitratorId === actor.id);
        const awards = this.state.awards.filter((award) => award.arbitratorId === actor.id);
        const notifications = this.listNotifications(actor);
        return {
            metrics: {
                assignedCases: cases.length,
                hearingsScheduled: hearings.filter((hearing) => hearing.status === entities_1.HearingStatus.SCHEDULED).length,
                draftAwards: awards.filter((award) => award.status === entities_1.AwardStatus.DRAFT).length,
                unreadNotifications: notifications.filter((notification) => !notification.read).length,
            },
            cases: cases.slice(-5).reverse().map((caseRecord) => this.serializeCase(caseRecord)),
            hearings: hearings.slice(-5).reverse().map((hearing) => this.serializeHearing(hearing)),
            awards: awards.slice(-5).reverse().map((award) => this.serializeAward(award)),
        };
    }
    serializeUser(user) {
        return {
            ...user,
            profile: this.getProfileForUser(user.id, user.role),
        };
    }
    serializeService(service) {
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
    serializeBooking(booking) {
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
    serializeCase(caseRecord) {
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
    serializeHearing(hearing) {
        const arbitrator = this.requireUser(hearing.arbitratorId);
        return {
            ...hearing,
            case: this.serializeCase(this.requireCase(hearing.caseId)),
            arbitrator: this.serializeUser(arbitrator),
        };
    }
    serializeDocument(document) {
        const uploader = this.requireUser(document.uploadedById);
        return {
            ...document,
            uploader: this.serializeUser(uploader),
            case: this.serializeCase(this.requireCase(document.caseId)),
        };
    }
    serializeAward(award) {
        const arbitrator = this.requireUser(award.arbitratorId);
        return {
            ...award,
            arbitrator: this.serializeUser(arbitrator),
            case: this.serializeCase(this.requireCase(award.caseId)),
        };
    }
    serializeReview(review) {
        return {
            ...review,
            service: this.serializeService(this.requireService(review.serviceId)),
            customer: this.serializeUser(this.requireUser(review.customerId)),
            provider: this.serializeUser(this.requireUser(review.providerId)),
        };
    }
    getProfileForUser(userId, role) {
        switch (role) {
            case entities_1.Role.CUSTOMER:
                return this.requireCustomerProfile(userId);
            case entities_1.Role.PROVIDER:
                return this.requireProviderProfile(userId);
            case entities_1.Role.ARBITRATOR:
                return this.requireArbitratorProfile(userId);
            case entities_1.Role.ADMIN:
                return this.requireAdminProfile(userId);
            default:
                return null;
        }
    }
    assertBookingStatusTransition(actor, booking, nextStatus) {
        if (actor.role === entities_1.Role.ADMIN)
            return;
        if (actor.role === entities_1.Role.CUSTOMER) {
            if (booking.customerId !== actor.id) {
                throw new common_1.ForbiddenException('You cannot change another customer’s booking.');
            }
            if (nextStatus !== entities_1.BookingStatus.CANCELLED) {
                throw new common_1.ForbiddenException('Customers can only cancel their bookings.');
            }
            if (![entities_1.BookingStatus.REQUESTED, entities_1.BookingStatus.CONFIRMED].includes(booking.status)) {
                throw new common_1.ConflictException('Only requested or confirmed bookings can be cancelled.');
            }
            return;
        }
        if (actor.role === entities_1.Role.PROVIDER) {
            if (booking.providerId !== actor.id) {
                throw new common_1.ForbiddenException('You cannot change another provider’s booking.');
            }
            const allowedTransitions = {
                [entities_1.BookingStatus.REQUESTED]: [entities_1.BookingStatus.CONFIRMED, entities_1.BookingStatus.CANCELLED],
                [entities_1.BookingStatus.CONFIRMED]: [entities_1.BookingStatus.IN_PROGRESS, entities_1.BookingStatus.CANCELLED],
                [entities_1.BookingStatus.IN_PROGRESS]: [entities_1.BookingStatus.COMPLETED],
                [entities_1.BookingStatus.COMPLETED]: [],
                [entities_1.BookingStatus.CANCELLED]: [],
                [entities_1.BookingStatus.DISPUTED]: [],
            };
            if (!allowedTransitions[booking.status].includes(nextStatus)) {
                throw new common_1.ConflictException('This booking status change is not allowed.');
            }
            return;
        }
        throw new common_1.ForbiddenException('This role cannot change booking status.');
    }
    applyEscrowTransition(booking, nextStatus) {
        if ([entities_1.EscrowStatus.RELEASED, entities_1.EscrowStatus.REFUNDED].includes(booking.escrowStatus)) {
            if (booking.status !== nextStatus) {
                throw new common_1.ConflictException('Escrow has already been finalized for this booking.');
            }
            return;
        }
        if (nextStatus === entities_1.BookingStatus.CONFIRMED) {
            booking.escrowStatus = entities_1.EscrowStatus.FUNDS_LOCKED;
            return;
        }
        if (nextStatus === entities_1.BookingStatus.COMPLETED) {
            if (booking.escrowStatus !== entities_1.EscrowStatus.FUNDS_LOCKED) {
                throw new common_1.ConflictException('Funds must be locked before completion.');
            }
            booking.escrowStatus = entities_1.EscrowStatus.RELEASED;
            return;
        }
        if (nextStatus === entities_1.BookingStatus.CANCELLED && booking.escrowStatus === entities_1.EscrowStatus.FUNDS_LOCKED) {
            booking.escrowStatus = entities_1.EscrowStatus.REFUNDED;
        }
    }
    applyAwardDecision(caseRecord, decision, actor) {
        if (!decision) {
            throw new common_1.BadRequestException('decision is required when issuing an award.');
        }
        const booking = this.requireBooking(caseRecord.bookingId);
        if (booking.escrowStatus !== entities_1.EscrowStatus.FUNDS_LOCKED) {
            throw new common_1.ConflictException('Escrow must be locked before an award decision can finalize funds.');
        }
        if (decision === entities_1.AwardDecision.RELEASE_TO_PROVIDER) {
            booking.escrowStatus = entities_1.EscrowStatus.RELEASED;
            booking.status = entities_1.BookingStatus.COMPLETED;
            booking.lastStatusNote = 'Funds released by arbitrator award.';
            this.createBookingEvent(booking.id, entities_1.BookingStatus.COMPLETED, actor.id, actor.role, booking.lastStatusNote);
        }
        if (decision === entities_1.AwardDecision.REFUND_TO_CUSTOMER) {
            booking.escrowStatus = entities_1.EscrowStatus.REFUNDED;
            booking.status = entities_1.BookingStatus.CANCELLED;
            booking.cancellationReason = 'Refunded by arbitrator award.';
            this.createBookingEvent(booking.id, entities_1.BookingStatus.CANCELLED, actor.id, actor.role, booking.cancellationReason);
        }
        booking.updatedAt = this.now();
    }
    assertCaseManagementAccess(actor, caseRecord) {
        if (actor.role === entities_1.Role.ADMIN)
            return;
        if (actor.role === entities_1.Role.ARBITRATOR && caseRecord.arbitratorId === actor.id)
            return;
        throw new common_1.ForbiddenException('Only admins and the assigned arbitrator can manage this case.');
    }
    assertDocumentEditable(actor, caseRecord, document) {
        if (actor.role === entities_1.Role.ADMIN)
            return;
        if (document.uploadedById === actor.id)
            return;
        if (actor.role === entities_1.Role.ARBITRATOR && caseRecord.arbitratorId === actor.id)
            return;
        throw new common_1.ForbiddenException('You cannot edit this document.');
    }
    assertServiceEditable(actor, service) {
        if (actor.role === entities_1.Role.ADMIN)
            return;
        if (actor.role === entities_1.Role.PROVIDER && service.providerId === actor.id)
            return;
        throw new common_1.ForbiddenException('You cannot manage this service.');
    }
    canSeeBooking(actor, booking) {
        if (actor.role === entities_1.Role.ADMIN)
            return true;
        if (actor.role === entities_1.Role.CUSTOMER)
            return booking.customerId === actor.id;
        if (actor.role === entities_1.Role.PROVIDER)
            return booking.providerId === actor.id;
        if (actor.role === entities_1.Role.ARBITRATOR) {
            return this.state.cases.some((caseRecord) => caseRecord.bookingId === booking.id && caseRecord.arbitratorId === actor.id);
        }
        return false;
    }
    canSeeCase(actor, caseRecord) {
        if (actor.role === entities_1.Role.ADMIN)
            return true;
        if (actor.role === entities_1.Role.CUSTOMER)
            return caseRecord.customerId === actor.id;
        if (actor.role === entities_1.Role.PROVIDER)
            return caseRecord.providerId === actor.id;
        if (actor.role === entities_1.Role.ARBITRATOR)
            return caseRecord.arbitratorId === actor.id;
        return false;
    }
    requireUser(userId) {
        const user = this.findUserById(userId);
        if (!user) {
            throw new common_1.NotFoundException(`User ${userId} was not found.`);
        }
        return user;
    }
    requireService(serviceId) {
        const service = this.state.services.find((entry) => entry.id === serviceId);
        if (!service) {
            throw new common_1.NotFoundException(`Service ${serviceId} was not found.`);
        }
        return service;
    }
    requireBooking(bookingId) {
        const booking = this.state.bookings.find((entry) => entry.id === bookingId);
        if (!booking) {
            throw new common_1.NotFoundException(`Booking ${bookingId} was not found.`);
        }
        return booking;
    }
    requireCase(caseId) {
        const caseRecord = this.state.cases.find((entry) => entry.id === caseId);
        if (!caseRecord) {
            throw new common_1.NotFoundException(`Case ${caseId} was not found.`);
        }
        return caseRecord;
    }
    requireHearing(hearingId) {
        const hearing = this.state.hearings.find((entry) => entry.id === hearingId);
        if (!hearing) {
            throw new common_1.NotFoundException(`Hearing ${hearingId} was not found.`);
        }
        return hearing;
    }
    requireDocument(documentId) {
        const document = this.state.documents.find((entry) => entry.id === documentId);
        if (!document) {
            throw new common_1.NotFoundException(`Document ${documentId} was not found.`);
        }
        return document;
    }
    requireAward(awardId) {
        const award = this.state.awards.find((entry) => entry.id === awardId);
        if (!award) {
            throw new common_1.NotFoundException(`Award ${awardId} was not found.`);
        }
        return award;
    }
    requireCustomerProfile(userId) {
        const profile = this.state.customerProfiles.find((entry) => entry.userId === userId);
        if (!profile) {
            throw new common_1.NotFoundException(`Customer profile ${userId} was not found.`);
        }
        return profile;
    }
    requireProviderProfile(userId) {
        const profile = this.state.providerProfiles.find((entry) => entry.userId === userId);
        if (!profile) {
            throw new common_1.NotFoundException(`Provider profile ${userId} was not found.`);
        }
        return profile;
    }
    requireArbitratorProfile(userId) {
        const profile = this.state.arbitratorProfiles.find((entry) => entry.userId === userId);
        if (!profile) {
            throw new common_1.NotFoundException(`Arbitrator profile ${userId} was not found.`);
        }
        return profile;
    }
    requireAdminProfile(userId) {
        const profile = this.state.adminProfiles.find((entry) => entry.userId === userId);
        if (!profile) {
            throw new common_1.NotFoundException(`Admin profile ${userId} was not found.`);
        }
        return profile;
    }
    assertRoles(actor, roles) {
        if (!roles.includes(actor.role)) {
            throw new common_1.ForbiddenException('You do not have permission to access this resource.');
        }
    }
    assertEmailAvailable(email, ignoreUserId) {
        const exists = this.state.users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.id !== ignoreUserId);
        if (exists) {
            throw new common_1.ConflictException('An account with that email already exists.');
        }
    }
    getUsersByRole(role) {
        return this.state.users.filter((user) => user.role === role);
    }
    findAvailableArbitrator() {
        const approvedArbitrators = this.state.users.filter((user) => {
            if (user.role !== entities_1.Role.ARBITRATOR || !user.isActive)
                return false;
            const profile = this.state.arbitratorProfiles.find((entry) => entry.userId === user.id);
            return profile?.approvalStatus === entities_1.ApplicationStatus.APPROVED;
        });
        return approvedArbitrators
            .map((user) => ({
            user,
            openCaseCount: this.state.cases.filter((caseRecord) => caseRecord.arbitratorId === user.id && ![entities_1.CaseStatus.RESOLVED, entities_1.CaseStatus.CLOSED].includes(caseRecord.status)).length,
        }))
            .sort((left, right) => left.openCaseCount - right.openCaseCount)[0]?.user;
    }
    recalculateServiceRating(serviceId) {
        const service = this.requireService(serviceId);
        const reviews = this.state.reviews.filter((review) => review.serviceId === serviceId);
        if (!reviews.length)
            return;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        service.rating = Number((total / reviews.length).toFixed(1));
        service.reviewCount = reviews.length;
        service.updatedAt = this.now();
    }
    recalculateProviderRating(providerId) {
        const profile = this.requireProviderProfile(providerId);
        const reviews = this.state.reviews.filter((review) => review.providerId === providerId);
        if (!reviews.length)
            return;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        profile.rating = Number((total / reviews.length).toFixed(1));
        profile.updatedAt = this.now();
    }
    appendNotification(recipientId, title, body, tone, entityType, entityId) {
        const user = this.requireUser(recipientId);
        const notification = this.buildRecord('notification', {
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
    createBookingEvent(bookingId, status, actorId, actorRole, note) {
        const event = this.buildRecord('booking_event', {
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
    createCaseMessage(caseId, authorId, authorRole, message) {
        const entry = this.buildRecord('case_message', {
            caseId,
            authorId,
            authorRole,
            message,
        });
        this.state.caseMessages.push(entry);
        this.state.caseMessages = this.trimCollection(this.state.caseMessages, 1000);
        return entry;
    }
    createUser(input) {
        const user = this.buildRecord('user', input);
        this.state.users.push(user);
        return user;
    }
    createCustomerProfile(input) {
        const profile = this.buildRecord('profile', input);
        this.state.customerProfiles.push(profile);
        return profile;
    }
    createProviderProfile(input) {
        const profile = this.buildRecord('profile', input);
        this.state.providerProfiles.push(profile);
        return profile;
    }
    createArbitratorProfile(input) {
        const profile = this.buildRecord('profile', input);
        this.state.arbitratorProfiles.push(profile);
        return profile;
    }
    createAdminProfile(input) {
        const profile = this.buildRecord('profile', input);
        this.state.adminProfiles.push(profile);
        return profile;
    }
    createServiceRecord(input) {
        const record = this.buildRecord('service', input);
        this.state.services.push(record);
        return record;
    }
    createBookingRecord(input) {
        const record = this.buildRecord('booking', input);
        this.state.bookings.push(record);
        return record;
    }
    createCaseRecord(input) {
        const record = this.buildRecord('case', input);
        this.state.cases.push(record);
        return record;
    }
    createHearingRecord(input) {
        const record = this.buildRecord('hearing', input);
        this.state.hearings.push(record);
        return record;
    }
    createDocumentRecord(input) {
        const record = this.buildRecord('document', input);
        this.state.documents.push(record);
        return record;
    }
    createAwardRecord(input) {
        const record = this.buildRecord('award', input);
        this.state.awards.push(record);
        return record;
    }
    createReviewRecord(input) {
        const record = this.buildRecord('review', input);
        this.state.reviews.push(record);
        return record;
    }
    createJobRequestRecord(input) {
        const record = this.buildRecord('job_request', input);
        this.state.jobRequests.push(record);
        this.state.jobRequests = this.trimCollection(this.state.jobRequests, 500);
        return record;
    }
    createContactMessageRecord(input) {
        const record = this.buildRecord('contact', input);
        this.state.contactMessages.push(record);
        this.state.contactMessages = this.trimCollection(this.state.contactMessages, 500);
        return record;
    }
    createWaitlistEntryRecord(input) {
        const record = this.buildRecord('waitlist', input);
        this.state.waitlistEntries.push(record);
        this.state.waitlistEntries = this.trimCollection(this.state.waitlistEntries, 500);
        return record;
    }
    createArbitratorApplication(input) {
        const record = this.buildRecord('application', input);
        this.state.arbitratorApplications.push(record);
        return record;
    }
    buildRecord(prefix, input) {
        const timestamp = this.now();
        return {
            id: this.nextId(prefix),
            createdAt: timestamp,
            updatedAt: timestamp,
            ...input,
        };
    }
    nextId(prefix) {
        const current = this.counters.get(prefix) || 1;
        this.counters.set(prefix, current + 1);
        return `${prefix}_${current}`;
    }
    now() {
        return new Date().toISOString();
    }
    humanizeToken(value) {
        return value.replace(/_/g, ' ');
    }
    compactObject(payload) {
        return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    }
    trimCollection(items, maxSize = 500) {
        if (items.length <= maxSize)
            return items;
        return items.slice(items.length - maxSize);
    }
    cloneSettings() {
        return JSON.parse(JSON.stringify(this.state.settings));
    }
    createSeedState() {
        const now = new Date('2026-04-24T09:00:00.000Z').toISOString();
        const stamp = (id, input) => ({
            id,
            createdAt: now,
            updatedAt: now,
            ...input,
        });
        const users = [
            stamp('user_1001', {
                role: entities_1.Role.ADMIN,
                name: 'Naina Kapoor',
                email: 'admin@servicehub.test',
                password: 'admin123',
                phone: '9999999991',
                avatarUrl: '',
                isActive: true,
            }),
            stamp('user_2001', {
                role: entities_1.Role.CUSTOMER,
                name: 'Aarav Mehta',
                email: 'aarav@servicehub.test',
                password: 'customer123',
                phone: '9999999992',
                avatarUrl: '',
                isActive: true,
            }),
            stamp('user_2002', {
                role: entities_1.Role.CUSTOMER,
                name: 'Siya Sharma',
                email: 'siya@servicehub.test',
                password: 'customer123',
                phone: '9999999993',
                avatarUrl: '',
                isActive: true,
            }),
            stamp('user_3001', {
                role: entities_1.Role.PROVIDER,
                name: 'Rohan Verma',
                email: 'rohan@servicehub.test',
                password: 'provider123',
                phone: '9999999994',
                avatarUrl: '',
                isActive: true,
            }),
            stamp('user_3002', {
                role: entities_1.Role.PROVIDER,
                name: 'Neha Iyer',
                email: 'neha@servicehub.test',
                password: 'provider123',
                phone: '9999999995',
                avatarUrl: '',
                isActive: true,
            }),
            stamp('user_4001', {
                role: entities_1.Role.ARBITRATOR,
                name: 'Kabir Malhotra',
                email: 'kabir@servicehub.test',
                password: 'arbitrator123',
                phone: '9999999996',
                avatarUrl: '',
                isActive: true,
            }),
            stamp('user_4002', {
                role: entities_1.Role.ARBITRATOR,
                name: 'Tara Singh',
                email: 'tara@servicehub.test',
                password: 'arbitrator123',
                phone: '9999999997',
                avatarUrl: '',
                isActive: true,
            }),
        ];
        const customerProfiles = [
            stamp('profile_2001', {
                userId: 'user_2001',
                city: 'Mumbai',
                address: 'Powai, Mumbai',
                preferredCategories: ['Home Cleaning', 'Appliance Repair'],
                bio: 'Busy professional looking for dependable services.',
            }),
            stamp('profile_2002', {
                userId: 'user_2002',
                city: 'Bengaluru',
                address: 'Indiranagar, Bengaluru',
                preferredCategories: ['Tutoring', 'Wellness'],
                bio: 'Books recurring services for family and home.',
            }),
        ];
        const providerProfiles = [
            stamp('profile_3001', {
                userId: 'user_3001',
                businessName: 'Spark Home Solutions',
                category: 'Home Cleaning',
                city: 'Mumbai',
                serviceArea: 'Mumbai and Navi Mumbai',
                experienceLevel: '6 – 10 years',
                bio: 'Deep cleaning and maintenance specialists.',
                rating: 4.8,
            }),
            stamp('profile_3002', {
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
        const arbitratorProfiles = [
            stamp('profile_4001', {
                userId: 'user_4001',
                specialization: 'Consumer Services',
                experienceYears: 9,
                bio: 'Handles service-quality and fulfillment disputes.',
                approvalStatus: entities_1.ApplicationStatus.APPROVED,
            }),
            stamp('profile_4002', {
                userId: 'user_4002',
                specialization: 'Contract Resolution',
                experienceYears: 7,
                bio: 'Focus on small business and digital service disputes.',
                approvalStatus: entities_1.ApplicationStatus.APPROVED,
            }),
        ];
        const adminProfiles = [
            stamp('profile_1001', {
                userId: 'user_1001',
                title: 'Operations Admin',
            }),
        ];
        const services = [
            stamp('service_5001', {
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
                status: entities_1.ServiceStatus.ACTIVE,
                rating: 4.9,
                reviewCount: 48,
            }),
            stamp('service_5002', {
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
                status: entities_1.ServiceStatus.ACTIVE,
                rating: 4.7,
                reviewCount: 22,
            }),
            stamp('service_5003', {
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
                status: entities_1.ServiceStatus.ACTIVE,
                rating: 4.6,
                reviewCount: 39,
            }),
            stamp('service_5004', {
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
                status: entities_1.ServiceStatus.ACTIVE,
                rating: 4.8,
                reviewCount: 31,
            }),
        ];
        const bookings = [
            stamp('booking_6001', {
                serviceId: 'service_5001',
                customerId: 'user_2001',
                providerId: 'user_3001',
                scheduledAt: '2026-04-28T09:30:00.000Z',
                status: entities_1.BookingStatus.CONFIRMED,
                notes: 'Please focus on the kitchen and balcony.',
                address: 'Powai, Mumbai',
                totalAmount: 2499,
                currency: 'INR',
                escrowStatus: entities_1.EscrowStatus.FUNDS_LOCKED,
                lastStatusNote: 'Team assigned and confirmed.',
            }),
            stamp('booking_6002', {
                serviceId: 'service_5003',
                customerId: 'user_2002',
                providerId: 'user_3002',
                scheduledAt: '2026-04-20T10:00:00.000Z',
                status: entities_1.BookingStatus.DISPUTED,
                notes: 'Machine is leaking after the previous repair.',
                address: 'Indiranagar, Bengaluru',
                totalAmount: 899,
                currency: 'INR',
                escrowStatus: entities_1.EscrowStatus.FUNDS_LOCKED,
                lastStatusNote: 'Customer raised a dispute.',
            }),
            stamp('booking_6003', {
                serviceId: 'service_5004',
                customerId: 'user_2001',
                providerId: 'user_3002',
                scheduledAt: '2026-04-18T13:30:00.000Z',
                status: entities_1.BookingStatus.COMPLETED,
                notes: 'Routine summer maintenance.',
                address: 'Powai, Mumbai',
                totalAmount: 1299,
                currency: 'INR',
                escrowStatus: entities_1.EscrowStatus.RELEASED,
                lastStatusNote: 'Service completed successfully.',
            }),
        ];
        const bookingEvents = [
            stamp('booking_event_7001', {
                bookingId: 'booking_6001',
                status: entities_1.BookingStatus.REQUESTED,
                actorId: 'user_2001',
                actorRole: entities_1.Role.CUSTOMER,
                note: 'Booking created',
            }),
            stamp('booking_event_7002', {
                bookingId: 'booking_6001',
                status: entities_1.BookingStatus.CONFIRMED,
                actorId: 'user_3001',
                actorRole: entities_1.Role.PROVIDER,
                note: 'Team assigned and confirmed.',
            }),
            stamp('booking_event_7003', {
                bookingId: 'booking_6002',
                status: entities_1.BookingStatus.REQUESTED,
                actorId: 'user_2002',
                actorRole: entities_1.Role.CUSTOMER,
                note: 'Booking created',
            }),
            stamp('booking_event_7004', {
                bookingId: 'booking_6002',
                status: entities_1.BookingStatus.CONFIRMED,
                actorId: 'user_3002',
                actorRole: entities_1.Role.PROVIDER,
                note: 'Technician assigned',
            }),
            stamp('booking_event_7005', {
                bookingId: 'booking_6002',
                status: entities_1.BookingStatus.DISPUTED,
                actorId: 'user_2002',
                actorRole: entities_1.Role.CUSTOMER,
                note: 'Customer raised a dispute',
            }),
            stamp('booking_event_7006', {
                bookingId: 'booking_6003',
                status: entities_1.BookingStatus.REQUESTED,
                actorId: 'user_2001',
                actorRole: entities_1.Role.CUSTOMER,
                note: 'Booking created',
            }),
            stamp('booking_event_7007', {
                bookingId: 'booking_6003',
                status: entities_1.BookingStatus.CONFIRMED,
                actorId: 'user_3002',
                actorRole: entities_1.Role.PROVIDER,
                note: 'Confirmed',
            }),
            stamp('booking_event_7008', {
                bookingId: 'booking_6003',
                status: entities_1.BookingStatus.IN_PROGRESS,
                actorId: 'user_3002',
                actorRole: entities_1.Role.PROVIDER,
                note: 'Technician onsite',
            }),
            stamp('booking_event_7009', {
                bookingId: 'booking_6003',
                status: entities_1.BookingStatus.COMPLETED,
                actorId: 'user_3002',
                actorRole: entities_1.Role.PROVIDER,
                note: 'Service completed',
            }),
        ];
        const cases = [
            stamp('case_8001', {
                bookingId: 'booking_6002',
                customerId: 'user_2002',
                providerId: 'user_3002',
                arbitratorId: 'user_4001',
                createdById: 'user_2002',
                title: 'Washing machine still leaking',
                description: 'The repair visit did not resolve the issue and water leakage continued.',
                status: entities_1.CaseStatus.HEARING_SCHEDULED,
                priority: 'high',
                resolutionSummary: '',
            }),
        ];
        const caseMessages = [
            stamp('case_message_9001', {
                caseId: 'case_8001',
                authorId: 'user_2002',
                authorRole: entities_1.Role.CUSTOMER,
                message: 'The machine started leaking again within 24 hours of the repair visit.',
            }),
            stamp('case_message_9002', {
                caseId: 'case_8001',
                authorId: 'user_3002',
                authorRole: entities_1.Role.PROVIDER,
                message: 'We offered a revisit, but the customer requested formal review instead.',
            }),
        ];
        const hearings = [
            stamp('hearing_10001', {
                caseId: 'case_8001',
                arbitratorId: 'user_4001',
                scheduledAt: '2026-04-30T11:00:00.000Z',
                type: entities_1.HearingType.VIDEO,
                status: entities_1.HearingStatus.SCHEDULED,
                agenda: 'Review technician report and customer evidence.',
                notes: 'Both parties confirmed attendance.',
            }),
        ];
        const documents = [
            stamp('document_11001', {
                caseId: 'case_8001',
                uploadedById: 'user_2002',
                uploaderRole: entities_1.Role.CUSTOMER,
                type: entities_1.DocumentType.EVIDENCE,
                status: entities_1.DocumentStatus.UPLOADED,
                title: 'Leakage photos',
                description: 'Photos showing water leakage after repair.',
                fileName: 'leakage-photos.zip',
                content: 'metadata-only-seed',
            }),
            stamp('document_11002', {
                caseId: 'case_8001',
                uploadedById: 'user_3002',
                uploaderRole: entities_1.Role.PROVIDER,
                type: entities_1.DocumentType.INVOICE,
                status: entities_1.DocumentStatus.ACCEPTED,
                title: 'Repair invoice',
                description: 'Invoice for the original repair visit.',
                fileName: 'repair-invoice.pdf',
                content: 'metadata-only-seed',
            }),
        ];
        const awards = [
            stamp('award_12001', {
                caseId: 'case_8001',
                arbitratorId: 'user_4001',
                title: 'Interim case summary',
                summary: 'Awaiting hearing before final award is issued.',
                status: entities_1.AwardStatus.DRAFT,
            }),
        ];
        const reviews = [];
        const notifications = [
            stamp('notification_13001', {
                recipientId: 'user_2001',
                recipientRole: entities_1.Role.CUSTOMER,
                title: 'Booking confirmed',
                body: 'Your deep cleaning booking is confirmed for April 28.',
                tone: entities_1.NotificationTone.SUCCESS,
                read: false,
                entityType: 'booking',
                entityId: 'booking_6001',
            }),
            stamp('notification_13002', {
                recipientId: 'user_3001',
                recipientRole: entities_1.Role.PROVIDER,
                title: 'Upcoming job',
                body: 'Premium Home Deep Cleaning is scheduled for April 28.',
                tone: entities_1.NotificationTone.INFO,
                read: false,
                entityType: 'booking',
                entityId: 'booking_6001',
            }),
            stamp('notification_13003', {
                recipientId: 'user_1001',
                recipientRole: entities_1.Role.ADMIN,
                title: 'Case needs review',
                body: 'Case case_8001 is scheduled for hearing.',
                tone: entities_1.NotificationTone.WARNING,
                read: false,
                entityType: 'case',
                entityId: 'case_8001',
            }),
            stamp('notification_13004', {
                recipientId: 'user_4001',
                recipientRole: entities_1.Role.ARBITRATOR,
                title: 'Hearing scheduled',
                body: 'Video hearing set for case case_8001.',
                tone: entities_1.NotificationTone.INFO,
                read: false,
                entityType: 'hearing',
                entityId: 'hearing_10001',
            }),
        ];
        const jobRequests = [];
        const contactMessages = [];
        const waitlistEntries = [];
        const arbitratorApplications = [
            stamp('application_14001', {
                userId: 'user_4001',
                name: 'Kabir Malhotra',
                email: 'kabir@servicehub.test',
                phone: '9999999996',
                specialization: 'Consumer Services',
                experienceYears: 9,
                bio: 'Handles service-quality and fulfillment disputes.',
                status: entities_1.ApplicationStatus.APPROVED,
            }),
            stamp('application_14002', {
                userId: 'user_4002',
                name: 'Tara Singh',
                email: 'tara@servicehub.test',
                phone: '9999999997',
                specialization: 'Contract Resolution',
                experienceYears: 7,
                bio: 'Focus on small business and digital service disputes.',
                status: entities_1.ApplicationStatus.APPROVED,
            }),
        ];
        const settings = {
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
};
exports.StoreService = StoreService;
exports.StoreService = StoreService = __decorate([
    (0, common_1.Injectable)()
], StoreService);
//# sourceMappingURL=store.service.js.map