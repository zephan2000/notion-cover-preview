export interface PreviewConfig {
  workspace_name: string;
  pages: PageConfig[];
}

export interface PageConfig {
  id: string;
  name: string;
  icon: string;
  option_a: string;
  option_b: string;
}

export interface SelectionsOutput {
  selections: Record<string, string>;
  confirmed_at: string;
}
