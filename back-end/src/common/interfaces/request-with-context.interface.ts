import { RequestActor } from './request-actor.interface';

export interface RequestWithContext {
  method: string;
  originalUrl?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  requestId: string;
  actor?: RequestActor;
}
