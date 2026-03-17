export interface PreviewConfig {
  workspace_name: string;
  pages: PageConfig[];
  image_pool: ImageCandidate[];
}

export interface PageConfig {
  id: string;
  name: string;
  icon: string;
}

export interface ImageCandidate {
  url: string;
  tags: string[];
}

export interface SelectionsOutput {
  selections: Record<string, string>;
  confirmed_at: string;
}
