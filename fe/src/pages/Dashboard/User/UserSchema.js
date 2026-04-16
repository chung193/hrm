import { z } from 'zod';

export const userSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
        email: z.string().min(1, 'Email is required').email('Invalid email'),
        password: z.string().min(8, 'Password must be at least 8 characters').max(50, 'Password must be at most 50 characters'),
        password_confirmation: z
            .string()
            .min(8, 'Password confirmation must be at least 8 characters')
            .max(50, 'Password confirmation must be at most 50 characters'),
        employee_code: z.string().max(50, 'Employee code must be at most 50 characters').optional().or(z.literal('')),
        organization_id: z.string().optional(),
        department_id: z.string().optional(),
        department_title_id: z.string().optional(),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Password confirmation does not match',
        path: ['password_confirmation'],
    });
