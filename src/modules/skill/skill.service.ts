import { CandidateSkillsRepository } from './../../repositories/CandidateSkillsRepository';
import { SkillsRepository } from './../../repositories/SkillsRepository';
import { CreateSkillDto } from './dtos/create-skill.dto';
import { QuestionsRepository } from '../../repositories/QuestionsRepository';
import { PollyService } from '../../shared/services/aws-polly.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { S3Service } from '../../shared/services/aws-s3.service';
import { AnswersRepository } from '../../repositories/AnswersRepository';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class SkillService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly pollyService: PollyService,
    private readonly questionsRepository: QuestionsRepository,
    private readonly skillRepository: SkillsRepository,
    private readonly candidateSkillsRepository: CandidateSkillsRepository,
    private readonly answersRepository: AnswersRepository
  ) {}

  async getAllSkills() {
    return this.skillRepository.getAllSorted()
  }

  async getSkillByName(skillName: string) {
    const skillEntity = await this.skillRepository.findBySkillName(skillName);

    if (!skillEntity) {
      throw new NotFoundException('Skill is not found');
    }

    return skillEntity;
  }

  async getSkillById(id: number) {
    const skillEntity = await this.skillRepository.findById(id);

    if (!skillEntity) {
      throw new NotFoundException('Skill is not found');
    }

    return skillEntity;
  } 

  async createNewSkill(createSkillDto: CreateSkillDto) {
    const findSkillByName = await this.skillRepository.findBySkillName(createSkillDto.skillName);

    if (findSkillByName) {
      throw new BadRequestException('Skill already exists');
    }

    const skillEntity = await this.skillRepository.save(this.skillRepository.create({
      skillName: createSkillDto.skillName
    }));

    return skillEntity;
  }

  async createSkillForCadidate(skillId: number, candidateId: number) {
    const skillEntity = await this.skillRepository.findById(skillId);

    if (!skillEntity) {
      throw new NotFoundException('Skill is not found');
    }

    const candidateWithTheSkillEntity = await this.candidateSkillsRepository.findByCandidateIdAndSkill(candidateId, skillId);

    if (candidateWithTheSkillEntity) {
      throw new BadRequestException('Skill is already assigned to candiidate');
    }

    const candidateSkillEntity = await this.candidateSkillsRepository.save(this.candidateSkillsRepository.create({
      candidateId,
      skillId    
    }))

    return candidateSkillEntity
  }

}
