import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    code: z.string().min(1, 'Code is required').max(50),
    name: z.string().min(1, 'Name is required').max(255),
    is_active: z.boolean().optional(),
});

const OrganizationAddModal = ({ onSubmit, onClose }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
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
                    label='Code'
                    fullWidth
                    size='small'
                    {...register('code')}
                    error={!!errors.code}
                    helperText={errors.code?.message}
                />
                <TextField
                    label='Name'
                    fullWidth
                    size='small'
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />
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

export default OrganizationAddModal;
