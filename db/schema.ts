import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const members = sqliteTable('members', {
 id: text('id').primaryKey(), email: text('email').notNull().unique(), name: text('name').notNull(),
 role: text('role').notNull(), phone: text('phone').notNull().default(''), active: integer('active').notNull().default(1), createdAt: text('created_at').notNull(),
});
export const records = sqliteTable('records', {
 id: text('id').primaryKey(), kind: text('kind').notNull(), data: text('data').notNull(), version: integer('version').notNull().default(1), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [index('records_kind_idx').on(t.kind)]);
export const files = sqliteTable('files', {id:text('id').primaryKey(), recordId:text('record_id').notNull(), name:text('name').notNull(), mime:text('mime').notNull(), size:integer('size').notNull(), category:text('category').notNull(), area:text('area').notNull().default(''), uploadedBy:text('uploaded_by').notNull(), createdAt:text('created_at').notNull()});
export const notifications = sqliteTable('notifications',{id:text('id').primaryKey(),memberId:text('member_id').notNull(),recordId:text('record_id').notNull(),title:text('title').notNull(),body:text('body').notNull(),read:integer('read').notNull().default(0),createdAt:text('created_at').notNull()});
export const audit = sqliteTable('audit',{id:text('id').primaryKey(),actor:text('actor').notNull(),recordId:text('record_id').notNull(),action:text('action').notNull(),details:text('details').notNull().default(''),createdAt:text('created_at').notNull()});
export const outbox = sqliteTable('outbox',{id:text('id').primaryKey(),recordId:text('record_id').notNull(),memberId:text('member_id').notNull(),status:text('status').notNull(),message:text('message').notNull(),providerId:text('provider_id'),createdAt:text('created_at').notNull()});
