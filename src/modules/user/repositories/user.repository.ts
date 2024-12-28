// import { Repository } from 'typeorm';
// import { CustomRepository } from '../../../db/typeorm-ex.decorator';
// import { UserEntity } from '../user.entity';
// import { UserNotFoundException } from '../exceptions/user-not-found.exception';

// @CustomRepository(UserEntity)
// export class UserRepository extends Repository<UserEntity> {
//     async findByEmail(email: string) {
//         return this.createQueryBuilder('user')
//         .where('user.email = :email', { email })
//         .getOne();
//     }

//     async getAllSorted() {
//         return this.createQueryBuilder('user')
//             .orderBy('user.createdAt', 'DESC')
//     }

//     async findById(id: string) {
//         const query = await this.createQueryBuilder('user')
//             .where('user.id = :id', { id })
//             .getOne();

//         if (!query) {
//             throw new UserNotFoundException();
//         }
//         return query;
//     }
// }
