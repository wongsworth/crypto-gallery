import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  imageCount: number;
  categoryCount: number;
  tagCount: number;
}

export async function getStaticProps() {
  const [
    { count: imageCount },
    { count: categoryCount },
    { count: tagCount },
  ] = await Promise.all([
    supabase.from('Image').select('*', { count: 'exact', head: true }),
    supabase.from('Category').select('*', { count: 'exact', head: true }),
    supabase.from('Tag').select('*', { count: 'exact', head: true }),
  ]);

  return {
    props: {
      stats: {
        imageCount: imageCount || 0,
        categoryCount: categoryCount || 0,
        tagCount: tagCount || 0,
      },
    },
    revalidate: 60,
  };
}

export default function AdminDashboard({ stats }: { stats: DashboardStats }) {
  const cards = [
    { title: 'Total Images', value: stats.imageCount, href: '/admin/images' },
    { title: 'Categories', value: stats.categoryCount, href: '/admin/categories' },
    { title: 'Tags', value: stats.tagCount, href: '/admin/tags' },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {card.value}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a
                  href={card.href}
                  className="font-medium text-indigo-600 hover:text-indigo-900"
                >
                  View all
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
} 