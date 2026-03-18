import type { PageLoad } from './$types'
import type { Component } from 'svelte'
import { error } from '@sveltejs/kit'

interface PostModule {
  default: Component
  metadata: { title: string; date: string; description?: string }
}

const posts = import.meta.glob<PostModule>('/src/posts/*.md')

export const load: PageLoad = async ({ params }) => {
  const { slug } = params
  const key = `/src/posts/${slug}.md`

  if (!(key in posts)) {
    throw error(404, 'Post not found')
  }

  const post = await posts[key]()
  return {
    content: post.default,
    meta: post.metadata,
  }
}
