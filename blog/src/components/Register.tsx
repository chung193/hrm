import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "./AuthCard";
import apiService from "../services/common";
import { persistAuthPayload } from "../utils/auth";
import PageMeta from "./PageMeta";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
      const response = await apiService.post("auth/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      const payload = response?.data?.data ?? response?.data ?? {};
      if (payload && (payload.token || payload.access_token)) {
        persistAuthPayload(payload);
        navigate("/");
        return;
      }

      navigate("/login");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="??ng k?" description="T?o t?i kho?n m?i ?? tham gia b?nh lu?n v? qu?n l? h? s? c? nh?n." />
      <AuthCard
      title="Đăng ký"
      subtitle="Tạo tài khoản mới để sử dụng đầy đủ tính năng"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-sky-700 hover:text-sky-800 font-medium dark:text-sky-300 dark:hover:text-sky-200">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Họ tên
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Nguyen Van A"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="you@example.com"
          />
        </div>

        <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Mật khẩu
          </label>
          <input
            id="register-password"
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
            <label htmlFor="register-password-confirm" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Xác nhận mật khẩu
          </label>
          <input
            id="register-password-confirm"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Nhập lại mật khẩu"
          />
        </div>

        {error && <p className="text-sm text-sky-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 text-white py-2.5 font-medium hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>
    </AuthCard>
    </>
  );
}

export default Register;


