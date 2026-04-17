import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const createSchema = (t) => z.object({
    leave_type: z.enum(['annual', 'sick', 'unpaid', 'other']),
    start_date: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.startDate', { ns: 'common' }) })),
    end_date: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.endDate', { ns: 'common' }) })),
    reason: z.string().min(1, t('messages.required', { ns: 'common', field: t('labels.reason', { ns: 'common' }) })),
});

const LeaveRequestAddModal = ({ onSubmit, onClose }) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createSchema(t)),
        defaultValues: {
            leave_type: 'annual',
            start_date: '',
            end_date: '',
            reason: '',
        },
    });

    return (
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
                <TextField select label={t('labels.leaveType', { ns: 'common' })} fullWidth size='small' defaultValue='annual' {...register('leave_type')} error={!!errors.leave_type} helperText={errors.leave_type?.message}>
                    <MenuItem value='annual'>{t('pages.leaveRequest.types.annual')}</MenuItem>
                    <MenuItem value='sick'>{t('pages.leaveRequest.types.sick')}</MenuItem>
                    <MenuItem value='unpaid'>{t('pages.leaveRequest.types.unpaid')}</MenuItem>
                    <MenuItem value='other'>{t('pages.leaveRequest.types.other')}</MenuItem>
                </TextField>
                <TextField type='date' label={t('labels.startDate', { ns: 'common' })} InputLabelProps={{ shrink: true }} fullWidth size='small' {...register('start_date')} error={!!errors.start_date} helperText={errors.start_date?.message} />
                <TextField type='date' label={t('labels.endDate', { ns: 'common' })} InputLabelProps={{ shrink: true }} fullWidth size='small' {...register('end_date')} error={!!errors.end_date} helperText={errors.end_date?.message} />
                <TextField label={t('labels.reason', { ns: 'common' })} fullWidth size='small' multiline minRows={3} {...register('reason')} error={!!errors.reason} helperText={errors.reason?.message} />

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

export default LeaveRequestAddModal;
