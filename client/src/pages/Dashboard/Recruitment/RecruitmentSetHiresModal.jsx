import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    hired_user_ids: z.array(z.coerce.number().int().positive()).optional(),
    hired_at: z.string().optional().or(z.literal('')),
});

const RecruitmentSetHiresModal = ({ users = [], defaultHires = [], onSubmit, onClose }) => {
    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            hired_user_ids: defaultHires,
            hired_at: '',
        },
    });

    const submit = (data) => {
        onSubmit({
            hired_user_ids: data.hired_user_ids || [],
            hired_at: data.hired_at || null,
        });
    };

    return (
        <Box component='form' onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2}>
                <Controller
                    name='hired_user_ids'
                    control={control}
                    render={({ field }) => (
                        <TextField
                            select
                            SelectProps={{ multiple: true }}
                            fullWidth
                            size='small'
                            label='Hired Users'
                            value={field.value || []}
                            onChange={(event) => field.onChange(event.target.value)}
                            error={!!errors.hired_user_ids}
                            helperText={errors.hired_user_ids?.message}
                        >
                            {users.map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                    {item.name} ({item.email})
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                <TextField
                    label='Hired At'
                    type='date'
                    fullWidth
                    size='small'
                    InputLabelProps={{ shrink: true }}
                    {...register('hired_at')}
                    error={!!errors.hired_at}
                    helperText={errors.hired_at?.message}
                />

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

export default RecruitmentSetHiresModal;

