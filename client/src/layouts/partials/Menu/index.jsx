import { useMemo, useState, useCallback } from 'react';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import { BarChart, Security, Apps } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '@providers/GlobalProvider';
import MenuItem from './MenuItem';
import menu from './menuItem.json';

const ICONS = {
    barChart: <BarChart />,
    security: <Security />,
    apps: <Apps />,
};

const DEFAULT_ITEMS = menu;

export default function Menu({
    items = DEFAULT_ITEMS,
    title = '',
    sx = {},
    onNavigate,
}) {
    const { organizationScope, chatState } = useGlobalContext();
    const roleNames = Array.isArray(organizationScope?.profile?.roles)
        ? organizationScope.profile.roles.map((role) => String(role?.name || '').toLowerCase())
        : [];
    const isSystemAdmin = roleNames.some((name) => ['admin', 'super-admin', 'super admin'].includes(name));

    const itemsWithDynamicBadges = useMemo(() => {
        const applyBadges = (list) => list.map((item) => {
            const nextItem = { ...item };

            if (item.id === 'chat-direct') {
                nextItem.badge = chatState?.directUnread > 0 ? { content: chatState.directUnread } : null;
            }

            if (item.id === 'chat-group') {
                nextItem.badge = chatState?.groupUnread > 0 ? { content: chatState.groupUnread } : null;
            }

            if (Array.isArray(item.children)) {
                nextItem.children = applyBadges(item.children);
            }

            return nextItem;
        });

        return applyBadges(items);
    }, [items, chatState?.directUnread, chatState?.groupUnread]);

    const visibleItems = useMemo(() => {
        const filterItems = (list) =>
            list
                .filter((item) => !item.systemAdminOnly || isSystemAdmin)
                .map((item) => ({
                    ...item,
                    children: Array.isArray(item.children) ? filterItems(item.children) : item.children,
                }))
                .filter((item) => !Array.isArray(item.children) || item.children.length > 0 || item.url);

        return filterItems(itemsWithDynamicBadges);
    }, [itemsWithDynamicBadges, isSystemAdmin]);

    const routerNavigate = useNavigate();

    const initialOpen = useMemo(() => {
        const map = {};
        const walk = (list) => {
            list.forEach((it) => {
                if (it.initiallyOpen) map[it.id] = true;
                if (Array.isArray(it.children)) walk(it.children);
            });
        };
        walk(visibleItems);
        return map;
    }, [visibleItems]);

    const [openMap, setOpenMap] = useState(initialOpen);

    const navigate = useCallback(
        (url, external, target) => {
            if (!url || /^javascript:/i.test(url)) return;

            if (external || /^https?:\/\//i.test(url)) {
                window.open(url, target || '_blank', 'noopener,noreferrer');
                return;
            }

            routerNavigate(url);
        },
        [routerNavigate]
    );

    const handleNavigate = onNavigate || navigate;
    const renderIcon = useCallback((key) => ICONS[key] || null, []);

    return (
        <List
            component="nav"
            aria-labelledby="nested-list-subheader"
            sx={{ px: 0, py: 0, ...sx }}
            subheader={
                title ? (
                    <ListSubheader
                        component="div"
                        id="nested-list-subheader"
                        sx={{
                            bgcolor: 'transparent',
                            color: 'inherit',
                            opacity: 0.65,
                            textTransform: 'uppercase',
                            fontSize: 11,
                            letterSpacing: 1,
                            mb: 1.5,
                            fontWeight: 600,
                            pl: 2,
                        }}
                    >
                        {title}
                    </ListSubheader>
                ) : null
            }
        >
            {visibleItems.map((item) => (
                <MenuItem
                    key={item.id}
                    item={item}
                    level={0}
                    openMap={openMap}
                    setOpenMap={setOpenMap}
                    onNavigate={handleNavigate}
                    renderIcon={renderIcon}
                    siblings={visibleItems}
                />
            ))}
        </List>
    );
}
