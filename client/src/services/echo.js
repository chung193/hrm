import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { backendUrl } from './axios';

let echoInstance = null;

const buildAuthHeaders = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user?.token) return {};

        return {
            Authorization: `${user.token_type || 'Bearer'} ${user.token}`,
        };
    } catch {
        return {};
    }
};

export const getEcho = () => {
    if (echoInstance) {
        return echoInstance;
    }

    if (!import.meta.env.VITE_REVERB_APP_KEY) {
        return null;
    }

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
        forceTLS: String(import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${backendUrl}broadcasting/auth`,
        auth: {
            headers: buildAuthHeaders(),
        },
    });

    return echoInstance;
};

export const disconnectEcho = () => {
    if (!echoInstance) {
        return;
    }

    echoInstance.disconnect();
    echoInstance = null;
};

export const subscribeToUserChannel = (userId, handlers = {}) => {
    const echo = getEcho();
    if (!echo || !userId) {
        return () => {};
    }

    const channel = echo.private(`App.Models.User.${userId}`);

    if (typeof handlers.onNotification === 'function') {
        channel.listen('.notification.created', handlers.onNotification);
    }

    if (typeof handlers.onConversationCreated === 'function') {
        channel.listen('.chat.conversation.created', handlers.onConversationCreated);
    }

    if (typeof handlers.onMessageCreated === 'function') {
        channel.listen('.chat.message.created', handlers.onMessageCreated);
    }

    return () => {
        echo.leave(`private-App.Models.User.${userId}`);
    };
};

export const subscribeToOrganizationPresence = (organizationId, handlers = {}) => {
    const echo = getEcho();
    if (!echo || !organizationId) {
        return () => {};
    }

    const channel = echo.join(`organization.${organizationId}`);

    if (typeof handlers.onHere === 'function') {
        channel.here(handlers.onHere);
    }

    if (typeof handlers.onJoining === 'function') {
        channel.joining(handlers.onJoining);
    }

    if (typeof handlers.onLeaving === 'function') {
        channel.leaving(handlers.onLeaving);
    }

    return () => {
        echo.leave(`presence-organization.${organizationId}`);
    };
};

export const subscribeToConversationPresence = (conversationId, handlers = {}) => {
    const echo = getEcho();
    if (!echo || !conversationId) {
        return { unsubscribe: () => {}, whisperTyping: () => {} };
    }

    const messageChannel = echo.private(`chat.conversation.${conversationId}`);
    const channel = echo.join(`chat.presence.${conversationId}`);

    if (typeof handlers.onMessageCreated === 'function') {
        messageChannel.listen('.chat.message.created', handlers.onMessageCreated);
    }

    if (typeof handlers.onHere === 'function') {
        channel.here(handlers.onHere);
    }

    if (typeof handlers.onJoining === 'function') {
        channel.joining(handlers.onJoining);
    }

    if (typeof handlers.onLeaving === 'function') {
        channel.leaving(handlers.onLeaving);
    }

    if (typeof handlers.onTyping === 'function') {
        channel.listenForWhisper('typing', handlers.onTyping);
    }

    return {
        whisperTyping: (payload) => channel.whisper('typing', payload),
        unsubscribe: () => {
            echo.leave(`private-chat.conversation.${conversationId}`);
            echo.leave(`presence-chat.presence.${conversationId}`);
        },
    };
};
