import { Controller, Get, HttpCode, HttpStatus, Put, Body, Param, Delete, Query, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import { UserDto } from '../common/modules/user/user.dto';
import { Auth, UUIDParam } from '../../decorators/http.decorator';
import { Role } from '../../constants/role.enum';
import { PageDto } from '../common/dtos/page.dto';
import { AuthUser } from '../../decorators/auth.decorator';
import { UpdatePasswordDto } from './dtoes/update-password.dto';
import { GetUsersDto } from './dtoes/get-users.dto';
import { Candidate } from '../../entities/Candidate';

@Controller('candidates')
@ApiTags('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) { }
  @Get('')
  // @Auth([Role.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  async getAllCandidates(
    @Query() getUsersDto: GetUsersDto,
  ): Promise<Candidate[]> {
    return this.candidateService.getAllUsers(getUsersDto);
  }

  @Get(':id')
  // @Auth([Role.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  async getCandidateById(
    @Param('id') id: number,
  ): Promise<Candidate> {
      return this.candidateService.getUserById(id);
  }

  @Delete(':id')
  @Auth([Role.SUPER_ADMIN], { setUserSession: true})
  @HttpCode(HttpStatus.OK)
  async deleteCandidateById(
    @UUIDParam('id') id: number,
  ): Promise<void> {
    return this.candidateService.deleteUser(id);
  }

  // @Put(':id/update-password')
  // @HttpCode(HttpStatus.OK)
  // async updateCandidatePassword(
  //   @UUIDParam('id') id: string,
  //   @AuthUser() user: UserDto,
  //   @Body() updateUserStatusDto: UpdatePasswordDto
  // ) {
  //   return this.candidateService.updateUserPassword(id, user, updateUserStatusDto)
  // }

  // @Auth([Role.SUPER_ADMIN], { setUserSession: true})
  @Post('invitation/:email/send-email')
  @HttpCode(HttpStatus.OK)
  async sendInvitationViaEmail(
    @Param('email') email: string,
  ) {
    return this.candidateService.sendInvitationViaEmail(email)
  }

  @Get(':id/interviews')
  @HttpCode(HttpStatus.OK)
  async getSingleCandidatesInterviews(
    @Param('id') id: number
  ) {
    return this.candidateService.getCandidatesInterviews(id);
  }
}
