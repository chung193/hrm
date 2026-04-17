import { authInstance } from '@services/axios';
import apiService from '@services/common';

export const getChatConversations = async () => {
    const response = await authInstance.get('chat-conversations');
    return response;
};

export const createChatConversation = async (data) => {
    const response = await authInstance.post('chat-conversations', data);
    return response;
};

export const getChatMessages = async (conversationId, params = {}) => {
    const response = await authInstance.get(`chat-conversations/${conversationId}/messages`, { params });
    return response;
};

export const sendChatMessage = async (conversationId, data) => {
    if (data instanceof FormData) {
        const response = await apiService.postWithMedia(`chat-conversations/${conversationId}/messages`, data);
        return response;
    }

    const response = await authInstance.post(`chat-conversations/${conversationId}/messages`, data);
    return response;
};
