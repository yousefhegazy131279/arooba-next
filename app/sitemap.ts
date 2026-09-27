import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { siteUrl } from '@/lib/seo';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ['', '/novels', '/about', '/community'].map(path => ({ url: siteUrl + path, changeFrequency: 'weekly', priority: path ? 0.7 : 1 }));
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  // Reader and story routes require authentication and must not enter the public sitemap.
  const { data: posts } = await client.from('posts').select('id,updated_at').eq('is_hidden', false).order('created_at', { ascending: false }).limit(1000);
  return [...staticRoutes, ...(posts || []).map(post => ({ url: siteUrl + '/community/post/' + post.id, lastModified: post.updated_at, priority: 0.5 }))];
}

