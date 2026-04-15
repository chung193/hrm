import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="max-w-md w-full mx-auto my-8 px-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 dark:bg-slate-900 dark:border-slate-700">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="text-sm text-slate-500 mt-2 dark:text-slate-400">{subtitle}</p>
        </div>

        {children}

        {footer && <div className="mt-6 text-sm text-center text-slate-600 dark:text-slate-300">{footer}</div>}
      </div>

      <p className="text-center text-xs text-slate-500 mt-4 dark:text-slate-400">
        <Link to="/" className="hover:text-slate-700 underline underline-offset-2 dark:hover:text-slate-200">
          Quay về trang chủ
        </Link>
      </p>
    </div>
  );
}

export default AuthCard;

