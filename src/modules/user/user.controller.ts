import { Controller, Get, HttpCode, HttpStatus, Put, Body, Param, Delete, Query, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserDto } from '../common/modules/user/user.dto';
import { Auth, UUIDParam } from '../../decorators/http.decorator';
import { Role } from '../../constants/role.enum';
import { PageDto } from '../common/dtos/page.dto';
import { AuthUser } from '../../decorators/auth.decorator';
import { UpdatePasswordDto } from './dtoes/update-password.dto';
import { GetUsersDto } from './dtoes/get-users.dto';
import { UsersEntity } from '../../entities/Users';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly UserService: UserService) { }
  @Get('')
  // @Auth([Role.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  async getAllUsers(
    @Query() getUsersDto: GetUsersDto,
  ): Promise<UsersEntity[]> {
    return this.UserService.getAllUsers(getUsersDto);
  }

  @Get(':id')
  // @Auth([Role.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  async getUserById(
    @Param('id') id: string,
  ): Promise<UsersEntity> {
      return this.UserService.getUserById(id);
  }

  @Delete(':id')
  @Auth([Role.SUPER_ADMIN], { setUserSession: true})
  @HttpCode(HttpStatus.OK)
  async deleteUserById(
    @UUIDParam('id') id: string,
  ): Promise<void> {
    return this.UserService.deleteUser(id);
  }

  // @Put(':id/update-password')
  // @HttpCode(HttpStatus.OK)
  // async updateUserPassword(
  //   @UUIDParam('id') id: string,
  //   @AuthUser() user: UserDto,
  //   @Body() updateUserStatusDto: UpdatePasswordDto
  // ) {
  //   return this.UserService.updateUserPassword(id, user, updateUserStatusDto)
  // }

  // @Auth([Role.SUPER_ADMIN], { setUserSession: true})
  @Post('invitation/:email/send-email')
  async sendInvitationViaEmail(
    @Param('email') email: string,
  ) {
    return this.UserService.sendInvitationViaEmail(email)
  }
}
