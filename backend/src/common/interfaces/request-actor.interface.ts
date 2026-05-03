import { UserRecord } from '../../store/entities';

export interface RequestActor {
  id: string;
  role: UserRecord['role'];
  user: UserRecord;
}
