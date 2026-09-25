import { FeedbackRepository } from "./feedback.repository.js";
import { CreateFeedbackDto } from "./dto/create-feedback.dto.js";

export class FeedbackService {

    private readonly repository = new FeedbackRepository();

    async create(
        dto: CreateFeedbackDto,
    ) {

        const id = await this.repository.create(dto);

        return {
            id,
        };
    }

    async findAll() {

        return this.repository.findAll();
    }
}