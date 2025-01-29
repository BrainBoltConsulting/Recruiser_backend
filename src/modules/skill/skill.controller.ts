import { CreateSkillDto } from './dtos/create-skill.dto';
import { Skills } from './../../entities/Skills';
import { Controller, Get, HttpCode, HttpStatus, Post, Query, Res, Body, Delete, Param, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkillService } from './skill.service';


@Controller('skills')
@ApiTags('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) { }

  @Get('')
  @HttpCode(HttpStatus.OK)
  async getAllSkills(
  ): Promise<Skills[]> {
      return this.skillService.getAllSkills();
  }

  @Post('')
  @HttpCode(HttpStatus.OK)
  async createNewQuestion(
    @Body() createSkillDto: CreateSkillDto,
  ): Promise<any> {
      return this.skillService.createNewSkill(createSkillDto);
  }
}
