import {
    pgTable,
    uuid,
    varchar,
    text,
    jsonb,
    timestamp,
} from "drizzle-orm/pg-core";
import { collections } from "./collections.schema.js";

export const documents = pgTable("documents", {
    id: uuid("id").defaultRandom().primaryKey(),

    filename: varchar("filename", {
        length: 255,
    }).notNull(),

    mimeType: varchar("mime_type", {
        length: 100,
    }).notNull(),

    storageKey: text("storage_key").notNull(),

    status: varchar("status", {
        length: 30,
    }).notNull(),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    }).defaultNow().notNull(),

    collectionId: uuid(
        "collection_id",
    )
    .references(
        () => collections.id,
        {
            onDelete: "restrict",
        },
    )

});
