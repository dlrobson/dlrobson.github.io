import type { PageLoad } from './$types'
import type { PostMeta } from '$lib/post.types'

const modules = import.meta.glob<{
  metadata: {
    title: string
    date: string
    description?: string
  }
}>('/src/posts/*.md', { eager: true })

export const load: PageLoad = async () => {
  const posts: PostMeta[] = Object.entries(modules).map(([path, mod]) => {
    const filename = path.split('/').pop()!
    const slug = filename.replace('.md', '')
    return {
      ...mod.metadata,
      slug,
    }
  })

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return { posts }
}
