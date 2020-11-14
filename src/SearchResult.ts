/**
 * Search result item.
 */
export default class SearchResult {
  id: string;
  title: string;
  text: string | null;
  link: string;
  userId?: string;
  // UNIX timestamp (in seconds)
  updatedAt?: number;

  constructor(id: string, title: string, text: string | null, link: string, userId?: string, updatedAt?: number) {
    this.id = id;
    this.title = title;
    this.text = text;
    this.link = link;
    this.userId = userId;
    this.updatedAt = updatedAt;
  }
}
