import DashboardLayout from '@layouts/DashboardLayout';
import Home from '@pages/dashboard/Home';
import Role from '@pages/Dashboard/Role/Role';
import Permission from '@pages/Dashboard/Permission/Permission';
import User from '@pages/Dashboard/User/User';
import PermissionMatrix from '@pages/Dashboard/PermissionMatrix/PermissionMatrix';
import Media from '@pages/Dashboard/Media/Media';
import Organization from '@pages/Dashboard/Organization/Organization';
import Department from '@pages/Dashboard/Department/Department';
import DepartmentTitle from '@pages/Dashboard/DepartmentTitle/DepartmentTitle';
import ContractType from '@pages/Dashboard/ContractType/ContractType';
import EmployeeContract from '@pages/Dashboard/EmployeeContract/EmployeeContract';
import RecruitmentSettings from '@pages/Dashboard/Recruitment/RecruitmentSettings';
import RecruitmentRequest from '@pages/Dashboard/Recruitment/RecruitmentRequest';
import LeaveRequest from '@pages/Dashboard/LeaveRequest/LeaveRequest';

import Reports from '@pages/dashboard/Reports';
import Settings from '@pages/dashboard/Settings';
import Features from '@pages/dashboard/Features';
import DataTables from '@pages/dashboard/DataTables';
import Chat from '@pages/Dashboard/Chat';
import ChatGroup from '@pages/Dashboard/ChatGroup';
import VideoCall from '@pages/Dashboard/VideoCall';

import Calendar from '@pages/Dashboard/Calendar';

export const DashboardRoutes = [
    {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'user', element: <User /> },
            { path: 'organization', element: <Organization /> },
            { path: 'department', element: <Department /> },
            { path: 'department-title', element: <DepartmentTitle /> },
            { path: 'contract-type', element: <ContractType /> },
            { path: 'employee-contract', element: <EmployeeContract /> },
            { path: 'recruitment-settings', element: <RecruitmentSettings /> },
            { path: 'recruitment-request', element: <RecruitmentRequest /> },
            { path: 'leave-request', element: <LeaveRequest /> },
            { path: 'media', element: <Media /> },
            { path: 'permission-matrix', element: <PermissionMatrix /> },
            { path: 'role', element: <Role /> },
            { path: 'permission', element: <Permission /> },
            { path: 'features', element: <Features /> },
            { path: 'reports', element: <Reports /> },
            { path: 'settings', element: <Settings /> },
            { path: 'datatables', element: <DataTables /> },
            { path: 'chat', element: <Chat /> },
            { path: 'chat-group', element: <ChatGroup /> },
            { path: 'video-call', element: <VideoCall /> },
            { path: 'calendar', element: <Calendar /> }
        ]
    }
];
