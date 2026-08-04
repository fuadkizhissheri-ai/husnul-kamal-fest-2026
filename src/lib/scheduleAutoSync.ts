import { prisma } from '@/lib/prisma';
import { broadcastRealtimeChange } from '@/lib/realtime';

/**
 * 🛠️ Parse Date (YYYY-MM-DD) and Time (HH:MM AM/PM or HH:MM) into a JavaScript Date object
 */
export function parseDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || !timeStr) return null;

  try {
    let hours = 0;
    let minutes = 0;

    const cleanTime = timeStr.trim();
    const match12 = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = parseInt(match12[2], 10);
      const ampm = match12[3].toUpperCase();

      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;

      hours = h;
      minutes = m;
    } else {
      const match24 = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
      if (match24) {
        hours = parseInt(match24[1], 10);
        minutes = parseInt(match24[2], 10);
      } else {
        return null;
      }
    }

    const dateParts = dateStr.trim().split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      return new Date(year, month, day, hours, minutes, 0, 0);
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * ⏰ Automatic Time-Based Schedule Status Synchronizer
 * 
 * Rules:
 * 1. Status -> "UPCOMING": If current time is within 1 hour before scheduled start time.
 * 2. Status -> "LIVE": When current time reaches or passes scheduled start time (and before end time).
 * 3. Status -> "COMPLETED": When current time passes scheduled end time.
 */
export async function autoSyncScheduleStatuses(): Promise<number> {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        programme: true,
      },
    });

    const now = new Date();
    let updatedCount = 0;

    for (const item of schedules) {
      const dateStr = item.date || item.programme?.date;
      const startTimeStr = item.startTime || item.programme?.startTime;
      const endTimeStr = item.endTime || item.programme?.endTime;

      const startDate = parseDateTime(dateStr, startTimeStr);
      const endDate = parseDateTime(dateStr, endTimeStr);

      if (!startDate || !endDate) continue;

      const oneHourBeforeStart = new Date(startDate.getTime() - 60 * 60 * 1000);
      let expectedStatus = item.status;

      if (now >= endDate) {
        expectedStatus = 'COMPLETED';
      } else if (now >= startDate && now < endDate) {
        expectedStatus = 'LIVE';
      } else if (now >= oneHourBeforeStart && now < startDate) {
        expectedStatus = 'UPCOMING';
      } else if (now < oneHourBeforeStart) {
        expectedStatus = 'UPCOMING';
      }

      if (expectedStatus !== item.status) {
        await prisma.schedule.update({
          where: { id: item.id },
          data: { status: expectedStatus },
        });
        updatedCount++;
        console.log(`[Schedule AutoSync] Updated item ${item.id} (${item.programme?.name}) -> ${expectedStatus}`);
      }
    }

    if (updatedCount > 0) {
      broadcastRealtimeChange('schedule_updated', {
        key: 'schedule_status',
        updatedCount,
        timestamp: Date.now(),
      });
    }

    return updatedCount;
  } catch (err) {
    console.error('[Schedule AutoSync] Error executing time-based status sync:', err);
    return 0;
  }
}
