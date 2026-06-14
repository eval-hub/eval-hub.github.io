export interface ProviderBenchmark {
  id: string;
  name: string;
  description: string;
  category: string;
  metrics: string[];
  tags: string[];
}

export interface K8sRuntime {
  image: string;
  entrypoint: string[];
  cpuRequest: string;
  memoryRequest: string;
  cpuLimit: string;
  memoryLimit: string;
  gpu: string | null;
}

export interface ProviderRuntime {
  k8s: K8sRuntime | null;
  local: boolean;
}

export interface CatalogProvider {
  id: string;
  name: string;
  title: string;
  description: string;
  tags: string[];
  adapterDir: string;
  sourceUrl: string;
  benchmarkCount: number;
  categories: string[];
  benchmarkTags: string[];
  allTags: string[];
  runtime: ProviderRuntime;
  benchmarks: ProviderBenchmark[];
  yaml: string;
}

export interface ConfigMapOptions {
  providerId: string;
  providerYaml: string;
  namespace: string;
  name: string;
  providerType: string;
  providerName: string;
}
