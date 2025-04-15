import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ImageUploadForm from '@/components/ImageUploadForm';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface ImageType {
  id: string;
  title: string;
  description: string;
  path: string;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
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
  images: ImageType[];
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
      .select('id, title, description, path'),
    supabase.from('Category').select('id, name'),
    supabase.from('Tag').select('id, name'),
  ]);

  return {
    props: {
      images: images?.map(image => ({
        ...image,
        categories: [],
        tags: []
      })) || [],
      categories: categories || [],
      tags: tags || [],
    },
    revalidate: 60,
  };
}

export default function AdminImages({ images: initialImages, categories, tags }: AdminImagesProps) {
  const [images, setImages] = useState(initialImages);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [editingImage, setEditingImage] = useState<ImageType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredImages = images.filter((image) => {
    const matchesSearch = searchTerm === '' || 
      image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || 
      image.categories.some(cat => cat.id === selectedCategory);
    
    const matchesTag = selectedTag === '' || 
      image.tags.some(tag => tag.id === selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const handleUpdateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('Image')
        .update({
          title: editingImage.title,
          description: editingImage.description,
        })
        .eq('id', editingImage.id)
        .select()
        .single();

      if (error) throw error;

      setImages(images.map(img => 
        img.id === editingImage.id ? { ...img, ...data } : img
      ));
      setEditingImage(null);
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Error updating image. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const imageToDelete = images.find(img => img.id === id);
      if (!imageToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([imageToDelete.path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('Image')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setImages(images.filter(img => img.id !== id));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image. Please try again.');
    }
  };

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

      <div className="mb-8 bg-white shadow sm:rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Tag</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredImages.map((image) => (
          <div key={image.id} className="bg-white shadow rounded-lg overflow-hidden">
            {editingImage?.id === image.id ? (
              <form onSubmit={handleUpdateImage} className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={editingImage.title}
                    onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editingImage.description}
                    onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingImage(null)}
                    className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="relative h-48">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${image.path}`}
                    alt={image.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">{image.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{image.description}</p>
                  <div className="mt-2">
                    {image.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2"
                      >
                        {cat.name}
                      </span>
                    ))}
                    {image.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setEditingImage(image)}
                      className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
} 