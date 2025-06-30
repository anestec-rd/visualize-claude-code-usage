import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BoltBadge } from './BoltBadge';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="mt-8 py-6 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright and project info */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600">
              © 2025 ClaudeCode Reset Schedule & Usage Analysis
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ja' 
                ? 'ClaudeCode非公式 - オープンソースプロジェクト'
                : 'ClaudeCode Unofficial - Open Source Project'
              }
            </p>
            <p className="text-xs text-gray-500">
              {language === 'ja' 
                ? 'プライバシー保護・ローカル処理・リアルタイム分析'
                : 'Privacy Protected, Local Processing, Real-time Analysis'
              }
            </p>
          </div>

          {/* Bolt.new Badge */}
          <div className="flex items-center">
            <BoltBadge />
          </div>
        </div>
      </div>
    </footer>
  );
};