import React from 'react';
import Head from 'next/head';
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

export async function getStaticProps() {
  const { data: images, error } = await supabase
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
    `);

  if (error) {
    console.error('Error fetching images:', error);
    return {
      props: {
        images: [],
      },
    };
  }

  return {
    props: {
      images: images || [],
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
}

export default function Home({ images }: { images: Image[] }) {
  return (
    <>
      <Head>
        <title>Crypto Gallery</title>
        <meta name="description" content="A gallery for crypto art and NFTs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Crypto Gallery</h1>
            <p className="text-xl text-gray-600">Welcome to your NFT gallery</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
} 