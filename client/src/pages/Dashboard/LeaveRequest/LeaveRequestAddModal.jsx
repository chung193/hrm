import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    leave_type: z.enum(['annual', 'sick', 'unpaid', 'other']),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    reason: z.string().min(1, 'Reason is required'),
});

const LeaveRequestAddModal = ({ onSubmit, onClose }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
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
                <TextField select label='Leave Type' fullWidth size='small' defaultValue='annual' {...register('leave_type')} error={!!errors.leave_type} helperText={errors.leave_type?.message}>
                    <MenuItem value='annual'>Annual</MenuItem>
                    <MenuItem value='sick'>Sick</MenuItem>
                    <MenuItem value='unpaid'>Unpaid</MenuItem>
                    <MenuItem value='other'>Other</MenuItem>
                </TextField>
                <TextField type='date' label='Start Date' InputLabelProps={{ shrink: true }} fullWidth size='small' {...register('start_date')} error={!!errors.start_date} helperText={errors.start_date?.message} />
                <TextField type='date' label='End Date' InputLabelProps={{ shrink: true }} fullWidth size='small' {...register('end_date')} error={!!errors.end_date} helperText={errors.end_date?.message} />
                <TextField label='Reason' fullWidth size='small' multiline minRows={3} {...register('reason')} error={!!errors.reason} helperText={errors.reason?.message} />

                <Stack direction='row' justifyContent='flex-end' spacing={1}>
                    <Button type='button' variant='outlined' onClick={onClose} disabled={isSubmitting}>
                        Close
                    </Button>
                    <Button type='submit' variant='contained' disabled={isSubmitting}>
                        Save
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default LeaveRequestAddModal;

