type SwaggerDocument = {
  paths?: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
};

const dtoSchemas: Record<string, any> = {
  LoginDto: objectSchema(['role', 'email', 'password'], {
    role: enumProp(['customer', 'provider', 'admin', 'arbitrator']),
    email: stringProp('user@example.com', 'Email address for the selected role.'),
    password: stringProp('password123', 'Account password.'),
  }),
  ResetPasswordDto: objectSchema(['role', 'identifier', 'nextPassword'], {
    role: enumProp(['customer', 'provider', 'admin', 'arbitrator']),
    identifier: stringProp('user@example.com', 'Account email or phone number.'),
    nextPassword: stringProp('newPassword123', 'Replacement password.'),
  }),
  RegisterCustomerDto: objectSchema(['name', 'email', 'password'], {
    name: stringProp('Priya Shah'),
    email: stringProp('priya@example.com'),
    password: stringProp('password123'),
    phone: stringProp('+919999999999'),
    city: stringProp('Chennai'),
    address: stringProp('12 Anna Nagar, Chennai'),
    preferredCategories: arrayProp('Home Cleaning'),
    bio: stringProp('Customer profile notes.'),
  }),
  RegisterProviderDto: objectSchema(['name', 'email', 'password', 'businessName', 'category'], {
    name: stringProp('Paul Services'),
    email: stringProp('paul@example.com'),
    password: stringProp('password123'),
    phone: stringProp('+919999999998'),
    businessName: stringProp('Paul Home Care'),
    category: stringProp('Home Cleaning'),
    city: stringProp('Chennai'),
    serviceArea: stringProp('Chennai'),
    experienceLevel: stringProp('5 years'),
    bio: stringProp('Provider profile notes.'),
  }),
  ApplyArbitratorDto: objectSchema(['name', 'email', 'password', 'specialization', 'experienceYears'], {
    name: stringProp('Ananya Rao'),
    email: stringProp('ananya@example.com'),
    password: stringProp('password123'),
    phone: stringProp('+919999999997'),
    specialization: stringProp('Service disputes'),
    experienceYears: numberProp(7),
    bio: stringProp('Arbitrator profile notes.'),
  }),
  UpdateMeDto: objectSchema([], {
    name: stringProp('Updated Name'),
    email: stringProp('updated@example.com'),
    phone: stringProp('+919999999996'),
    avatarUrl: stringProp('https://example.com/avatar.png'),
    city: stringProp('Bengaluru'),
    address: stringProp('MG Road, Bengaluru'),
    preferredCategories: arrayProp('Repairs'),
    bio: stringProp('Updated profile notes.'),
    businessName: stringProp('Updated Business'),
    category: stringProp('Repairs'),
    serviceArea: stringProp('Bengaluru'),
    experienceLevel: stringProp('Expert'),
    specialization: stringProp('Marketplace disputes'),
    experienceYears: numberProp(8),
    title: stringProp('Platform Admin'),
  }),
  UpdateUserDto: objectSchema([], {
    isActive: booleanProp(true),
    approvalStatus: enumProp(['pending', 'approved', 'rejected']),
  }),
  CreateServiceDto: objectSchema(['title', 'description', 'category', 'price', 'durationMinutes', 'location'], {
    providerId: stringProp('user_1002'),
    title: stringProp('Deep Home Cleaning'),
    description: stringProp('Complete home cleaning service with verified staff.'),
    category: stringProp('Home Cleaning'),
    price: numberProp(2500),
    durationMinutes: numberProp(180),
    location: stringProp('Chennai'),
    image: stringProp('https://example.com/service.jpg'),
    tags: arrayProp('verified'),
    status: enumProp(['active', 'paused', 'archived']),
  }),
  UpdateServiceDto: objectSchema([], {
    title: stringProp('Updated Service'),
    description: stringProp('Updated service description.'),
    category: stringProp('Repairs'),
    price: numberProp(3000),
    durationMinutes: numberProp(120),
    location: stringProp('Bengaluru'),
    image: stringProp('https://example.com/service.jpg'),
    tags: arrayProp('premium'),
    status: enumProp(['active', 'paused', 'archived']),
  }),
  CreateBookingDto: objectSchema(['serviceId', 'scheduledAt'], {
    serviceId: stringProp('service_7001'),
    scheduledAt: stringProp('2026-05-10T10:00:00.000Z', 'ISO datetime.'),
    notes: stringProp('Please arrive on time.'),
    address: stringProp('12 Anna Nagar, Chennai'),
  }),
  UpdateBookingDto: objectSchema([], {
    status: enumProp(['requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed']),
    note: stringProp('Status update note.'),
    scheduledAt: stringProp('2026-05-11T10:00:00.000Z'),
    cancellationReason: stringProp('Customer unavailable.'),
  }),
  CreateCaseDto: objectSchema(['bookingId', 'title', 'description'], {
    bookingId: stringProp('booking_8001'),
    title: stringProp('Service quality dispute'),
    description: stringProp('The delivered service did not match the agreed scope.'),
    priority: enumProp(['low', 'medium', 'high']),
  }),
  UpdateCaseDto: objectSchema([], {
    status: enumProp(['open', 'under_review', 'assigned', 'hearing_scheduled', 'evidence_review', 'resolved', 'closed']),
    arbitratorId: stringProp('user_1004'),
    message: stringProp('Case note or message.'),
    resolutionSummary: stringProp('Resolution summary.'),
    priority: enumProp(['low', 'medium', 'high']),
  }),
  UpdateCaseMessageDto: objectSchema([], {
    flagged: booleanProp(false),
    reviewed: booleanProp(true),
  }),
  CreateHearingDto: objectSchema(['caseId', 'scheduledAt', 'type', 'agenda'], {
    caseId: stringProp('case_10001'),
    scheduledAt: stringProp('2026-05-12T11:00:00.000Z'),
    type: enumProp(['video', 'phone', 'in_person']),
    agenda: stringProp('Review submitted evidence.'),
    notes: stringProp('Internal hearing notes.'),
  }),
  UpdateHearingDto: objectSchema([], {
    scheduledAt: stringProp('2026-05-13T11:00:00.000Z'),
    type: enumProp(['video', 'phone', 'in_person']),
    status: enumProp(['scheduled', 'completed', 'cancelled']),
    agenda: stringProp('Updated agenda.'),
    notes: stringProp('Updated notes.'),
  }),
  CreateDocumentDto: objectSchema(['caseId', 'title', 'type', 'fileName'], {
    caseId: stringProp('case_10001'),
    title: stringProp('Evidence Photo'),
    description: stringProp('Photo showing incomplete work.'),
    type: enumProp(['evidence', 'invoice', 'identity', 'contract', 'award_attachment', 'other']),
    fileName: stringProp('evidence.jpg'),
    content: stringProp('Base64 or textual file content.'),
  }),
  UpdateDocumentDto: objectSchema([], {
    title: stringProp('Updated Document'),
    description: stringProp('Updated description.'),
    type: enumProp(['evidence', 'invoice', 'identity', 'contract', 'award_attachment', 'other']),
    status: enumProp(['uploaded', 'accepted', 'rejected']),
    fileName: stringProp('updated.pdf'),
    content: stringProp('Updated content.'),
  }),
  CreateAwardDto: objectSchema(['caseId', 'title', 'summary'], {
    caseId: stringProp('case_10001'),
    title: stringProp('Final award'),
    summary: stringProp('The customer is entitled to a refund.'),
    status: enumProp(['draft', 'issued', 'amended']),
    decision: enumProp(['release_to_provider', 'refund_to_customer']),
  }),
  UpdateAwardDto: objectSchema([], {
    title: stringProp('Updated award'),
    summary: stringProp('Updated award summary.'),
    status: enumProp(['draft', 'issued', 'amended']),
    decision: enumProp(['release_to_provider', 'refund_to_customer']),
  }),
  CreateReviewDto: objectSchema(['bookingId', 'rating'], {
    bookingId: stringProp('booking_8001'),
    rating: numberProp(5),
    comment: stringProp('Great service.'),
  }),
  UpdateNotificationDto: objectSchema(['read'], {
    read: booleanProp(true),
  }),
  BulkUpdateNotificationsDto: objectSchema(['read'], {
    read: booleanProp(true),
    ids: arrayProp('notification_15001'),
  }),
  CreateJobRequestDto: objectSchema(['name', 'email', 'serviceCategory', 'description'], {
    name: stringProp('Priya Shah'),
    email: stringProp('priya@example.com'),
    phone: stringProp('+919999999999'),
    serviceCategory: stringProp('Home Cleaning'),
    description: stringProp('Need home cleaning this weekend.'),
    budget: numberProp(2500),
  }),
  CreateContactMessageDto: objectSchema(['name', 'email', 'subject', 'message'], {
    name: stringProp('Priya Shah'),
    email: stringProp('priya@example.com'),
    phone: stringProp('+919999999999'),
    subject: stringProp('Support request'),
    message: stringProp('Please contact me about my booking.'),
  }),
  CreateWaitlistEntryDto: objectSchema(['email'], {
    name: stringProp('Priya Shah'),
    email: stringProp('priya@example.com'),
    city: stringProp('Chennai'),
    serviceCategory: stringProp('Home Cleaning'),
  }),
  UpdateSettingsDto: objectSchema([], {
    general: objectProp({
      name: stringProp('ServiceHub'),
      email: stringProp('admin@servicehub.local'),
      phone: stringProp('+919999999999'),
      timezone: stringProp('Asia/Kolkata'),
    }),
    arbitration: objectProp({
      maxResolutionTime: numberProp(72),
      defaultHearingDuration: numberProp(60),
      maxFileSize: numberProp(10),
      allowedFileTypes: stringProp('pdf,jpg,png'),
    }),
    userManagement: objectProp({
      allowNewUserRegistrations: booleanProp(true),
      requireEmailVerification: booleanProp(false),
      allowArbitratorApplications: booleanProp(true),
    }),
    notifications: objectProp({
      emailNewCases: booleanProp(true),
      hearingReminders: booleanProp(true),
      awardIssued: booleanProp(true),
    }),
    security: objectProp({
      minPasswordLength: numberProp(8),
      twoFactorAuth: enumProp(['Enabled', 'Disabled']),
      sessionTimeout: numberProp(30),
    }),
  }),
};

export function enhanceSwaggerDocument(document: SwaggerDocument) {
  document.components = document.components || {};
  document.components.schemas = {
    ...(document.components.schemas || {}),
    ...dtoSchemas,
    ApiResponse: objectSchema(['data'], {
      data: objectProp({}),
      message: stringProp('Operation completed successfully.'),
    }),
    DeleteResponse: objectSchema(['data', 'message'], {
      data: objectProp({
        id: stringProp('record_id'),
        deleted: booleanProp(true),
      }),
      message: stringProp('Record deleted successfully.'),
    }),
  };

  document.components.securitySchemes = {
    ...(document.components.securitySchemes || {}),
    RoleHeader: {
      type: 'apiKey',
      in: 'header',
      name: 'x-role',
      description: 'Role used for RBAC. Allowed values: customer, provider, admin, arbitrator.',
    },
    ActorHeader: {
      type: 'apiKey',
      in: 'header',
      name: 'x-actor-id',
      description: 'In-memory actor user id for the selected role. Required for protected APIs.',
    },
  };

  Object.values(document.paths || {}).forEach((pathItem) => {
    Object.values(pathItem).forEach((operation) => {
      operation.parameters = mergeParameters(operation.parameters || [], [
        {
          name: 'x-role',
          in: 'header',
          required: false,
          description: 'Role for RBAC. Required for protected endpoints.',
          schema: { type: 'string', enum: ['customer', 'provider', 'admin', 'arbitrator'] },
        },
        {
          name: 'x-actor-id',
          in: 'header',
          required: false,
          description: 'Actor user id matching x-role. Required for protected endpoints.',
          schema: { type: 'string', example: 'user_1001' },
        },
      ]);

      operation.responses = operation.responses || {};
      if (!operation.responses['200'] && !operation.responses['201']) {
        operation.responses['200'] = responseRef('Successful response.');
      }

      Object.entries(operation.responses).forEach(([status, response]: [string, any]) => {
        response.description = response.description || defaultResponseDescription(status);
        if (!response.content && ['200', '201'].includes(status)) {
          response.content = {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiResponse' },
            },
          };
        }
      });

      operation.responses['400'] = operation.responses['400'] || responseText('Invalid input or missing required header.');
      operation.responses['403'] = operation.responses['403'] || responseText('Role is not authorized for this operation.');
      operation.responses['404'] = operation.responses['404'] || responseText('Requested record was not found.');
    });
  });

  return document;
}

function mergeParameters(current: any[], next: any[]) {
  const keys = new Set(current.map((item) => `${item.in}:${item.name}`));
  return current.concat(next.filter((item) => !keys.has(`${item.in}:${item.name}`)));
}

function responseRef(description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiResponse' },
      },
    },
  };
}

function responseText(description: string) {
  return { description };
}

function defaultResponseDescription(status: string) {
  if (status === '201') return 'Created successfully.';
  if (status === '204') return 'No content.';
  return 'Successful response.';
}

function objectSchema(required: string[], properties: Record<string, any>) {
  return {
    type: 'object',
    required,
    properties,
  };
}

function objectProp(properties: Record<string, any>) {
  return {
    type: 'object',
    properties,
  };
}

function stringProp(example: string, description?: string) {
  return {
    type: 'string',
    example,
    ...(description ? { description } : {}),
  };
}

function numberProp(example: number) {
  return {
    type: 'number',
    example,
  };
}

function booleanProp(example: boolean) {
  return {
    type: 'boolean',
    example,
  };
}

function enumProp(values: string[]) {
  return {
    type: 'string',
    enum: values,
    example: values[0],
  };
}

function arrayProp(example: string) {
  return {
    type: 'array',
    items: {
      type: 'string',
      example,
    },
  };
}
