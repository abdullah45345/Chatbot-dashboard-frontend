'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Business = {
  id: string;
  name: string;
  website_url: string;
  status: string;
  primary_color?: string | null;
};

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  scraping: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses`);
        if (!res.ok) throw new Error('Failed to fetch businesses');
        const data = await res.json();
        setBusinesses(data);
      } catch (error) {
        console.error(error);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Business Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your businesses and demos.</p>
          </div>
          <Link
            href="/dashboard/new"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Add Business
          </Link>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading businesses...
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <h2 className="text-lg font-medium text-gray-900">No businesses yet. Add your first one.</h2>
            <p className="mt-2 text-sm text-gray-500">Create a business to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{business.website_url}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      statusStyles[business.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {business.status}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/demo/${business.id}`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    View Demo
                  </Link>
                  <Link
                    href={`/dashboard/${business.id}`}
                    className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
