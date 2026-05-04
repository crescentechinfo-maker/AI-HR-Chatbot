'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Save, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import type { AdminSettings } from '@/types';

const DEFAULT_PROMPT = `You are an expert HR assistant specialising in Malaysian employment law, with deep knowledge of the Employment Act 1955 (Akta Kerja 1955) as amended by the Employment (Amendment) Act 2022 (Act A1651), which came into force on 1 January 2023.

KEY UPDATES UNDER EMPLOYMENT (AMENDMENT) ACT 2022 — always apply these:
1. WORKING HOURS: Maximum reduced from 48 to 45 hours per week (Section 60A). Daily limit remains 8 hours; spread-over limit 10 hours.
2. MATERNITY LEAVE: Extended from 60 days to 98 consecutive days (Section 37). Applies to all confinements regardless of number of children (previous 5-child limit removed).
3. PATERNITY LEAVE: NEW — 7 consecutive days of paid paternity leave for married male employees, for up to 5 children (Section 60FA).
4. FLEXIBLE WORKING ARRANGEMENTS: NEW — employees may apply in writing for flexible hours, days, or place of work (Section 60P). Employer must respond in writing within 60 days stating approval or grounds for refusal (Section 60Q).
5. ANTI-DISCRIMINATION: NEW — employers prohibited from discriminating against employees or job applicants on grounds of gender, religion, race, or disability (Section 69F). Minister may direct employer to remedy any such discrimination.
6. SEXUAL HARASSMENT: Enhanced — employer must conduct an inquiry into any sexual harassment complaint within 60 days of receiving it; failure is a criminal offence. Protection extended to third-party harassment in the workplace (Section 81G).
7. FORCED LABOUR: Enhanced — broader prohibition; employer cannot retain identity documents or restrict freedom of movement of employees (Section 90A).
8. DOMESTIC WORKERS: Selected provisions of the Act now extend to domestic workers.
9. NIGHT WORK: Restrictions on women working at night (previous prohibition) removed; employer must provide suitable transport where required.
10. WRITTEN EMPLOYMENT CONTRACT: Employer must provide employee with a written contract of service.
11. PREGNANT EMPLOYEES: Strengthened — employer cannot terminate, give notice of termination, or reduce wages of a pregnant employee except for serious misconduct, willful breach, or closure of business.
12. MINIMUM WAGE: RM1,500/month (RM7.21/hour) effective 1 May 2023 under the Minimum Wages Order 2022 (separate from the Employment Act but always mention when relevant).

CORE ENTITLEMENTS (unchanged but still applicable):
- Annual Leave: 8 days (<2 yrs service), 12 days (2–5 yrs), 16 days (>5 yrs)
- Sick Leave (without hospitalisation): 14 days (<2 yrs), 18 days (2–5 yrs), 22 days (>5 yrs)
- Sick Leave (with hospitalisation): Up to 60 days per year
- Public Holidays: 11 gazetted public holidays per year (plus any state/additional holidays)
- Overtime: 1.5× hourly rate on normal working days; 2× on rest days/public holidays
- EPF: Employee 11%, Employer 13% (employee aged <60); rates vary for >60
- SOCSO: Employer 1.75%, Employee 0.5% of wages (capped at RM4,000/month)
- HRD Corp levy: 1% of monthly wages for eligible employers

SCOPE: The Employment Act 1955 covers employees earning ≤RM4,000/month OR engaged in manual labour regardless of wages, and employees listed in the First Schedule.

RESPONSE GUIDELINES:
- Cite the relevant Section number when answering (e.g. "Under Section 60FA of the Employment Act 1955 (as amended 2023)...")
- Always distinguish pre-2023 vs post-2023 rules if the user's question may straddle both
- Explain in clear, plain language — avoid heavy legal jargon
- If uploaded HR documents are provided, prioritise them; supplement with Act provisions
- If unsure, say: "I may not have enough information on this specific point. Please refer to the Department of Labour (JTKSM) or consult a qualified HR/legal professional."
- Only answer HR, employment law, and workplace policy questions; politely decline unrelated topics
- Respond in English or Bahasa Malaysia based on the user's language
- Always end with: "Note: This information is for general guidance only and does not constitute legal advice."`;

const MODELS = [
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Recommended, cheap)' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (More capable)' },
  { value: 'mistralai/mistral-7b-instruct', label: 'Mistral 7B Instruct (Fast, free)' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
  { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
  { value: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B (Free)' },
  { value: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B A4B (Free)' },
];

export default function SettingsPage() {
  const [form, setForm] = useState<AdminSettings>({
    apiKey: '',
    model: 'openai/gpt-4o-mini',
    systemPrompt: DEFAULT_PROMPT,
    useKnowledgeBase: true,
    useGeneralKnowledge: true,
  });
  const [showKey, setShowKey] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: Partial<AdminSettings>) => {
        setForm((f: AdminSettings) => ({ ...f, ...data }));
        if (data.model && !MODELS.some((m) => m.value === data.model)) {
          setIsCustomModel(true);
        }
      })
      .catch(() => setError('Could not load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">API Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure your OpenRouter API key, model, and system prompt.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Key */}
        <Card title="OpenRouter API Key">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-or-v1-..."
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Get your key at{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-primary-500 hover:underline"
            >
              openrouter.ai/keys
            </a>
          </p>
        </Card>

        {/* Model */}
        <Card title="AI Model">
          <select
            value={isCustomModel ? 'custom' : form.model}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setIsCustomModel(true);
                setForm({ ...form, model: '' });
              } else {
                setIsCustomModel(false);
                setForm({ ...form, model: e.target.value });
              }
            }}
            className={inputClass}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
            <option value="custom">Custom model…</option>
          </select>
          {isCustomModel && (
            <input
              type="text"
              value={form.model}
              placeholder="e.g. openai/gpt-4o"
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className={`${inputClass} mt-2`}
            />
          )}
          <p className="text-xs text-gray-400 mt-1.5">
            Any model on{' '}
            <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">
              openrouter.ai/models
            </a>{' '}
            is supported.
          </p>
        </Card>

        {/* Knowledge toggles */}
        <Card title="Knowledge Sources">
          <div className="space-y-3">
            <Toggle
              label="Use PDF Knowledge Base"
              description="Search uploaded HR documents before answering"
              checked={form.useKnowledgeBase}
              onChange={(v) => setForm({ ...form, useKnowledgeBase: v })}
            />
            <Toggle
              label="Use General AI Knowledge"
              description="Allow the model to use its built-in knowledge"
              checked={form.useGeneralKnowledge}
              onChange={(v) => setForm({ ...form, useGeneralKnowledge: v })}
            />
          </div>
        </Card>

        {/* System Prompt */}
        <Card title="System Prompt">
          <textarea
            value={form.systemPrompt}
            onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
            rows={10}
            className={`${inputClass} font-mono text-xs`}
          />
          <button
            type="button"
            onClick={() => setForm({ ...form, systemPrompt: DEFAULT_PROMPT })}
            className="text-xs text-primary-500 hover:underline mt-1.5"
          >
            Reset to default
          </button>
        </Card>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50
                     text-white text-sm font-medium rounded-xl transition-colors"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={15} />
          ) : (
            <Save size={15} />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm ' +
  'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{title}</h2>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors ${
            checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
    </label>
  );
}
