// Утилиты для адаптации файловых интерфейсов

export interface UploadedFile {
  file: File;
  uploadResponse?: any;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

// Адаптер для преобразования UploadedFile в File для обратной совместимости
export const extractFilesFromUploaded = (uploadedFiles: {
  tz_file: UploadedFile | null;
  kp_files: UploadedFile[];
  additional_files: UploadedFile[];
}): {
  tz_file: File | null;
  kp_files: File[];
  additional_files: File[];
} => {
  return {
    tz_file: uploadedFiles.tz_file?.file || null,
    kp_files: uploadedFiles.kp_files.map(uploaded => uploaded.file),
    additional_files: uploadedFiles.additional_files.map(uploaded => uploaded.file)
  };
};

// Адаптер для преобразования File в UploadedFile
export const wrapFilesAsUploaded = (files: {
  tz_file: File | null;
  kp_files: File[];
  additional_files: File[];
}): {
  tz_file: UploadedFile | null;
  kp_files: UploadedFile[];
  additional_files: UploadedFile[];
} => {
  return {
    tz_file: files.tz_file ? { file: files.tz_file } : null,
    kp_files: files.kp_files.map(file => ({ file })),
    additional_files: files.additional_files.map(file => ({ file }))
  };
};

// Проверка статуса загрузки файлов
export const getUploadStatus = (uploadedFiles: {
  tz_file: UploadedFile | null;
  kp_files: UploadedFile[];
  additional_files: UploadedFile[];
}) => {
  const allFiles = [
    ...(uploadedFiles.tz_file ? [uploadedFiles.tz_file] : []),
    ...uploadedFiles.kp_files,
    ...uploadedFiles.additional_files
  ];

  const uploading = allFiles.some(f => f.uploading);
  const hasErrors = allFiles.some(f => f.error);
  const allUploaded = allFiles.length > 0 && allFiles.every(f => !f.uploading && !f.error);

  return {
    uploading,
    hasErrors,
    allUploaded,
    totalFiles: allFiles.length,
    uploadedFiles: allFiles.filter(f => !f.uploading && !f.error).length,
    errorFiles: allFiles.filter(f => f.error).length
  };
};