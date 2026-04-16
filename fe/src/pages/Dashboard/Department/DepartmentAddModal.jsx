import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    organization_id: z.coerce.number().int().positive('Organization is required'),
    code: z.string().min(1, 'Code is required').max(50),
    name: z.string().min(1, 'Name is required').max(255),
    is_active: z.boolean().optional(),
});

const DepartmentAddModal = ({ organizations = [], onSubmit, onClose }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            organization_id: organizations[0]?.id || '',
            code: '',
            name: '',
            is_active: true,
        },
    });

    return (
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
                <TextField select label='Organization' size='small' fullWidth defaultValue={organizations[0]?.id || ''} {...register('organization_id')} error={!!errors.organization_id} helperText={errors.organization_id?.message}>
                    {organizations.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                            {item.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField label='Code' fullWidth size='small' {...register('code')} error={!!errors.code} helperText={errors.code?.message} />
                <TextField label='Name' fullWidth size='small' {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
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

export default DepartmentAddModal;
