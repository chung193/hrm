import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { userSchema } from './UserSchema';
import { getAllSimple as getOrganizations } from '../Organization/OrganizationServices';
import { getAllSimple as getDepartments } from '../Department/DepartmentServices';
import { getAllSimple as getDepartmentTitles } from '../DepartmentTitle/DepartmentTitleServices';

const UserAdd = ({ onSubmit, onClose }) => {
    const { t } = useTranslation('dashboard');
    const [organizations, setOrganizations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [titles, setTitles] = useState([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            employee_code: '',
            organization_id: '',
            department_id: '',
            department_title_id: '',
        },
    });

    const selectedOrganizationId = watch('organization_id');
    const selectedDepartmentId = watch('department_id');

    useEffect(() => {
        Promise.all([getOrganizations(), getDepartments(), getDepartmentTitles()])
            .then(([orgRes, depRes, titleRes]) => {
                setOrganizations(orgRes.data?.data || []);
                setDepartments(depRes.data?.data || []);
                setTitles(titleRes.data?.data || []);
            })
            .catch(() => {});
    }, []);

    const filteredDepartments = useMemo(() => {
        if (!selectedOrganizationId) {
            return departments;
        }

        return departments.filter((department) => Number(department.organization_id) === Number(selectedOrganizationId));
    }, [departments, selectedOrganizationId]);

    const filteredTitles = useMemo(() => {
        if (!selectedDepartmentId) {
            return titles;
        }

        return titles.filter((title) => Number(title.department_id) === Number(selectedDepartmentId));
    }, [titles, selectedDepartmentId]);

    const submitHandler = (data) => {
        onSubmit({
            ...data,
            organization_id: data.organization_id ? Number(data.organization_id) : null,
            department_id: data.department_id ? Number(data.department_id) : null,
            department_title_id: data.department_title_id ? Number(data.department_title_id) : null,
            employee_code: data.employee_code || null,
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit(submitHandler)} noValidate>
            <Stack spacing={2}>
                <TextField
                    label={t('pages.user.form.name')}
                    fullWidth
                    size="small"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                <TextField
                    label={t('pages.user.form.email')}
                    fullWidth
                    size="small"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                />

                <TextField
                    label="Employee Code"
                    fullWidth
                    size="small"
                    {...register('employee_code')}
                    error={!!errors.employee_code}
                    helperText={errors.employee_code?.message}
                />

                <TextField
                    select
                    label="Organization"
                    fullWidth
                    size="small"
                    {...register('organization_id')}
                    onChange={(event) => {
                        setValue('organization_id', event.target.value);
                        setValue('department_id', '');
                        setValue('department_title_id', '');
                    }}
                    error={!!errors.organization_id}
                    helperText={errors.organization_id?.message}
                >
                    <MenuItem value="">None</MenuItem>
                    {organizations.map((organization) => (
                        <MenuItem key={organization.id} value={organization.id}>
                            {organization.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Department"
                    fullWidth
                    size="small"
                    {...register('department_id')}
                    onChange={(event) => {
                        setValue('department_id', event.target.value);
                        setValue('department_title_id', '');
                    }}
                    error={!!errors.department_id}
                    helperText={errors.department_id?.message}
                >
                    <MenuItem value="">None</MenuItem>
                    {filteredDepartments.map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                            {department.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Department Title"
                    fullWidth
                    size="small"
                    {...register('department_title_id')}
                    error={!!errors.department_title_id}
                    helperText={errors.department_title_id?.message}
                >
                    <MenuItem value="">None</MenuItem>
                    {filteredTitles.map((title) => (
                        <MenuItem key={title.id} value={title.id}>
                            {title.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label={t('pages.user.form.password')}
                    type="password"
                    fullWidth
                    size="small"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                />

                <TextField
                    label={t('pages.user.form.passwordConfirmation')}
                    type="password"
                    fullWidth
                    size="small"
                    {...register('password_confirmation')}
                    error={!!errors.password_confirmation}
                    helperText={errors.password_confirmation?.message}
                />

                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button
                        type="button"
                        variant="outlined"
                        sx={{ textTransform: 'none' }}
                        disabled={isSubmitting}
                        onClick={onClose}
                    >
                        {t('pages.user.form.close')}
                    </Button>

                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ textTransform: 'none' }}
                        disabled={isSubmitting}
                    >
                        {t('pages.user.form.save')}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default UserAdd;
