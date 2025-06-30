import React, { useState, useEffect } from 'react';
import { Folder, Trash2, Download, FileText, Clock, HardDrive, AlertTriangle, Database, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { fileStorage, StoredFile } from '../utils/fileStorage';

interface FileManagerProps {
  files: StoredFile[];
  onFilesChange: (files: StoredFile[]) => void;
  selectedFiles: string[];
  onFileSelectionChange: (filenames: string[]) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ 
  files,
  onFilesChange, 
  selectedFiles, 
  onFileSelectionChange 
}) => {
  const { language, t } = useLanguage();
  const [storageSize, setStorageSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateStorageSize = async () => {
      try {
        const size = await fileStorage.getStorageSize();
        setStorageSize(size);
      } catch (err) {
        console.error('Failed to get storage size:', err);
      }
    };

    updateStorageSize();
  }, [files]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const storedFiles = await fileStorage.getAllFiles();
      const size = await fileStorage.getStorageSize();
      
      setStorageSize(size);
      onFilesChange(storedFiles);
      setError(null);
    } catch (err) {
      setError(t('fileManager.loadError'));
      console.error('Failed to load files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDelete = async (filename: string) => {
    if (!confirm(t('fileManager.deleteConfirm').replace('{filename}', filename))) return;
    
    try {
      await fileStorage.deleteFile(filename);
      await loadFiles();
      
      // 選択されていたファイルが削除された場合、選択から除外
      if (selectedFiles.includes(filename)) {
        onFileSelectionChange(selectedFiles.filter(f => f !== filename));
      }
    } catch (err) {
      setError(t('fileManager.deleteError'));
      console.error('Failed to delete file:', err);
    }
  };

  const handleDeleteSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    const confirmMessage = selectedFiles.length === 1 
      ? t('fileManager.deleteConfirm').replace('{filename}', selectedFiles[0])
      : t('fileManager.deleteSelectedConfirm').replace('{count}', selectedFiles.length.toString());
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setIsLoading(true);
      
      // 選択されたファイルを順次削除
      for (const filename of selectedFiles) {
        await fileStorage.deleteFile(filename);
      }
      
      // ファイル一覧を再読み込み
      await loadFiles();
      
      // 選択状態をクリア
      onFileSelectionChange([]);
      
    } catch (err) {
      setError(t('fileManager.deleteError'));
      console.error('Failed to delete selected files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllFiles = async () => {
    if (!confirm(t('fileManager.deleteAllConfirm'))) return;
    
    try {
      setIsLoading(true);
      await fileStorage.clearAllFiles();
      await loadFiles();
      onFileSelectionChange([]);
    } catch (err) {
      setError(t('fileManager.deleteError'));
      console.error('Failed to clear all files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileToggle = (filename: string) => {
    const newSelection = selectedFiles.includes(filename)
      ? selectedFiles.filter(f => f !== filename)
      : [...selectedFiles, filename];
    onFileSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      onFileSelectionChange([]);
    } else {
      onFileSelectionChange(files.map(f => f.filename));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          <span className="ml-2 text-gray-600">{t('fileManager.loadingFiles')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Folder className="h-5 w-5 text-slate-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">{t('fileManager.title')}</h3>
            <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {files.length}{t('fileManager.files')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-gray-500">
              <HardDrive className="h-4 w-4 mr-1" />
              {formatFileSize(storageSize)}
            </div>
            {files.length > 0 && (
              <button
                onClick={handleClearAllFiles}
                disabled={isLoading}
                className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('fileManager.deleteAll')}
              >
                {t('fileManager.deleteAll')}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                disabled={isLoading}
                className="text-sm text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedFiles.length === files.length ? t('fileManager.deselectAll') : t('fileManager.selectAll')}
              </button>
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleDeleteSelectedFiles}
                  disabled={isLoading}
                  className="flex items-center text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('fileManager.deleteSelected')}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t('fileManager.deleteSelected')}
                </button>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {selectedFiles.length}{t('fileManager.selected')}
            </span>
          </div>
        )}
      </div>

      {/* ファイル一覧 */}
      <div className="max-h-64 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('fileManager.noFiles')}</p>
            <p className="text-xs mt-1">{t('fileManager.uploadPrompt')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {files.map((file) => (
              <div
                key={file.filename}
                className={`p-3 hover:bg-gray-50 transition-colors ${
                  selectedFiles.includes(file.filename) ? 'bg-slate-50 border-l-4 border-slate-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.filename)}
                      onChange={() => handleFileToggle(file.filename)}
                      disabled={isLoading}
                      className="mr-3 rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:opacity-50"
                    />
                    <FileText className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {file.filename}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="mr-3">{formatDate(file.uploadedAt)}</span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFileDelete(file.filename)}
                    disabled={isLoading}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('fileManager.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IndexedDB使用に関する注記 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-start space-x-2">
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Database className="h-4 w-4 text-blue-600" />
            <Shield className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-xs text-gray-600 leading-relaxed">
            <p className="font-medium text-gray-700 mb-1">
              {t('fileManager.storageNote.title')}
            </p>
            <p className="mb-1">
              {t('fileManager.storageNote.description')}
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>{t('fileManager.storageNote.feature1')}</li>
              <li>{t('fileManager.storageNote.feature2')}</li>
              <li>{t('fileManager.storageNote.feature3')}</li>
              <li>{t('fileManager.storageNote.feature4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};