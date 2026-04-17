import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const createSchema = (t) => z.object({
    code: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.code', { ns: 'common' }) })).max(50),
    name: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.name', { ns: 'common' }) })).max(255),
    duration_months: z.coerce.number().int().positive().max(600).optional().or(z.literal('')),
    is_probation: z.boolean().optional(),
    is_indefinite: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

const ContractTypeAddModal = ({ onSubmit, onClose }) => {
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
            duration_months: '',
            is_probation: false,
            is_indefinite: false,
            is_active: true,
        },
    });

    const submit = (data) => {
        onSubmit({
            ...data,
            duration_months: data.duration_months === '' ? null : data.duration_months,
        });
    };

    return (
        <Box component='form' onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2}>
                <TextField label={t('labels.code', { ns: 'common' })} fullWidth size='small' {...register('code')} error={!!errors.code} helperText={errors.code?.message} />
                <TextField label={t('labels.name', { ns: 'common' })} fullWidth size='small' {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                <TextField label={t('labels.durationMonths', { ns: 'common' })} fullWidth size='small' type='number' {...register('duration_months')} error={!!errors.duration_months} helperText={errors.duration_months?.message} />

                <FormControlLabel control={<Checkbox {...register('is_probation')} />} label={t('labels.probation', { ns: 'common' })} />
                <FormControlLabel control={<Checkbox {...register('is_indefinite')} />} label={t('labels.indefinite', { ns: 'common' })} />
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

export default ContractTypeAddModal;
