import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import MainCard from '@components/MainCard';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import { useGlobalContext } from '@providers/GlobalProvider';
import { getCalendar, getLeaveBalance } from '@pages/Dashboard/LeaveRequest/LeaveRequestServices';

const localizer = dayjsLocalizer(dayjs);

const statusColorMap = {
    pending: '#ed6c02',
    approved: '#2e7d32',
    rejected: '#d32f2f',
    cancelled: '#616161',
    holiday: '#1976d2',
};

const statusLabelMap = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    holiday: 'Holiday',
};

const eventStyleGetter = (event) => {
    const bg = statusColorMap[event.status] || '#0288d1';

    return {
        style: {
            backgroundColor: bg,
            borderRadius: 8,
            border: 'none',
            color: '#fff',
            padding: '2px 6px',
        },
    };
};

const normalizeLeaveEvents = (rows) => {
    return rows.map((item) => ({
        id: item.id,
        title: `${item.user?.name || 'Employee'} - ${item.leave_type}`,
        start: dayjs(item.start_date).startOf('day').toDate(),
        end: dayjs(item.end_date).add(1, 'day').startOf('day').toDate(),
        allDay: true,
        status: item.status,
        eventType: 'leave',
        meta: item,
    }));
};

const normalizeHolidayEvents = (rows) => {
    return rows.map((item) => ({
        id: `holiday-${item.id}`,
        title: `Holiday - ${item.name}`,
        start: dayjs(item.holiday_date).startOf('day').toDate(),
        end: dayjs(item.holiday_date).add(1, 'day').startOf('day').toDate(),
        allDay: true,
        status: 'holiday',
        eventType: 'holiday',
        meta: item,
    }));
};

export default function CalendarScreenBig() {
    const { showLoading, hideLoading, showNotification } = useGlobalContext();
    const [events, setEvents] = useState([]);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [leaveBalance, setLeaveBalance] = useState(null);

    const loadLeaveCalendar = async (date) => {
        const month = dayjs(date).format('YYYY-MM');

        showLoading();
        try {
            const [calendarRes, balanceRes] = await Promise.all([
                getCalendar(month),
                getLeaveBalance(month),
            ]);

            const rows = calendarRes.data?.data?.leave_requests || [];
            const holidays = calendarRes.data?.data?.holidays || [];
            setEvents([
                ...normalizeLeaveEvents(rows),
                ...normalizeHolidayEvents(holidays),
            ]);
            setLeaveBalance(balanceRes.data?.data || null);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to load leave calendar', 'error');
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        loadLeaveCalendar(viewDate);
    }, [viewDate]);

    const selectedMeta = useMemo(() => selectedEvent?.meta || null, [selectedEvent]);

    return (
        <MainCard>
            <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
                Monthly Leave Calendar
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1.7fr 1fr' } }}>
                <Paper variant='outlined' sx={{ p: 1.5, borderRadius: 3, minWidth: 0 }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor='start'
                        endAccessor='end'
                        style={{ height: 'calc(100vh - 220px)' }}
                        views={['month']}
                        defaultView='month'
                        date={viewDate}
                        onNavigate={(d) => setViewDate(d)}
                        popup
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={(event) => setSelectedEvent(event)}
                        messages={{
                            month: 'Month',
                            today: 'Today',
                            previous: 'Prev',
                            next: 'Next',
                            showMore: (total) => `+${total} events`,
                        }}
                    />
                </Paper>

                <Paper variant='outlined' sx={{ borderRadius: 3, p: 2 }}>
                    <Typography variant='subtitle1' fontWeight={700} gutterBottom>
                        Leave Balance
                    </Typography>
                    {leaveBalance ? (
                        <Stack spacing={0.5} sx={{ mb: 2 }}>
                            <Typography><strong>As Of:</strong> {leaveBalance.as_of_date}</Typography>
                            <Typography><strong>Total Available:</strong> {leaveBalance.available_total}</Typography>
                            <Typography><strong>Current Year Remaining:</strong> {leaveBalance.remaining_current_year}</Typography>
                            <Typography><strong>Prev Year Available:</strong> {leaveBalance.available_previous_year}</Typography>
                            {Number(leaveBalance.expired_previous_year || 0) > 0 && (
                                <Typography><strong>Prev Year Expired:</strong> {leaveBalance.expired_previous_year}</Typography>
                            )}
                        </Stack>
                    ) : (
                        <Typography color='text.secondary' sx={{ mb: 2 }}>
                            No leave balance data.
                        </Typography>
                    )}

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant='subtitle1' fontWeight={700} gutterBottom>
                        Leave Request Detail
                    </Typography>

                    {!selectedMeta ? (
                        <Typography color='text.secondary'>Select one leave request on calendar to view detail.</Typography>
                    ) : selectedEvent?.eventType === 'holiday' ? (
                        <Stack spacing={1.25}>
                            <Typography><strong>Type:</strong> Holiday</Typography>
                            <Typography><strong>Name:</strong> {selectedMeta.name}</Typography>
                            <Typography><strong>Date:</strong> {selectedMeta.holiday_date}</Typography>
                            <Typography><strong>Note:</strong> {selectedMeta.note || '-'}</Typography>
                        </Stack>
                    ) : (
                        <Stack spacing={1.25}>
                            <Typography><strong>Request No:</strong> {selectedMeta.request_no}</Typography>
                            <Typography><strong>Employee:</strong> {selectedMeta.user?.name || '-'}</Typography>
                            <Typography><strong>Department:</strong> {selectedMeta.department?.name || '-'}</Typography>
                            <Typography><strong>Type:</strong> {selectedMeta.leave_type}</Typography>
                            <Typography><strong>Date:</strong> {selectedMeta.start_date} to {selectedMeta.end_date}</Typography>
                            <Typography><strong>Total Days:</strong> {selectedMeta.total_days}</Typography>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <Typography><strong>Status:</strong></Typography>
                                <Chip
                                    size='small'
                                    label={statusLabelMap[selectedMeta.status] || selectedMeta.status}
                                    sx={{ color: '#fff', backgroundColor: statusColorMap[selectedMeta.status] || '#0288d1' }}
                                />
                            </Stack>
                            <Typography><strong>Reason:</strong> {selectedMeta.reason}</Typography>
                            {selectedMeta.rejection_reason && (
                                <Typography><strong>Rejection Reason:</strong> {selectedMeta.rejection_reason}</Typography>
                            )}
                        </Stack>
                    )}
                </Paper>
            </Box>
        </MainCard>
    );
}
