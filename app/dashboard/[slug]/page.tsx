'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';

type Business = {
  id: string;
  name: string;
  website_url: string;
  primary_color?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  hours?: string | null;
  tone?: string | null;
  welcome_message?: string | null;
  suggested_messages?: string[] | null;
  focus_on?: string | null;
  avoid_topics?: string | null;
  description?: string | null;
  services?: string | null;
  service_areas?: string | null;
  why_choose_us?: string | null;
  special_offers?: string | null;
  status: string;
  created_at?: string;
};

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  scraping: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function BusinessManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setBusiness(null);
            setError('');
            return;
          }
          throw new Error('Failed to load business');
        }
        const data = await res.json();
        setBusiness(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [slug]);

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure? This cannot be undone.');
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${slug}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete business');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete business');
      setDeleting(false);
    }
  };

  const copyLink = async () => {
    if (!business) return;
    const demoUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/demo/${business.id}`;
    await navigator.clipboard.writeText(demoUrl);
  };

  const copyEmbedCode = async () => {
    if (!business) return;
    const embedCode = `<script src="${process.env.NEXT_PUBLIC_BACKEND_URL}/embed.js?id=${business.id}"></script>`;
    await navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    window.setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleUploadFiles = async () => {
    if (!business || !selectedFiles?.length) return;

    setUploading(true);
    setUploadMessage(null);
    setError('');

    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => formData.append('files', file));

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${slug}/upload-files`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to upload files');
      }

      setUploadMessage({ type: 'success', text: 'Files uploaded successfully! Chatbot is now trained.' });
      setSelectedFiles(null);
    } catch (err) {
      setUploadMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to upload files' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Loading business...
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Business not found</h1>
          <p className="mt-2 text-sm text-gray-500">The requested business could not be found.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-gray-700 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Back to Dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">{business.name}</h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
              statusStyles[business.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {business.status}
          </span>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Business Info</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-700">Website</p>
                <a href={business.website_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {business.website_url}
                </a>
              </div>
              <div>
                <p className="font-medium text-gray-700">Primary Color</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: business.primary_color || '#000000' }}
                  />
                  <span>{business.primary_color || '#000000'}</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700">Created</p>
                <p>{business.created_at ? new Date(business.created_at).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          </div>

          {business.status === 'ready' ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Demo Link</h2>
              <p className="mt-2 text-sm text-gray-500">Share this preview link with your team.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={copyLink}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Copy Link
                </button>
                <a
                  href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/demo/${business.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Open Demo
                </a>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Embed on Your Website</h2>
            <p className="mt-2 text-sm text-gray-500">Paste this code snippet just before the closing &lt;/body&gt; tag on your website</p>
            <div className="mt-4 overflow-hidden rounded-lg bg-gray-900 p-4">
              <pre className="overflow-x-auto text-sm text-gray-100"><code>{`<script src="https://chatbot-backend-delta-brown.vercel.app/static/embed.js?id=${business.id}"></script>`}</code></pre>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={copyEmbedCode}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                {copiedEmbed ? '✓ Copied!' : 'Copy Code'}
              </button>
              {copiedEmbed ? <span className="text-sm font-medium text-green-600">Copied!</span> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Files</h2>
            <p className="mt-2 text-sm text-gray-500">Upload documents about this business to train the chatbot</p>
            <div className="mt-4 space-y-3">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.md,.docx"
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              />
              <button
                onClick={handleUploadFiles}
                disabled={uploading || !selectedFiles?.length}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploading ? 'Uploading & training...' : 'Upload & Train'}
              </button>
              {uploadMessage ? (
                <div className={`rounded-lg border px-3 py-2 text-sm ${uploadMessage.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {uploadMessage.text}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Chatbot Settings</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-700">Tone</p>
                <p>{business.tone || 'professional'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Welcome message</p>
                <p>{business.welcome_message || '—'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Suggested messages</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {(business.suggested_messages || []).length > 0 ? (
                    business.suggested_messages!.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Focus on</p>
                <p>{business.focus_on || '—'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Avoid topics</p>
                <p>{business.avoid_topics || '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
            <p className="mt-2 text-sm text-red-600">Deleting this business cannot be undone.</p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {deleting ? 'Deleting...' : 'Delete Business'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
