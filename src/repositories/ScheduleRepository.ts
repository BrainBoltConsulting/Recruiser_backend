import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CustomRepository } from '../db/typeorm-ex.decorator';
import { Schedule } from '../entities/Schedule';

@CustomRepository(Schedule)
export class ScheduleRepository extends Repository<Schedule> {
  async findByName(name: string): Promise<Schedule | null> {
    return this.createQueryBuilder('schedule')
      .where('schedule.name = :name', { name })
      .getOne();
  }

  async getAllSorted(): Promise<Schedule[]> {
    return this.createQueryBuilder('schedule')
      .orderBy('schedule.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Schedule> {
    const entity = await this.createQueryBuilder('schedule')
      .where('schedule.scheduleId = :id', { id })
      .leftJoinAndSelect('schedule.candidate', 'candidate')
      .leftJoinAndSelect('schedule.job', 'job')
      .leftJoinAndSelect('job.jobSkills', 'jobSkills')
      .leftJoinAndSelect('candidate.candidateSkills', 'candidateSkills')
      .leftJoinAndSelect('candidateSkills.skill', 'skill')
      .leftJoinAndSelect('job.manager', 'manager')
      .getOne();

    if (!entity) {
      throw new NotFoundException(`Schedule not found with id: ${id}`);
    }

    return entity;
  }

  async findByCandidateId(candidateId: number): Promise<Schedule[] | null> {
    return this.createQueryBuilder('schedule')
      .where('schedule.candidateId = :candidateId', { candidateId })
      .getMany();
  }

  async findByCandidateAndJobId(
    candidateId: string,
    jobId: string,
  ): Promise<Schedule | null> {
    return this.createQueryBuilder('schedule')
      .where('schedule.candidateId = :candidateId', { candidateId })
      .andWhere('schedule.jobId = :jobId', { jobId })
      .getOne();
  }

  async findByMeetingLink(meetingLink: string): Promise<Schedule | null> {
    return this.createQueryBuilder('schedule')
      .where('schedule.meetingLink = :meetingLink', { meetingLink })
      .leftJoinAndSelect('schedule.candidate', 'candidate')
      .leftJoinAndSelect('schedule.job', 'job')
      .leftJoinAndSelect('job.manager', 'manager')
      .getOne();
  }

  async findByManagerIdAndDateRange(
    managerId: string,
    startDate: Date,
    endDate: Date,
    jobId?: string,
  ): Promise<Schedule[]> {
    const query = this.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.job', 'job')
      .leftJoinAndSelect('job.manager', 'manager')
      .where('job.manager_id = :managerId', { managerId })
      .andWhere('schedule.scheduledDatetime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (jobId) {
      query.andWhere('job.jobId = :jobId', { jobId });
    }

    return query.getMany();
  }

  /**
   * Get all jobs for a specific manager (regardless of schedules)
   */
  async findJobsByManagerId(managerId: string): Promise<any[]> {
    return this.createQueryBuilder('schedule')
      .select('job.jobId', 'jobId')
      .addSelect('job.jobTitle', 'jobTitle')
      .addSelect('job.yearsOfExp', 'yearsOfExp')
      .addSelect('job.jobDesc', 'jobDesc')
      .addSelect('COUNT(schedule.scheduleId)', 'scheduleCount')
      .leftJoin('schedule.job', 'job')
      .where('job.managerId = :managerId', { managerId })
      .groupBy('job.jobId')
      .addGroupBy('job.jobTitle')
      .addGroupBy('job.yearsOfExp')
      .addGroupBy('job.jobDesc')
      .getRawMany();
  }
}
