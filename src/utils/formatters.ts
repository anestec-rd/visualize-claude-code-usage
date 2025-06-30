export const USD_TO_JPY_RATE = 150; // 為替レート（USD/JPY）

export const formatNumber = (num: number, locale: string = 'en-US'): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + (locale === 'ja' ? 'M' : 'M');
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + (locale === 'ja' ? 'K' : 'K');
  }
  return num.toLocaleString(locale);
};

export const formatCost = (cost: number, locale: string = 'en-US'): string => {
  return cost.toLocaleString(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatCostWithJPY = (cost: number, locale: string = 'en-US'): string => {
  const usd = cost.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const jpy = (cost * USD_TO_JPY_RATE).toLocaleString('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return `${usd} (${jpy})`;
};

export const formatDetailedCost = (cost: number, locale: string = 'en-US'): string => {
  if (cost < 0.01) {
    return cost.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  }
  return cost.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
};

export const formatTime = (date: Date, locale: string = 'en-US'): string => {
  // ローカルタイムゾーンを使用（timeZoneオプションを削除）
  if (locale === 'ja') {
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
};

export const formatJSTTime = (date: Date, locale: string = 'en-US', options: Intl.DateTimeFormatOptions = {}) => {
  // ローカルタイムゾーンを使用（timeZoneオプションを削除）
  const defaultOptions = {
    ...options
  };
  
  if (locale === 'ja') {
    return date.toLocaleString('ja-JP', defaultOptions);
  } else {
    return date.toLocaleString('en-US', defaultOptions);
  }
};

export const getModelDisplayName = (model: string): string => {
  // Claude 4 Opus
  if (model.includes('claude-4-opus') || model.includes('claude-opus-4') ||
      model.includes('opus-4') || model.includes('4-opus')) {
    return 'Claude 4 Opus';
  }
  // Claude 4 Sonnet
  if (model.includes('claude-4-sonnet') || model.includes('claude-sonnet-4') ||
      model.includes('sonnet-4') || model.includes('4-sonnet')) {
    return 'Claude 4 Sonnet';
  }
  // 一般的なSonnet（バージョン不明）
  if (model.includes('sonnet')) {
    return 'Claude 4 Sonnet';
  }
  // 一般的なOpus（バージョン不明）
  if (model.includes('opus')) {
    return 'Claude 4 Opus';
  }
  // OpenAI models
  if (model.includes('gpt-4o')) return 'GPT-4o';
  if (model.includes('gpt-4-turbo')) return 'GPT-4 Turbo';
  if (model.includes('gpt-4')) return 'GPT-4';
  if (model.includes('gpt-3.5')) return 'GPT-3.5 Turbo';
  
  // その他
  return model.length > 20 ? model.substring(0, 20) + '...' : model;
};

export const getModelColor = (model: string): string => {
  if (model.includes('claude-4-opus') || model.includes('claude-opus-4') ||
      model.includes('opus-4') || model.includes('4-opus')) return 'bg-purple-600';
  if (model.includes('claude-4-sonnet') || model.includes('claude-sonnet-4') ||
      model.includes('sonnet-4') || model.includes('4-sonnet')) return 'bg-indigo-500';
  if (model.includes('sonnet')) return 'bg-indigo-400';
  if (model.includes('opus')) return 'bg-purple-500';
  if (model.includes('gpt-4')) return 'bg-orange-500';
  if (model.includes('gpt-3.5')) return 'bg-yellow-500';
  return 'bg-gray-500';
};

export const getWeekdayName = (date: Date, locale: string = 'en-US'): string => {
  if (locale === 'ja') {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  } else {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekdays[date.getDay()];
  }
};