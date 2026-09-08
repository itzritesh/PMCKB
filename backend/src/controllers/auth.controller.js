const bcrypt = require('bcryptjs');
const { UserModel } = require('../models');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

// Email regex pattern for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required fields.', 400);
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email.trim())) {
      return sendError(res, 'Please provide a valid email address.', 400);
    }

    // Validate password complexity
    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    // Check for existing user with identical email
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 409);
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const newUser = await UserModel.create({
      name,
      email,
      passwordHash,
    });

    // Auto-create default personal workspace for new user
    try {
      const { TeamModel } = require('../models');
      await TeamModel.create({
        name: `${newUser.name}'s Workspace`,
        description: 'Personal workspace',
        createdBy: newUser.id,
      });
    } catch (teamErr) {
      console.warn('Auto-provisioning workspace warning:', teamErr.message);
    }

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    return sendSuccess(
      res,
      {
        user: newUser,
        token,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login an existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }

    // Lookup user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // Compare provided password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    // Return sanitized user details (omitting password hash)
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    };

    return sendSuccess(
      res,
      {
        user: userProfile,
        token,
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    return sendSuccess(res, { user }, 'User profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
