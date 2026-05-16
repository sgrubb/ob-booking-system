export interface BankHoliday {
  id: number;
  seasonId: number;
  label: string;
  date: Date;
}

export interface Season {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  bankHolidays: BankHoliday[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSeason {
  name: string;
  startDate: Date;
  endDate: Date;
  bankHolidays: { label: string; date: Date }[];
}

export interface UpdateSeason {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  updatedAt: Date;
}
