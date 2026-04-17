import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    department_id: z.coerce.number().int().positive('Department is required'),
    code: z.string().min(1, 'Code is required').max(50),
    name: z.string().min(1, 'Name is required').max(255),
    is_active: z.boolean().optional(),
    can_request_recruitment: z.boolean().optional(),
    can_approve_leave: z.boolean().optional(),
});

const DepartmentTitleAddModal = ({ departments = [], onSubmit, onClose }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            department_id: departments[0]?.id || '',
            code: '',
            name: '',
            is_active: true,
            can_request_recruitment: false,
            can_approve_leave: false,
        },
    });

    return (
        <Box component='form' onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
                <TextField select label='Department' size='small' fullWidth defaultValue={departments[0]?.id || ''} {...register('department_id')} error={!!errors.department_id} helperText={errors.department_id?.message}>
                    {departments.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                            {item.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField label='Code' fullWidth size='small' {...register('code')} error={!!errors.code} helperText={errors.code?.message} />
                <TextField label='Name' fullWidth size='small' {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                <FormControlLabel control={<Checkbox {...register('can_request_recruitment')} />} label='Can Request Recruitment' />
                <FormControlLabel control={<Checkbox {...register('can_approve_leave')} />} label='Can Approve Leave' />
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

export default DepartmentTitleAddModal;
