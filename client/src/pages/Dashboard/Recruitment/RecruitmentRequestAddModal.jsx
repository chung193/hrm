import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    requested_position: z.string().min(1, 'Requested position is required').max(255),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    reason: z.string().min(1, 'Reason is required'),
    note: z.string().optional().or(z.literal('')),
    is_active: z.boolean().optional(),
});

const RecruitmentRequestAddModal = ({ onSubmit, onClose }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            requested_position: '',
            quantity: 1,
            reason: '',
            note: '',
            is_active: true,
        },
    });

    const submit = (data) => {
        onSubmit({
            ...data,
            note: data.note || null,
        });
    };

    return (
        <Box component='form' onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2}>
                <TextField label='Requested Position' fullWidth size='small' {...register('requested_position')} error={!!errors.requested_position} helperText={errors.requested_position?.message} />
                <TextField label='Quantity' type='number' fullWidth size='small' {...register('quantity')} error={!!errors.quantity} helperText={errors.quantity?.message} />
                <TextField label='Reason' fullWidth size='small' multiline minRows={3} {...register('reason')} error={!!errors.reason} helperText={errors.reason?.message} />
                <TextField label='Note' fullWidth size='small' multiline minRows={2} {...register('note')} error={!!errors.note} helperText={errors.note?.message} />

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

export default RecruitmentRequestAddModal;

