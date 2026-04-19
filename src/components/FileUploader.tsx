'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

export function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/json', 'text/plain', 'text/yaml', 'application/x-yaml'];
    const validExtensions = ['.json', '.yaml', '.yml'];
    return validTypes.includes(file.type) || validExtensions.some((ext) => file.name.endsWith(ext));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) onFileUpload(file);
      else alert(t('upload.invalidFile'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) onFileUpload(file);
      else alert(t('upload.invalidFile'));
    }
  };

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-700/20'
        }`}
      >
        <Upload className="mx-auto mb-3 text-blue-400" size={32} />
        <p className="font-medium mb-1">
          {isDragActive ? t('upload.dropActive') : t('upload.dropIdle')}
        </p>
        <p className="text-sm text-slate-400">{t('upload.browse')}</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.yaml,.yml"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
