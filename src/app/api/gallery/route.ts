import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export const revalidate = 60;

export async function GET() {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      include: {
        photos: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const coverSetting = await prisma.setting.findUnique({
      where: { key: 'gallery_cover_photo' },
    });

    const settingsList = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const item of settingsList) {
      settingsMap[item.key] = item.value;
    }

    // Attach autoCover setting status to each album object
    const albumsWithSettings = albums.map((album) => {
      const autoCoverVal = settingsMap[`album_auto_cover_${album.id}`];
      const autoCover = autoCoverVal === undefined ? true : autoCoverVal === 'true';

      // Fallback: If coverImage is empty/broken/black box, automatically use latest or first photo
      let resolvedCover = album.coverImage;
      if (!resolvedCover || resolvedCover.trim().length < 5 || resolvedCover === 'black') {
        resolvedCover = album.photos?.[album.photos.length - 1]?.imageUrl ||
          album.photos?.[0]?.imageUrl ||
          'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=800&q=80';
      }

      return {
        ...album,
        coverImage: resolvedCover,
        autoCover,
      };
    });

    return NextResponse.json({
      albums: albumsWithSettings,
      coverPhotoUrl: coverSetting?.value || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch gallery data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, title, coverImage, albumId, imageUrl, photoUrls, coverPhotoUrl, autoCover } = body;

    // Action: setCoverPhoto
    if (action === 'setCoverPhoto') {
      if (!coverPhotoUrl) {
        return NextResponse.json({ error: 'coverPhotoUrl is required.' }, { status: 400 });
      }
      await prisma.setting.upsert({
        where: { key: 'gallery_cover_photo' },
        update: { value: coverPhotoUrl },
        create: { key: 'gallery_cover_photo', value: coverPhotoUrl },
      });
      return NextResponse.json({ success: true, coverPhotoUrl });
    }

    // Action: updateAlbumCoverMode (Toggle Auto vs Manual)
    if (action === 'updateAlbumCoverMode') {
      if (!albumId) {
        return NextResponse.json({ error: 'albumId is required' }, { status: 400 });
      }
      await prisma.setting.upsert({
        where: { key: `album_auto_cover_${albumId}` },
        update: { value: String(Boolean(autoCover)) },
        create: { key: `album_auto_cover_${albumId}`, value: String(Boolean(autoCover)) },
      });

      // If switching to auto mode or explicitly providing coverImage, update album cover
      if (coverImage) {
        await prisma.galleryAlbum.update({
          where: { id: albumId },
          data: { coverImage },
        });
      }

      return NextResponse.json({ success: true });
    }

    // Action: createAlbum
    if (action === 'createAlbum') {
      if (!title) {
        return NextResponse.json({ error: 'Album title is required.' }, { status: 400 });
      }
      const album = await prisma.galleryAlbum.create({
        data: {
          title,
          coverImage: coverImage || 'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=800&q=80',
        },
      });

      // Default autoCover to true for new album
      await prisma.setting.upsert({
        where: { key: `album_auto_cover_${album.id}` },
        update: { value: 'true' },
        create: { key: `album_auto_cover_${album.id}`, value: 'true' },
      });

      return NextResponse.json({ success: true, album });
    }

    // Action: addPhoto
    if (action === 'addPhoto') {
      if (!albumId || !imageUrl) {
        return NextResponse.json({ error: 'albumId and imageUrl are required.' }, { status: 400 });
      }
      const photo = await prisma.galleryPhoto.create({
        data: { albumId, imageUrl },
      });

      // Check if autoCover is enabled for this album
      const autoCoverSetting = await prisma.setting.findUnique({
        where: { key: `album_auto_cover_${albumId}` },
      });
      const isAutoCover = autoCoverSetting === null || autoCoverSetting.value === 'true';

      if (isAutoCover) {
        await prisma.galleryAlbum.update({
          where: { id: albumId },
          data: { coverImage: imageUrl },
        });
      }

      return NextResponse.json({ success: true, photo });
    }

    // Action: addPhotos (batch upload)
    if (action === 'addPhotos') {
      if (!albumId || !Array.isArray(photoUrls)) {
        return NextResponse.json({ error: 'albumId and photoUrls array are required.' }, { status: 400 });
      }
      await prisma.galleryPhoto.createMany({
        data: photoUrls.map((url: string) => ({ albumId, imageUrl: url })),
      });

      // Update cover to last uploaded photo if autoCover is true
      if (photoUrls.length > 0) {
        const autoCoverSetting = await prisma.setting.findUnique({
          where: { key: `album_auto_cover_${albumId}` },
        });
        const isAutoCover = autoCoverSetting === null || autoCoverSetting.value === 'true';

        if (isAutoCover) {
          const latestUrl = photoUrls[photoUrls.length - 1];
          await prisma.galleryAlbum.update({
            where: { id: albumId },
            data: { coverImage: latestUrl },
          });
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process gallery action' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // album | photo
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'album') {
      await prisma.galleryAlbum.delete({ where: { id } });
    } else {
      await prisma.galleryPhoto.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete gallery item' }, { status: 500 });
  }
}
