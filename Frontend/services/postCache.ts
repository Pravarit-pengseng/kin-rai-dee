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
