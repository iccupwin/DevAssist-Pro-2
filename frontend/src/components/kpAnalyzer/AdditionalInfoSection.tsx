import React, { useState, useEffect } from 'react';
import { MessageSquare, Info, Save } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';

interface UploadedFile {
  id: string;
  originalName: string;
  filePath: string;
  extension: string;
  size: number;
  type: 'tz' | 'kp' | 'additional';
}

interface AdditionalInfoSectionProps {
  onFilesUpload: (files: UploadedFile[], type: 'tz' | 'kp' | 'additional') => void;
  onTextUpdate: (text: string) => void;
  uploadedFiles?: UploadedFile[];
  additionalText?: string;
}

export const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  onFilesUpload,
  onTextUpdate,
  uploadedFiles = [],
  additionalText = ''
}) => {
  const [textValue, setTextValue] = useState(additionalText);
  const [textSaved, setTextSaved] = useState(false);

  useEffect(() => {
    setTextValue(additionalText);
  }, [additionalText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextValue(e.target.value);
    setTextSaved(false);
  };

  const handleTextSave = () => {
    onTextUpdate(textValue);
    setTextSaved(true);
    setTimeout(() => setTextSaved(false), 2000);
  };

  const acceptedFiles = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
  };

  return (
    <div className="mt-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Дополнительная информация (опционально)
            </h3>
            <p className="text-sm text-gray-600">
              Загрузите дополнительные файлы или введите текст, который может быть релевантен для анализа
            </p>
          </div>
        </div>

        {/* Важное уведомление */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Дополнительная информация имеет существенный вес в рейтинге и общей оценке!
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Информация о предыдущем опыте, компетенциях и других важных факторах значительно влияет на итоговую оценку
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload Section */}
        <div className="lg:col-span-2">
          <FileUploadZone
            onFilesUpload={(files) => onFilesUpload(files, 'additional')}
            accept={acceptedFiles}
            multiple={true}
            type="additional"
            title="Дополнительные файлы"
            description="PDF, DOCX, TXT файлы"
            icon={<MessageSquare className="w-6 h-6 text-blue-600" />}
            uploadedFiles={uploadedFiles}
          />
        </div>

        {/* Text Input Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Текстовая информация
              </h4>
              {textValue.trim() && (
                <button
                  onClick={handleTextSave}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${textSaved 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                    }
                  `}
                  disabled={textSaved}
                >
                  <Save className="w-4 h-4" />
                  {textSaved ? 'Сохранено' : 'Сохранить'}
                </button>
              )}
            </div>

            <textarea
              value={textValue}
              onChange={handleTextChange}
              placeholder="Например: информация о предыдущем опыте поставщика, результаты проверки референсов, дополнительные требования, обсуждавшиеся вне ТЗ..."
              className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />

            {textValue.trim() && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  Текст будет учтен при анализе
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};