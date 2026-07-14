export interface CreateStaticPageDto {
  title: string;
  slug: string;
  htmlContent: string;
  status?: 'active' | 'inactive';
}

export interface UpdateStaticPageDto {
  title?: string;
  slug?: string;
  htmlContent?: string;
  status?: 'active' | 'inactive';
}
