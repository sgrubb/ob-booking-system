export interface Contact {
  id: number;
  name: string;
  tel: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContact {
  name: string;
  tel?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UpdateContact {
  name?: string;
  tel?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  updatedAt: Date;
}

export interface ContactListParams {
  search?: string;
}
