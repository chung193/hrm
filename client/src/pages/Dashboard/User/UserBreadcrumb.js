export const getBreadcrumbs = (t, scopeMode = 'organization') => [
    {
        label: t('home'),
        path: '#',
    },
    {
        label: scopeMode === 'system' ? 'System Users' : t('pages.user.title'),
        path: '#',
    },
];
