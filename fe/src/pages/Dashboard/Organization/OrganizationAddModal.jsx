import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const createSchema = (t) => z.object({
    code: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.code', { ns: 'common' }) })).max(50),
    name: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.name', { ns: 'common' }) })).max(255),
    is_active: z.boolean().optional(),
});

const OrganizationAddModal = ({ onSubmit, onClose }) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createSchema(t)),
        defaultValues: {
            code: '',
            name: '',
            is_active: true,
        },
    });

    return (
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
                <TextField
                    label={t('labels.code', { ns: 'common' })}
                    fullWidth
                    size='small'
                    {...register('code')}
                    error={!!errors.code}
                    helperText={errors.code?.message}
                />
                <TextField
                    label={t('labels.name', { ns: 'common' })}
                    fullWidth
                    size='small'
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />
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

export default OrganizationAddModal;
