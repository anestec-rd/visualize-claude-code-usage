import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { fileStorage, StoredFile } from '../utils/fileStorage';

interface FileUploadProps {
  onFileLoad: () => void;
  isLoading: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoad, isLoading, error }) => {
  const { language, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    uploading: boolean;
    success: string[];
    errors: string[];
  }>({
    uploading: false,
    success: [],
    errors: []
  });

  const processFiles = async (files: FileList) => {
    setUploadStatus({ uploading: true, success: [], errors: [] });
    
    const successFiles: string[] = [];
    const errorFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.json')) {
        errorFiles.push(`${file.name}: ${t('fileUpload.notJsonl')}`);
        continue;
      }

      try {
        const content = await readFileContent(file);
        
        // ファイル内容の簡単な検証
        const lines = content.trim().split('\n');
        let validLines = 0;
        let hasUsageData = false;
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              validLines++;
              
              // Claudeセッションログ形式かチェック
              if (parsed.type === 'assistant' && parsed.message && parsed.message.usage) {
                hasUsageData = true;
              }
              // 標準的なccusage形式かチェック
              else if (parsed.input_tokens !== undefined || parsed.output_tokens !== undefined) {
                hasUsageData = true;
              }
              // OpenAI API形式かチェック
              else if (parsed.usage && (parsed.usage.prompt_tokens || parsed.usage.completion_tokens)) {
                hasUsageData = true;
              }
            } catch {
              // 無効な行はスキップ
            }
          }
        }

        if (validLines === 0) {
          errorFiles.push(`${file.name}: ${t('fileUpload.noValidData')}`);
          continue;
        }

        if (!hasUsageData) {
          errorFiles.push(`${file.name}: ${t('fileUpload.noUsageData')}`);
          continue;
        }

        const storedFile: StoredFile = {
          filename: file.name,
          content: content,
          uploadedAt: new Date(),
          size: file.size
        };

        await fileStorage.saveFile(storedFile);
        successFiles.push(file.name);
        
      } catch (err) {
        errorFiles.push(`${file.name}: ${err instanceof Error ? err.message : t('fileUpload.processingError')}`);
      }
    }

    setUploadStatus({
      uploading: false,
      success: successFiles,
      errors: errorFiles
    });

    // 成功したファイルがある場合、全ファイルを再読み込み
    if (successFiles.length > 0) {
      onFileLoad();
    }

    // 3秒後にステータスをクリア
    setTimeout(() => {
      setUploadStatus({ uploading: false, success: [], errors: [] });
    }, 3000);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error(t('fileUpload.readError')));
      reader.readAsText(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // input要素をリセット（同じファイルを再選択可能にする）
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const isProcessing = isLoading || uploadStatus.uploading;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center mb-3">
        <FileText className="h-5 w-5 text-slate-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">{t('fileUpload.title')}</h3>
      </div>
      
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* アップロード結果 */}
      {(uploadStatus.success.length > 0 || uploadStatus.errors.length > 0) && (
        <div className="mb-3 space-y-2">
          {uploadStatus.success.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <div className="flex items-center mb-1">
                <CheckCircle className="h-4 w-4 text-slate-600 mr-2" />
                <span className="text-sm font-medium text-slate-800">
                  {uploadStatus.success.length}{t('fileUpload.filesUploaded')}
                </span>
              </div>
              <ul className="text-xs text-slate-700 ml-6">
                {uploadStatus.success.map((filename, index) => (
                  <li key={index}>• {filename}</li>
                ))}
              </ul>
            </div>
          )}
          
          {uploadStatus.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center mb-1">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  {uploadStatus.errors.length}{t('fileUpload.errorsOccurred')}
                </span>
              </div>
              <ul className="text-xs text-red-700 ml-6">
                {uploadStatus.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isProcessing 
            ? 'border-gray-300 bg-gray-50' 
            : 'border-gray-300 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jsonl,.json"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
        ) : (
          <Plus className="h-8 w-8 mx-auto mb-2 text-gray-500" />
        )}
        
        {uploadStatus.uploading ? (
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('fileUpload.processing')}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-slate-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        ) : isLoading ? (
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('fileUpload.analyzing')}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-slate-600 h-2 rounded-full animate-pulse" style={{ width: '80%' }}></div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-1">
              {t('fileUpload.dragDrop')}
            </p>
            <p className="text-xs text-gray-500">
              {language === 'ja' ? 'または' : 'or'}<span className="text-slate-600 font-medium">{t('fileUpload.clickToSelect')}</span>
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <p>• <strong>{language === 'ja' ? '対応形式:' : 'Supported formats:'}</strong> {t('fileUpload.supportedFormats')}</p>
        <p>• {t('fileUpload.multipleFiles')}</p>
        <p>• {t('fileUpload.overwrite')}</p>
        <p>• {t('fileUpload.persistent')}</p>
        <p>• {t('fileUpload.noExternal')}</p>
      </div>
    </div>
  );
};