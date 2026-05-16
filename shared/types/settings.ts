export interface AppSettings {
  id: number;
  generatorFee: number;
  defaultTeamSize: number;
}

export interface UpdateAppSettings {
  generatorFee?: number;
  defaultTeamSize?: number;
}
