import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { validateDocumentPayload } from './document-validation';
import { DocumentStatus, DocumentType } from '../store/entities';
import { StoreService } from '../store/store.service';
import { appLogger } from '../common/logger/winston-logger.service';

// Allowed MIME types for Multer file upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Ensure the uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer disk storage configuration
const multerDiskStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    // Sanitize original name and add timestamp to avoid collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// Multer file filter — rejects disallowed MIME types
function multerFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Accepted: PDF, PNG, JPEG, DOCX, XLSX.`,
      ),
      false,
    );
  }
}

class CreateDocumentDto {
  @IsString()
  caseId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsString()
  @MinLength(3)
  fileName!: string;

  @IsOptional()
  @IsString()
  content?: string;
}

class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  fileName?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

@Injectable()
class DocumentsService {
  constructor(private readonly storeService: StoreService) {}

  listDocuments(
    actor: RequestActor,
    filters: { caseId?: string; status?: DocumentStatus; type?: DocumentType },
  ) {
    return this.storeService.listDocuments(actor, filters);
  }

  createDocument(actor: RequestActor, payload: CreateDocumentDto) {
    validateDocumentPayload(payload);
    return this.storeService.createDocument(actor, payload);
  }

  updateDocument(actor: RequestActor, documentId: string, payload: UpdateDocumentDto) {
    return this.storeService.updateDocument(actor, documentId, payload);
  }

  deleteDocument(actor: RequestActor, documentId: string) {
    return this.storeService.deleteDocument(actor, documentId);
  }
}

@Controller('documents')
class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  listDocuments(
    @Req() req: { actor: RequestActor },
    @Query('caseId') caseId?: string,
    @Query('status') status?: DocumentStatus,
    @Query('type') type?: DocumentType,
  ) {
    return {
      data: this.documentsService.listDocuments(req.actor, { caseId, status, type }),
    };
  }

  @Post()
  createDocument(@Req() req: { actor: RequestActor }, @Body() payload: CreateDocumentDto) {
    return {
      data: this.documentsService.createDocument(req.actor, payload),
      message: 'Document created successfully.',
    };
  }

  /**
   * POST /documents/upload — Multer multipart/form-data file upload endpoint.
   * Accepts a physical file upload (multipart/form-data) alongside document metadata.
   * The file is saved to disk under uploads/documents/ and metadata is stored in-memory.
   * This demonstrates the standard Multer file upload middleware pattern.
   *
   * Form fields required: caseId, title, type, fileName (from file)
   * File field: "file"
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerDiskStorage,
      fileFilter: multerFileFilter,
      limits: {
        fileSize: 25 * 1024 * 1024, // 25 MiB max file size
        files: 1,
      },
    }),
  )
  uploadDocument(
    @Req() req: { actor: RequestActor; requestId?: string },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      caseId?: string;
      title?: string;
      description?: string;
      type?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('A file must be uploaded. Use multipart/form-data with field name "file".');
    }

    if (!body.caseId) {
      throw new BadRequestException('caseId is required as a form field.');
    }

    if (!body.title || body.title.trim().length < 3) {
      throw new BadRequestException('title is required (minimum 3 characters) as a form field.');
    }

    const docType = (body.type || DocumentType.EVIDENCE) as DocumentType;
    if (!Object.values(DocumentType).includes(docType)) {
      throw new BadRequestException(`type must be one of: ${Object.values(DocumentType).join(', ')}`);
    }

    // Log the successful upload to the application log file
    appLogger.info('File uploaded via multipart/form-data', {
      event: 'MULTIPART_UPLOAD_SUCCESS',
      requestId: (req as any).requestId || '-',
      actorId: req.actor?.id || '-',
      actorRole: req.actor?.role || '-',
      originalName: file.originalname,
      savedAs: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      savedPath: file.path,
      caseId: body.caseId,
      timestamp: new Date().toISOString(),
    });

    // Create document metadata entry in the in-memory store
    const payload: CreateDocumentDto = {
      caseId: body.caseId,
      title: body.title.trim(),
      description: body.description?.trim(),
      type: docType,
      fileName: file.filename,
      // No base64 content — file is stored on disk
    };

    const document = this.documentsService.createDocument(req.actor, payload);

    return {
      data: {
        ...document,
        upload: {
          originalName: file.originalname,
          savedAs: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storagePath: file.path,
        },
      },
      message: 'File uploaded and document created successfully.',
    };
  }

  @Patch(':id')
  updateDocument(
    @Req() req: { actor: RequestActor },
    @Param('id') id: string,
    @Body() payload: UpdateDocumentDto,
  ) {
    return {
      data: this.documentsService.updateDocument(req.actor, id, payload),
      message: 'Document updated successfully.',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  deleteDocument(@Req() req: { actor: RequestActor }, @Param('id') id: string) {
    return {
      data: this.documentsService.deleteDocument(req.actor, id),
      message: 'Document deleted successfully.',
    };
  }
}

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
