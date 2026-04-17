import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    user_id: z.coerce.number().int().positive('Employee is required'),
    contract_type_id: z.coerce.number().int().positive('Contract type is required'),
    contract_no: z.string().max(100).optional().or(z.literal('')),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional().or(z.literal('')),
    signed_date: z.string().optional().or(z.literal('')),
    status: z.enum(['draft', 'active', 'expired', 'terminated']),
    note: z.string().optional().or(z.literal('')),
    is_active: z.boolean().optional(),
});

const EmployeeContractAddModal = ({ users = [], contractTypes = [], onSubmit, onClose }) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            user_id: users[0]?.id || '',
            contract_type_id: contractTypes[0]?.id || '',
            contract_no: '',
            start_date: '',
            end_date: '',
            signed_date: '',
            status: 'draft',
            note: '',
            is_active: true,
        },
    });

    const submit = (data) => {
        onSubmit({
            ...data,
            contract_no: data.contract_no || null,
            end_date: data.end_date || null,
            signed_date: data.signed_date || null,
            note: data.note || null,
        });
    };

    return (
        <Box component='form' onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2}>
                <TextField select label='Employee' size='small' fullWidth defaultValue={users[0]?.id || ''} {...register('user_id')} error={!!errors.user_id} helperText={errors.user_id?.message}>
                    {users.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                            {item.name} ({item.email})
                        </MenuItem>
                    ))}
                </TextField>

                <TextField select label='Contract Type' size='small' fullWidth defaultValue={contractTypes[0]?.id || ''} {...register('contract_type_id')} error={!!errors.contract_type_id} helperText={errors.contract_type_id?.message}>
                    {contractTypes.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                            {item.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField label='Contract No' fullWidth size='small' {...register('contract_no')} error={!!errors.contract_no} helperText={errors.contract_no?.message} />
                <TextField label='Start Date' type='date' fullWidth size='small' InputLabelProps={{ shrink: true }} {...register('start_date')} error={!!errors.start_date} helperText={errors.start_date?.message} />
                <TextField label='End Date' type='date' fullWidth size='small' InputLabelProps={{ shrink: true }} {...register('end_date')} error={!!errors.end_date} helperText={errors.end_date?.message} />
                <TextField label='Signed Date' type='date' fullWidth size='small' InputLabelProps={{ shrink: true }} {...register('signed_date')} error={!!errors.signed_date} helperText={errors.signed_date?.message} />

                <TextField select label='Status' size='small' fullWidth defaultValue='draft' {...register('status')} error={!!errors.status} helperText={errors.status?.message}>
                    <MenuItem value='draft'>Draft</MenuItem>
                    <MenuItem value='active'>Active</MenuItem>
                    <MenuItem value='expired'>Expired</MenuItem>
                    <MenuItem value='terminated'>Terminated</MenuItem>
                </TextField>

                <TextField label='Note' fullWidth size='small' multiline minRows={2} {...register('note')} error={!!errors.note} helperText={errors.note?.message} />
                <FormControlLabel control={<Checkbox {...register('is_active')} defaultChecked />} label='Current Active Contract' />

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

export default EmployeeContractAddModal;

