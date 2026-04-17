import {
    Alert,
    Stack,
    TextField,
    Button,
    IconButton,
    InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useGlobalContext } from '@providers/GlobalProvider';
import { resetPassword, resetPasswordSystem } from './UserServices';

export default function UserChangePasswordTab({ id, scopeMode = 'organization' }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const { showLoading, hideLoading, showNotification } = useGlobalContext();
    const isSystemScope = scopeMode === 'system';

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            password: "",
            password_confirmation: "",
        },
    });

    const onSubmit = async (data) => {
        showLoading();

        try {
            const action = isSystemScope ? resetPasswordSystem : resetPassword;
            await action(id, data);
            showNotification('Updated password successfully', 'success');
            reset();
        } catch (err) {
            showNotification(err.response?.data?.message || err.response?.data?.error || 'Cannot update password', 'error');
        } finally {
            hideLoading();
        }
    };

    return (
        <Stack
            maxWidth={420}
            spacing={2.5}
            component="form"
            onSubmit={handleSubmit(onSubmit)}
        >
            <Alert severity="info">
                {isSystemScope
                    ? 'System administrator scope can update passwords for administrator users.'
                    : 'Organization scope can update passwords for users within the current organization.'}
            </Alert>

            <Controller
                name="password"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="New Password"
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />

            <Controller
                name="password_confirmation"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Confirm Password"
                        type={showConfirmation ? "text" : "password"}
                        fullWidth
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirmation((prev) => !prev)} edge="end">
                                        {showConfirmation ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />

            <Button type="submit" variant="contained" size="small" sx={{ width: 200 }}>
                Update Password
            </Button>
        </Stack>
    );
}
