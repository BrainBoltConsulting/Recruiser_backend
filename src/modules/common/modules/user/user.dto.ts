import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import type { UserEntity } from '../../../user/user.entity';
import { AbstractDto } from '../../dtos/abstract.dto';

export class UserDto extends AbstractDto {

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  techPrimary: string;

  constructor(user: any, options: {isForAdmin?: boolean, isAccess?: boolean, isExtended?: boolean}) {
    super(user);
    this.firstName = user.firstName;
    this.email = user.email;
    this.techPrimary = user.techPrimary;
  }
}
