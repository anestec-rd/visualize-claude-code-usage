import React, { useState, useMemo } from 'react';
import { History, BarChart2, Clock, Calculator, TrendingDown, Cpu, ArrowDown, ArrowUp, Database, HardDrive, Filter, SortAsc, SortDesc, ChevronLeft, ChevronRight, Calendar, Hash, DollarSign } from 'lucide-react';
import { PeriodUsage } from '../types/ccusage';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber, formatCost, formatCostWithJPY, formatDetailedCost, formatTime, USD_TO_JPY_RATE, getModelDisplayName, getModelColor } from '../utils/formatters';

interface PeriodHistoryProps {
  periods: PeriodUsage[];
  currentTime: Date;
}

type SortKey = 'periodStart' | 'totalRequests' | 'estimatedCost' | 'totalTokens';
type SortOrder = 'asc' | 'desc';

export const PeriodHistory: React.FC<PeriodHistoryProps> = ({ periods, currentTime }) => {
  const { language, t } = useLanguage();

  // State for sorting, filtering, and pagination
  const [sortKey, setSortKey] = useState<SortKey>('periodStart');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterMinRequests, setFilterMinRequests] = useState<number>(0);
  const [filterMinCost, setFilterMinCost] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const isCurrentPeriod = (period: PeriodUsage): boolean => {
    return currentTime >= period.periodStart && currentTime < period.periodEnd;
  };

  // Filtered periods based on filter criteria
  const filteredPeriods = useMemo(() => {
    return periods.filter(period => {
      // Hide periods with no usage unless they are the current period
      if (!isCurrentPeriod(period) && period.stats.totalRequests === 0) {
        return false;
      }

      // Date range filter
      if (filterStartDate) {
        const startDate = new Date(filterStartDate);
        if (period.periodEnd < startDate) return false;
      }
      if (filterEndDate) {
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (period.periodStart > endDate) return false;
      }
      
      // Minimum requests filter
      if (filterMinRequests > 0 && period.stats.totalRequests < filterMinRequests) {
        return false;
      }
      
      // Minimum cost filter
      if (filterMinCost > 0 && period.stats.estimatedCost < filterMinCost) {
        return false;
      }
      
      return true;
    });
  }, [periods, currentTime, filterStartDate, filterEndDate, filterMinRequests, filterMinCost]);

  // Sorted periods based on sort criteria
  const sortedPeriods = useMemo(() => {
    return [...filteredPeriods].sort((a, b) => {
      let aValue: number | Date;
      let bValue: number | Date;
      
      switch (sortKey) {
        case 'periodStart':
          aValue = a.periodStart;
          bValue = b.periodStart;
          break;
        case 'totalRequests':
          aValue = a.stats.totalRequests;
          bValue = b.stats.totalRequests;
          break;
        case 'estimatedCost':
          aValue = a.stats.estimatedCost;
          bValue = b.stats.estimatedCost;
          break;
        case 'totalTokens':
          aValue = a.stats.totalTokens;
          bValue = b.stats.totalTokens;
          break;
        default:
          aValue = a.periodStart;
          bValue = b.periodStart;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPeriods, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedPeriods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeriods = sortedPeriods.slice(startIndex, endIndex);

  // コスト基準でバーの最大値を計算
  const maxCost = Math.max(...filteredPeriods.map(p => p.stats.estimatedCost), 0.001);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMinRequests(0);
    setFilterMinCost(0);
    setCurrentPage(1);
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <History className="h-5 w-5 text-slate-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">{t('periodHistory.title')}</h3>
          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {filteredPeriods.length}{t('periodHistory.periods')}
          </span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center px-3 py-1 text-sm rounded transition-colors ${
            showFilters ? 'bg-slate-100 text-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Filter className="h-4 w-4 mr-1" />
          {t('periodHistory.filters')}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                {t('periodHistory.startDate')}
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                {t('periodHistory.endDate')}
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Hash className="h-3 w-3 inline mr-1" />
                {t('periodHistory.minRequests')}
              </label>
              <input
                type="number"
                min="0"
                value={filterMinRequests}
                onChange={(e) => setFilterMinRequests(parseInt(e.target.value) || 0)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <DollarSign className="h-3 w-3 inline mr-1" />
                {t('periodHistory.minCost')} (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filterMinCost}
                onChange={(e) => setFilterMinCost(parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            >
              {t('periodHistory.clearFilters')}
            </button>
            <span className="text-xs text-gray-500">
              {filteredPeriods.length} / {periods.length} {t('periodHistory.periodsShown')}
            </span>
          </div>
        </div>
      )}

      {/* Sorting Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-xs font-medium text-gray-700">{t('periodHistory.sortBy')}:</span>
        <button
          onClick={() => handleSort('periodStart')}
          className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
            sortKey === 'periodStart' ? 'bg-slate-200 text-slate-800' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Clock className="h-3 w-3 mr-1" />
          {t('periodHistory.date')}
          {getSortIcon('periodStart')}
        </button>
        <button
          onClick={() => handleSort('totalRequests')}
          className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
            sortKey === 'totalRequests' ? 'bg-slate-200 text-slate-800' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Hash className="h-3 w-3 mr-1" />
          {t('periodHistory.requests')}
          {getSortIcon('totalRequests')}
        </button>
        <button
          onClick={() => handleSort('estimatedCost')}
          className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
            sortKey === 'estimatedCost' ? 'bg-slate-200 text-slate-800' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <DollarSign className="h-3 w-3 mr-1" />
          {t('periodHistory.cost')}
          {getSortIcon('estimatedCost')}
        </button>
        <button
          onClick={() => handleSort('totalTokens')}
          className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
            sortKey === 'totalTokens' ? 'bg-slate-200 text-slate-800' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Database className="h-3 w-3 mr-1" />
          {t('periodHistory.tokens')}
          {getSortIcon('totalTokens')}
        </button>
      </div>

      {/* Pagination Controls (Top) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              {t('periodHistory.previous')}
            </button>
            <span className="text-xs text-gray-600">
              {t('periodHistory.page')} {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('periodHistory.next')}
              <ChevronRight className="h-3 w-3 ml-1" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{t('periodHistory.itemsPerPage')}:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
              className="text-xs border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {periods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('periodHistory.noHistory')}</p>
          </div>
        ) : filteredPeriods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('periodHistory.noMatchingPeriods')}</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-xs text-slate-600 hover:text-slate-800 underline"
            >
              {t('periodHistory.clearFilters')}
            </button>
          </div>
        ) : (
          <>
            {paginatedPeriods.map((period, index) => {
              const isCurrent = isCurrentPeriod(period);
              // コスト基準でバーの幅を計算
              const barWidth = maxCost > 0 ? (period.stats.estimatedCost / maxCost) * 100 : 0;
              const hasUsage = period.stats.totalRequests > 0;
              
              // 使用されたモデルの情報
              const usedModels = Object.entries(period.stats.modelStats).filter(([_, stats]) => stats.totalRequests > 0);
              const primaryModel = usedModels.length > 0 ? usedModels.reduce((a, b) => a[1].totalRequests > b[1].totalRequests ? a : b) : null;
              
              return (
                <div
                  key={`${period.periodStart.getTime()}-${index}`}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-300 shadow-sm'
                      : hasUsage
                      ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Clock className={`h-4 w-4 mr-2 ${isCurrent ? 'text-slate-600' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${isCurrent ? 'text-slate-800' : 'text-gray-700'}`}>
                        {formatTime(period.periodStart, language)} - {formatTime(period.periodEnd, language)}
                      </span>
                      {isCurrent && (
                        <span className="ml-2 text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-medium">
                          {t('app.current')}
                        </span>
                      )}
                      {primaryModel && (
                        <div className="ml-2 flex items-center">
                          <div className={`w-2 h-2 rounded-full ${getModelColor(primaryModel[0])} mr-1`}></div>
                          <span className="text-xs text-gray-600">
                            {getModelDisplayName(primaryModel[0])}
                            {usedModels.length > 1 && ` +${usedModels.length - 1}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-extrabold ${isCurrent ? 'text-slate-900' : 'text-gray-900'}`}>
                        {period.stats.totalRequests}{t('usage.times')}
                      </div>
                      <div className={`text-lg font-bold ${isCurrent ? 'text-slate-700' : 'text-gray-700'}`}>
                        {formatDetailedCost(period.stats.estimatedCost, language)}
                      </div>
                    </div>
                  </div>

                  {period.stats.totalRequests > 0 && (
                    <>
                      {/* コスト基準のプログレスバー */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isCurrent ? 'bg-gradient-to-r from-slate-400 to-gray-400' : 'bg-gradient-to-r from-slate-400 to-gray-400'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      {/* トークン使用量セクション */}
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                          <Database className="h-3 w-3 mr-1" />
                          {t('periodHistory.tokenUsage')}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                          <div className="text-center">
                            <p className={`font-medium ${isCurrent ? 'text-slate-700' : 'text-gray-600'}`}>
                              {t('usage.input')}
                            </p>
                            <p className={`font-bold ${isCurrent ? 'text-slate-800' : 'text-gray-800'}`}>
                              {formatNumber(period.stats.totalInputTokens, language)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className={`font-medium ${isCurrent ? 'text-slate-700' : 'text-gray-600'}`}>
                              {t('usage.output')}
                            </p>
                            <p className={`font-bold ${isCurrent ? 'text-slate-800' : 'text-gray-800'}`}>
                              {formatNumber(period.stats.totalOutputTokens, language)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-blue-600">
                              {t('usage.cacheWrite')}
                            </p>
                            <p className="font-bold text-blue-800">
                              {formatNumber(period.stats.totalCacheCreationTokens, language)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-cyan-600">
                              {t('usage.cacheRead')}
                            </p>
                            <p className="font-bold text-cyan-800">
                              {formatNumber(period.stats.totalCacheReadTokens, language)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className={`font-medium ${isCurrent ? 'text-slate-700' : 'text-gray-600'}`}>
                              {t('usage.total')}
                            </p>
                            <p className={`text-lg font-extrabold ${isCurrent ? 'text-slate-900' : 'text-gray-900'}`}>
                              {formatNumber(period.stats.totalTokens, language)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* コスト内訳セクション */}
                      <div className="mb-2">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                          <Calculator className="h-3 w-3 mr-1" />
                          {t('periodHistory.costBreakdown')}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                          <div className="text-center">
                            <p className="font-medium text-slate-600">
                              {t('usage.inputCost')}
                            </p>
                            <p className="font-bold text-slate-800">
                              {formatDetailedCost(period.stats.estimatedInputCost, language)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-600">
                              {t('usage.outputCost')}
                            </p>
                            <p className="font-bold text-gray-800">
                              {formatDetailedCost(period.stats.estimatedOutputCost, language)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-blue-600">
                              {t('usage.cacheWriteCost')}
                            </p>
                            <p className="font-bold text-blue-800">
                              {formatDetailedCost(period.stats.estimatedCacheWriteCost, language)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-cyan-600">
                              {t('usage.cacheReadCost')}
                            </p>
                            <p className="font-bold text-cyan-800">
                              {formatDetailedCost(period.stats.estimatedCacheReadCost, language)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-slate-600">
                              {t('usage.totalCost')}
                            </p>
                            <p className={`text-lg font-extrabold ${isCurrent ? 'text-slate-900' : 'text-gray-900'}`}>
                              {formatDetailedCost(period.stats.estimatedCost, language)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* モデル別詳細（複数モデル使用時） */}
                      {usedModels.length > 1 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center mb-1">
                            <Cpu className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-xs text-gray-600 font-medium">{t('periodHistory.modelDetails')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {usedModels.map(([model, modelStats]) => (
                              <div key={model} className="flex items-center text-xs">
                                <div className={`w-2 h-2 rounded-full ${getModelColor(model)} mr-1`}></div>
                                <span className="text-gray-600 mr-1">{getModelDisplayName(model)}:</span>
                                <span className="font-medium text-gray-800">{modelStats.totalRequests}{t('usage.times')}</span>
                                <span className="text-slate-600 ml-1">({formatDetailedCost(modelStats.estimatedCost, language)})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {period.stats.totalRequests === 0 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">{t('periodHistory.noPeriodUsage')}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Pagination Controls (Bottom) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('periodHistory.first')}
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              {t('periodHistory.previous')}
            </button>
            
            {/* Page number input */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    handlePageChange(page);
                  }
                }}
                className="w-12 text-xs text-center border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
              />
              <span className="text-xs text-gray-600">/ {totalPages}</span>
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('periodHistory.next')}
              <ChevronRight className="h-3 w-3 ml-1" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('periodHistory.last')}
            </button>
          </div>
          <div className="text-xs text-gray-600">
            {t('periodHistory.showing')} {startIndex + 1}-{Math.min(endIndex, sortedPeriods.length)} {t('periodHistory.of')} {sortedPeriods.length}
          </div>
        </div>
      )}

      {/* コスト重み付け説明 */}
      <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded p-2">
        {t('periodHistory.barDisplay')}
      </div>
    </div>
  );
};