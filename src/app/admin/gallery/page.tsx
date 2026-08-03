'use client';

import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon, Plus, Trash2, FolderOpen, X, Upload, Link as LinkIcon, CheckCircle2, Loader2,
  Sparkles, Check, Eye, Sliders, RefreshCw
} from 'lucide-react';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=800&q=80';

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery Cover Photo State
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string>('');
  const [savingCover, setSavingCover] = useState(false);
  const [uploadingCoverFile, setUploadingCoverFile] = useState(false);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [coverSuccessMessage, setCoverSuccessMessage] = useState('');

  // Album Modal State
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumCover, setNewAlbumCover] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Photo Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchGallery = () => {
    setLoading(true);
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((d) => {
        if (d.albums) setAlbums(d.albums);
        if (d.coverPhotoUrl) setCoverPhotoUrl(d.coverPhotoUrl);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  // File Upload Helper
  const handleFileUpload = async (file: File, onSuccess: (url: string) => void, setUploading: (u: boolean) => void) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      onSuccess(data.url);
    } catch (err: any) {
      alert(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  // Toggle Auto vs Manual Cover Mode per Album
  const handleToggleAutoCover = async (album: any, newAutoVal: boolean) => {
    try {
      // If turning AUTO mode ON, use the latest photo URL if available
      let latestCover = album.coverImage;
      if (newAutoVal && album.photos && album.photos.length > 0) {
        latestCover = album.photos[album.photos.length - 1].imageUrl;
      }

      await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAlbumCoverMode',
          albumId: album.id,
          autoCover: newAutoVal,
          coverImage: latestCover,
        }),
      });

      fetchGallery();
    } catch (e: any) {
      alert(`Failed to update cover mode: ${e.message}`);
    }
  };

  // Save Gallery Cover Photo (Hero Banner)
  const handleSaveCoverPhoto = async (targetUrl?: string) => {
    const urlToSave = targetUrl || coverPhotoUrl;
    if (!urlToSave) return;
    setSavingCover(true);
    setCoverSuccessMessage('');

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setCoverPhoto',
          coverPhotoUrl: urlToSave,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCoverPhotoUrl(urlToSave);
        setCoverSuccessMessage('Gallery Cover Photo updated & published live!');
        setTimeout(() => setCoverSuccessMessage(''), 3000);
      } else {
        alert(data.error || 'Failed to save cover photo');
      }
    } catch (e: any) {
      alert(`Save error: ${e.message}`);
    } finally {
      setSavingCover(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle) return;

    await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createAlbum',
        title: newAlbumTitle,
        coverImage: newAlbumCover || FALLBACK_COVER,
      }),
    });
    setIsAlbumModalOpen(false);
    setNewAlbumTitle('');
    setNewAlbumCover('');
    fetchGallery();
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlbumId || !photoUrl) return;

    await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addPhoto',
        albumId: activeAlbumId,
        imageUrl: photoUrl,
      }),
    });
    setIsPhotoModalOpen(false);
    setPhotoUrl('');
    fetchGallery();
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('Delete album and all photos?')) return;
    await fetch(`/api/gallery?type=album&id=${id}`, { method: 'DELETE' });
    fetchGallery();
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Delete photo?')) return;
    await fetch(`/api/gallery?type=photo&id=${id}`, { method: 'DELETE' });
    fetchGallery();
  };

  // Collect all photos from all albums for the selector modal
  const allGalleryPhotos = albums.flatMap((album) =>
    (album.photos || []).map((p: any) => ({ ...p, albumTitle: album.title }))
  );

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-[#C8A86B]" />
            <span>Photo Gallery Manager</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Configure featured Gallery Cover Photo, create photo albums, set auto-latest cover mode, and upload event pictures.
          </p>
        </div>

        <button
          onClick={() => setIsAlbumModalOpen(true)}
          className="btn-pill-luxury bg-[#18181B] text-[#F5E6C4] dark:bg-[#C8A86B] dark:text-[#0B0B0B] font-bold text-xs px-4 py-2 flex items-center space-x-1.5 shadow-lg hover:bg-[#9E741D]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Album</span>
        </button>
      </div>

      {/* ================= 1. GALLERY COVER PHOTO MANAGER SECTION ================= */}
      <div className="luxury-glass p-6 rounded-[28px] border border-[#C8A86B]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold font-serif text-[#C8A86B] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#C8A86B]" />
              <span>Gallery Hero Cover Photo</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Set a featured widescreen hero banner shown at the top of the public Photo Gallery page.
            </p>
          </div>

          {coverSuccessMessage && (
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{coverSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* 16:9 Banner Preview Box */}
        <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden border border-white/20 bg-slate-950 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverPhotoUrl || FALLBACK_COVER}
            alt="Gallery Cover Photo Banner Preview"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_COVER;
            }}
            className="w-full h-full object-cover filter brightness-75 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
            <span className="px-3 py-1 rounded-full bg-[#C8A86B]/20 text-[#C8A86B] text-[10px] font-bold uppercase tracking-widest border border-[#C8A86B]/40 w-fit mb-2">
              LIVE HERO BANNER PREVIEW (16:9)
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">Meelad Fest Photo Gallery</h3>
            <p className="text-xs text-slate-300">Mifthahul Uloom Madrasa, Ullisherikkunnu</p>
          </div>
        </div>

        {/* Controls: Upload Fresh or Select Existing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Option A: Upload New Image */}
          <label className="btn-pill-luxury bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3 px-4 flex items-center justify-center space-x-2 border border-white/20 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-[#C8A86B]" />
            <span>{uploadingCoverFile ? 'Uploading Banner...' : 'Upload New Cover Photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(
                    e.target.files[0],
                    (url) => {
                      setCoverPhotoUrl(url);
                      handleSaveCoverPhoto(url);
                    },
                    setUploadingCoverFile
                  );
                }
              }}
            />
          </label>

          {/* Option B: Pick from Existing Gallery Photos */}
          <button
            type="button"
            onClick={() => setIsPhotoPickerOpen(true)}
            className="btn-pill-luxury bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3 px-4 flex items-center justify-center space-x-2 border border-white/20 transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-[#C8A86B]" />
            <span>Select Existing Photo ({allGalleryPhotos.length})</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => handleSaveCoverPhoto()}
            disabled={savingCover}
            className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold text-xs py-3 px-4 flex items-center justify-center space-x-2 shadow-lg hover:bg-[#B8943A] disabled:opacity-50"
          >
            {savingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{savingCover ? 'Publishing...' : 'Save & Publish Banner'}</span>
          </button>
        </div>
      </div>

      {/* ================= 2. ALBUMS & PHOTOS LIST ================= */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading gallery albums...</div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-[#C8A86B]" />
            <span>Photo Albums ({albums.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => {
              const displayCover = album.coverImage || FALLBACK_COVER;

              return (
                <div
                  key={album.id}
                  className="luxury-glass rounded-[28px] overflow-hidden border border-[#C8A86B]/30 shadow-luxury flex flex-col justify-between"
                >
                  {/* Album Cover Frame */}
                  <div className="h-48 relative overflow-hidden bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayCover}
                      alt={album.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_COVER;
                      }}
                      className="w-full h-full object-cover filter brightness-90"
                    />

                    {/* Auto Cover Mode Status Badge */}
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-[#C8A86B] font-mono font-bold border border-[#C8A86B]/30 flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3 text-[#C8A86B]" />
                      <span>{album.autoCover ? 'AUTO (LATEST PHOTO)' : 'MANUAL COVER'}</span>
                    </div>

                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white font-mono font-bold border border-white/10">
                      {album.photos?.length || 0} Photos
                    </div>
                  </div>

                  {/* Card Controls */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif">{album.title}</h3>
                      <button
                        onClick={() => handleDeleteAlbum(album.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                        title="Delete Album"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Auto-set Cover to Latest Photo Toggle Switch */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                      <div>
                        <div className="font-bold text-white text-[11px]">Auto-set to Latest Photo</div>
                        <div className="text-[9px] text-slate-400">Updates cover automatically on new upload</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={album.autoCover !== false}
                        onChange={(e) => handleToggleAutoCover(album, e.target.checked)}
                        className="w-4 h-4 accent-[#C8A86B] cursor-pointer"
                      />
                    </div>

                    {/* Photos Grid Inside Album Card */}
                    <div className="grid grid-cols-4 gap-2">
                      {album.photos?.slice(0, 4).map((p: any) => (
                        <div key={p.id} className="h-14 rounded-xl overflow-hidden relative group bg-slate-900 border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.imageUrl}
                            alt="Thumbnail"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_COVER;
                            }}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleDeletePhoto(p.id)}
                            className="absolute inset-0 bg-rose-900/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setActiveAlbumId(album.id);
                        setIsPhotoModalOpen(true);
                      }}
                      className="w-full btn-pill-luxury bg-[#C8A86B]/20 text-[#C8A86B] font-bold text-xs py-2 flex items-center justify-center space-x-1.5 border border-[#C8A86B]/40 hover:bg-[#C8A86B]/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Photos to Album</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 3. PHOTO PICKER MODAL (SELECT EXISTING PHOTO FOR COVER) ================= */}
      {isPhotoPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="luxury-glass max-w-4xl w-full p-6 rounded-[28px] border border-[#C8A86B]/40 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#C8A86B] flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-[#C8A86B]" />
                  <span>Select Gallery Cover Photo</span>
                </h3>
                <p className="text-xs text-slate-400">Click any uploaded photo to set as the Gallery Hero Cover Banner.</p>
              </div>
              <button onClick={() => setIsPhotoPickerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
              {allGalleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => {
                    setCoverPhotoUrl(photo.imageUrl);
                    handleSaveCoverPhoto(photo.imageUrl);
                    setIsPhotoPickerOpen(false);
                  }}
                  className={`group relative h-36 rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                    coverPhotoUrl === photo.imageUrl
                      ? 'border-[#C8A86B] ring-2 ring-[#C8A86B] scale-105'
                      : 'border-white/10 hover:border-[#C8A86B]/70'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt="Select photo"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_COVER;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <span className="text-[9px] text-[#C8A86B] font-mono bg-black/70 px-2 py-0.5 rounded-full w-fit">
                      {photo.albumTitle}
                    </span>
                    <span className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] text-[10px] py-1 px-2 font-bold self-center shadow-lg">
                      Use as Banner
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. CREATE ALBUM MODAL ================= */}
      {isAlbumModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="luxury-glass max-w-md w-full p-6 rounded-[28px] border border-[#C8A86B]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-[#C8A86B]">Create New Album</h3>
              <button onClick={() => setIsAlbumModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Album Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Inauguration & Qirat"
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cover Image (Upload or URL)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newAlbumCover}
                    onChange={(e) => setNewAlbumCover(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                  />
                  <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer shrink-0">
                    <Upload className="w-4 h-4 text-[#C8A86B]" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], setNewAlbumCover, setUploadingCover);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAlbumModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold px-5 py-2 shadow-lg hover:bg-[#B8943A]"
                >
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 5. ADD PHOTO MODAL ================= */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="luxury-glass max-w-md w-full p-6 rounded-[28px] border border-[#C8A86B]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-[#C8A86B]">Add Photo to Album</h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Photo File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0], setPhotoUrl, setUploadingPhoto);
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#C8A86B] file:text-[#0B0B0B] hover:file:bg-[#B8943A]"
                />
              </div>

              {photoUrl && (
                <div className="h-36 rounded-xl overflow-hidden border border-white/20 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Photo preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!photoUrl || uploadingPhoto}
                  className="btn-pill-luxury bg-[#C8A86B] text-[#0B0B0B] font-bold px-5 py-2 shadow-lg hover:bg-[#B8943A] disabled:opacity-50"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
