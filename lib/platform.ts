import {PostgresDatabase} from './adapters/postgres';
import {PrivateStorage} from './adapters/storage';
// Compatibility boundary: business rules retain their prepared-statement/storage contract.
export const env:Record<string,any>&{DB:D1Database;BUCKET:R2Bucket}={...process.env,DB:new PostgresDatabase() as unknown as D1Database,BUCKET:new PrivateStorage() as unknown as R2Bucket};
