import { useTranslation } from 'react-i18next';
import MetaData from '@components/MetaData';
import { useSearchParams } from "react-router-dom";
import UserDetail from './UserDetail';
import UserTable from './UserTable';

const User = ({ scopeMode = 'organization' }) => {
    const { t } = useTranslation('dashboard');

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");

    return (
        <>
            <MetaData
                title={scopeMode === 'system' ? 'System User Management' : t('pages.user.title')}
                description={scopeMode === 'system' ? 'System User Management' : t('pages.user.title')}
            />
            {id && <UserDetail id={id} scopeMode={scopeMode} />}
            {!id && <UserTable scopeMode={scopeMode} />}
        </>
    );
};

export default User;
