export default interface IOutputChange {
  type: 'insert' | 'delete' | 'update' | 'reorder';
  path: string;
  value: string;
  lastCommandId: number;
  timestamp: number;
}
