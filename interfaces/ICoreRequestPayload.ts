import { ISessionMeta } from './ISessionMeta';

export interface ICoreRequestPayload {
  messageId: string;
  meta?: ISessionMeta;
  command: string;
  commandId?: number;
  startDate: Date;
  sendDate: Date;
  args: any[];
  recordCommands?: Omit<ICoreRequestPayload, 'meta' | 'messageId' | 'sendDate'>[];
}
