import { cookies } from "next/headers";
import { getTrainerId, verifyClientOwnership } from "@/lib/trainer-auth";

/**
 * 写真操作用の認可ヘルパー。
 * クライアント本人（client_auth_${clientId} cookie）または
 * そのクライアントを担当するトレーナーのいずれかであれば許可する。
 */
export async function authorizePhotoAccess(clientId: string): Promise<
  { ok: true; actor: "client" | "trainer" } | { ok: false; status: 401 | 403 }
> {
  const cookieStore = await cookies();
  if (cookieStore.get(`client_auth_${clientId}`)?.value === "1") {
    return { ok: true, actor: "client" };
  }

  const trainerId = await getTrainerId();
  if (trainerId) {
    const ownership = await verifyClientOwnership(trainerId, clientId);
    if (ownership) return { ok: true, actor: "trainer" };
    return { ok: false, status: 403 };
  }

  return { ok: false, status: 401 };
}
