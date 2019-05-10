import Promise from "bluebird";
import mongoose from "mongoose";

/**
 * User Schema
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  encryptedCert: {
    type: String,
    required: true
  },
  encryptedKey: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
UserSchema.method({});

/**
 * Statics
 */
UserSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then(user => {
        if (user) {
          return user;
        }
        return Promise.reject(new Error("No such user exists!"));
      });
  },

  /**
   * Get user
   * @param {ObjectId} username - The username of user.
   * @returns {Promise<User>}
   */
  getByName(username) {
    return this.findOne({ username })
      .exec()
      .then(user => {
        if (user) {
          return user;
        }
        return null;
      });
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef User
 */
export default mongoose.model("User", UserSchema);
