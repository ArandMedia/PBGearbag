import { apiClient } from './api';

export interface WidgetConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'list';
}

export interface WidgetDefinition {
  key: string;
  label: string;
  description: string;
  tags: string[];
  configFields: WidgetConfigField[];
}

export interface ProfileWidget {
  id: string;
  userId: string;
  widgetKey: string;
  position: number;
  config: Record<string, any>;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export const widgetsService = {
  async catalog() {
    return (await apiClient.get<WidgetDefinition[]>('/profile-widgets/catalog')).data;
  },
  async mine() {
    return (await apiClient.get<ProfileWidget[]>('/profile-widgets/me')).data;
  },
  async forUser(userId: string) {
    return (await apiClient.get<ProfileWidget[]>(`/profile-widgets/user/${userId}`)).data;
  },
  async add(widgetKey: string, config: Record<string, any> = {}) {
    return (await apiClient.post<ProfileWidget>('/profile-widgets', { widgetKey, config })).data;
  },
  async update(id: string, data: { config?: Record<string, any>; isVisible?: boolean }) {
    return (await apiClient.patch<ProfileWidget>(`/profile-widgets/${id}`, data)).data;
  },
  async remove(id: string) {
    return (await apiClient.delete(`/profile-widgets/${id}`)).data;
  },
  async reorder(order: string[]) {
    return (await apiClient.patch<ProfileWidget[]>('/profile-widgets/reorder', { order })).data;
  },
};
