import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "./AuthCard";
import apiService from "../services/common";
import PageMeta from "./PageMeta";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      await apiService.post("auth/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate("/login");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="??t l?i m?t kh?u" description="Thi?t l?p m?t kh?u m?i cho t?i kho?n c?a b?n." />
      <AuthCard
      title="Đặt lại mật khẩu"
      subtitle="Nhập token từ email và mật khẩu mới"
      footer={
        <>
          Quay lại{" "}
          <Link to="/login" className="text-sky-700 hover:text-sky-800 font-medium dark:text-sky-300 dark:hover:text-sky-200">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="reset-token" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Token
          </label>
          <input
            id="reset-token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Nhap token trong email"
          />
        </div>

        <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Mật khẩu mới
          </label>
          <input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Tối thiểu 6 ký tự"
          />
        </div>

        <div>
            <label htmlFor="reset-password-confirm" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Xác nhận mật khẩu mới
          </label>
          <input
            id="reset-password-confirm"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        {error && <p className="text-sm text-sky-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 text-white py-2.5 font-medium hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>
    </AuthCard>
    </>
  );
}

export default ResetPassword;


