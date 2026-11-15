import { PopupPostData } from "@/components/popup-post";

let _cachedPosts: PopupPostData[] = [];

export function setCachedPostList(posts: PopupPostData[]) {
  _cachedPosts = posts;
}

export function getCachedPostList(): PopupPostData[] {
  return _cachedPosts;
}

export function clearCachedPostList() {
  _cachedPosts = [];
}

export function removePostFromCachedList(postId: string) {
  const idStr = String(postId);
  _cachedPosts = _cachedPosts.filter((p) => String(p.id) !== idStr);
}

export function updatePostInCachedList(updated: PopupPostData) {
  const idStr = String(updated.id);
  _cachedPosts = _cachedPosts.map((p) => (String(p.id) === idStr ? { ...p, ...updated } : p));
}
