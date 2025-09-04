import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, Eye, Trash2 } from 'lucide-react';
import { useNotification } from './NotificationSystem';

const API_BASE_URL = 'http://localhost:3001/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface ReceiptFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
}

interface ReceiptUploadProps {
  onReceiptUploaded?: (file: ReceiptFile) => void;
  existingReceipt?: string;
  onReceiptDeleted?: () => void;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ 
  onReceiptUploaded, 
  existingReceipt,
  onReceiptDeleted 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<ReceiptFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess } = useNotification();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showError('Invalid file type', 'Please upload only image or PDF files');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showError('File too large', 'File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch(`${API_BASE_URL}/receipts/upload`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const uploadedFile = result.file;
      
      setUploadedFile(uploadedFile);
      onReceiptUploaded?.(uploadedFile);
      showSuccess('Receipt uploaded', 'Receipt has been uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Upload failed', 'Failed to upload receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReceipt = async (filename: string) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/receipts/${filename}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setUploadedFile(null);
      onReceiptDeleted?.();
      showSuccess('Receipt deleted', 'Receipt has been deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      showError('Delete failed', 'Failed to delete receipt. Please try again.');
    }
  };

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (mimetype === 'application/pdf') {
      return <File className="h-8 w-8 text-red-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const currentFile = uploadedFile || (existingReceipt ? { 
    filename: existingReceipt.split('/').pop() || '', 
    originalname: 'Existing Receipt',
    mimetype: 'image/jpeg',
    size: 0,
    url: existingReceipt 
  } : null);

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleChange}
        className="hidden"
      />

      {!currentFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileInput}
        >
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Images or PDF files up to 5MB
              </p>
            </div>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(currentFile.mimetype)}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {currentFile.originalname}
                </p>
                {currentFile.size > 0 && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(currentFile.size)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(currentFile.url, '_blank');
                }}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="View receipt"
                type="button"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteReceipt(currentFile.filename);
                }}
                className="text-red-600 hover:text-red-800 p-1"
                title="Delete receipt"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;