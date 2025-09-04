import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { TransactionModel } from '../models/Transaction';
const createCsvWriter = require('csv-writer');

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({ 
  dest: 'temp/',
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// CSV Import endpoint
router.post('/import', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const transactions: any[] = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to transaction fields
        const transaction = {
          description: row.description || row.Description,
          amount: parseFloat(row.amount || row.Amount || '0'),
          transaction_date: row.date || row.Date || row.transaction_date,
          type: (row.type || row.Type || '').toLowerCase() === 'income' ? 'income' : 'expense',
          category: row.category || row.Category,
          payment_method: row.payment_method || row['Payment Method'],
          tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : []
        };

        // Validate required fields
        if (transaction.description && transaction.amount && transaction.transaction_date) {
          transactions.push(transaction);
        }
      })
      .on('end', () => {
        // Clean up temp file
        fs.unlinkSync(filePath);

        res.json({
          message: 'CSV imported successfully',
          importedCount: transactions.length,
          transactions: transactions
        });
      })
      .on('error', (error) => {
        // Clean up temp file
        fs.unlinkSync(filePath);
        console.error('CSV parsing error:', error);
        res.status(500).json({ error: 'Failed to parse CSV file' });
      });

  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

// CSV Export endpoint
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get real transactions from database
    let transactions = await TransactionModel.getAll(userId);

    // Apply filters
    let filteredTransactions = transactions;

    if (startDate) {
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.transaction_date) >= new Date(startDate as string)
      );
    }

    if (endDate) {
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.transaction_date) <= new Date(endDate as string)
      );
    }

    if (type && type !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }

    if (category && category !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.category?.name === category);
    }

    // Format transactions for CSV export
    const csvTransactions = filteredTransactions.map(t => ({
      description: t.description,
      amount: t.amount,
      transaction_date: t.transaction_date,
      type: t.type,
      category: t.category?.name || 'Uncategorized',
      payment_method: t.payment_method || '',
      tags: Array.isArray(t.tags) ? t.tags.join(',') : t.tags || '',
      created_at: t.created_at
    }));

    // Create CSV file
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    const filepath = path.join(__dirname, '../../temp', filename);

    // Ensure temp directory exists
    const tempDir = path.dirname(filepath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'description', title: 'Description' },
        { id: 'amount', title: 'Amount' },
        { id: 'transaction_date', title: 'Date' },
        { id: 'type', title: 'Type' },
        { id: 'category', title: 'Category' },
        { id: 'payment_method', title: 'Payment Method' },
        { id: 'tags', title: 'Tags' },
        { id: 'created_at', title: 'Created At' }
      ]
    });

    await csvWriter.writeRecords(csvTransactions);

    // Send file and clean up
    res.download(filepath, filename, (error) => {
      if (error) {
        console.error('Error sending CSV file:', error);
      }
      // Clean up temp file
      fs.unlink(filepath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

export default router;