import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, Calendar, Info, BarChart3, History, Folder, BookOpen, Cpu, ArrowDown, ArrowUp, Sparkles, Zap, Activity, Database, Calculator, Globe, Download, FileText, Lock, Shield, Target } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { FileManager } from './components/FileManager';
import { UsageStats } from './components/UsageStats';
import { PeriodHistory } from './components/PeriodHistory';
import { Footer } from './components/Footer';
import { useLanguage } from './contexts/LanguageContext';
import { parseMultipleCcusageFiles, calculateUsageStats, getUsageByPeriods, getCurrentPeriodStart } from './utils/ccusageParser';
import { formatNumber, formatCostWithJPY, formatTime, formatDetailedCost, getModelDisplayName, getModelColor, formatJSTTime, getWeekdayName } from './utils/formatters';
import { StoredFile, fileStorage, downloadFile } from './utils/fileStorage';
import { CcusageEntry, UsageStats as UsageStatsType, PeriodUsage } from './types/ccusage';
import { RESET_INTERVAL_HOURS, FALLBACK_BASE_TIME, SAMPLE_JSONL_DATA, SAMPLE_JSONL_DATA_2 } from './utils/constants';

type TabType = 'stats' | 'history' | 'files' | 'info';

// 時刻を00分にスナップする関数
const getCycleAnchorTime = (date: Date): Date => {
  const anchorTime = new Date(date);
  anchorTime.setMinutes(0, 0, 0); // 分、秒、ミリ秒を0に設定
  return anchorTime;
};

function App() {
  const { language, setLanguage, t } = useLanguage();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [nextReset, setNextReset] = useState<Date | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [currentCycleBaseTime, setCurrentCycleBaseTime] = useState<Date | null>(null);
  
  // 使用量データ関連の状態
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [ccusageData, setCcusageData] = useState<CcusageEntry[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStatsType | null>(null);
  const [periodHistory, setPeriodHistory] = useState<PeriodUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期データロード
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const files = await fileStorage.getAllFiles();
        setStoredFiles(files);
        if (files.length > 0) {
          setSelectedFiles(files.map(f => f.filename));
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      // 現在時刻をローカルタイムゾーンで取得
      const now = new Date();
      setCurrentTime(now);
      
      // 動的な基準時刻を取得
      const dynamicCycleBaseTime = ccusageData.length > 0 
        ? getCurrentPeriodStart(now, ccusageData)
        : null;
      
      setCurrentCycleBaseTime(dynamicCycleBaseTime);
      
      // 次のリセット時刻を計算
      const nextResetTime = calculateNextReset(now, dynamicCycleBaseTime);
      setNextReset(nextResetTime);
      
      // 次のリセットまでの時間を計算
      if (nextResetTime) {
        const timeDiff = nextResetTime.getTime() - now.getTime();
        setTimeUntilReset(formatTimeDifference(timeDiff));
      }

      // 使用量データがある場合、期間履歴を更新
      if (ccusageData.length > 0) {
        const periods = getUsageByPeriods(ccusageData, now);
        setPeriodHistory(periods);
      }
    };

    // 即座に更新
    updateTime();
    
    // 1秒ごとに更新
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [ccusageData]);

  // 選択されたファイルが変更された時にデータを再計算
  useEffect(() => {
    if (storedFiles.length === 0) {
      setCcusageData([]);
      setUsageStats(null);
      setPeriodHistory([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 選択されたファイルがない場合は全ファイルを使用
      const filesToProcess = selectedFiles.length > 0 
        ? storedFiles.filter(f => selectedFiles.includes(f.filename))
        : storedFiles;

      if (filesToProcess.length === 0) {
        setCcusageData([]);
        setUsageStats(null);
        setPeriodHistory([]);
        setIsLoading(false);
        return;
      }

      const entries = parseMultipleCcusageFiles(filesToProcess);
      
      if (entries.length === 0) {
        throw new Error(language === 'ja' ? '選択されたファイルに有効な使用量データが見つかりませんでした。' : 'No valid usage data found in selected files.');
      }

      setCcusageData(entries);
      
      const stats = calculateUsageStats(entries, currentTime);
      setUsageStats(stats);
      
      const periods = getUsageByPeriods(entries, currentTime);
      setPeriodHistory(periods);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : (language === 'ja' ? 'データの処理中にエラーが発生しました。' : 'An error occurred while processing data.'));
      setCcusageData([]);
      setUsageStats(null);
      setPeriodHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [storedFiles, selectedFiles, currentTime, language]);

  const calculateNextReset = (currentTime: Date, currentCycleBaseTime: Date | null): Date => {
    const baseTime = currentCycleBaseTime || FALLBACK_BASE_TIME;
    
    // 基準時刻からの経過時間（ミリ秒）
    const timeSinceBase = currentTime.getTime() - baseTime.getTime();
    
    // 5時間ごとのサイクル数
    const cyclesSinceBase = Math.floor(timeSinceBase / (RESET_INTERVAL_HOURS * 60 * 60 * 1000));
    
    // 次のリセット時刻
    const nextResetTime = new Date(baseTime.getTime() + (cyclesSinceBase + 1) * RESET_INTERVAL_HOURS * 60 * 60 * 1000);
    
    return nextResetTime;
  };

  const formatTimeDifference = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const generateDummyCurrentPeriodData = (): CcusageEntry[] => {
    // 現在期間の開始・終了時刻を計算
    const currentPeriodStart = currentCycleBaseTime 
      ? getCurrentPeriodStart(currentTime, ccusageData.length > 0 ? ccusageData : [])
      : FALLBACK_BASE_TIME;
    
    const currentPeriodEnd = new Date(currentPeriodStart.getTime() + RESET_INTERVAL_HOURS * 60 * 60 * 1000);
    
    // ダミーデータを生成（3-5個のエントリ）
    const dummyEntries: CcusageEntry[] = [];
    const entryCount = Math.floor(Math.random() * 3) + 3; // 3-5個
    
    for (let i = 0; i < entryCount; i++) {
      // 現在期間内のランダムな時刻を生成
      const randomTime = new Date(
        currentPeriodStart.getTime() + 
        Math.random() * (currentPeriodEnd.getTime() - currentPeriodStart.getTime())
      );
      
      // ランダムなモデルを選択
      const models = ['claude-sonnet-4-20250514', 'claude-4-opus'];
      const randomModel = models[Math.floor(Math.random() * models.length)];
      
      // ランダムなトークン数を生成
      const inputTokens = Math.floor(Math.random() * 3000) + 500;
      const outputTokens = Math.floor(Math.random() * 2000) + 300;
      const cacheCreationTokens = Math.random() > 0.7 ? Math.floor(Math.random() * 1500) : 0;
      const cacheReadTokens = Math.random() > 0.6 ? Math.floor(Math.random() * 1000) : 0;
      
      dummyEntries.push({
        timestamp: randomTime.toISOString(),
        model: randomModel,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_creation_input_tokens: cacheCreationTokens,
        cache_read_input_tokens: cacheReadTokens,
        request_id: `dummy_req_${i + 1}_${Math.random().toString(36).substr(2, 9)}`
      });
    }
    
    // 時系列順にソート
    return dummyEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const handleDownloadCurrentPeriodSample = () => {
    try {
      let entriesToDownload: CcusageEntry[];
      let isDummyData = false;
      
      if (!currentPeriod || currentPeriod.requests.length === 0) {
        // 実データがない場合はダミーデータを生成
        entriesToDownload = generateDummyCurrentPeriodData();
        isDummyData = true;
      } else {
        // 実データがある場合はそれを使用
        entriesToDownload = currentPeriod.requests;
      }

      // ClaudeCodeログ形式に変換
      const jsonlLines = entriesToDownload.map((request, index) => {
        const logEntry = {
          parentUuid: isDummyData ? "dummy-current-period" : "current-period-sample",
          isSidechain: false,
          userType: "external",
          cwd: "/home/user",
          sessionId: isDummyData ? "dummy-current-period-session" : "current-period-sample",
          version: "0.8.0",
          type: "assistant",
          message: {
            id: `msg_${request.request_id || Math.random().toString(36).substr(2, 9)}`,
            type: "message",
            role: "assistant",
            model: request.model,
            content: [
              {
                type: "text",
                text: isDummyData 
                  ? `Dummy response ${index + 1} for current period demonstration`
                  : "Sample response from current period data"
              }
            ],
            usage: {
              input_tokens: request.input_tokens || 0,
              cache_creation_input_tokens: request.cache_creation_input_tokens || 0,
              cache_read_input_tokens: request.cache_read_input_tokens || 0,
              output_tokens: request.output_tokens || 0,
              service_tier: "standard"
            }
          },
          requestId: request.request_id || `req_${Math.random().toString(36).substr(2, 9)}`,
          uuid: `uuid_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: request.timestamp
        };
        return JSON.stringify(logEntry);
      });

      const jsonlContent = jsonlLines.join('\n');
      const filename = `current-period-sample-${isDummyData ? 'dummy-' : ''}${formatJSTTime(currentTime, 'en', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(/[/:]/g, '-')}.jsonl`;
      
      downloadFile(jsonlContent, filename, 'application/jsonl');
      
      if (isDummyData) {
        alert(t('sampleData.currentPeriod.dummyDataGenerated'));
      } else {
        alert(t('sampleData.currentPeriod.downloadSuccess'));
      }
    } catch (error) {
      console.error('Failed to download current period sample:', error);
      alert(t('sampleData.currentPeriod.downloadError'));
    }
  };

  const handleFilesChange = (files: StoredFile[]) => {
    setStoredFiles(files);
    // 新しいファイルが追加された場合、自動的に全選択
    if (files.length > 0 && selectedFiles.length === 0) {
      setSelectedFiles(files.map(f => f.filename));
    }
  };

  const handleFileLoad = async () => {
    try {
      const files = await fileStorage.getAllFiles();
      setStoredFiles(files);
      // 全ファイルを自動的に選択状態にする
      setSelectedFiles(files.map(f => f.filename));
    } catch (err) {
      console.error('Failed to reload files:', err);
    }
  };

  const handleSampleDownload = (sampleNumber: number) => {
    try {
      const sampleData = sampleNumber === 1 ? SAMPLE_JSONL_DATA : SAMPLE_JSONL_DATA_2;
      const filename = `sample-claudecode-session-${sampleNumber}.jsonl`;
      downloadFile(sampleData, filename, 'application/jsonl');
      
      // 成功メッセージを表示（簡単な実装）
      alert(t('sampleData.downloadSuccess'));
    } catch (error) {
      console.error('Failed to download sample file:', error);
      alert(t('sampleData.downloadError'));
    }
  };

  const tabs = [
    { id: 'stats' as TabType, label: t('tabs.stats'), icon: BarChart3, disabled: !usageStats },
    { id: 'history' as TabType, label: t('tabs.history'), icon: History, disabled: periodHistory.length === 0 },
    { id: 'files' as TabType, label: t('tabs.files'), icon: Folder, disabled: false },
    { id: 'info' as TabType, label: t('tabs.info'), icon: BookOpen, disabled: false }
  ];

  const getCurrentPeriod = (): PeriodUsage | null => {
    if (!currentCycleBaseTime) return null;
    
    // 現在のサイクル基準時刻から現在期間の開始・終了時刻を直接計算
    const timeSinceBase = currentTime.getTime() - currentCycleBaseTime.getTime();
    const cyclesSinceBase = Math.floor(timeSinceBase / (RESET_INTERVAL_HOURS * 60 * 60 * 1000));
    const currentPeriodStart = new Date(currentCycleBaseTime.getTime() + cyclesSinceBase * RESET_INTERVAL_HOURS * 60 * 60 * 1000);
    const currentPeriodEnd = new Date(currentPeriodStart.getTime() + RESET_INTERVAL_HOURS * 60 * 60 * 1000);
    
    // periodHistoryから該当する期間を検索
    return periodHistory.find(period => 
      Math.abs(period.periodStart.getTime() - currentPeriodStart.getTime()) < 1000 && // 1秒の誤差を許容
      Math.abs(period.periodEnd.getTime() - currentPeriodEnd.getTime()) < 1000
    ) || null;
  };

  const currentPeriod = getCurrentPeriod();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-2">
      <div className="max-w-7xl mx-auto">
        {/* コンパクトなヘッダー */}
        <div className="relative mb-4 overflow-hidden">
          {/* 背景グラデーション */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-800 opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
          
          {/* アニメーション背景パターン */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute top-2 right-8 w-16 h-16 bg-blue-300 rounded-full blur-xl animate-bounce"></div>
            <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-indigo-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          
          {/* メインコンテンツ */}
          <div className="relative z-10 text-center py-4 px-4">
            {/* 言語切り替えボタン */}
            <div className="absolute top-2 right-2">
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs font-medium rounded-l-full transition-colors ${
                    language === 'en' 
                      ? 'bg-white text-indigo-600' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ja')}
                  className={`px-3 py-1 text-xs font-medium rounded-r-full transition-colors ${
                    language === 'ja' 
                      ? 'bg-white text-indigo-600' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  日本語
                </button>
              </div>
            </div>

            {/* メインタイトル */}
            <div className="flex items-center justify-center mb-2">
              <div className="relative">
                <Sparkles className="h-6 w-6 text-amber-300 mr-2 animate-pulse" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {t('app.title')}
              </h1>
              <div className="relative ml-2">
                <Activity className="h-6 w-6 text-amber-300 animate-pulse" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-ping delay-500"></div>
              </div>
            </div>
            
            {/* サブタイトル */}
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-4 w-4 text-amber-300 mr-1 animate-bounce" />
              <h2 className="text-lg md:text-xl font-semibold text-white/90">
                {t('app.subtitle')}
              </h2>
              <Zap className="h-4 w-4 text-amber-300 ml-1 animate-bounce delay-300" />
            </div>
            
            {/* 説明文 */}
            <p className="text-white/80 text-sm max-w-2xl mx-auto leading-relaxed mb-3">
              {t('app.description')}
            </p>

            {/* プライバシー・処理・分析機能の表示 */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-3">
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
                <Lock className="h-4 w-4 text-green-300 mr-1" />
                <span className="text-xs font-medium text-white">
                  {t('app.privacy')}
                </span>
              </div>
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
                <Cpu className="h-4 w-4 text-blue-300 mr-1" />
                <span className="text-xs font-medium text-white">
                  {t('app.browserProcessing')}
                </span>
              </div>
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
                <Target className="h-4 w-4 text-purple-300 mr-1" />
                <span className="text-xs font-medium text-white">
                  {t('app.realtimeAnalysis')}
                </span>
              </div>
            </div>
            
            {/* 統計情報バッジ（データがある場合） */}
            {usageStats && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
                  <div className="flex items-center text-gray-800">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">
                      {formatNumber(usageStats.totalRequests, language)}{t('usage.requests')}
                    </span>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
                  <div className="flex items-center text-gray-800">
                    <Cpu className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">
                      {formatNumber(usageStats.totalTokens, language)}{t('usage.tokens')}
                    </span>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
                  <div className="flex items-center text-gray-800">
                    <Activity className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">
                      {formatCostWithJPY(usageStats.estimatedCost, language).split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 下部の波形装飾 */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-6 fill-current text-gray-50">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
            </svg>
          </div>
        </div>

        {/* 上部情報エリア - 2列レイアウト */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {/* 現在時刻カード */}
          <div className="bg-white rounded-md shadow-sm p-3 border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-4 w-4 text-slate-600 mr-1" />
              <h2 className="text-sm font-semibold text-gray-800">{t('app.currentTime')}</h2>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-gray-800 mb-1">
                {formatJSTTime(currentTime, language, { 
                  hour12: false, 
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              <div className="text-xs text-gray-600">
                {currentTime.getMonth() + 1}/{currentTime.getDate()} ({getWeekdayName(currentTime, language)})
              </div>
            </div>
          </div>

          {/* 次回リセットまでのカウントダウン */}
          <div className="bg-white rounded-md shadow-sm p-3 border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <RefreshCw className="h-4 w-4 text-slate-600 mr-1" />
              <h2 className="text-sm font-semibold text-gray-800">{t('app.nextReset')}</h2>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-slate-600 mb-1">
                {timeUntilReset}
              </div>
              <div className="text-xs text-gray-600">
                {nextReset && formatJSTTime(nextReset, language, { 
                  hour12: false, 
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {nextReset && nextReset.toDateString() !== currentTime.toDateString() && t('app.tomorrow')}
              </div>
            </div>
          </div>
        </div>

        {/* リセットサイクル基準時刻の表示 + 現在期間の使用状況 */}
        {ccusageData.length > 0 && (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-3 border border-slate-200">
            {/* 現在期間の使用状況 */}
            {currentPeriod && (
              <div className="bg-white rounded-lg p-3 border border-slate-200 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-slate-600 mr-2" />
                    <span className="text-sm font-medium text-slate-800">{t('app.currentPeriodUsage')}</span>
                    <span className="ml-2 text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-medium">
                      {formatTime(currentPeriod.periodStart, language)} - {formatTime(currentPeriod.periodEnd, language)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-slate-900">
                      {currentPeriod.stats.totalRequests}{t('usage.times')}
                    </div>
                    <div className="text-lg font-bold text-slate-700">
                      {formatDetailedCost(currentPeriod.stats.estimatedCost, language)}
                    </div>
                  </div>
                </div>

                {/* トークン使用量セクション */}
                <div className="mb-3">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <Database className="h-3 w-3 mr-1" />
                    {t('periodHistory.tokenUsage')}
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-medium text-slate-700">{t('usage.input')}</p>
                      <p className="font-bold text-slate-800">
                        {formatNumber(currentPeriod.stats.totalInputTokens, language)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-slate-700">{t('usage.output')}</p>
                      <p className="font-bold text-slate-800">
                        {formatNumber(currentPeriod.stats.totalOutputTokens, language)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-blue-600">{t('usage.cacheWrite')}</p>
                      <p className="font-bold text-blue-800">
                        {formatNumber(currentPeriod.stats.totalCacheCreationTokens, language)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-cyan-600">{t('usage.cacheRead')}</p>
                      <p className="font-bold text-cyan-800">
                        {formatNumber(currentPeriod.stats.totalCacheReadTokens, language)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-slate-700">{t('usage.total')}</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {formatNumber(currentPeriod.stats.totalTokens, language)}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-medium text-slate-600">{t('usage.inputCost')}</p>
                      <p className="font-bold text-slate-800">
                        {formatDetailedCost(currentPeriod.stats.estimatedInputCost, language)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-600">{t('usage.outputCost')}</p>
                      <p className="font-bold text-gray-800">
                        {formatDetailedCost(currentPeriod.stats.estimatedOutputCost, language)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-blue-600">{t('usage.cacheWriteCost')}</p>
                      <p className="font-bold text-blue-800">
                        {formatDetailedCost(currentPeriod.stats.estimatedCacheWriteCost, language)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-cyan-600">{t('usage.cacheReadCost')}</p>
                      <p className="font-bold text-cyan-800">
                        {formatDetailedCost(currentPeriod.stats.estimatedCacheReadCost, language)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-slate-600">{t('usage.totalCost')}</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {formatDetailedCost(currentPeriod.stats.estimatedCost, language)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* モデル別詳細（複数モデル使用時） */}
                {Object.keys(currentPeriod.stats.modelStats).length > 1 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center mb-2">
                      <Cpu className="h-3 w-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600 font-medium">{t('periodHistory.modelDetails')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(currentPeriod.stats.modelStats)
                        .filter(([_, stats]) => stats.totalRequests > 0)
                        .map(([model, modelStats]) => (
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

                {/* モデル消費速度の説明 */}
                <div className="mt-3 text-xs text-slate-600 bg-slate-50 rounded p-2">
                  <strong>{language === 'ja' ? 'モデル別リソース消費速度:' : 'Model Resource Consumption Speed:'}</strong> {t('periodHistory.modelConsumptionSpeed')}
                </div>
              </div>
            )}

            <div className="flex items-center">
              <RefreshCw className="h-4 w-4 text-slate-600 mr-2 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-800">
                  {t('app.currentResetCycleBase')}
                </span>
                <div className="text-sm text-slate-700 font-mono">
                  {currentCycleBaseTime ? formatJSTTime(currentCycleBaseTime, language, { 
                    year: 'numeric',
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit'
                  }) : t('app.noData')}
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-slate-600 bg-slate-100 rounded p-2">
              <strong>{language === 'ja' ? '動的リセットルール:' : 'Dynamic Reset Rule:'}</strong> {t('app.dynamicResetRule')}
            </div>
          </div>
        )}

        {!currentCycleBaseTime && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <div className="flex items-center">
              <Info className="h-4 w-4 text-amber-600 mr-2" />
              <div className="text-sm text-amber-800">
                <strong>{language === 'ja' ? '注意:' : 'Notice:'}</strong> {t('app.notice')}
              </div>
            </div>
          </div>
        )}

        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-slate-600 border-b-2 border-slate-600 bg-slate-50'
                      : tab.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 mr-2 ${
                    activeTab === tab.id ? 'text-slate-600' : tab.disabled ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  {tab.label}
                  {tab.disabled && (
                    <span className="ml-1 text-xs text-gray-400">{t('tabs.noData')}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* タブコンテンツ */}
          <div className="p-4">
            {/* 使用統計タブ */}
            {activeTab === 'stats' && (
              <div>
                {usageStats ? (
                  <UsageStats 
                    stats={usageStats} 
                    filename={selectedFiles.length > 0 
                      ? `${selectedFiles.length}${language === 'ja' ? '個のファイル' : ' files'}` 
                      : `${language === 'ja' ? '全' : 'All '}${storedFiles.length}${language === 'ja' ? '個のファイル' : ' files'}`
                    } 
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      {language === 'ja' ? '使用統計データがありません' : 'No usage statistics data'}
                    </p>
                    <p className="text-sm">
                      {language === 'ja' ? '「ファイル管理」タブからJSONLファイルをアップロードしてください' : 'Please upload JSONL files from the "File Management" tab'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 期間別履歴タブ */}
            {activeTab === 'history' && (
              <div>
                {periodHistory.length > 0 ? (
                  <PeriodHistory periods={periodHistory} currentTime={currentTime} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      {language === 'ja' ? '期間別履歴データがありません' : 'No period history data'}
                    </p>
                    <p className="text-sm">
                      {language === 'ja' ? '「ファイル管理」タブからJSONLファイルをアップロードしてください' : 'Please upload JSONL files from the "File Management" tab'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ファイル管理タブ */}
            {activeTab === 'files' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FileUpload 
                  onFileLoad={handleFileLoad}
                  isLoading={isLoading}
                  error={error}
                />
                <FileManager
                  files={storedFiles}
                  onFilesChange={handleFilesChange}
                  selectedFiles={selectedFiles}
                  onFileSelectionChange={setSelectedFiles}
                />
              </div>
            )}

            {/* 説明タブ */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <Info className="h-5 w-5 text-slate-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">{t('info.title')}</h2>
                </div>

                {/* サンプルデータダウンロードセクション */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-500 p-4 rounded-r-lg mb-4">
                  <h3 className="font-semibold text-slate-800 mb-2 text-base flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {t('sampleData.title')}
                  </h3>
                  <p className="text-slate-700 mb-3">
                    {t('sampleData.description')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-800">{t('sampleData.fileDescription1')}</span>
                        <FileText className="h-4 w-4 text-slate-600" />
                      </div>
                      <button
                        onClick={() => handleSampleDownload(1)}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('sampleData.downloadButton')}
                      </button>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-800">{t('sampleData.fileDescription2')}</span>
                        <FileText className="h-4 w-4 text-slate-600" />
                      </div>
                      <button
                        onClick={() => handleSampleDownload(2)}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('sampleData.downloadButton2')}
                      </button>
                    </div>

                    {/* 現在期間サンプルダウンロード */}
                    <div className="bg-white rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-800">{t('sampleData.currentPeriod.title')}</span>
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <button
                        onClick={handleDownloadCurrentPeriodSample}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('sampleData.currentPeriod.downloadButton')}
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-slate-700 space-y-1 text-sm">
                    <p className="font-medium">{t('sampleData.features')}</p>
                    <ul className="space-y-1">
                      <li>{t('sampleData.feature1')}</li>
                      <li>{t('sampleData.feature2')}</li>
                      <li>{t('sampleData.feature3')}</li>
                      <li>{t('sampleData.feature4')}</li>
                      <li>{t('sampleData.feature5')}</li>
                    </ul>
                    <p className="mt-2 text-xs bg-slate-100 rounded p-2">
                      <strong>{language === 'ja' ? '使用方法:' : 'How to use:'}</strong> {t('sampleData.instructions')}
                    </p>
                  </div>
                </div>
                
                <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <h3 className="font-semibold text-blue-800 mb-2 text-base">{t('info.dynamicReset.title')}</h3>
                    <p className="text-blue-700 mb-2">
                      {t('info.dynamicReset.description')}
                    </p>
                    <p className="text-blue-700 mb-2">
                      {language === 'ja' ? '例：' : 'Example: '}{t('info.dynamicReset.example')}
                    </p>
                    <p className="text-blue-700">
                      <strong>{language === 'ja' ? '重要:' : 'Important:'}</strong> {t('info.dynamicReset.important')}
                    </p>
                  </div>

                  <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
                    <h3 className="font-semibold text-slate-800 mb-2 text-base">{t('info.usageAnalysis.title')}</h3>
                    <ul className="text-slate-700 space-y-1">
                      <li>• <strong>{language === 'ja' ? '対応形式：' : 'Supported format: '}</strong> {t('info.usageAnalysis.supportedFormat')}</li>
                      <li>• <strong>{language === 'ja' ? 'ファイル場所：' : 'File location: '}</strong> {t('info.usageAnalysis.fileLocation')}</li>
                      <li>• <strong>{language === 'ja' ? '自動解析：' : 'Auto analysis: '}</strong> {t('info.usageAnalysis.autoAnalysis')}</li>
                      <li>• <strong>{language === 'ja' ? '動的サイクル：' : 'Dynamic cycle: '}</strong> {t('info.usageAnalysis.dynamicCycle')}</li>
                      <li>• <strong>{language === 'ja' ? '00分スナップ：' : '00-minute snap: '}</strong> {t('info.usageAnalysis.00MinSnap')}</li>
                      <li>• <strong>{language === 'ja' ? '詳細コスト分析：' : 'Detailed cost analysis: '}</strong> {t('info.usageAnalysis.detailedCost')}</li>
                      <li>• <strong>{language === 'ja' ? 'プラン比較：' : 'Plan comparison: '}</strong> {t('info.usageAnalysis.planComparison')}</li>
                      <li>• <strong>{language === 'ja' ? '永続保存：' : 'Persistent storage: '}</strong> {t('info.usageAnalysis.persistent')}</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                    <h3 className="font-semibold text-amber-800 mb-2 text-base">{t('info.logFileLocation.title')}</h3>
                    <div className="text-amber-700 space-y-2">
                      <p>
                        <strong>{language === 'ja' ? '通常の保存場所：' : 'Normal storage location: '}</strong> {t('info.logFileLocation.description')}
                      </p>
                      <div className="bg-amber-100 rounded p-3 font-mono text-sm">
                        <div className="mb-1"><strong>{t('info.logFileLocation.macOS')}</strong></div>
                        <div><strong>{t('info.logFileLocation.linux')}</strong></div>
                      </div>
                      <p>
                        {t('info.logFileLocation.note')}
                      </p>
                      <p className="text-sm bg-amber-100 rounded p-2">
                        <strong>{language === 'ja' ? 'ヒント：' : 'Tip: '}</strong> {t('info.logFileLocation.tip')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-r-lg">
                    <h3 className="font-semibold text-gray-800 mb-2 text-base">{t('info.costCalculation.title')}</h3>
                    <p className="text-gray-700 mb-2">
                      <strong>Claude 4 Opus:</strong> {t('info.costCalculation.opus')}<br/>
                      <strong>Claude 4 Sonnet:</strong> {t('info.costCalculation.sonnet')}<br/>
                      {t('info.costCalculation.note')}
                    </p>
                    <p className="text-gray-700">
                      <strong>{language === 'ja' ? '計算式：' : 'Calculation formula: '}</strong> {t('info.costCalculation.formula')}
                    </p>
                  </div>

                  <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
                    <h3 className="font-semibold text-slate-800 mb-2 text-base">{t('info.planSimulation.title')}</h3>
                    <ul className="text-slate-700 space-y-1">
                      <li>• <strong>{language === 'ja' ? '従量課金制：' : 'Pay-as-you-go: '}</strong> {t('info.planSimulation.payAsYouGo')}</li>
                      <li>• <strong>{language === 'ja' ? '200ドルプラン：' : '$200 plan: '}</strong> {t('info.planSimulation.200Plan')}</li>
                      <li>• <strong>{language === 'ja' ? '節約効果：' : 'Savings effect: '}</strong> {t('info.planSimulation.savings')}</li>
                      <li>• <strong>{language === 'ja' ? '使用率表示：' : 'Usage rate display: '}</strong> {t('info.planSimulation.usageRate')}</li>
                      <li>• <strong>{language === 'ja' ? 'コスト内訳：' : 'Cost breakdown: '}</strong> {t('info.planSimulation.costBreakdown')}</li>
                    </ul>
                  </div>

                  <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded-r-lg">
                    <h3 className="font-semibold text-cyan-800 mb-2 text-base">{t('info.cacheFeature.title')}</h3>
                    <div className="text-cyan-700 space-y-2">
                      <p>
                        <strong>{language === 'ja' ? 'キャッシュ機能：' : 'Cache feature: '}</strong> {t('info.cacheFeature.description')}
                      </p>
                      <ul className="space-y-1">
                        <li>• <strong>{language === 'ja' ? 'キャッシュ作成トークン：' : 'Cache creation: '}</strong> {t('info.cacheFeature.cacheWrite')}</li>
                        <li>• <strong>{language === 'ja' ? 'キャッシュ読込：' : 'Cache read: '}</strong> {t('info.cacheFeature.cacheRead')}</li>
                        <li>• <strong>{language === 'ja' ? '効果：' : 'Effect: '}</strong> {t('info.cacheFeature.effect')}</li>
                      </ul>
                      <p className="text-sm bg-cyan-100 rounded p-2">
                        <strong>{language === 'ja' ? '注意：' : 'Note: '}</strong> {t('info.cacheFeature.note')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 text-base">{t('info.examples.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>{language === 'ja' ? '通常のサイクル:' : 'Normal cycle:'}</strong><br/>
                        {t('info.examples.normal')}
                      </div>
                      <div>
                        <strong>{language === 'ja' ? 'リセット後の再開:' : 'Post-reset restart:'}</strong><br/>
                        {t('info.examples.restart')}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {t('info.examples.note')}
                    </div>
                  </div>

                  <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
                    <p className="text-slate-800">
                      <strong>{language === 'ja' ? '注意：' : 'Notice: '}</strong> {t('info.notice')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default App;