import { CollapseAction } from '@redux/UIReducer';
import { Settings, Menu as MenuIcon, ArrowForwardIos } from '@mui/icons-material';
import SettingDrawer from '@layouts/partials/Setting/SettingDrawer'
import {
    AppBar as SiteAppBar, Toolbar, Typography, Stack, IconButton, Box, Badge, Avatar, Menu, MenuItem, Divider, FormControl, InputLabel, Select
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useGlobalContext } from '@providers/GlobalProvider';
import SearchBox from './SearchBox';
import FullscreenToggleButton from '@components/FullscreenToggleButton';
import NotificationMenu from './NotificationMenu';
import UserMenu from './UserMenu';
import LanguageSwitcherFlag from '@components/LanguageSwitcherFlag';
import ThemeSwitcherIcon from '@components/ThemeSwitcherIcon';
import { useTranslation } from 'react-i18next';

const FULL = 250;
const MINI = 56;


const AppBar = () => {

    const dispatch = useDispatch();
    const { t } = useTranslation('common');
    const {
        openDrawer,
        organizationScope,
        setOrganizationScopeId
    } = useGlobalContext();

    const isCollapsed = useSelector((state) => state.ui.data.CollapseMenu);
    const sideWidth = isCollapsed ? MINI : FULL;

    return <SiteAppBar
        position="fixed"
        elevation={0}
        sx={{
            ml: { xs: 0, sm: `${sideWidth}px` },
            zIndex: 1004,
            backgroundColor: "background.paper",
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
            width: { xs: '100%', sm: `calc(100% - ${sideWidth}px)` },
            boxSizing: 'border-box',
            transition: 'margin-left .3s cubic-bezier(0.4, 0, 0.2, 1), width .3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
    >
        <Toolbar sx={{ gap: 2, justifyContent: 'space-between' }} >
            {isCollapsed && <IconButton
                color="inherit"
                aria-label="toggle sidebar"
                onClick={() => dispatch(CollapseAction(!isCollapsed))}
                sx={{

                    '&:focus': { outline: 'none' },           // bỏ outline mặc định
                    '&:focus-visible': { outline: 'none' },   // trình duyệt hỗ trợ pseudo này
                    '&.Mui-focusVisible': {                   // MUI thêm class này khi focus-visible
                        outline: 'none',
                        boxShadow: 'none',
                        backgroundColor: 'transparent'
                    }
                }}
            >
                <ArrowForwardIos />
            </IconButton>}

            {/* Desktop View */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    {/* Trái: Search */}
                    <Box sx={{ minWidth: 240, maxWidth: 520, flexGrow: 1 }}>
                        <SearchBox fullWidth />
                    </Box>

                    {/* Phải: các action */}
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 2 }}>
                        {organizationScope?.canSwitchOrganization && (
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id="organization-scope-label">{t('labels.organization')}</InputLabel>
                                <Select
                                    labelId="organization-scope-label"
                                    label={t('labels.organization')}
                                    value={organizationScope?.selectedOrganizationId || ''}
                                    onChange={(event) => {
                                        setOrganizationScopeId(event.target.value ? Number(event.target.value) : null);
                                        window.location.reload();
                                    }}
                                >
                                    {organizationScope?.organizations?.map((organization) => (
                                        <MenuItem key={organization.id} value={organization.id}>
                                            {organization.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <FullscreenToggleButton />
                        {/* <NotificationMenu /> */}
                        <LanguageSwitcherFlag />
                        <ThemeSwitcherIcon />
                        <IconButton onClick={() => openDrawer({ content: <SettingDrawer /> })} sx={{ color: 'text.secondary' }}>
                            <Settings />
                        </IconButton>
                        <Divider orientation="vertical" flexItem sx={{ my: 1.5 }} />
                        <UserMenu />
                    </Stack>
                </Stack>
            </Box>

            {/* Mobile View */}
            <Box sx={{ flexGrow: 1, display: { xs: 'block', sm: 'none' } }}>
                <Stack direction="row" alignItems="center" justifyContent="flex-end">
                    <LanguageSwitcherFlag />
                    <ThemeSwitcherIcon />
                    <UserMenu />
                </Stack>
            </Box>

        </Toolbar>
    </SiteAppBar>
}

export default AppBar
