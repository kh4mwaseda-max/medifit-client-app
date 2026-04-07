import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// クライアントサイド用（ブラウザから直接アクセス）
export const getSupabaseClient = (): SupabaseClient<Database> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
};

// 後方互換のためのシングルトン（クライアントコンポーネントで使用）
let _supabase: SupabaseClient<Database> | null = null;
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = getSupabaseClient();
    }
    return (_supabase as any)[prop];
  },
});

// サーバーサイド専用（APIルート・Server Actions用）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createServerClient = (): SupabaseClient<any> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, serviceKey);
};
