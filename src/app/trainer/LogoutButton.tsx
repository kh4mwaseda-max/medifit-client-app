"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/trainer/auth", { method: "DELETE" });
    router.push("/trainer/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
    >
      ログアウト
    </button>
  );
}
