export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CANDIDATE = 'CANDIDATE'
}

export const roleVisibleContent = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.CANDIDATE]: 'Candidate',
}
