import {
    pgTable,
    uuid,
    timestamp,
    jsonb,
} from "drizzle-orm/pg-core";

export const conversations = pgTable(
    "conversations",
    {
        id: uuid("id")
            .primaryKey(),

        metadata: jsonb("metadata"),

        createdAt: timestamp(
            "created_at",
            {
                withTimezone: true,
            },
        )
            .defaultNow()
            .notNull(),

        updatedAt: timestamp(
            "updated_at",
            {
                withTimezone: true,
            },
        )
            .defaultNow()
            .notNull(),
    },
);
