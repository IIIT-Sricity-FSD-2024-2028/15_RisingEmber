import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RequestActor } from '../common/interfaces/request-actor.interface';
import { DocumentStatus, DocumentType } from '../store/entities';
import { StoreService } from '../store/store.service';

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
