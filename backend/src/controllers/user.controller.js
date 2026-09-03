const { UserModel } = require('../models');
const { sendSuccess } = require('../utils/response');

const UserController = {
  /**
   * Get list of all registered users (id, name, email)
   * GET /api/users
   */
  async getUsers(req, res, next) {
    try {
      const users = await UserModel.findAllUsers();
      return sendSuccess(res, { users, total: users.length }, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = UserController;
