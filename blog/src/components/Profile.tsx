import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiService from "../services/common";
import Waiting from "./Waiting";
import PageMeta from "./PageMeta";
import { getAuthProfile, syncStoredUserProfile } from "../utils/auth";
import { getMediaUrl } from "../utils/formatDate";

interface ProfilePayload {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

const getResponseData = <T,>(response: { data?: T | { data?: T } } | undefined): T | null => {
  const payload = response?.data;
  if (!payload) return null;

  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data?: T }).data ?? null;
  }

  return payload as T;
};

const withAvatarVersion = (avatar: string | undefined, version?: number): string => {
  if (!avatar) return "";

  // First, convert relative path to full URL
  const fullUrl = getMediaUrl(avatar);

  // Then add version query parameter for cache busting
  if (!version) return fullUrl;

  const separator = fullUrl.includes("?") ? "&" : "?";
  return `${fullUrl}${separator}v=${version}`;
};

function Profile() {
  const navigate = useNavigate();
  const auth = useMemo(() => getAuthProfile(), []);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const applyProfile = (nextProfile: ProfilePayload, avatarVersion?: number) => {
    setProfile(nextProfile);
    setName(nextProfile.name || "");
    setEmail(nextProfile.email || "");
    const resolvedAvatar = withAvatarVersion(nextProfile.avatar, avatarVersion);
    setAvatarPreview(resolvedAvatar);
    syncStoredUserProfile({
      id: nextProfile.id,
      name: nextProfile.name,
      email: nextProfile.email,
      avatar: resolvedAvatar,
    });
  };

  const loadProfile = async (avatarVersion?: number) => {
    const response = await apiService.profile();
    const data = getResponseData<ProfilePayload>(response);
    if (!data || typeof data.id !== "number") {
      throw new Error("Invalid profile response");
    }
    applyProfile(data, avatarVersion);
  };

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setLoading(false);
      return;
    }

    loadProfile()
      .catch(() => {
        setProfileError("Không tải được thông tin cá nhân.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const response = await apiService.authPut("auth/me", {
        name: name.trim(),
        email: email.trim(),
      });

      const payload = getResponseData<{ message?: string; user?: ProfilePayload }>(response);
      const nextUser = payload?.user;
      if (nextUser && typeof nextUser.id === "number") {
        applyProfile(nextUser);
      } else {
        await loadProfile(Date.now());
      }

      setProfileMessage(payload?.message || "Cập nhật thông tin thành công.");
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || err?.response?.data?.error || "Không cập nhật được thông tin.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await apiService.authPatch("auth/change-password", {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      const payload = getResponseData<{ message?: string }>(response);
      setPasswordMessage(payload?.message || "Đổi mật khẩu thành công.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || err?.response?.data?.error || "Không đổi được mật khẩu.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setUploadingAvatar(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "User");
      formData.append("id", String(profile.id));
      formData.append("collection", "avatar");

      await apiService.authPostWithMedia("media/upload", formData);
      await loadProfile(Date.now());
      setProfileMessage("Cập nhật ảnh đại diện thành công.");
    } catch (err: any) {
      setAvatarPreview(profile.avatar || auth.avatar || "");
      setProfileError(err?.response?.data?.message || err?.response?.data?.error || "Không cập nhật được ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
      URL.revokeObjectURL(localPreview);
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <PageMeta
          title="Thông tin cá nhân"
          description="Cập nhật email, tên hiển thị, avatar và mật khẩu của tài khoản."
        />
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Thông tin cá nhân</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Vui lòng <Link to="/login" className="font-medium text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
            đăng nhập
          </Link>
          cập nhật thông tin tài khoản
        </p>
      </div>
    );
  }

  if (loading) {
    return <Waiting />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageMeta
        title="Thông tin cá nhân"
        description="Cập nhật email, tên hiển thị, avatar và mật khẩu của tài khoản."
      />

      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <img src={avatarPreview} alt={name || "Người dùng"} className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm dark:border-slate-800" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-sky-100 text-2xl font-semibold text-sky-700 shadow-sm dark:border-slate-800 dark:bg-slate-700 dark:text-slate-100">
                {(name?.charAt(0) || auth.name?.charAt(0) || "N").toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thông tin cá nhân</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Cập nhật tên hiển thị, email, ảnh đại diện và mật khẩu tài khoản của bạn.
              </p>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50 dark:border-slate-600 dark:bg-slate-900 dark:text-sky-200 dark:hover:bg-slate-800">
            {uploadingAvatar ? "Đang tải ảnh..." : "Đổi ảnh đại diện"}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Thông tin hiển thị</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tên hiển thị</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {profileError && <p className="mt-4 text-sm text-rose-600">{profileError}</p>}
          {profileMessage && <p className="mt-4 text-sm text-emerald-600">{profileMessage}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
            >
              {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Quay lại
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Đổi mật khẩu</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Mật khẩu hiện tại
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu mới</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Xác nhận mật khẩu mới</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {passwordError && <p className="mt-4 text-sm text-rose-600">{passwordError}</p>}
          {passwordMessage && <p className="mt-4 text-sm text-emerald-600">{passwordMessage}</p>}

          <button
            type="submit"
            disabled={savingPassword}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-60 dark:bg-sky-700 dark:hover:bg-sky-600"
          >
            {savingPassword ? "Đang đổi mật khẩu..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
