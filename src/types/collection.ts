export interface CatalogCollection {
  id: string;
  name: string;
  description: string;
  curationOrder: number;
  tags: string[];
  benchmarks: {
    id: string;
    providerId: string;
    task: string;
    fewshot: number | null;
  }[];
  sourceUrl: string;
  yaml: string;
}
