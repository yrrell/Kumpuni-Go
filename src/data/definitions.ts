// src/data/definitions.ts
export interface Shop {
  id: number | string;
  name: string;
  brgy: string;
  type: string;
  contact: string;
  lat: number;
  lng: number;
  openTime: number;
  closeTime: number;
  workDays: number[];
  status?: 'pending' | 'approved' | 'rejected';
  evidence_url?: string;
  email?: string;
  user_id?: string;
  created_at?: string;
  rejection_reason?: string;
}

export interface ContributionForm {
  name: string;
  brgy: string;
  type: string;
  contact: string;
  lat: number;
  lng: number;
  openTime: number;
  closeTime: number;
  workDays: number[];
  evidence_url: string;
  email: string;
}
