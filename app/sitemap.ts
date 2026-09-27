import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { siteUrl } from '@/lib/seo';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ['', '/novels', '/about', '/community', '/contact'].map(path => ({ url: siteUrl + path, changeFrequency: 'weekly', priority: path ? 0.7 : 1 }));
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const [{ data: posts }, { data: novels }, { data: chapters }] = await Promise.all([
    client.from('posts').select('id,updated_at').eq('is_hidden', false).order('created_at', { ascending: false }).limit(1000),
    client.from('novels').select('id').limit(1000),
    client.from('chapters').select('id,novel_id').limit(5000),
  ]);
  return [
    ...staticRoutes,
    ...(novels || []).map(novel => ({ url: `${siteUrl}/stories/${novel.id}`, priority: 0.7 })),
    ...(chapters || []).map(chapter => ({ url: `${siteUrl}/stories/${chapter.novel_id}/chapters/${chapter.id}`, priority: 0.6 })),
    ...(posts || []).map(post => ({ url: siteUrl + '/community/post/' + post.id, lastModified: post.updated_at, priority: 0.5 })),
  ];
}

