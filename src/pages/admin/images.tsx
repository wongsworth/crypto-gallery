import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ImageUploadForm from '@/components/ImageUploadForm';
import { supabase } from '@/lib/supabase';
import ImageCard from '@/components/ImageCard';

interface Image {
  id: string;
  title: string;
  description: string;
  path: string;
  tags: { id: string; name: string; }[];
  categories: { id: string; name: string; }[];
}

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface AdminImagesProps {
  images: Image[];
  categories: Category[];
  tags: Tag[];
}

export async function getStaticProps() {
  const [
    { data: images },
    { data: categories },
    { data: tags },
  ] = await Promise.all([
    supabase
      .from('Image')
      .select(`
        id,
        title,
        description,
        path,
        tags (
          id,
          name
        ),
        categories (
          id,
          name
        )
      `),
    supabase.from('Category').select('id, name'),
    supabase.from('Tag').select('id, name'),
  ]);

  return {
    props: {
      images: images || [],
      categories: categories || [],
      tags: tags || [],
    },
    revalidate: 60,
  };
}

export default function AdminImages({ images: initialImages, categories, tags }: AdminImagesProps) {
  const [images, setImages] = useState(initialImages);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleUploadSuccess = () => {
    // Refresh the page to get the latest images
    window.location.reload();
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Images</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showUploadForm ? 'Cancel Upload' : 'Upload Image'}
        </button>
      </div>

      {showUploadForm && (
        <div className="mb-8 bg-white shadow sm:rounded-lg p-6">
          <ImageUploadForm
            categories={categories}
            tags={tags}
            onSuccess={handleUploadSuccess}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>
    </AdminLayout>
  );
} 