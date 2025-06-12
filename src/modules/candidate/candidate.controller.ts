import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Role } from '../../constants/role.enum';
import { Auth, UUIDParam } from '../../decorators/http.decorator';
import type { Candidate } from '../../entities/Candidate';
import { CandidateService } from './candidate.service';
import { GetUsersDto } from './dtoes/get-users.dto';

@Controller('candidates')
@ApiTags('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

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
  async getCandidateById(@Param('id') id: number): Promise<Candidate> {
    return this.candidateService.getUserById(id);
  }

  @Delete(':id')
  @Auth([Role.SUPER_ADMIN], { setUserSession: true })
  @HttpCode(HttpStatus.OK)
  async deleteCandidateById(@UUIDParam('id') id: number): Promise<void> {
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
  // @Post('invitation/:email/send-email')
  // @HttpCode(HttpStatus.OK)
  // async sendInvitationViaEmail(
  //   @Param('email') email: string,
  // ) {
  //   return this.candidateService.sendInvitationViaEmail(email)
  // }

  @Get(':id/interviews')
  @HttpCode(HttpStatus.OK)
  async getSingleCandidatesInterviews(@Param('id') id: number) {
    return this.candidateService.getCandidatesInterviews(id);
  }

  @Delete(':id/interviews')
  @HttpCode(HttpStatus.OK)
  async deleteCandidateInterviews(@Param('id') id: number) {
    return this.candidateService.deleteCandidateInterviews(id);
  }
}
