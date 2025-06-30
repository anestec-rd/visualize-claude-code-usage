import React from 'react';
import { BarChart3, TrendingUp, Clock, Calculator, Zap, Activity, Target, Calendar, Cpu, DollarSign, TrendingDown, ArrowUp, ArrowDown, Database, HardDrive } from 'lucide-react';
import { UsageStats as UsageStatsType } from '../types/ccusage';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber, formatCost, formatCostWithJPY, formatDetailedCost, formatTime, USD_TO_JPY_RATE, getModelDisplayName, getModelColor } from '../utils/formatters';

interface UsageStatsProps {
  stats: UsageStatsType;
  filename: string;
}

export const UsageStats: React.FC<UsageStatsProps> = ({ stats, filename }) => {
  const { language, t } = useLanguage();

  const getHourlyChart = () => {
    // コスト基準でチャートを生成
    const maxCost = Math.max(...Object.values(stats.hourlyCostDistribution));
    return Object.entries(stats.hourlyCostDistribution).map(([hour, cost]) => ({
      hour: parseInt(hour),
      cost,
      requestCount: stats.hourlyDistribution[parseInt(hour)] || 0,
      percentage: maxCost > 0 ? (cost / maxCost) * 100 : 0
    }));
  };

  const sortedModels = Object.entries(stats.modelStats).sort((a, b) => b[1].estimatedCost - a[1].estimatedCost);
  const totalModelCost = Object.values(stats.modelStats).reduce((sum, model) => sum + model.estimatedCost, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart3 className="h-5 w-5 text-slate-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">{t('usage.usageStats')}</h3>
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {filename}
        </div>
      </div>

      {/* 全体統計 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">{t('usage.totalRequests')}</p>
              <p className="text-lg font-bold text-slate-800">{formatNumber(stats.totalRequests, language)}</p>
            </div>
            <Activity className="h-6 w-6 text-slate-600" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">{t('usage.totalTokens')}</p>
              <p className="text-lg font-bold text-gray-800">
                {formatNumber(stats.totalTokens, language)}
              </p>
            </div>
            <Zap className="h-6 w-6 text-gray-600" />
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">{t('usage.payAsYouGoCost')}</p>
              <p className="text-sm font-bold text-slate-800">{formatCostWithJPY(stats.estimatedCost, language)}</p>
            </div>
            <Calculator className="h-6 w-6 text-slate-600" />
          </div>
        </div>
      </div>

      {/* コスト内訳詳細 */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 mb-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <Calculator className="h-4 w-4 mr-1" />
          {t('usage.detailedCostBreakdown')}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">{t('usage.inputCost')}</span>
              <ArrowDown className="h-3 w-3 text-slate-600" />
            </div>
            <div className="text-lg font-bold text-slate-800">
              {formatDetailedCost(stats.totalEstimatedInputCost, language)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatNumber(stats.totalInputTokens, language)} {t('usage.tokens')}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">{t('usage.outputCost')}</span>
              <ArrowUp className="h-3 w-3 text-gray-600" />
            </div>
            <div className="text-lg font-bold text-gray-800">
              {formatDetailedCost(stats.totalEstimatedOutputCost, language)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatNumber(stats.totalOutputTokens, language)} {t('usage.tokens')}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">{t('usage.cacheWriteCost')}</span>
              <Database className="h-3 w-3 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-800">
              {formatDetailedCost(stats.totalEstimatedCacheWriteCost, language)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatNumber(stats.totalCacheCreationTokens, language)} {t('usage.tokens')}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">{t('usage.cacheReadCost')}</span>
              <HardDrive className="h-3 w-3 text-cyan-600" />
            </div>
            <div className="text-lg font-bold text-cyan-800">
              {formatDetailedCost(stats.totalEstimatedCacheReadCost, language)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatNumber(stats.totalCacheReadTokens, language)} {t('usage.tokens')}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 font-medium">{t('usage.totalCost')}</span>
              <DollarSign className="h-3 w-3 text-slate-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">
              {formatDetailedCost(stats.estimatedCost, language)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(stats.estimatedCost * USD_TO_JPY_RATE).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US', {
                style: 'currency',
                currency: 'JPY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-600 bg-gray-100 rounded p-2">
          <strong>{language === 'ja' ? '計算式:' : 'Calculation formula:'}</strong> {t('usage.calculationFormula')}<br/>
          <strong>{language === 'ja' ? 'キャッシュ機能:' : 'Cache feature:'}</strong> {t('usage.cacheFeature')}
        </div>
      </div>

      {/* モデル別使用統計 */}
      {sortedModels.length > 0 && (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 mb-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
            <Cpu className="h-4 w-4 mr-1" />
            {t('usage.modelUsageStats')}
          </h4>
          
          <div className="space-y-4">
            {sortedModels.map(([model, modelStats]) => {
              const percentage = totalModelCost > 0 ? (modelStats.estimatedCost / totalModelCost) * 100 : 0;
              const displayName = getModelDisplayName(model);
              const colorClass = getModelColor(model);
              
              return (
                <div key={model} className="bg-white rounded-lg p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${colorClass} mr-2`}></div>
                      <span className="text-sm font-medium text-gray-800">{displayName}</span>
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {model}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-slate-900">
                        {formatCostWithJPY(modelStats.estimatedCost, language)}
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {percentage.toFixed(1)}% | {formatNumber(modelStats.totalRequests, language)}{t('usage.times')}
                      </div>
                    </div>
                  </div>
                  
                  {/* プログレスバー */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {/* トークン使用量セクション */}
                  <div className="mb-4">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <Database className="h-3 w-3 mr-1" />
                      {t('periodHistory.tokenUsage')}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                      <div className="text-center">
                        <p className="font-medium text-slate-700">{t('usage.input')}</p>
                        <p className="font-bold text-slate-800">
                          {formatNumber(modelStats.totalInputTokens, language)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-700">{t('usage.output')}</p>
                        <p className="font-bold text-slate-800">
                          {formatNumber(modelStats.totalOutputTokens, language)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-blue-600">{t('usage.cacheWrite')}</p>
                        <p className="font-bold text-blue-800">
                          {formatNumber(modelStats.totalCacheCreationTokens, language)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-cyan-600">{t('usage.cacheRead')}</p>
                        <p className="font-bold text-cyan-800">
                          {formatNumber(modelStats.totalCacheReadTokens, language)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-700">{t('usage.total')}</p>
                        <p className="text-lg font-extrabold text-slate-900">
                          {formatNumber(modelStats.totalTokens, language)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* コスト内訳セクション */}
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <Calculator className="h-3 w-3 mr-1" />
                      {t('periodHistory.costBreakdown')}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                      <div className="text-center">
                        <p className="font-medium text-slate-600">{t('usage.inputCost')}</p>
                        <p className="font-bold text-slate-800">
                          {formatDetailedCost(modelStats.estimatedInputCost, language)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-600">{t('usage.outputCost')}</p>
                        <p className="font-bold text-gray-800">
                          {formatDetailedCost(modelStats.estimatedOutputCost, language)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-blue-600">{t('usage.cacheWriteCost')}</p>
                        <p className="font-bold text-blue-800">
                          {formatDetailedCost(modelStats.estimatedCacheWriteCost, language)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-cyan-600">{t('usage.cacheReadCost')}</p>
                        <p className="font-bold text-cyan-800">
                          {formatDetailedCost(modelStats.estimatedCacheReadCost, language)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-600">{t('usage.totalCost')}</p>
                        <p className="text-lg font-extrabold text-slate-900">
                          {formatDetailedCost(modelStats.estimatedCost, language)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* プラン別コストシミュレーション */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-4 border border-amber-200">
        <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center">
          <Target className="h-4 w-4 mr-1" />
          {t('usage.planCostSimulation')}
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* 従量課金制コスト */}
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <h5 className="text-sm font-semibold text-amber-800 mb-3 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {t('usage.currentUsagePayAsYouGo')}
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-amber-600">{t('usage.currentCumulativeCost')}</span>
                <span className="text-lg font-extrabold text-amber-900">{formatCostWithJPY(stats.estimatedCost, language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-amber-600">{t('usage.estimatedMonthlyUsage')}</span>
                <span className="text-sm font-bold text-amber-800">{formatCostWithJPY(stats.estimatedMonthlyUsage, language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-amber-600">{t('usage.dailyAverageCost')}</span>
                <span className="text-sm font-bold text-amber-800">{formatCostWithJPY(stats.estimatedMonthlyUsage / 30, language)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded p-2">
              {t('usage.currentPlanNote')}
            </div>
          </div>

          {/* 200ドルプランでの4倍トークン使用時のコスト */}
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <h5 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
              <ArrowUp className="h-4 w-4 mr-1" />
              {t('usage.200DollarPlan4xTokens')}
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">{t('usage.4xTokensPayAsYouGoCost')}</span>
                <span className="text-sm font-bold text-slate-800">{formatCostWithJPY(stats.hypotheticalGeneralCostAt4xTokens, language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">{t('usage.200DollarPlanFixedFee')}</span>
                <span className="text-sm font-bold text-slate-800">
                  {(200).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ({(200 * USD_TO_JPY_RATE).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US', {
                    style: 'currency',
                    currency: 'JPY',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">{t('usage.estimatedMonthly4x')}</span>
                <span className="text-sm font-bold text-slate-800">{formatCostWithJPY(stats.hypotheticalMonthlyUsageAt4xTokens, language)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-xs text-slate-600 font-semibold">{t('usage.potentialSavings')}</span>
                <span className="text-lg font-extrabold text-slate-900">{formatCostWithJPY(stats.estimatedSavingsOn200DollarPlan, language)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600 bg-slate-50 rounded p-2">
              {t('usage.200DollarPlanNote')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-amber-600">{t('usage.daysUntil200Limit')}</p>
            <p className="text-lg font-bold text-amber-800">
              {stats.estimatedDaysUntil200On200DollarPlan === Infinity ? '∞' : Math.ceil(stats.estimatedDaysUntil200On200DollarPlan).toLocaleString(language)}
            </p>
            <p className="text-xs text-amber-600">{t('usage.days')}{t('usage.200DollarPlanBasis')}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-amber-600">{t('usage.4xUsageSavings')}</p>
            <p className="text-lg font-bold text-amber-800">
              {stats.estimatedSavingsOn200DollarPlan > 0 ? formatCostWithJPY(stats.estimatedSavingsOn200DollarPlan, language) : t('usage.noSavings')}
            </p>
            <p className="text-xs text-amber-600">{t('usage.vs')} {t('usage.payAsYouGoCost2')}</p>
          </div>
        </div>

        <div className="mt-3 text-xs text-amber-600 bg-amber-100 rounded p-2">
          {t('usage.pricingNote')}
        </div>
      </div>

      {/* 時間別使用分布（コスト重み付け） */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">{t('usage.hourlyDistribution')}</h4>
        <div className="grid grid-cols-12 gap-1">
          {getHourlyChart().map(({ hour, cost, requestCount, percentage }) => (
            <div key={hour} className="text-center">
              <div 
                className={`bg-gradient-to-t from-slate-500 to-slate-300 rounded-sm mb-1 transition-all duration-300 hover:from-slate-600 hover:to-slate-400 ${
                  hour === stats.peakHour ? 'ring-2 ring-amber-400' : ''
                }`}
                style={{ height: `${Math.max(4, percentage * 0.6)}px` }}
                title={`${hour}${language === 'ja' ? '時' : ':00'}: ${requestCount}${language === 'ja' ? '回' : ' requests'}, ${formatDetailedCost(cost, language)} ${hour === stats.peakHour ? (language === 'ja' ? '(ピーク)' : '(Peak)') : ''}`}
              />
              <div className="text-xs text-gray-500 font-mono">
                {hour.toString().padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          {t('usage.peakHour')}: {stats.peakHour.toString().padStart(2, '0')}:00 
          ({formatNumber(stats.hourlyDistribution[stats.peakHour], language)}{language === 'ja' ? '回' : ' requests'}, {formatDetailedCost(stats.hourlyCostDistribution[stats.peakHour], language)})
        </div>
      </div>

      {/* トークン詳細 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">{t('usage.tokenDetails')}</h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600">{t('usage.input')}</p>
            <p className="text-lg font-bold text-gray-800">{formatNumber(stats.totalInputTokens, language)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">{t('usage.output')}</p>
            <p className="text-lg font-bold text-gray-800">{formatNumber(stats.totalOutputTokens, language)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-600">{t('usage.cacheCreation')}</p>
            <p className="text-lg font-bold text-blue-800">{formatNumber(stats.totalCacheCreationTokens, language)}</p>
          </div>
          <div>
            <p className="text-xs text-cyan-600">{t('usage.cacheRead')}</p>
            <p className="text-lg font-bold text-cyan-800">{formatNumber(stats.totalCacheReadTokens, language)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">{t('usage.total')}</p>
            <p className="text-xl font-extrabold text-gray-900">{formatNumber(stats.totalTokens, language)}</p>
          </div>
        </div>
      </div>

      {/* 最終使用時刻 */}
      {stats.lastRequestTime && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
          <strong>{t('usage.lastUsage')}:</strong> {formatTime(stats.lastRequestTime, language)}
        </div>
      )}
    </div>
  );
};