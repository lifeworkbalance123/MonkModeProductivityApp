import * as SQLite from 'expo-sqlite'
import type { ContentBlock, MediaAsset } from '@/types/media'

let dbInstance: SQLite.SQLiteDatabase | null = null

export type TrainingModuleRow = {
  id: string
  title: string
  description: string
  type: string
  duration: string
  locked: number
  thumbnail_key: string
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance
  const db = await SQLite.openDatabaseAsync('monkmode.db')
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS training_modules (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      duration TEXT NOT NULL,
      locked INTEGER NOT NULL DEFAULT 0,
      thumbnail_key TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS content_blocks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      videoUrl TEXT,
      videoThumbnailUri TEXT,
      image_json TEXT,
      imagePosition TEXT NOT NULL,
      aspectRatio TEXT NOT NULL,
      bodyText TEXT,
      ctaLabel TEXT,
      ctaAction TEXT,
      moduleId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS module_completions (
      module_id TEXT NOT NULL,
      completed_date TEXT NOT NULL,
      PRIMARY KEY (module_id, completed_date)
    );
  `)

  const count = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM training_modules',
  )
  if ((count?.c ?? 0) === 0) {
    const seed: TrainingModuleRow[] = [
      {
        id: '1',
        title: 'The Pomodoro Technique Mastery',
        description:
          'Learn how to use 25-minute focused sessions to maximize productivity and avoid burnout.',
        type: 'video',
        duration: '12 min',
        locked: 0,
        thumbnail_key: 'pomodoro',
      },
      {
        id: '2',
        title: 'Time Boxing Fundamentals',
        description:
          'Master the art of scheduling every minute of your day for maximum effectiveness.',
        type: 'video',
        duration: '18 min',
        locked: 0,
        thumbnail_key: 'timeboxing',
      },
      {
        id: '3',
        title: 'Building Atomic Habits',
        description: 'Small changes, remarkable results. Learn to build habits that stick.',
        type: 'article',
        duration: '8 min read',
        locked: 0,
        thumbnail_key: 'habits',
      },
      {
        id: '4',
        title: 'Morning Routine Blueprint',
        description: 'Design a morning routine that sets you up for a productive day.',
        type: 'video',
        duration: '15 min',
        locked: 1,
        thumbnail_key: 'morning',
      },
      {
        id: '5',
        title: 'Deep Work Strategies',
        description: 'Techniques for achieving flow state and eliminating distractions.',
        type: 'video',
        duration: '22 min',
        locked: 1,
        thumbnail_key: 'deepwork',
      },
      {
        id: '6',
        title: 'Evening Reflection Practice',
        description: 'How to review your day and prepare for tomorrow effectively.',
        type: 'article',
        duration: '5 min read',
        locked: 1,
        thumbnail_key: 'evening',
      },
    ]
    for (const m of seed) {
      await db.runAsync(
        `INSERT INTO training_modules (id, title, description, type, duration, locked, thumbnail_key)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.title, m.description, m.type, m.duration, m.locked, m.thumbnail_key],
      )
    }
  }

  dbInstance = db
  return db
}

function rowToBlock(row: Record<string, unknown>): ContentBlock {
  const imageJson = row.image_json as string | null
  let image: MediaAsset | undefined
  if (imageJson) {
    try {
      image = JSON.parse(imageJson) as MediaAsset
    } catch {
      image = undefined
    }
  }
  return {
    id: row.id as string,
    title: row.title as string,
    videoUrl: (row.videoUrl as string) || undefined,
    videoThumbnailUri: (row.videoThumbnailUri as string) || undefined,
    image,
    imagePosition: row.imagePosition as ContentBlock['imagePosition'],
    aspectRatio: row.aspectRatio as ContentBlock['aspectRatio'],
    bodyText: (row.bodyText as string) || undefined,
    ctaLabel: (row.ctaLabel as string) || undefined,
    ctaAction: (row.ctaAction as string) || undefined,
    moduleId: (row.moduleId as string) || undefined,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }
}

export async function createContentBlock(block: ContentBlock): Promise<void> {
  const db = await getDb()
  const imageJson = block.image ? JSON.stringify(block.image) : null
  await db.runAsync(
    `INSERT INTO content_blocks (
      id, title, videoUrl, videoThumbnailUri, image_json, imagePosition, aspectRatio,
      bodyText, ctaLabel, ctaAction, moduleId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      block.id,
      block.title,
      block.videoUrl ?? null,
      block.videoThumbnailUri ?? null,
      imageJson,
      block.imagePosition,
      block.aspectRatio,
      block.bodyText ?? null,
      block.ctaLabel ?? null,
      block.ctaAction ?? null,
      block.moduleId ?? null,
      block.createdAt,
      block.updatedAt,
    ],
  )
}

export async function getContentBlocks(): Promise<ContentBlock[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM content_blocks ORDER BY updatedAt DESC',
  )
  return rows.map(rowToBlock)
}

export async function getContentBlockById(id: string): Promise<ContentBlock | null> {
  const db = await getDb()
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM content_blocks WHERE id = ?',
    [id],
  )
  return row ? rowToBlock(row) : null
}

export async function getContentBlockByModuleId(
  moduleId: string,
): Promise<ContentBlock | null> {
  const db = await getDb()
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM content_blocks WHERE moduleId = ? ORDER BY updatedAt DESC LIMIT 1',
    [moduleId],
  )
  return row ? rowToBlock(row) : null
}

export async function updateContentBlock(block: ContentBlock): Promise<void> {
  const db = await getDb()
  const imageJson = block.image ? JSON.stringify(block.image) : null
  await db.runAsync(
    `UPDATE content_blocks SET
      title = ?, videoUrl = ?, videoThumbnailUri = ?, image_json = ?, imagePosition = ?,
      aspectRatio = ?, bodyText = ?, ctaLabel = ?, ctaAction = ?, moduleId = ?, updatedAt = ?
    WHERE id = ?`,
    [
      block.title,
      block.videoUrl ?? null,
      block.videoThumbnailUri ?? null,
      imageJson,
      block.imagePosition,
      block.aspectRatio,
      block.bodyText ?? null,
      block.ctaLabel ?? null,
      block.ctaAction ?? null,
      block.moduleId ?? null,
      block.updatedAt,
      block.id,
    ],
  )
}

export async function deleteContentBlock(id: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM content_blocks WHERE id = ?', [id])
}

export async function getTrainingModules(): Promise<TrainingModuleRow[]> {
  const db = await getDb()
  return await db.getAllAsync<TrainingModuleRow>(
    'SELECT * FROM training_modules ORDER BY CAST(id AS INTEGER) ASC',
  )
}

export async function getTrainingModuleById(
  id: string,
): Promise<TrainingModuleRow | null> {
  const db = await getDb()
  return db.getFirstAsync<TrainingModuleRow>(
    'SELECT * FROM training_modules WHERE id = ?',
    [id],
  )
}

export async function markModuleCompleted(moduleId: string): Promise<void> {
  const db = await getDb()
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  await db.runAsync(
    `INSERT OR REPLACE INTO module_completions (module_id, completed_date) VALUES (?, ?)`,
    [moduleId, date],
  )
}

export async function isModuleCompletedToday(moduleId: string): Promise<boolean> {
  const db = await getDb()
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM module_completions WHERE module_id = ? AND completed_date = ?',
    [moduleId, date],
  )
  return (row?.c ?? 0) > 0
}

export async function getCompletedModuleIdsToday(): Promise<Set<string>> {
  const db = await getDb()
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const rows = await db.getAllAsync<{ module_id: string }>(
    'SELECT module_id FROM module_completions WHERE completed_date = ?',
    [date],
  )
  return new Set(rows.map((r) => r.module_id))
}

export { getDb as initDb }
