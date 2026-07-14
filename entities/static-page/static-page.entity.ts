export interface StaticPageEntity {
  id: string;
  title: string;
  slug: string;
  htmlContent: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}
