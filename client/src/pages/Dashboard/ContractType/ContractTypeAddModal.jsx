import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    code: z.string().min(1, 'Code is required').max(50),
    name: z.string().min(1, 'Name is required').max(255),
    duration_months: z.coerce.number().int().positive().max(600).optional().or(z.literal('')),
    is_probation: z.boolean().optional(),
    is_indefinite: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

const ContractTypeAddModal = ({ onSubmit, onClose }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
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
                <TextField label='Code' fullWidth size='small' {...register('code')} error={!!errors.code} helperText={errors.code?.message} />
                <TextField label='Name' fullWidth size='small' {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                <TextField label='Duration (months)' fullWidth size='small' type='number' {...register('duration_months')} error={!!errors.duration_months} helperText={errors.duration_months?.message} />

                <FormControlLabel control={<Checkbox {...register('is_probation')} />} label='Probation' />
                <FormControlLabel control={<Checkbox {...register('is_indefinite')} />} label='Indefinite' />
                <FormControlLabel control={<Checkbox {...register('is_active')} defaultChecked />} label='Active' />

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

export default ContractTypeAddModal;

