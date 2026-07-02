'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type FormState = {
  name: string;
  website_url: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  primary_color: string;
  tone: string;
  welcome_message: string;
  suggested_messages: string[];
  focus_on: string;
  avoid_topics: string;
  description: string;
  services: string;
  service_areas: string;
  why_choose_us: string;
  special_offers: string;
};

const initialFormState: FormState = {
  name: '',
  website_url: '',
  phone: '',
  email: '',
  address: '',
  hours: '',
  primary_color: '#2563eb',
  tone: 'professional',
  welcome_message: 'Hi! How can I help you today?',
  suggested_messages: ['', '', ''],
  focus_on: '',
  avoid_topics: '',
  description: '',
  services: '',
  service_areas: '',
  why_choose_us: '',
  special_offers: '',
};

export default function NewBusinessPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const updateForm = (field: keyof FormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };



  const handleAnalyze = async () => {
    if (!selectedFiles.length) {
      setError('Please select at least one file.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append('files', file);
      }

      const res = await fetch('http://localhost:8000/businesses/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorText = typeof data === 'string'
          ? data
          : data?.detail
            ? (Array.isArray(data.detail)
              ? data.detail.map((e: unknown) => typeof e === 'object' && e && 'msg' in e ? String(e.msg) : String(e)).join(', ')
              : data.detail)
            : data?.message || 'Failed to analyze files';
        throw new Error(errorText);
      }

      const data = await res.json();
      console.log('[EXTRACT] Response data:', JSON.stringify(data, null, 2));
      const newForm: FormState = {
        name: data.name || '',
        website_url: data.website_url || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        hours: Array.isArray(data.hours) ? data.hours.join(', ') : data.hours || '',
        primary_color: data.primary_color || '#2563eb',
        tone: data.tone || 'professional',
        welcome_message: data.welcome_message || 'Hi! How can I help you today?',
        suggested_messages: data.suggested_messages?.length === 3 ? data.suggested_messages : ['', '', ''],
        focus_on: Array.isArray(data.focus_on) ? data.focus_on.join(', ') : data.focus_on || '',
        avoid_topics: Array.isArray(data.avoid_topics) ? data.avoid_topics.join(', ') : data.avoid_topics || '',
        description: Array.isArray(data.description) ? data.description.join(', ') : data.description || '',
        services: Array.isArray(data.services) ? data.services.join(', ') : data.services || '',
        service_areas: Array.isArray(data.service_areas) ? data.service_areas.join(', ') : data.service_areas || '',
        why_choose_us: Array.isArray(data.why_choose_us) ? data.why_choose_us.join(', ') : data.why_choose_us || '',
        special_offers: Array.isArray(data.special_offers) ? data.special_offers.join(', ') : data.special_offers || '',
      };

      setForm(newForm);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze files');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const stringify = (val: unknown) => {
        if (Array.isArray(val)) return val.join(', ');
        return val || null;
      };

      const payload = {
        name: form.name,
        website_url: form.website_url,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        hours: stringify(form.hours),
        primary_color: form.primary_color,
        tone: form.tone,
        welcome_message: form.welcome_message || null,
        suggested_messages: form.suggested_messages.filter(Boolean),
        focus_on: stringify(form.focus_on),
        avoid_topics: stringify(form.avoid_topics),
        description: stringify(form.description),
        services: stringify(form.services),
        service_areas: stringify(form.service_areas),
        why_choose_us: stringify(form.why_choose_us),
        special_offers: stringify(form.special_offers),
      };

      const res = await fetch('http://localhost:8000/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorText = typeof data === 'string'
          ? data
          : data?.detail
            ? (Array.isArray(data.detail)
              ? data.detail.map((e: unknown) => typeof e === 'object' && e && 'msg' in e ? String(e.msg) : String(e)).join(', ')
              : data.detail)
            : data?.message || 'Failed to create business';
        throw new Error(errorText);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">Add New Business</h1>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
            Step {step} of 2
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-5">
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <input
                  id="files"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.docx"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
                  className="hidden"
                />
                <label htmlFor="files" className="flex cursor-pointer flex-col items-center justify-center gap-3">
                  <div className="rounded-full bg-gray-900 p-3 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5 5 0 0117 8a5.5 5.5 0 01.1 11H7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Upload business files</p>
                    <p className="mt-1 text-sm text-gray-500">PDF, TXT, MD, or DOCX files</p>
                  </div>
                </label>
                {selectedFiles.length ? (
                  <p className="mt-4 text-sm text-gray-600">{selectedFiles.map((file) => file.name).join(', ')}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing || !selectedFiles.length}
                  className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {analyzing ? 'AI is analyzing your files...' : 'Analyze with AI'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Skip, fill manually
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <section className="rounded-xl border border-gray-200 p-5">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Info</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Business Name</label>
                    <input required value={form.name} onChange={(e) => updateForm('name', e.target.value)} className={inputClassName} placeholder="Acme Corp" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Website URL</label>
                    <input type="url" value={form.website_url} onChange={(e) => updateForm('website_url', e.target.value)} className={inputClassName} placeholder="https://example.com" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                    <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className={inputClassName} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className={inputClassName} placeholder="hello@example.com" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
                    <input value={form.address} onChange={(e) => updateForm('address', e.target.value)} className={inputClassName} placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Business Hours</label>
                    <input value={form.hours} onChange={(e) => updateForm('hours', e.target.value)} className={inputClassName} placeholder="Mon-Fri 9am-5pm" />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-5">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Branding</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Primary Color</label>
                    <input type="color" value={form.primary_color} onChange={(e) => updateForm('primary_color', e.target.value)} className="h-11 w-20 cursor-pointer rounded-lg border border-gray-300 bg-white p-1" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Tone</label>
                    <select value={form.tone} onChange={(e) => updateForm('tone', e.target.value)} className={inputClassName}>
                      <option value="friendly">friendly</option>
                      <option value="professional">professional</option>
                      <option value="funny">funny</option>
                      <option value="formal">formal</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-5">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Chatbot Behavior</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Welcome Message</label>
                    <textarea value={form.welcome_message} onChange={(e) => updateForm('welcome_message', e.target.value)} rows={3} className={inputClassName} placeholder="Hi! How can I help you today?" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-1">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Quick reply 1</label>
                      <input value={form.suggested_messages[0] || ''} onChange={(e) => { const msgs = [...form.suggested_messages]; msgs[0] = e.target.value; updateForm('suggested_messages', msgs); }} className={inputClassName} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Quick reply 2</label>
                      <input value={form.suggested_messages[1] || ''} onChange={(e) => { const msgs = [...form.suggested_messages]; msgs[1] = e.target.value; updateForm('suggested_messages', msgs); }} className={inputClassName} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Quick reply 3</label>
                      <input value={form.suggested_messages[2] || ''} onChange={(e) => { const msgs = [...form.suggested_messages]; msgs[2] = e.target.value; updateForm('suggested_messages', msgs); }} className={inputClassName} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Focus On</label>
                    <textarea value={form.focus_on} onChange={(e) => updateForm('focus_on', e.target.value)} rows={3} className={inputClassName} placeholder="What should the chatbot help with?" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Avoid Topics</label>
                    <textarea value={form.avoid_topics} onChange={(e) => updateForm('avoid_topics', e.target.value)} rows={3} className={inputClassName} placeholder="What topics should the chatbot avoid?" />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-5">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Knowledge</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                    <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Services</label>
                    <textarea value={form.services} onChange={(e) => updateForm('services', e.target.value)} rows={3} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Service Areas</label>
                    <input value={form.service_areas} onChange={(e) => updateForm('service_areas', e.target.value)} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Why Choose Us</label>
                    <textarea value={form.why_choose_us} onChange={(e) => updateForm('why_choose_us', e.target.value)} rows={3} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Special Offers</label>
                    <textarea value={form.special_offers} onChange={(e) => updateForm('special_offers', e.target.value)} rows={3} className={inputClassName} />
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Back
              </button>
              <button type="submit" disabled={loading} className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? 'Creating...' : 'Create Business'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
