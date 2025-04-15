import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Crypto Gallery</title>
        <meta name="description" content="A gallery for crypto art and NFTs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold mb-8">Crypto Gallery</h1>
          <p className="text-xl">Welcome to your NFT gallery</p>
        </div>
      </main>
    </>
  );
} 