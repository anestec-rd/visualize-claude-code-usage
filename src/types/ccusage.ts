export interface CcusageEntry {
  timestamp: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  organization_id?: string;
  project_id?: string;
  request_id?: string;
}

export interface ModelStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalTokens: number;
  estimatedCost: number;
  estimatedInputCost: number;
  estimatedOutputCost: number;
  estimatedCacheWriteCost: number;
  estimatedCacheReadCost: number;
}

export interface UsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalTokens: number;
  requestsInCurrentPeriod: number;
  tokensInCurrentPeriod: number;
  lastRequestTime?: Date;
  averageRequestsPerHour: number;
  peakHour: number;
  hourlyDistribution: { [hour: number]: number };
  hourlyCostDistribution: { [hour: number]: number };
  // 一般利用での推定コスト（標準料金）
  estimatedCost: number;
  totalEstimatedInputCost: number;
  totalEstimatedOutputCost: number;
  totalEstimatedCacheWriteCost: number;
  totalEstimatedCacheReadCost: number;
  estimatedCostInCurrentPeriod: number;
  estimatedMonthlyUsage: number;
  estimatedDaysUntil200: number;
  // 200ドルプランでの推定コスト・節約額
  estimatedCostOn200DollarPlan: number;
  estimatedSavingsOn200DollarPlan: number;
  estimatedMonthlyUsageOn200DollarPlan: number;
  estimatedDaysUntil200On200DollarPlan: number;
  // 4倍トークン使用時の一般利用コスト（仮想的な計算）
  hypotheticalGeneralCostAt4xTokens: number;
  hypotheticalMonthlyUsageAt4xTokens: number;
  // モデル別統計
  modelStats: { [model: string]: ModelStats };
}

export interface PeriodUsage {
  periodStart: Date;
  periodEnd: Date;
  requests: CcusageEntry[];
  stats: {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCacheCreationTokens: number;
    totalCacheReadTokens: number;
    totalTokens: number;
    estimatedCost: number;
    estimatedInputCost: number;
    estimatedOutputCost: number;
    estimatedCacheWriteCost: number;
    estimatedCacheReadCost: number;
    modelStats: { [model: string]: ModelStats };
  };
}