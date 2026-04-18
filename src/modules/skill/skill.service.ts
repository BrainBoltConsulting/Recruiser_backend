import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Skills } from '../../entities/Skills';
import { CandidateRepository } from '../../repositories/CandidateRepository';
import { CandidateSkillsRepository } from '../../repositories/CandidateSkillsRepository';
import { SkillsRepository } from '../../repositories/SkillsRepository';

@Injectable()
export class SkillService {
  constructor(
    private readonly skillRepository: SkillsRepository,
    private readonly candidateSkillsRepository: CandidateSkillsRepository,
    private readonly candidateRepository: CandidateRepository,
  ) {}

  async getSkillById(id: number): Promise<Skills> {
    return this.skillRepository.findById(id);
  }

  async createSkillForCadidate(skillId: number, cUuid: string) {
    const skillEntity = await this.skillRepository.findById(skillId);

    if (!skillEntity) {
      throw new NotFoundException('Skill is not found');
    }

    const candidate = await this.candidateRepository.findByCUuid(cUuid);

    const candidateWithTheSkillEntity =
      await this.candidateSkillsRepository.findByCUuidAndSkill(cUuid, skillId);

    if (candidateWithTheSkillEntity) {
      throw new BadRequestException('Skill is already assigned to candiidate');
    }

    const candidateSkillEntity = await this.candidateSkillsRepository.save(
      this.candidateSkillsRepository.create({
        candidateId: candidate.candidateId,
        cUuid: candidate.cUuid,
        skillId,
      }),
    );

    return candidateSkillEntity;
  }
}
