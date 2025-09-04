import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Category } from '../types';

const CSVManager: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all',
    category: 'all'
  });

  const categories = [
    { id: 1, name: 'Food & Dining' },
    { id: 2, name: 'Transportation' },
    { id: 3, name: 'Shopping' },
    { id: 4, name: 'Entertainment' },
    { id: 5, name: 'Bills & Utilities' },
    { id: 9, name: 'Salary' },
    { id: 10, name: 'Investment' },
  ];

  const handleImportCSV = async (file: File) => {
    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('/api/csv/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult(result);
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        error: error instanceof Error ? error.message : 'Import failed'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportCSV(file);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);

    try {
      const params = new URLSearchParams();
      if (exportFilters.startDate) params.append('startDate', exportFilters.startDate);
      if (exportFilters.endDate) params.append('endDate', exportFilters.endDate);
      if (exportFilters.type !== 'all') params.append('type', exportFilters.type);
      if (exportFilters.category !== 'all') params.append('category', exportFilters.category);

      const response = await fetch(`/api/csv/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const ImportModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Import Transactions</h3>
          <button
            onClick={() => {
              setShowImportModal(false);
              setImportResult(null);
            }}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!importResult ? (
            <>
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-2 text-lg font-medium text-gray-900">Upload CSV File</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Import your transactions from a CSV file
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-blue-900">Required Columns:</h5>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• <strong>Description</strong> - Transaction description</li>
                  <li>• <strong>Amount</strong> - Transaction amount (positive for income, negative for expenses)</li>
                  <li>• <strong>Date</strong> - Transaction date (YYYY-MM-DD)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-yellow-900">Optional Columns:</h5>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• <strong>Type</strong> - income or expense</li>
                  <li>• <strong>Category</strong> - Transaction category</li>
                  <li>• <strong>Payment Method</strong> - Payment method used</li>
                  <li>• <strong>Tags</strong> - Comma-separated tags</li>
                </ul>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select CSV File
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center">
              {importResult.error ? (
                <div className="space-y-4">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                  <div>
                    <h4 className="text-lg font-medium text-red-900">Import Failed</h4>
                    <p className="text-sm text-red-700 mt-1">{importResult.error}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <div>
                    <h4 className="text-lg font-medium text-green-900">Import Successful</h4>
                    <p className="text-sm text-green-700 mt-1">
                      {importResult.importedCount} transactions imported successfully
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t">
          <button
            onClick={() => {
              setShowImportModal(false);
              setImportResult(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const ExportModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Export Transactions</h3>
          <button
            onClick={() => setShowExportModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={exportFilters.startDate}
              onChange={(e) => setExportFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={exportFilters.endDate}
              onChange={(e) => setExportFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={exportFilters.type}
              onChange={(e) => setExportFilters(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={exportFilters.category}
              onChange={(e) => setExportFilters(prev => ({ ...prev, category: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t">
          <button
            onClick={() => setShowExportModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2 inline-block" />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Import & Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <Upload className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Import Transactions</h4>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file to import your transaction data
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </button>
          </div>

          <div className="text-center p-6 border border-gray-200 rounded-lg">
            <Download className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Export Transactions</h4>
            <p className="text-sm text-gray-600 mb-4">
              Download your transaction data as a CSV file
            </p>
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {showImportModal && <ImportModal />}
      {showExportModal && <ExportModal />}
    </>
  );
};

export default CSVManager;