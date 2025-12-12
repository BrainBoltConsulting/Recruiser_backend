import { Repository } from 'typeorm';
import { CustomRepository } from '../db/typeorm-ex.decorator';
import { DishonestSs } from '../entities/DishonestSs';

@CustomRepository(DishonestSs)
export class DishonestSsRepository extends Repository<DishonestSs> {}


