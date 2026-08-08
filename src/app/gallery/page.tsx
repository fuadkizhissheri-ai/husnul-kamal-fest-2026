'use client';

import React, { useState, useEffect } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, FolderOpen, Download, Check, Sparkles, Layers } from 'lucide-react';
import { downloadFile } from '@/lib/fileDownloader';

interface GalleryPhoto {
  id: string;
  imageUrl: string;
}

interface GalleryAlbum {
  id: string;
  title: string;
  coverImage: string;
  photos: GalleryPhoto[];
}

/**
 * 📥 Robust cross-origin image download helper
 * Converts image to Blob to bypass cross-origin browser restrictions (e.g. Unsplash, CDN).
 */
async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Fetch image failed');

    const blob = await response.blob();
    // Use the universal downloader which handles native Capacitor automatically
    await downloadFile(blob, filename, blob.type || 'image/jpeg');
  } catch (error) {
    console.warn('Cross-origin blob fetch failed, falling back to direct anchor download:', error);
    // If running in browser and CORS fails, standard anchor fallback
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export default function GalleryPage() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Selected Album View
  const [activeAlbum, setActiveAlbum] = useState<GalleryAlbum | null>(null);

  // Lightbox Image Index
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Download status feedback per photo ID
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data.albums) setAlbums(data.albums);
        if (data.coverPhotoUrl) setCoverPhotoUrl(data.coverPhotoUrl);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const nextLightboxPhoto = () => {
    if (activeAlbum && lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % activeAlbum.photos.length);
    }
  };

  const prevLightboxPhoto = () => {
    if (activeAlbum && lightboxIndex !== null) {
      setLightboxIndex(
        (lightboxIndex - 1 + activeAlbum.photos.length) % activeAlbum.photos.length
      );
    }
  };

  const handleDownloadSingle = async (e: React.MouseEvent, photo: GalleryPhoto, index: number) => {
    e.stopPropagation(); // Don't trigger Lightbox open
    setDownloadingId(photo.id);

    const safeAlbumTitle = activeAlbum ? activeAlbum.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') : 'Album';
    const filename = `HusnulKamal2026_${safeAlbumTitle}_Photo_${index + 1}.jpg`;

    await downloadImage(photo.imageUrl, filename);

    setTimeout(() => {
      setDownloadingId(null);
    }, 1500);
  };

  const handleDownloadAllAlbumPhotos = async () => {
    if (!activeAlbum || activeAlbum.photos.length === 0) return;
    setBatchDownloading(true);

    const safeAlbumTitle = activeAlbum.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

    for (let i = 0; i < activeAlbum.photos.length; i++) {
      const photo = activeAlbum.photos[i];
      const filename = `HusnulKamal2026_${safeAlbumTitle}_Photo_${i + 1}.jpg`;
      await downloadImage(photo.imageUrl, filename);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setBatchDownloading(false);
  };

  return (
    <SmoothScroll>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 space-y-10">
        
        {/* Hero Banner with Configured Gallery Cover Photo */}
        <div className="relative h-64 sm:h-80 w-full rounded-[32px] overflow-hidden luxury-glass border border-[#9E741D]/30 dark:border-[#C8A86B]/40 shadow-luxury">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverPhotoUrl || 'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=2000&q=90'}
            alt="Meelad Fest Visual Gallery Banner"
            className="w-full h-full object-cover filter brightness-75 dark:brightness-60 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 sm:p-10 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#C8A86B]/20 text-[#F5E6C4] dark:text-[#C8A86B] text-xs font-semibold font-mono tracking-widest uppercase border border-[#C8A86B]/40 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-[#C8A86B] animate-pulse" />
              <span>Official Meelad Fest Photo Gallery</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-white">
              Visual Gallery &amp; Moments
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-neutral-300 font-sans">
              Highlights, Qirat performances, exhibition displays, and memorable moments from Mifthahul Uloom Madrasa, Ullisherikkunnu. Click any photo to inspect or download in high resolution.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-neutral-500">Loading gallery albums...</div>
        ) : activeAlbum ? (
          
          /* Album Photos View */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4">
              <div>
                <button
                  onClick={() => {
                    setActiveAlbum(null);
                    setLightboxIndex(null);
                  }}
                  className="text-xs font-bold text-[#9E741D] dark:text-[#C8A86B] hover:underline flex items-center space-x-1 mb-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Albums</span>
                </button>
                <h2 className="text-2xl font-heading font-bold text-[#0B0B0B] dark:text-white">
                  {activeAlbum.title}
                </h2>
              </div>

              {/* Album Actions */}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-neutral-400">
                  {activeAlbum.photos.length} Photos
                </span>

                <button
                  onClick={handleDownloadAllAlbumPhotos}
                  disabled={batchDownloading}
                  className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-xs px-4 py-2 flex items-center space-x-2 shadow-md hover:bg-[#9E741D] disabled:opacity-50"
                  title="Download all photos in this album"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{batchDownloading ? 'Downloading Album...' : 'Download All Photos'}</span>
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {activeAlbum.photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => openLightbox(idx)}
                  className="group relative h-64 rounded-[28px] overflow-hidden luxury-glass border border-[#9E741D]/25 dark:border-[#C8A86B]/30 shadow-luxury cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={`Gallery Photo ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Dark Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] text-xs px-4 py-2 font-bold shadow-lg">
                      View Fullscreen
                    </span>
                  </div>

                  {/* Corner Download Button Overlay (Visible on Hover Desktop & Always on Mobile) */}
                  <button
                    onClick={(e) => handleDownloadSingle(e, photo, idx)}
                    className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-[#C8A86B] hover:bg-black/90 border border-white/20 flex items-center justify-center shadow-lg transition-all duration-300 sm:opacity-0 group-hover:opacity-100"
                    title="Download high-resolution image"
                  >
                    {downloadingId === photo.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>

                  {/* Bottom Photo Index Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-mono border border-white/10 opacity-90">
                    Photo #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* Albums Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map((album) => {
              const displayCover =
                album.coverImage && album.coverImage.trim().length > 5 && album.coverImage !== 'black'
                  ? album.coverImage
                  : album.photos?.[album.photos.length - 1]?.imageUrl ||
                    album.photos?.[0]?.imageUrl ||
                    'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={album.id}
                  onClick={() => setActiveAlbum(album)}
                  className="group luxury-glass rounded-[28px] overflow-hidden border border-[#9E741D]/25 dark:border-[#C8A86B]/30 shadow-luxury hover:-translate-y-1 transition-transform cursor-pointer flex flex-col justify-between"
                >
                  <div className="h-56 relative overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayCover}
                      alt={album.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          album.photos?.[album.photos.length - 1]?.imageUrl ||
                          album.photos?.[0]?.imageUrl ||
                          'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90"
                    />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-[#F5E6C4] dark:text-[#C8A86B] font-bold border border-[#C8A86B]/30 flex items-center space-x-1">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{album.photos?.length || 0} Photos</span>
                  </div>
                </div>

                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-[#0B0B0B] dark:text-white group-hover:text-[#9E741D] dark:group-hover:text-[#C8A86B] transition-colors">
                      {album.title}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9E741D] dark:text-[#C8A86B] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Lightbox Modal with Download Control */}
        {activeAlbum && lightboxIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            
            {/* Top Toolbar Actions */}
            <div className="absolute top-6 right-6 z-50 flex items-center space-x-3">
              {/* Download Current Lightbox Photo */}
              <button
                onClick={(e) => handleDownloadSingle(e, activeAlbum.photos[lightboxIndex], lightboxIndex)}
                className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-xs px-4 py-2 flex items-center space-x-2 shadow-xl hover:bg-[#B8943A]"
                title="Download high-resolution image"
              >
                {downloadingId === activeAlbum.photos[lightboxIndex].id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Image</span>
                  </>
                )}
              </button>

              {/* Close Lightbox */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2.5 text-neutral-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Left Nav Arrow */}
            <button
              onClick={prevLightboxPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-neutral-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-40"
              title="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={nextLightboxPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-neutral-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-40"
              title="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Center Image Frame */}
            <div className="max-w-5xl max-h-[85vh] overflow-hidden rounded-[28px] border-2 border-[#C8A86B]/40 shadow-2xl relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeAlbum.photos[lightboxIndex].imageUrl}
                alt={`Photo ${lightboxIndex + 1} of ${activeAlbum.photos.length}`}
                className="w-full h-full object-contain max-h-[85vh]"
              />

              {/* Bottom Caption & Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono text-[#F5E6C4] border border-white/10 flex items-center space-x-2">
                <span>{activeAlbum.title}</span>
                <span>•</span>
                <span>{lightboxIndex + 1} of {activeAlbum.photos.length}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </SmoothScroll>
  );
}
