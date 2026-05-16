export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isTeamLeader: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMember {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isTeamLeader: boolean;
}

export interface UpdateMember {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  isTeamLeader?: boolean;
  isActive?: boolean;
  updatedAt: Date;
}

export interface MemberListParams {
  includeInactive?: boolean;
}
