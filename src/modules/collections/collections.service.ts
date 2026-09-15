import { CollectionsRepository } from "./collections.repository.js";

export class CollectionsService {

    private readonly repository = new CollectionsRepository();

    async create(
        name: string,
        description?: string,
    ): Promise<string> {

        return this.repository.create(
            name,
            description,
        );
    }

    async getAll() {
        return this.repository.findAll();
    }

    async getById(
        collectionId: string,
    ) {
        return this.repository.findById(
            collectionId,
        );
    }

    async update(
        collectionId: string,
        data: {
            name?: string;
            description?: string;
        },
    ) {

        await this.repository.update(
            collectionId,
            data,
        );
    }

    async delete(
        collectionId: string,
    ) {

        await this.repository.delete(
            collectionId,
        );
    }

    async findByName(
        name: string,
    ) {

        return this.repository.findByName(
            name,
        );
    }

    async findOrCreate(
        collectionName: string,
    ): Promise<string> {

        const existing = await this.repository.findByName(
            collectionName,
        );

        if (existing) {
            return existing.id;
        }

        return this.repository.create(
            collectionName,
        );
    }
}