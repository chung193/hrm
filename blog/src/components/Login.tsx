import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "./AuthCard";
import apiService from "../services/common";
import { persistAuthPayload } from "../utils/auth";
import PageMeta from "./PageMeta";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiService.post("auth/login", { email, password });
      const payload = response?.data?.data ?? response?.data ?? {};

      if (payload && (payload.token || payload.access_token)) {
        persistAuthPayload(payload);
      }

      navigate("/");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Đăng nhập"
        description="Đăng nhập để bình luận, quản lý thông tin cá nhân và theo dõi hoạt động của bạn."
      />
      <AuthCard
        title="Đăng nhập"
        subtitle="Đăng nhập để quản lý bài viết và thông tin tài khoản"
        footer={
          <>
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-sky-700 hover:text-sky-800 font-medium dark:text-sky-300 dark:hover:text-sky-200">
              Đăng ký
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Mật khẩu
              </label>
              <Link to="/forgot-password" className="text-sm text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="********"
            />
          </div>

          {error && <p className="text-sm text-sky-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 text-white py-2.5 font-medium hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </AuthCard>
    </>
  );
}

export default Login;


