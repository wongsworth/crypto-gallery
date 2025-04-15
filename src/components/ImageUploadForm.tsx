import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDropzone } from 'react-dropzone';

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface ImageUploadFormProps {
  categories: Category[];
  tags: Tag[];
  onSuccess: () => void;
}

interface UploadProgress {
  [key: string]: {
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
  };
}

export default function ImageUploadForm({ categories, tags, onSuccess }: ImageUploadFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const newProgress: UploadProgress = {};
    acceptedFiles.forEach(file => {
      newProgress[file.name] = { progress: 0, status: 'pending' };
    });
    setUploadProgress(newProgress);

    try {
      // Process files in batches of 5 to avoid overwhelming the server
      const batchSize = 5;
      for (let i = 0; i < acceptedFiles.length; i += batchSize) {
        const batch = acceptedFiles.slice(i, i + batchSize);
        await Promise.all(batch.map(file => processFile(file)));
      }
      onSuccess();
    } catch (error) {
      console.error('Error in batch upload:', error);
      alert('Some files failed to upload. Please check the progress indicators.');
    } finally {
      setUploading(false);
    }
  }, [selectedCategories, selectedTags]);

  const processFile = async (file: File) => {
    try {
      // Update status to uploading
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { ...prev[file.name], status: 'uploading', progress: 10 }
      }));

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      // Update progress to 30% - Starting upload
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { ...prev[file.name], progress: 30 }
      }));

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update progress to 70% - File uploaded, creating database record
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { ...prev[file.name], progress: 70 }
      }));

      const { error: imageError } = await supabase
        .from('Image')
        .insert([
          {
            title: file.name.split('.')[0], // Use filename as default title
            description: '', // Empty description by default
            path: uploadData.path,
            categories: selectedCategories,
            tags: selectedTags,
          },
        ]);

      if (imageError) throw imageError;

      // Update status to completed
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { ...prev[file.name], status: 'completed', progress: 100 }
      }));
    } catch (error) {
      console.error('Error processing file:', file.name, error);
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { 
          ...prev[file.name], 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Categories</label>
        <select
          multiple
          value={selectedCategories}
          onChange={(e) =>
            setSelectedCategories(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tags</label>
        <select
          multiple
          value={selectedTags}
          onChange={(e) =>
            setSelectedTags(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : ''
        }`}
      >
        <div className="text-center">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-sm text-gray-500">Drop the files here ...</p>
          ) : (
            <div>
              <p className="text-sm text-gray-500">
                Drag and drop images here, or click to select files
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB each
              </p>
            </div>
          )}
        </div>
      </div>

      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Upload Progress</h4>
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([fileName, { progress, status, error }]) => (
              <div key={fileName} className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{fileName}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'completed'
                          ? 'bg-green-500'
                          : status === 'error'
                          ? 'bg-red-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {status === 'completed' && (
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {status === 'error' && (
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Uploading... Please don't close this window.
          </p>
        </div>
      )}
    </div>
  );
} 