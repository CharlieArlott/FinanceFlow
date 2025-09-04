import express from 'express';
const jwt = require('jsonwebtoken');
import bcrypt from 'bcryptjs';
import pool from '../models/database';
import { authenticateToken } from '../middleware/auth';
import { UserModel, UserRegistrationData, UserLoginData } from '../models/User';

const router = express.Router();

console.log('Auth routes module loaded');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register new user  
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, first_name, last_name }: UserRegistrationData = req.body;

    // Validation
    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required' 
      });
    }

    if (!password) {
      return res.status(400).json({ 
        error: 'Password is required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Email validation (if provided)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Please provide a valid email address' 
        });
      }
    }

    // Check if username already exists
    const existingUserByUsername = await UserModel.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(409).json({ 
        error: 'Username is already taken' 
      });
    }

    // Check if email already exists (if email is provided)
    if (email) {
      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({ 
          error: 'User with this email already exists' 
        });
      }
    }

    // Create new user
    const newUser = await UserModel.create({
      email,
      password,
      username,
      first_name,
      last_name
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : error);
    res.status(500).json({ 
      error: 'Failed to register user. Please try again.' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password }: UserLoginData = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    // Find user by username
    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Validate password
    const isPasswordValid = await UserModel.validatePassword(password, user.password_hash!);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login. Please try again.' 
    });
  }
});

// Get current user profile (requires authentication)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    // Get user profile
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid access token' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to fetch profile' 
    });
  }
});

// Verify token endpoint
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    // Check if user still exists
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'User no longer exists' 
      });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      valid: false,
      error: 'Invalid or expired token' 
    });
  }
});

// Update password
router.put('/update-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters long'
      });
    }

    // Get current user with password
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get user with password for validation
    const userWithPassword = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userWithPassword.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const fullUser = userWithPassword.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await UserModel.validatePassword(currentPassword, fullUser.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const updateQuery = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await pool.query(updateQuery, [hashedNewPassword, userId]);

    res.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({
      error: 'Failed to update password. Please try again.'
    });
  }
});

// Update user profile
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, username } = req.body;
    const userId = req.user!.id;

    // Get current user
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Validation
    if (email && email !== currentUser.email) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Please provide a valid email address' 
        });
      }

      // Check if email is already taken by another user
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ 
          error: 'Email is already taken by another user' 
        });
      }
    }

    if (username && username !== currentUser.username) {
      // Check if username is already taken by another user
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ 
          error: 'Username is already taken by another user' 
        });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      updateValues.push(first_name);
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      updateValues.push(last_name);
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(email);
    }

    if (username !== undefined) {
      updateFields.push(`username = $${paramCount++}`);
      updateValues.push(username);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    // Add updated_at and user ID
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    // Update user profile in database
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await pool.query(updateQuery, updateValues);

    // Get updated user data
    const updatedUser = await UserModel.findById(userId);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser!.id,
        username: updatedUser!.username,
        email: updatedUser!.email,
        first_name: updatedUser!.first_name,
        last_name: updatedUser!.last_name
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile. Please try again.'
    });
  }
});

export default router;