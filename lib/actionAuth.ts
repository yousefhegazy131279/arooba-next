import 'server-only';
import { createClient } from '@/lib/supabaseServer';

export async function requireActionUser(bucket?: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('سجّل الدخول لإكمال هذه العملية');
  if (bucket) {
    const { data, error: limitError } = await supabase.rpc('consume_action_rate_limit', { p_action: bucket });
    if (limitError) throw new Error('تعذر التحقق من حد الاستخدام. حاول لاحقاً');
    if (data !== true) throw new Error('طلبات كثيرة خلال وقت قصير. انتظر دقيقة ثم حاول مجدداً');
  }
  return { supabase, user };
}

export async function requireAdmin(bucket?: string) {
  const context = await requireActionUser(bucket);
  const { data, error } = await context.supabase.from('profiles').select('role').eq('id', context.user.id).single();
  if (error || data?.role !== 'admin') throw new Error('هذه العملية متاحة للمشرفين فقط');
  return context;
}

/** Never forward database internals, query text, or credentials to a client. */
export function actionDatabaseError(error: { code?: string; message?: string } | null, fallback: string): never {
  if (error?.code === '23505') throw new Error('هذا العنصر موجود بالفعل');
  if (error?.code === '42501' || error?.code === 'PGRST116') throw new Error('العنصر غير متاح أو لا تملك صلاحية تعديله');
  if (error?.message?.includes('rate_limit_exceeded')) throw new Error('طلبات كثيرة. انتظر دقيقة ثم حاول مجدداً');
  throw new Error(fallback);
}
