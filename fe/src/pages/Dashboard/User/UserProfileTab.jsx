import {
    Avatar,
    Box,
    Button,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { CameraAltOutlined } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useGlobalContext } from '@providers/GlobalProvider';
import { show, showSystem, update, updateSystem, uploadAvatar } from './UserServices';
import { getAllSimple as getOrganizations } from '../Organization/OrganizationServices';
import { getAllSimple as getDepartments } from '../Department/DepartmentServices';
import { getAllSimple as getDepartmentTitles } from '../DepartmentTitle/DepartmentTitleServices';

const sectionSx = {
    p: { xs: 2, md: 3 },
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    bgcolor: 'background.paper',
};

const organizationFieldSx = {
    minWidth: { xs: '100%', md: 220 },
};

const SectionHeader = ({ title, description }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {title}
        </Typography>
        {description && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {description}
            </Typography>
        )}
    </Box>
);

export default function UserProfileTab({ id, scopeMode = 'organization' }) {
    const { organizationScope, showLoading, hideLoading, showNotification } = useGlobalContext();
    const [preview, setPreview] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [titles, setTitles] = useState([]);

    const { control, reset, handleSubmit, setValue } = useForm({
        defaultValues: {
            name: '',
            email: '',
            is_active: false,
            employee_code: '',
            organization_id: '',
            department_id: '',
            department_title_id: '',
            phone: '',
            address: '',
            city: '',
            position: '',
            website: '',
            github: '',
            birthday: '',
            join_date: '',
            hired_at: '',
            description: '',
            avatar: null,
        },
    });

    const selectedOrgId = useWatch({ control, name: 'organization_id' });
    const selectedDepartmentId = useWatch({ control, name: 'department_id' });
    const userName = useWatch({ control, name: 'name' });
    const userEmail = useWatch({ control, name: 'email' });
    const isActive = useWatch({ control, name: 'is_active' });
    const scopedOrganizationId = organizationScope?.selectedOrganizationId || null;
    const isScoped = scopeMode === 'organization' && Number(scopedOrganizationId || 0) > 0;
    const showFn = scopeMode === 'system' ? showSystem : show;
    const updateFn = scopeMode === 'system' ? updateSystem : update;

    useEffect(() => {
        Promise.all([getOrganizations(), getDepartments(), getDepartmentTitles()])
            .then(([orgRes, deptRes, titleRes]) => {
                setOrganizations(orgRes.data?.data || []);
                setDepartments(deptRes.data?.data || []);
                setTitles(titleRes.data?.data || []);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (isScoped && Number(selectedOrgId || 0) !== Number(scopedOrganizationId)) {
            setValue('organization_id', scopedOrganizationId);
        }
    }, [isScoped, scopedOrganizationId, selectedOrgId, setValue]);

    useEffect(() => {
        if (!id) {
            return;
        }

        showFn(id).then((res) => {
            const u = res.data.data || {};
            const detail = u.detail || {};

            reset({
                name: u.name || '',
                email: u.email || '',
                is_active: !!u.is_active,
                employee_code: detail.employee_code || '',
                organization_id: detail.organization_id || '',
                department_id: detail.department_id || '',
                department_title_id: detail.department_title_id || '',
                phone: detail.phone || '',
                address: detail.address || '',
                city: detail.city || '',
                birthday: detail.birthday || '',
                join_date: detail.join_date || '',
                hired_at: detail.hired_at || '',
                website: detail.website || '',
                github: detail.github || '',
                position: detail.position || '',
                description: detail.description || '',
            });

            if (u.avatar) {
                setPreview(u.avatar);
            }
        });
    }, [id, reset, scopeMode]);

    const filteredDepartments = useMemo(() => {
        if (!selectedOrgId) {
            return departments;
        }

        return departments.filter((department) => Number(department.organization_id) === Number(selectedOrgId));
    }, [departments, selectedOrgId]);

    const filteredTitles = useMemo(() => {
        if (!selectedDepartmentId) {
            return titles;
        }

        return titles.filter((title) => Number(title.department_id) === Number(selectedDepartmentId));
    }, [titles, selectedDepartmentId]);

    const onSubmit = (data) => {
        const payload = {
            ...data,
            organization_id: isScoped ? scopedOrganizationId : data.organization_id || null,
            department_id: data.department_id || null,
            department_title_id: data.department_title_id || null,
        };

        showLoading();
        updateFn(id, payload)
            .then(() => {
                showNotification('Updated user successfully', 'success');
            })
            .catch((err) => {
                showNotification(err.response?.data?.message || err.response?.data?.error || 'Cannot update user', 'error');
            })
            .finally(() => {
                hideLoading();
            });
    };

    const handleAvatar = (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        setValue('avatar', file);
        setPreview(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', 'User');
        formData.append('id', id);
        formData.append('collection', 'avatar');
        uploadAvatar(formData)
            .then(() => {
                showNotification('Updated avatar successfully', 'success');
            })
            .catch((err) => {
                showNotification(err.response?.data?.message || err.response?.data?.error || 'Cannot update avatar', 'error');
            });
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <Box sx={{ ...sectionSx, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={preview}
                            sx={{
                                width: 88,
                                height: 88,
                                bgcolor: 'grey.200',
                            }}
                        />
                        <input hidden id="upload" type="file" onChange={handleAvatar} />
                        <label htmlFor="upload">
                            <IconButton
                                component="span"
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    right: -6,
                                    bottom: -6,
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <CameraAltOutlined fontSize="small" />
                            </IconButton>
                        </label>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {userName || 'Unnamed user'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {userEmail || 'No email assigned'}
                        </Typography>
                    </Box>

                    <Controller
                        name="is_active"
                        control={control}
                        render={({ field }) => (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {field.value ? 'Active' : 'Inactive'}
                                </Typography>
                                <Switch
                                    checked={!!field.value}
                                    onChange={(event) => field.onChange(event.target.checked)}
                                />
                            </Stack>
                        )}
                    />
                </Stack>
            </Box>

            <Stack spacing={3}>
                <Box sx={sectionSx}>
                    <SectionHeader
                        title="Basic Information"
                        description="Main account information and employee identity."
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Full Name" fullWidth size="small" />}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Email" fullWidth size="small" />}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="employee_code"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Employee Code" fullWidth size="small" />}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="position"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Position" fullWidth size="small" />}
                            />
                        </Grid>
                    </Grid>
                </Box>

                <Box sx={sectionSx}>
                    <SectionHeader
                        title="Organization"
                        description="Department and title assignment."
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            {isScoped ? (
                                <TextField
                                    label="Organization"
                                    fullWidth
                                    size="small"
                                    sx={organizationFieldSx}
                                    value={organizations.find((org) => Number(org.id) === Number(scopedOrganizationId))?.name || ''}
                                    disabled
                                />
                            ) : (
                                <Controller
                                    name="organization_id"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth size="small" sx={organizationFieldSx}>
                                            <InputLabel id="organization-id-label">Organization</InputLabel>
                                            <Select
                                                {...field}
                                                labelId="organization-id-label"
                                                label="Organization"
                                                value={field.value || ''}
                                                onChange={(event) => {
                                                    field.onChange(event.target.value);
                                                    setValue('department_id', '');
                                                    setValue('department_title_id', '');
                                                }}
                                            >
                                                <MenuItem value="">None</MenuItem>
                                                {organizations.map((organization) => (
                                                    <MenuItem key={organization.id} value={organization.id}>
                                                        {organization.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                            )}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Controller
                                name="department_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth size="small" sx={organizationFieldSx}>
                                        <InputLabel id="department-id-label">Department</InputLabel>
                                        <Select
                                            {...field}
                                            labelId="department-id-label"
                                            label="Department"
                                            value={field.value || ''}
                                            onChange={(event) => {
                                                field.onChange(event.target.value);
                                                setValue('department_title_id', '');
                                            }}
                                        >
                                            <MenuItem value="">None</MenuItem>
                                            {filteredDepartments.map((department) => (
                                                <MenuItem key={department.id} value={department.id}>
                                                    {department.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Controller
                                name="department_title_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth size="small" sx={organizationFieldSx}>
                                        <InputLabel id="department-title-id-label">Department Title</InputLabel>
                                        <Select
                                            {...field}
                                            labelId="department-title-id-label"
                                            label="Department Title"
                                            value={field.value || ''}
                                        >
                                            <MenuItem value="">None</MenuItem>
                                            {filteredTitles.map((title) => (
                                                <MenuItem key={title.id} value={title.id}>
                                                    {title.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ ...sectionSx, height: '100%' }}>
                            <SectionHeader
                                title="Contact"
                                description="Daily contact information."
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Phone" fullWidth size="small" />}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="address"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="Address" fullWidth size="small" />}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="city"
                                        control={control}
                                        render={({ field }) => <TextField {...field} label="City" fullWidth size="small" />}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box sx={{ ...sectionSx, height: '100%' }}>
                            <SectionHeader
                                title="Dates"
                                description="Important employment dates."
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Controller
                                        name="join_date"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Join Date"
                                                type="date"
                                                fullWidth
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="hired_at"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Hired At"
                                                type="date"
                                                fullWidth
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="birthday"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Birthday"
                                                type="date"
                                                fullWidth
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={sectionSx}>
                    <SectionHeader
                        title="Links and Notes"
                        description="Optional references and internal notes."
                    />
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="website"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Website" fullWidth size="small" />}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="github"
                                control={control}
                                render={({ field }) => <TextField {...field} label="GitHub" fullWidth size="small" />}
                            />
                        </Grid>
                    </Grid>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Bio" fullWidth size="small" multiline rows={4} />
                        )}
                    />
                </Box>

                <Divider />

                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Save when you finish updating the user information.
                    </Typography>
                    <Button
                        type="submit"
                        variant="contained"
                        size="medium"
                        sx={{ minWidth: 160, alignSelf: { xs: 'stretch', sm: 'auto' } }}
                    >
                        Save Changes
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
