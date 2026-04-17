export const isBrowserNotificationSupported = () => (
    typeof window !== 'undefined' && 'Notification' in window
);

export const getBrowserNotificationPermission = () => {
    if (!isBrowserNotificationSupported()) {
        return 'unsupported';
    }

    return Notification.permission;
};

export const ensureBrowserNotificationPermission = async () => {
    if (!isBrowserNotificationSupported()) {
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    try {
        return await Notification.requestPermission();
    } catch {
        return Notification.permission;
    }
};

export const showBrowserNotification = async ({ title, body }) => {
    if (!isBrowserNotificationSupported()) {
        return false;
    }

    const permission = await ensureBrowserNotificationPermission();
    if (permission !== 'granted') {
        return false;
    }

    new Notification(title, { body });
    return true;
};
