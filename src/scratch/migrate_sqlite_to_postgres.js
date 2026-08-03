const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const sqlitePath = 'prisma/dev.db';

const TABLES = [
  'AdminUser',
  'Setting',
  'AboutContent',
  'Programme',
  'Participant',
  'Announcement',
  'Schedule',
  'Registration',
  'Result',
  'GalleryAlbum',
  'GalleryPhoto',
];

function getSQLiteData(tableName) {
  try {
    const raw = execSync(`sqlite3 ${sqlitePath} -json "SELECT * FROM \\"${tableName}\\";"`).toString();
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error dumping SQLite table ${tableName}:`, err.message);
    return [];
  }
}

async function runMigration() {
  console.log('=== STARTING SQLITE TO NEON POSTGRESQL DATA MIGRATION ===\n');

  // Truncate tables first to ensure clean full migration
  for (const table of [...TABLES].reverse()) {
    const modelName = table.charAt(0).toLowerCase() + table.slice(1);
    try {
      await (prisma[modelName] || prisma[table]).deleteMany();
    } catch (e) {}
  }

  const migrationSummary = [];

  for (const table of TABLES) {
    const sqliteRecords = getSQLiteData(table);
    const sqliteCount = sqliteRecords.length;

    console.log(`📦 Processing '${table}': ${sqliteCount} records found in SQLite...`);

    let insertedCount = 0;
    let failedCount = 0;

    for (const record of sqliteRecords) {
      try {
        const formattedRecord = { ...record };

        // Convert boolean integers (0/1) from SQLite to true/false booleans for Postgres
        if (table === 'Programme') {
          if (typeof formattedRecord.isGroup === 'number') formattedRecord.isGroup = Boolean(formattedRecord.isGroup);
          if (typeof formattedRecord.isActive === 'number') formattedRecord.isActive = Boolean(formattedRecord.isActive);
        }
        if (table === 'Result') {
          if (typeof formattedRecord.certificateGenerated === 'number') formattedRecord.certificateGenerated = Boolean(formattedRecord.certificateGenerated);
        }

        // Convert any timestamp fields (createdAt, updatedAt, publishedAt) to JS Date objects
        for (const key of Object.keys(formattedRecord)) {
          if (key === 'createdAt' || key === 'updatedAt' || key === 'publishedAt') {
            const val = formattedRecord[key];
            if (val !== null && val !== undefined) {
              const num = Number(val);
              if (!isNaN(num)) {
                formattedRecord[key] = new Date(num);
              } else if (typeof val === 'string') {
                formattedRecord[key] = new Date(val);
              }
            }
          }
        }

        // Access Prisma model dynamically
        const modelName = table.charAt(0).toLowerCase() + table.slice(1);
        await (prisma[modelName] || prisma[table]).create({
          data: formattedRecord,
        });

        insertedCount++;
      } catch (err) {
        failedCount++;
        console.warn(`  ⚠️ Failed to insert record into '${table}':`, err.message);
      }
    }

    // Query Neon PostgreSQL count to verify
    const modelName = table.charAt(0).toLowerCase() + table.slice(1);
    const postgresCount = await (prisma[modelName] || prisma[table]).count();

    const isMatch = sqliteCount === postgresCount;
    migrationSummary.push({
      Table: table,
      'SQLite Count': sqliteCount,
      'Neon Postgres Count': postgresCount,
      Status: isMatch ? '✅ MATCHED' : '❌ MISMATCH',
      Failed: failedCount,
    });
  }

  console.log('\n=== FINAL MIGRATION VERIFICATION COMPARISON REPORT ===');
  console.table(migrationSummary);
}

runMigration()
  .catch((e) => console.error('Migration error:', e))
  .finally(() => prisma.$disconnect());
