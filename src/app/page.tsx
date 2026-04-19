'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { TranslationForm } from '@/components/TranslationForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setError(null);
    setTranslationResult(null);
  };

  const handleTranslate = async (formData: {
    context: string;
    targetLanguage: string;
  }) => {
    if (!uploadedFile) {
      setError('Please upload a file first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await uploadedFile.text();
      const fileContent = JSON.parse(text);

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: fileContent,
          context: formData.context,
          targetLanguage: formData.targetLanguage,
          fileFormat: uploadedFile.name.endsWith('.json') ? 'json' : 'yaml',
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const result = await response.json();
      setTranslationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text">
          Localize Your App, Instantly
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Upload your localization files, add context about your app, and get
          intelligent, tone-aware translations powered by LLMs.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="https://github.com/quicklocalize/quicklocalize"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
          >
            GitHub Repository
          </a>
        </div>
      </section>

      {/* Main Content */}
      <section className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Upload & Form */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Upload File</h2>
            <FileUploader onFileUpload={handleFileUpload} />
            {uploadedFile && (
              <p className="text-sm text-green-400 mt-4">
                ✓ File uploaded: {uploadedFile.name}
              </p>
            )}
          </div>

          {uploadedFile && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">
                Step 2: Add Context & Translate
              </h2>
              <TranslationForm
                onTranslate={handleTranslate}
                isLoading={isLoading}
              />
            </div>
          )}

          {error && (
            <div className="card p-4 border-red-500/30 bg-red-500/10">
              <p className="text-red-400">❌ Error: {error}</p>
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {translationResult && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Translation Result</h2>
              <ResultsDisplay result={translationResult} />
            </div>
          )}

          {!translationResult && uploadedFile && (
            <div className="card p-6 text-center text-slate-400">
              <p>Awaiting translation...</p>
              <p className="text-sm mt-2">Fill in the form and click translate</p>
            </div>
          )}

          {!uploadedFile && (
            <div className="card p-6 text-center text-slate-400">
              <p>📁 Upload a file to get started</p>
              <p className="text-sm mt-2">Supports JSON and YAML formats</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Why QuickLocalize?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Context-Aware',
              description:
                'Provide context about your app to get tone-appropriate translations',
              icon: '🎯',
            },
            {
              title: 'Free Forever',
              description:
                'No API keys, no payment required. Built on Cloudflare free tier.',
              icon: '💰',
            },
            {
              title: 'Fast & Reliable',
              description:
                'Powered by Llama 3 on Cloudflare edge network worldwide',
              icon: '⚡',
            },
          ].map((feature, i) => (
            <div key={i} className="card p-6 text-center">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
