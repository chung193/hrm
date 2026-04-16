import {
    Avatar,
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useGlobalContext } from '@providers/GlobalProvider';

import { show, showSystem, update, updateSystem, uploadAvatar } from './UserServices';
import { getAllSimple as getOrganizations } from '../Organization/OrganizationServices';
import { getAllSimple as getDepartments } from '../Department/DepartmentServices';
import { getAllSimple as getDepartmentTitles } from '../DepartmentTitle/DepartmentTitleServices';

export default function UserProfileTab({ id, scopeMode = 'organization' }) {
    const { organizationScope } = useGlobalContext();
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
            organization_id: isScoped ? scopedOrganizationId : (data.organization_id || null),
            department_id: data.department_id || null,
            department_title_id: data.department_title_id || null,
        };

        updateFn(id, payload).catch(() => {});
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
        uploadAvatar(formData).catch(() => {});
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box textAlign="center" position="relative" sx={{ mb: 3 }}>
                <Avatar
                    src={preview}
                    sx={{
                        width: 120,
                        height: 120,
                        mx: 'auto',
                        border: '4px solid #2c3e50',
                    }}
                />

                <input hidden id="upload" type="file" onChange={handleAvatar} />

                <label htmlFor="upload">
                    <IconButton
                        component="span"
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: '50%',
                            transform: 'translateX(25px)',
                            bgcolor: 'background.paper',
                        }}
                    >
                        <PhotoCamera />
                    </IconButton>
                </label>
            </Box>

            <Box sx={{ width: '100%' }} component="form" onSubmit={handleSubmit(onSubmit)}>
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

                    <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    label={field.value ? 'Active' : 'Inactive'}
                                    control={
                                        <Checkbox
                                            checked={!!field.value}
                                            onChange={(event) => field.onChange(event.target.checked)}
                                        />
                                    }
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        {isScoped ? (
                            <TextField
                                label="Organization"
                                fullWidth
                                size="small"
                                value={
                                    organizations.find((org) => Number(org.id) === Number(scopedOrganizationId))?.name || ''
                                }
                                disabled
                            />
                        ) : (
                            <Controller
                                name="organization_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth size="small">
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
                                <FormControl fullWidth size="small">
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
                                <FormControl fullWidth size="small">
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

                    <Grid item xs={12} md={6}>
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => <TextField {...field} label="Phone" fullWidth size="small" />}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => <TextField {...field} label="Address" fullWidth size="small" />}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Controller
                            name="city"
                            control={control}
                            render={({ field }) => <TextField {...field} label="City" fullWidth size="small" />}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Controller
                            name="position"
                            control={control}
                            render={({ field }) => <TextField {...field} label="Position" fullWidth size="small" />}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
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

                    <Grid item xs={12} md={4}>
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

                    <Grid item xs={12} md={4}>
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
                            render={({ field }) => <TextField {...field} label="Github" fullWidth size="small" />}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Bio" fullWidth size="small" multiline rows={3} />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" size="small" sx={{ minWidth: 150 }}>
                            Save Changes
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
