import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthCard from "./AuthCard";
import apiService from "../services/common";
import PageMeta from "./PageMeta";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiService.post("auth/forgot-password", { email });
      setMessage(
        response?.data?.message ||
          "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu."
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Không gửi được yêu cầu. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Qu?n m?t kh?u" description="Nh?p email ?? nh?n li?n k?t ??t l?i m?t kh?u t?i kho?n." />
      <AuthCard
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận liên kết đặt lại mật khẩu"
      footer={
        <>
          Nhớ mật khẩu rồi?{" "}
          <Link to="/login" className="text-sky-700 hover:text-sky-800 font-medium dark:text-sky-300 dark:hover:text-sky-200">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-sky-700">{error}</p>}
        {message && <p className="text-sm text-sky-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 text-white py-2.5 font-medium hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
        </button>
      </form>
    </AuthCard>
    </>
  );
}

export default ForgotPassword;


