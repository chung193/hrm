import { authInstance } from '@services/axios';

export const getConversations = async () => authInstance.get('chat-conversations');

export const getMessages = async (conversationId, params = {}) =>
    authInstance.get(`chat-conversations/${conversationId}/messages`, { params });

export const sendMessage = async (conversationId, data) =>
    authInstance.post(`chat-conversations/${conversationId}/messages`, data);
