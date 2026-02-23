import { api } from '../api/client';
import { DashboardSummary, JournalTrade, Signal, UserProfile } from '../types';

export const fetchDashboard = async () => (await api.get<{ summary: DashboardSummary }>('/dashboard')).data.summary;
export const fetchSignals = async () => (await api.get<{ signals: Signal[] }>('/signals')).data.signals;
export const fetchJournal = async () => (await api.get<{ journal: JournalTrade[] }>('/journal')).data.journal;
export type NewJournalTrade = Pick<JournalTrade, 'pair' | 'direction' | 'entry' | 'exit' | 'pnl'>;
export const saveJournalTrade = async (payload: NewJournalTrade) => (await api.post<{ trade: JournalTrade }>('/journal', payload)).data.trade;
export const fetchProfile = async () => (await api.get<{ user: UserProfile }>('/auth/me')).data.user;
export const updateProfile = async (payload: Partial<UserProfile>) => (await api.patch<{ user: UserProfile }>('/auth/profile', payload)).data.user;
export const getAdminSettings = async () => (await api.get('/admin/settings')).data;
export const updateAdminSettings = async (payload: Record<string, unknown>) => (await api.patch('/admin/settings', payload)).data;
