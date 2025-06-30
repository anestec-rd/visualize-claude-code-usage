import { CcusageEntry, UsageStats, PeriodUsage, ModelStats } from '../types/ccusage';
import { StoredFile } from './fileStorage';
import { RESET_INTERVAL_HOURS, FALLBACK_BASE_TIME } from './constants';

// モデル別の推定料金（1Mトークンあたり）- 2025年基準
const MODEL_PRICING: { [key: string]: { input: number; output: number; cache_write: number; cache_read: number } } = {
  // Claude 4 Opus
  'claude-4-opus': { input: 15.0, output: 75.0, cache_write: 18.75, cache_read: 1.5 },
  'claude-opus-4': { input: 15.0, output: 75.0, cache_write: 18.75, cache_read: 1.5 },
  
  // Claude 4 Sonnet
  'claude-4-sonnet': { input: 3.0, output: 15.0, cache_write: 3.75, cache_read: 0.3 },
  'claude-sonnet-4': { input: 3.0, output: 15.0, cache_write: 3.75, cache_read: 0.3 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0, cache_write: 3.75, cache_read: 0.3 },
  
  // OpenAI GPT-4（キャッシュ機能は仮定値）
  'gpt-4': { input: 30.0, output: 60.0, cache_write: 37.5, cache_read: 3.0 },
  'gpt-4-turbo': { input: 10.0, output: 30.0, cache_write: 12.5, cache_read: 1.0 },
  'gpt-4o': { input: 5.0, output: 15.0, cache_write: 6.25, cache_read: 0.5 },
  
  // OpenAI GPT-3.5（キャッシュ機能は仮定値）
  'gpt-3.5-turbo': { input: 0.5, output: 1.5, cache_write: 0.625, cache_read: 0.05 },
  
  // デフォルト（Claude 4 Opus相当）
  'default': { input: 15.0, output: 75.0, cache_write: 18.75, cache_read: 1.5 }
};

export const parseCcusageFile = (fileContent: string): CcusageEntry[] => {
  const lines = fileContent.trim().split('\n');
  const entries: CcusageEntry[] = [];

  console.log('Parsing file, total lines:', lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const entry = JSON.parse(line);
        
        let ccusageEntry: CcusageEntry | null = null;

        // Claudeセッションログ形式の場合（assistantメッセージ）
        if (entry.type === 'assistant' && entry.message && entry.message.usage) {
          const usage = entry.message.usage;
          
          // 入力トークンの計算（複数のソースから）
          const inputTokens = (usage.input_tokens || 0);
          const cacheCreationTokens = (usage.cache_creation_input_tokens || 0);
          const cacheReadTokens = (usage.cache_read_input_tokens || 0);
          
          ccusageEntry = {
            timestamp: entry.timestamp,
            model: entry.message.model || 'claude-unknown',
            input_tokens: inputTokens,
            output_tokens: usage.output_tokens || 0,
            cache_creation_input_tokens: cacheCreationTokens,
            cache_read_input_tokens: cacheReadTokens,
            organization_id: entry.organization_id,
            project_id: entry.project_id,
            request_id: entry.requestId || entry.uuid
          };
        }
        // 標準的なccusage形式の場合
        else if (entry.input_tokens !== undefined || entry.output_tokens !== undefined) {
          ccusageEntry = {
            timestamp: entry.timestamp || entry.created_at || entry.time,
            model: entry.model || entry.model_name || 'unknown',
            input_tokens: entry.input_tokens || entry.prompt_tokens || entry.input || 0,
            output_tokens: entry.output_tokens || entry.completion_tokens || entry.output || 0,
            cache_creation_input_tokens: entry.cache_creation_input_tokens || 0,
            cache_read_input_tokens: entry.cache_read_input_tokens || 0,
            organization_id: entry.organization_id || entry.org_id,
            project_id: entry.project_id,
            request_id: entry.request_id || entry.id
          };
        }
        // OpenAI API形式の場合
        else if (entry.usage && (entry.usage.prompt_tokens || entry.usage.completion_tokens)) {
          ccusageEntry = {
            timestamp: entry.created_at ? new Date(entry.created_at * 1000).toISOString() : entry.timestamp,
            model: entry.model || 'openai-unknown',
            input_tokens: entry.usage.prompt_tokens || 0,
            output_tokens: entry.usage.completion_tokens || 0,
            cache_creation_input_tokens: entry.usage.cache_creation_input_tokens || 0,
            cache_read_input_tokens: entry.usage.cache_read_input_tokens || 0,
            organization_id: entry.organization_id,
            project_id: entry.project_id,
            request_id: entry.id
          };
        }

        // 有効なエントリかチェック
        if (ccusageEntry && ccusageEntry.timestamp && 
            (ccusageEntry.input_tokens > 0 || ccusageEntry.output_tokens > 0 || 
             (ccusageEntry.cache_creation_input_tokens || 0) > 0 || (ccusageEntry.cache_read_input_tokens || 0) > 0)) {
          entries.push(ccusageEntry);
        } else if (entry.type !== 'user' && entry.type !== 'summary' && !entry.toolUseResult) {
          // user、summary、toolUseResultタイプ以外で無効なエントリの場合は警告（デバッグ用）
          console.debug('Skipped entry (no usage data):', entry.type || 'unknown type');
        }
      } catch (error) {
        console.warn(`Failed to parse line ${i + 1}:`, line.substring(0, 100) + '...', error);
      }
    }
  }

  console.log('Total valid entries found:', entries.length);
  return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const parseMultipleCcusageFiles = (files: StoredFile[]): CcusageEntry[] => {
  const allEntries: CcusageEntry[] = [];
  
  console.log('Parsing multiple files:', files.length);
  
  for (const file of files) {
    console.log('Processing file:', file.filename);
    const entries = parseCcusageFile(file.content);
    console.log(`File ${file.filename} produced ${entries.length} entries`);
    allEntries.push(...entries);
  }

  console.log('Total entries before deduplication:', allEntries.length);

  // 重複除去（timestamp + request_idで判定）
  const uniqueEntries = new Map<string, CcusageEntry>();
  
  for (const entry of allEntries) {
    const key = `${entry.timestamp}-${entry.request_id || Math.random()}`;
    uniqueEntries.set(key, entry);
  }

  const result = Array.from(uniqueEntries.values())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  console.log('Final unique entries:', result.length);
  return result;
};

const getModelPricing = (model: string): { input: number; output: number; cache_write: number; cache_read: number } => {
  // 正確なモデル名でマッチング
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }
  
  // 部分マッチング（より具体的なパターンから順番に）
  const modelLower = model.toLowerCase();
  
  // Claude 4 Opus
  if (modelLower.includes('claude-4-opus') || modelLower.includes('claude-opus-4') ||
      modelLower.includes('opus-4') || modelLower.includes('4-opus')) {
    return MODEL_PRICING['claude-4-opus'];
  }
  
  // Claude 4 Sonnet
  if (modelLower.includes('claude-4-sonnet') || modelLower.includes('claude-sonnet-4') ||
      modelLower.includes('sonnet-4') || modelLower.includes('4-sonnet')) {
    return MODEL_PRICING['claude-4-sonnet'];
  }
  
  // 一般的なSonnet（4 Sonnetとして扱う）
  if (modelLower.includes('sonnet')) {
    return MODEL_PRICING['claude-4-sonnet'];
  }
  
  // 一般的なOpus（4 Opusとして扱う）
  if (modelLower.includes('opus')) {
    return MODEL_PRICING['claude-4-opus'];
  }
  
  // OpenAI models
  if (modelLower.includes('gpt-4o')) {
    return MODEL_PRICING['gpt-4o'];
  }
  if (modelLower.includes('gpt-4-turbo')) {
    return MODEL_PRICING['gpt-4-turbo'];
  }
  if (modelLower.includes('gpt-4')) {
    return MODEL_PRICING['gpt-4'];
  }
  if (modelLower.includes('gpt-3.5')) {
    return MODEL_PRICING['gpt-3.5-turbo'];
  }
  
  // デフォルト（Claude 4 Opus相当）
  console.warn(`Unknown model: ${model}, using default pricing (Claude 4 Opus)`);
  return MODEL_PRICING['default'];
};

// 時刻を00分にスナップする関数
const getCycleAnchorTime = (date: Date): Date => {
  const anchorTime = new Date(date);
  anchorTime.setMinutes(0, 0, 0); // 分、秒、ミリ秒を0に設定
  return anchorTime;
};

const calculateEstimatedCost = (
  inputTokens: number, 
  outputTokens: number, 
  cacheCreationTokens: number = 0,
  cacheReadTokens: number = 0,
  model?: string
): { 
  totalCost: number; 
  inputCost: number; 
  outputCost: number; 
  cacheWriteCost: number;
  cacheReadCost: number;
} => {
  const pricing = model ? getModelPricing(model) : MODEL_PRICING['default'];
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  const cacheWriteCost = (cacheCreationTokens / 1000000) * pricing.cache_write;
  const cacheReadCost = (cacheReadTokens / 1000000) * pricing.cache_read;
  const totalCost = inputCost + outputCost + cacheWriteCost + cacheReadCost;
  
  console.debug(`Cost calculation for ${model || 'unknown'}:`, {
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    pricing,
    inputCost: inputCost.toFixed(6),
    outputCost: outputCost.toFixed(6),
    cacheWriteCost: cacheWriteCost.toFixed(6),
    cacheReadCost: cacheReadCost.toFixed(6),
    totalCost: totalCost.toFixed(6)
  });
  
  return { totalCost, inputCost, outputCost, cacheWriteCost, cacheReadCost };
};

const calculateModelStats = (entries: CcusageEntry[]): { [model: string]: ModelStats } => {
  const modelStats: { [model: string]: ModelStats } = {};
  
  for (const entry of entries) {
    const model = entry.model || 'unknown';
    
    if (!modelStats[model]) {
      modelStats[model] = {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        estimatedInputCost: 0,
        estimatedOutputCost: 0,
        estimatedCacheWriteCost: 0,
        estimatedCacheReadCost: 0
      };
    }
    
    const stats = modelStats[model];
    stats.totalRequests++;
    stats.totalInputTokens += entry.input_tokens || 0;
    stats.totalOutputTokens += entry.output_tokens || 0;
    stats.totalCacheCreationTokens += entry.cache_creation_input_tokens || 0;
    stats.totalCacheReadTokens += entry.cache_read_input_tokens || 0;
    stats.totalTokens += (entry.input_tokens || 0) + (entry.output_tokens || 0) + 
                        (entry.cache_creation_input_tokens || 0) + (entry.cache_read_input_tokens || 0);
    
    const costBreakdown = calculateEstimatedCost(
      entry.input_tokens || 0, 
      entry.output_tokens || 0,
      entry.cache_creation_input_tokens || 0,
      entry.cache_read_input_tokens || 0,
      model
    );
    stats.estimatedCost += costBreakdown.totalCost;
    stats.estimatedInputCost += costBreakdown.inputCost;
    stats.estimatedOutputCost += costBreakdown.outputCost;
    stats.estimatedCacheWriteCost += costBreakdown.cacheWriteCost;
    stats.estimatedCacheReadCost += costBreakdown.cacheReadCost;
  }
  
  return modelStats;
};

export const calculateUsageStats = (entries: CcusageEntry[], currentTime: Date): UsageStats => {
  if (entries.length === 0) {
    return {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheCreationTokens: 0,
      totalCacheReadTokens: 0,
      totalTokens: 0,
      requestsInCurrentPeriod: 0,
      tokensInCurrentPeriod: 0,
      averageRequestsPerHour: 0,
      peakHour: 0,
      hourlyDistribution: {},
      hourlyCostDistribution: {},
      estimatedCost: 0,
      totalEstimatedInputCost: 0,
      totalEstimatedOutputCost: 0,
      totalEstimatedCacheWriteCost: 0,
      totalEstimatedCacheReadCost: 0,
      estimatedCostInCurrentPeriod: 0,
      estimatedMonthlyUsage: 0,
      estimatedDaysUntil200: 0,
      estimatedCostOn200DollarPlan: 0,
      estimatedSavingsOn200DollarPlan: 0,
      estimatedMonthlyUsageOn200DollarPlan: 0,
      estimatedDaysUntil200On200DollarPlan: 0,
      hypotheticalGeneralCostAt4xTokens: 0,
      hypotheticalMonthlyUsageAt4xTokens: 0,
      modelStats: {}
    };
  }

  const now = currentTime;
  const currentPeriodStart = getCurrentPeriodStart(now, entries);
  
  const totalRequests = entries.length;
  const totalInputTokens = entries.reduce((sum, entry) => sum + (entry.input_tokens || 0), 0);
  const totalOutputTokens = entries.reduce((sum, entry) => sum + (entry.output_tokens || 0), 0);
  const totalCacheCreationTokens = entries.reduce((sum, entry) => sum + (entry.cache_creation_input_tokens || 0), 0);
  const totalCacheReadTokens = entries.reduce((sum, entry) => sum + (entry.cache_read_input_tokens || 0), 0);
  const totalTokens = totalInputTokens + totalOutputTokens + totalCacheCreationTokens + totalCacheReadTokens;
  
  console.log('Usage stats calculation:', {
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    totalCacheCreationTokens,
    totalCacheReadTokens,
    totalTokens
  });
  
  const currentPeriodEntries = entries.filter(entry => 
    new Date(entry.timestamp) >= currentPeriodStart
  );
  
  const requestsInCurrentPeriod = currentPeriodEntries.length;
  const tokensInCurrentPeriod = currentPeriodEntries.reduce(
    (sum, entry) => sum + (entry.input_tokens || 0) + (entry.output_tokens || 0) + 
                    (entry.cache_creation_input_tokens || 0) + (entry.cache_read_input_tokens || 0), 0
  );
  
  const lastRequestTime = entries.length > 0 ? new Date(entries[entries.length - 1].timestamp) : undefined;
  
  // 時間別分布を計算（リクエスト数とコスト）
  const hourlyDistribution: { [hour: number]: number } = {};
  const hourlyCostDistribution: { [hour: number]: number } = {};
  for (let i = 0; i < 24; i++) {
    hourlyDistribution[i] = 0;
    hourlyCostDistribution[i] = 0;
  }
  
  entries.forEach(entry => {
    const hour = new Date(entry.timestamp).getHours();
    hourlyDistribution[hour]++;
    
    // 時間別コスト分布を計算
    const costBreakdown = calculateEstimatedCost(
      entry.input_tokens || 0, 
      entry.output_tokens || 0,
      entry.cache_creation_input_tokens || 0,
      entry.cache_read_input_tokens || 0,
      entry.model
    );
    hourlyCostDistribution[hour] += costBreakdown.totalCost;
  });
  
  // ピーク時間をコスト基準で計算
  const peakHour = Object.entries(hourlyCostDistribution).reduce((peak, [hour, cost]) => 
    cost > hourlyCostDistribution[peak] ? parseInt(hour) : peak, 0
  );
  
  // 1時間あたりの平均リクエスト数
  const firstEntry = new Date(entries[0].timestamp);
  const lastEntry = new Date(entries[entries.length - 1].timestamp);
  const hoursDiff = Math.max(1, (lastEntry.getTime() - firstEntry.getTime()) / (1000 * 60 * 60));
  const averageRequestsPerHour = totalRequests / hoursDiff;

  // モデル別統計を計算
  const modelStats = calculateModelStats(entries);
  
  // 一般利用での推定コスト計算（標準料金）
  const estimatedCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedCost, 0);
  const totalEstimatedInputCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedInputCost, 0);
  const totalEstimatedOutputCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedOutputCost, 0);
  const totalEstimatedCacheWriteCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedCacheWriteCost, 0);
  const totalEstimatedCacheReadCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedCacheReadCost, 0);
  
  const currentPeriodModelStats = calculateModelStats(currentPeriodEntries);
  const estimatedCostInCurrentPeriod = Object.values(currentPeriodModelStats).reduce((sum, stats) => sum + stats.estimatedCost, 0);
  
  // 月間使用量推定（過去30日のデータから）
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentEntries = entries.filter(entry => new Date(entry.timestamp) >= thirtyDaysAgo);
  const recentModelStats = calculateModelStats(recentEntries);
  const estimatedMonthlyUsage = Object.values(recentModelStats).reduce((sum, stats) => sum + stats.estimatedCost, 0);
  
  // 200ドルまでの推定日数（一般利用基準）
  const dailyAverageCost = estimatedMonthlyUsage / 30;
  const estimatedDaysUntil200 = dailyAverageCost > 0 ? (200 - estimatedCost) / dailyAverageCost : Infinity;

  // 200ドルプランでの推定コスト・節約額計算
  // 200ドルプランでは4倍のトークンが使えるため、実質的なコストは1/4になる
  const estimatedCostOn200DollarPlan = estimatedCost / 4;
  const estimatedMonthlyUsageOn200DollarPlan = estimatedMonthlyUsage / 4;
  
  // 200ドルプランでの200ドル上限までの推定日数
  const dailyAverageCostOn200DollarPlan = estimatedMonthlyUsageOn200DollarPlan / 30;
  const estimatedDaysUntil200On200DollarPlan = dailyAverageCostOn200DollarPlan > 0 ? 
    (200 - estimatedCostOn200DollarPlan) / dailyAverageCostOn200DollarPlan : Infinity;

  // 4倍のトークンを使用した場合の一般利用料金（仮想的な計算）
  const hypotheticalGeneralCostAt4xTokens = estimatedCost * 4;
  const hypotheticalMonthlyUsageAt4xTokens = estimatedMonthlyUsage * 4;
  
  // 200ドルプランでの節約額（4倍トークン使用時の一般利用料金 - 200ドル固定費）
  const estimatedSavingsOn200DollarPlan = Math.max(0, hypotheticalGeneralCostAt4xTokens - 200);

  console.log('Final cost calculations:', {
    estimatedCost: estimatedCost.toFixed(6),
    totalEstimatedInputCost: totalEstimatedInputCost.toFixed(6),
    totalEstimatedOutputCost: totalEstimatedOutputCost.toFixed(6),
    totalEstimatedCacheWriteCost: totalEstimatedCacheWriteCost.toFixed(6),
    totalEstimatedCacheReadCost: totalEstimatedCacheReadCost.toFixed(6),
    estimatedCostInCurrentPeriod: estimatedCostInCurrentPeriod.toFixed(6),
    estimatedMonthlyUsage: estimatedMonthlyUsage.toFixed(6),
    estimatedCostOn200DollarPlan: estimatedCostOn200DollarPlan.toFixed(6),
    hypotheticalGeneralCostAt4xTokens: hypotheticalGeneralCostAt4xTokens.toFixed(6),
    estimatedSavingsOn200DollarPlan: estimatedSavingsOn200DollarPlan.toFixed(6),
    estimatedMonthlyUsageOn200DollarPlan: estimatedMonthlyUsageOn200DollarPlan.toFixed(6),
    modelStatsCount: Object.keys(modelStats).length,
    peakHour: peakHour,
    peakHourCost: hourlyCostDistribution[peakHour].toFixed(6)
  });

  return {
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    totalCacheCreationTokens,
    totalCacheReadTokens,
    totalTokens,
    requestsInCurrentPeriod,
    tokensInCurrentPeriod,
    lastRequestTime,
    averageRequestsPerHour,
    peakHour,
    hourlyDistribution,
    hourlyCostDistribution,
    estimatedCost,
    totalEstimatedInputCost,
    totalEstimatedOutputCost,
    totalEstimatedCacheWriteCost,
    totalEstimatedCacheReadCost,
    estimatedCostInCurrentPeriod,
    estimatedMonthlyUsage,
    estimatedDaysUntil200,
    estimatedCostOn200DollarPlan,
    estimatedSavingsOn200DollarPlan,
    estimatedMonthlyUsageOn200DollarPlan,
    estimatedDaysUntil200On200DollarPlan,
    hypotheticalGeneralCostAt4xTokens,
    hypotheticalMonthlyUsageAt4xTokens,
    modelStats
  };
};

export const getCurrentPeriodStart = (currentTime: Date, entries: CcusageEntry[]): Date => {
  if (entries.length === 0) {
    // データがない場合はフォールバック基準時刻を使用
    const timeSinceBase = currentTime.getTime() - FALLBACK_BASE_TIME.getTime();
    const cyclesSinceBase = Math.floor(timeSinceBase / (RESET_INTERVAL_HOURS * 60 * 60 * 1000));
    return new Date(FALLBACK_BASE_TIME.getTime() + cyclesSinceBase * RESET_INTERVAL_HOURS * 60 * 60 * 1000);
  }

  // 動的にサイクル基準時刻を決定
  let currentCycleBase = getCycleAnchorTime(new Date(entries[0].timestamp));
  
  for (let i = 1; i < entries.length; i++) {
    const entryTime = new Date(entries[i].timestamp);
    const currentCycleEnd = new Date(currentCycleBase.getTime() + RESET_INTERVAL_HOURS * 60 * 60 * 1000);
    
    // 現在のサイクル終了時刻を過ぎている場合、新しいサイクルの開始
    if (entryTime >= currentCycleEnd) {
      // リセット時刻を過ぎてから最初に利用したタイミングで新しい基準時刻として設定
      currentCycleBase = getCycleAnchorTime(entryTime);
    }
  }
  
  // 現在時刻が属するサイクルの開始時刻を計算
  const timeSinceBase = currentTime.getTime() - currentCycleBase.getTime();
  const cyclesSinceBase = Math.floor(timeSinceBase / (RESET_INTERVAL_HOURS * 60 * 60 * 1000));
  
  return new Date(currentCycleBase.getTime() + cyclesSinceBase * RESET_INTERVAL_HOURS * 60 * 60 * 1000);
};

export const getUsageByPeriods = (entries: CcusageEntry[], currentTime: Date): PeriodUsage[] => {
  if (entries.length === 0) return [];
  
  const periods: PeriodUsage[] = [];
  
  // 動的にサイクル基準時刻を決定し、期間を順次生成
  let currentCycleBase = getCycleAnchorTime(new Date(entries[0].timestamp));
  let periodStart = new Date(currentCycleBase);
  let entryIndex = 0;
  
  while (entryIndex < entries.length || periodStart.getTime() <= currentTime.getTime()) {
    const periodEnd = new Date(periodStart.getTime() + RESET_INTERVAL_HOURS * 60 * 60 * 1000);
    
    // この期間内のエントリを収集
    const periodEntries: CcusageEntry[] = [];
    while (entryIndex < entries.length) {
      const entryTime = new Date(entries[entryIndex].timestamp);
      
      if (entryTime >= periodStart && entryTime < periodEnd) {
        periodEntries.push(entries[entryIndex]);
        entryIndex++;
      } else if (entryTime >= periodEnd) {
        // 次の期間のエントリなので、ここで停止
        break;
      } else {
        // 期間開始前のエントリ（通常は発生しない）
        entryIndex++;
      }
    }
    
    // 期間統計を計算
    const inputTokens = periodEntries.reduce((sum, entry) => sum + (entry.input_tokens || 0), 0);
    const outputTokens = periodEntries.reduce((sum, entry) => sum + (entry.output_tokens || 0), 0);
    const cacheCreationTokens = periodEntries.reduce((sum, entry) => sum + (entry.cache_creation_input_tokens || 0), 0);
    const cacheReadTokens = periodEntries.reduce((sum, entry) => sum + (entry.cache_read_input_tokens || 0), 0);
    const modelStats = calculateModelStats(periodEntries);
    const estimatedCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedCost, 0);
    const estimatedInputCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedInputCost, 0);
    const estimatedOutputCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedOutputCost, 0);
    const estimatedCacheWriteCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedCacheWriteCost, 0);
    const estimatedCacheReadCost = Object.values(modelStats).reduce((sum, stats) => sum + stats.estimatedCacheReadCost, 0);
    
    const period: PeriodUsage = {
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      requests: periodEntries,
      stats: {
        totalRequests: periodEntries.length,
        totalInputTokens: inputTokens,
        totalOutputTokens: outputTokens,
        totalCacheCreationTokens: cacheCreationTokens,
        totalCacheReadTokens: cacheReadTokens,
        totalTokens: inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens,
        estimatedCost,
        estimatedInputCost,
        estimatedOutputCost,
        estimatedCacheWriteCost,
        estimatedCacheReadCost,
        modelStats
      }
    };
    
    periods.push(period);
    
    // 次の期間の開始時刻を決定
    periodStart = periodEnd;
    
    // 次のエントリがリセット時刻以降にある場合、新しいサイクル基準を設定
    if (entryIndex < entries.length) {
      const nextEntryTime = new Date(entries[entryIndex].timestamp);
      if (nextEntryTime.getTime() >= periodEnd.getTime()) {
        // 現在の期間終了時刻以降に次のエントリがある場合
        // リセット時刻を過ぎてから最初に利用したタイミングで新しいサイクル基準時刻として設定
        currentCycleBase = getCycleAnchorTime(nextEntryTime);
        periodStart = new Date(currentCycleBase);
      }
    }
    
    // 現在時刻を過ぎた場合は終了（ただし、現在の期間は含める）
    if (periodStart.getTime() > currentTime.getTime()) {
      break;
    }
  }
  
  // 時系列順にソートして全期間を返す（制限なし）
  return periods.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
};