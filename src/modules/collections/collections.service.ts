import { CollectionsRepository } from "./collections.repository.js";
import { NotFoundError } from "../../common/errors/index.js";

export class CollectionsService {

    private readonly repository = new CollectionsRepository();

    async create(
        tenantId: string,
        name: string,
        description?: string,
    ): Promise<string> {

        return this.repository.create(
            tenantId,
            name,
            description,
        );
    }

    async getAll(
        tenantId: string,
    ) {

        return this.repository.findAll(
            tenantId,
        );
    }

    async getById(
        tenantId: string,
        collectionId: string,
    ) {

        return this.repository.findById(
            tenantId,
            collectionId,
        );
    }

    async update(
        tenantId: string,
        collectionId: string,
        data: {
            name?: string;
            description?: string;
        },
    ) {

        await this.repository.update(
            tenantId,
            collectionId,
            data,
        );
    }

    async delete(
        tenantId: string,
        collectionId: string,
    ) {

        await this.repository.delete(
            tenantId,
            collectionId,
        );
    }

    async findByName(
        tenantId: string,
        name: string,
    ) {

        return this.repository.findByName(
            tenantId,
            name,
        );
    }

    async findOrCreate(
        tenantId: string,
        collectionName: string,
    ): Promise<string> {

        const existing = await this.repository.findByName(
            tenantId,
            collectionName,
        );

        if (existing) {
            return existing.id;
        }

        return this.repository.create(
            tenantId,
            collectionName,
        );
    }

    async getStats(
        tenantId: string,
        collectionId: string,
    ) {

        const collection = await this.repository.findById(
            tenantId,
            collectionId,
        );

        if (!collection) {
            throw new NotFoundError(
                "Collection",
            );
        }

        return this.repository.getStats(
            collectionId,
        );
    }
}