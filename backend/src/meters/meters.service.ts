// Thin service layer between controller and repository.
// Business logic (filtering, mapping) lives here once it grows beyond simple queries.

import { Injectable } from '@nestjs/common';
import { MetersRepository, MeterRow } from './meters.repository';

@Injectable()
export class MetersService {
    constructor(private readonly repo: MetersRepository) {}

    async getAllMeters(): Promise<MeterRow[]> {
        return this.repo.getAllMeters();
    }
}
