import React from 'react';
import Image from 'next/image';

interface Tag {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ImageCardProps {
  image: {
    id: string;
    title: string;
    description: string;
    path: string;
    tags: Tag[];
    categories: Category[];
  };
}

export default function ImageCard({ image }: ImageCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={image.path}
          alt={image.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{image.title}</h3>
        <p className="text-gray-600 mb-4">{image.description}</p>
        <div className="flex flex-wrap gap-2">
          {image.categories.map((category) => (
            <span
              key={category.id}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {category.name}
            </span>
          ))}
          {image.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 