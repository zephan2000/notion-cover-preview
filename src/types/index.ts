export interface BrandContext {
  business_type: string;
  brand_vibe: string[];
  brand_references?: string[];
  brand_avoids?: string[];
  brand_description?: string;
}

export interface PreviewConfig {
  workspace_name: string;
  brand_context?: BrandContext;
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

export interface RepositionConfig {
  x: number;
  y: number;
}

export interface SelectionsOutput {
  selections: Record<string, string>;
  repositions?: Record<string, RepositionConfig>;
  confirmed_at: string;
}
