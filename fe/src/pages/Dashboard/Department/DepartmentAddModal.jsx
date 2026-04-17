import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const createSchema = (t) => z.object({
    organization_id: z.coerce.number().int().positive(t('messages.required', { ns: 'common', field: t('labels.organization', { ns: 'common' }) })),
    code: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.code', { ns: 'common' }) })).max(50),
    name: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.name', { ns: 'common' }) })).max(255),
    is_active: z.boolean().optional(),
});

const DepartmentAddModal = ({ organizations = [], onSubmit, onClose, scopedOrganizationId = null }) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const isScoped = Number(scopedOrganizationId || 0) > 0;
    const scopedOrganization = organizations.find((item) => Number(item.id) === Number(scopedOrganizationId));

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createSchema(t)),
        defaultValues: {
            organization_id: scopedOrganizationId || organizations[0]?.id || '',
            code: '',
            name: '',
            is_active: true,
        },
    });

    useEffect(() => {
        if (isScoped) {
            setValue('organization_id', Number(scopedOrganizationId));
        }
    }, [isScoped, scopedOrganizationId, setValue]);

    return (
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
                {isScoped ? (
                    <TextField
                        label={t('labels.organization', { ns: 'common' })}
                        size='small'
                        fullWidth
                        value={scopedOrganization?.name || ''}
                        disabled
                    />
                ) : (
                    <TextField
                        select
                        label={t('labels.organization', { ns: 'common' })}
                        size='small'
                        fullWidth
                        defaultValue={organizations[0]?.id || ''}
                        {...register('organization_id')}
                        error={!!errors.organization_id}
                        helperText={errors.organization_id?.message}
                    >
                        {organizations.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </TextField>
                )}

                <TextField label={t('labels.code', { ns: 'common' })} fullWidth size='small' {...register('code')} error={!!errors.code} helperText={errors.code?.message} />
                <TextField label={t('labels.name', { ns: 'common' })} fullWidth size='small' {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                <FormControlLabel control={<Checkbox {...register('is_active')} defaultChecked />} label={t('active', { ns: 'common' })} />

                <Stack direction='row' justifyContent='flex-end' spacing={1}>
                    <Button type='button' variant='outlined' onClick={onClose} disabled={isSubmitting}>
                        {t('close', { ns: 'common' })}
                    </Button>
                    <Button type='submit' variant='contained' disabled={isSubmitting}>
                        {t('save', { ns: 'common' })}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default DepartmentAddModal;
