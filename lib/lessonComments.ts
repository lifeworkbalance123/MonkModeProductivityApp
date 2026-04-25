/** API / UI shape for one comment row (flat list; threads built via `parentCommentId`). */
export type LessonCommentApi = {
  id: string
  userId: string
  lessonId: string
  parentCommentId: string | null
  content: string
  likesCount: number
  createdAt: string
  updatedAt: string
  authorDisplayName: string | null
  likedByMe: boolean
}

/** Alias for examples / imports that expect the name `Comment`. */
export type Comment = LessonCommentApi

export function buildCommentReplyMap(comments: LessonCommentApi[]) {
  const childMap = new Map<string, LessonCommentApi[]>()
  for (const c of comments) {
    const key = c.parentCommentId ?? '__root__'
    if (!childMap.has(key)) childMap.set(key, [])
    childMap.get(key)!.push(c)
  }
  for (const arr of childMap.values()) {
    arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }
  return childMap
}
