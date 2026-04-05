
import { query, getClient } from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

class AuthService {
  // Registers a new user, creates their wallet, and initializes a merchant profile if applicable
  async register(userData) {
    const { name, phone, email, city, nid, epin, role } = userData;
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const epinHash = await hashPassword(epin);
      const userQuery = `
        INSERT INTO users (name, phone, email, city, nid, epin_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await client.query(userQuery, [name, phone, email, city, nid, epinHash, role, 'active']);

      const userIdResult = await client.query('SELECT LASTVAL() as id');
      const userId = userIdResult.rows[0].id;

      const userResult = await client.query(
        'SELECT user_id, name, phone, email, city, nid, role, status, created_at FROM users WHERE user_id = $1',
        [userId]
      );
      const user = userResult.rows[0];

      const walletType = role === 'agent' ? 'agent' : (role === 'merchant' ? 'merchant' : 'user');
      const walletInsertQuery = `
        INSERT INTO wallets (user_id, wallet_type, balance, status)
        VALUES ($1, $2, $3, $4)
      `;

      await client.query(walletInsertQuery, [userId, walletType, 0.00, 'active']);

      if (role === 'merchant') {
        const merchantProfileQuery = `
          INSERT INTO merchant_profiles (merchant_user_id, merchant_name, status)
          VALUES ($1, $2, 'inactive')
        `;
        await client.query(merchantProfileQuery, [userId, name]);
      }

      const walletIdResult = await client.query('SELECT LASTVAL() as id');
      const walletId = walletIdResult.rows[0].id;

      const walletResult = await client.query(
        'SELECT wallet_id, wallet_type, balance, status FROM wallets WHERE wallet_id = $1',
        [walletId]
      );
      const wallet = walletResult.rows[0];

      await client.query('COMMIT');

      const token = generateToken(user.user_id, user.role);

      return {
        user: {
          ...user,
          wallet: {
            ...wallet,
            balance: parseFloat(wallet.balance)
          }
        },
        token
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Authenticates a user via phone and ePin, handles failed attempts, and generates a JWT token
  async login(phone, epin) {
    try {
      const userQuery = `
          SELECT 
            u.user_id, u.name, u.phone, u.city, u.nid, u.epin_hash, u.role, u.status, u.try AS failed_attempts, u.created_at,
          w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status,
          mp.status as merchant_status, mp.subscription_expiry
        FROM users u
        JOIN wallets w ON u.user_id = w.user_id 
        LEFT JOIN merchant_profiles mp ON u.user_id = mp.merchant_user_id
        WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent', 'merchant')
      `;

      const result = await query(userQuery, [phone]);

      if (result.rows.length === 0) {
        throw new Error('Invalid phone number or ePin');
      }

      const user = result.rows[0];

      const normalizeTryCount = (raw) => {
        const parsed = typeof raw === 'number' ? raw : parseInt(raw, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      };
      const previousFailedAttempts = normalizeTryCount(user.failed_attempts);

      if (user.status !== 'active') {
        throw new Error('Account is not active. Please contact support.');
      }

      const isValidEpin = await comparePassword(epin, user.epin_hash);

      if (!isValidEpin) {
        const incrementResult = await query(
          'UPDATE users SET try = COALESCE(try, 0) + 1 WHERE user_id = $1 RETURNING try',
          [user.user_id]
        );
        
        const currentTry = normalizeTryCount(incrementResult.rows[0]?.try);

        if (currentTry >= 5) {
          // Use direct updates instead of relying on potentially missing stored procedures
          await query('UPDATE users SET status = $1 WHERE user_id = $2', ['frozen', user.user_id]);
          await query('UPDATE wallets SET status = $1 WHERE user_id = $2', ['frozen', user.user_id]);
          
          throw new Error('Account locked due to multiple failed login attempts. Please contact support.');
        }

        throw new Error('Invalid phone number or ePin');
      }

      if (previousFailedAttempts > 0) {
        await query('UPDATE users SET try = 0 WHERE user_id = $1', [user.user_id]);
      }

      const { epin_hash, failed_attempts, ...userData } = user;

      const token = generateToken(user.user_id, user.role);

      return {
        user: {
          user_id: userData.user_id,
          name: userData.name,
          phone: userData.phone,
          city: userData.city,
          nid: userData.nid,
          role: userData.role,
          status: userData.status,
          created_at: userData.created_at,
          wallet: {
            wallet_id: userData.wallet_id,
            wallet_type: userData.wallet_type,
            balance: parseFloat(userData.balance),
            status: userData.wallet_status
          },
          merchant_status: userData.merchant_status,
          subscription_expiry: userData.subscription_expiry
        },
        token
      };

    } catch (error) {
      throw error;
    }
  }

  
  // Retrieves a comprehensive user profile including wallet and merchant subscription details
  async getProfile(userId) {
    try {
      const profileQuery = `
        SELECT 
          u.user_id, u.name, u.phone, u.city, u.nid, u.role, u.status, u.created_at,
          w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status,
          mp.status as merchant_status, mp.subscription_expiry
        FROM users u
        JOIN wallets w ON u.user_id = w.user_id 
        LEFT JOIN merchant_profiles mp ON u.user_id = mp.merchant_user_id
        WHERE u.user_id = $1 AND w.wallet_type IN ('user', 'agent', 'merchant')
      `;

      const result = await query(profileQuery, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      return {
        user_id: user.user_id,
        name: user.name,
        phone: user.phone,
        city: user.city,
        nid: user.nid,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        wallet: {
          wallet_id: user.wallet_id,
          wallet_type: user.wallet_type,
          balance: parseFloat(user.balance),
          status: user.wallet_status
        },
        merchant_status: user.merchant_status,
        subscription_expiry: user.subscription_expiry
      };

    } catch (error) {
      throw error;
    }
  }

  // Verifies the current ePin and updates it to a new hashed value for the user
  async changePin(userId, oldPin, newPin) {
    try {
      const userResult = await query(
        'SELECT epin_hash FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      const isMatch = await comparePassword(oldPin, user.epin_hash);
      if (!isMatch) {
        throw new Error('Incorrect old PIN');
      }

      const newPinHash = await hashPassword(newPin);
      await query(
        'UPDATE users SET epin_hash = $1 WHERE user_id = $2',
        [newPinHash, userId]
      );

      return { message: 'PIN updated successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Updates personal user details such as name and city while ensuring data validity
  async updateProfile(userId, updates) {
    try {
      const { name, city } = updates;
      const fields = [];
      const values = [];

      if (name && name.trim().length > 0) {
        fields.push(`name = $${fields.length + 1}`);
        values.push(name.trim());
      }

      if (city && city.trim().length > 0) {
        fields.push(`city = $${fields.length + 1}`);
        values.push(city.trim());
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(userId);

      await query(
        `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${values.length}`,
        values
      );

      return this.getProfile(userId);
    } catch (error) {
      throw error;
    }
  }


  // Generates and emails a 6-digit OTP to the user for initiating the PIN reset process
  async forgotPassword(phone) {
    const userRes = await query(
      'SELECT user_id, name, email FROM users WHERE phone = $1',
      [phone]
    );

    if (userRes.rows.length === 0) {
      throw new Error('No account found with this phone number');
    }

    const user = userRes.rows[0];

    if (!user.email) {
      throw new Error('No email address registered for this account. Please contact support.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await query(
      'UPDATE users SET reset_otp = $1, reset_otp_expiry = $2 WHERE phone = $3',
      [otp, expiry, phone]
    );

    console.log(`[AUTH] Sending OTP via Gmail...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'whereisrobert1245@gmail.com',
        pass: 'pjxsksjubhsgirys',
      },
    });

    const info = await transporter.sendMail({
      from: '"ClickPay Security" <whereisrobert1245@gmail.com>',
      to: user.email,
      subject: 'ClickPay: Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your PIN</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your ClickPay PIN. Here is your 6-digit OTP:</p>
          <h1 style="background: #f4f4f5; padding: 16px; text-align: center; letter-spacing: 8px; font-size: 32px; color: #4f46e5; border-radius: 8px;">${otp}</h1>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log('[AUTH] OTP Email sent!');

    const [name, domain] = user.email.split('@');
    const maskedEmail = `${name.slice(0, 1)}***@${domain}`;

    return { 
      message: 'OTP sent successfully to your email.',
      maskedEmail
    };
  }

  // Validates the provided OTP against the stored record and checks for expiration
  async verifyResetOtp(phone, otp) {
    const res = await query(
      'SELECT reset_otp, reset_otp_expiry FROM users WHERE phone = $1',
      [phone]
    );

    if (res.rows.length === 0) throw new Error('User not found');
    const user = res.rows[0];

    if (!user.reset_otp || user.reset_otp !== otp) {
      throw new Error('Invalid OTP');
    }

    if (new Date() > new Date(user.reset_otp_expiry)) {
      throw new Error('OTP has expired. Please request a new one.');
    }

    return { success: true, message: 'OTP verified successfully' };
  }

  // Resets the user's ePin to a new value after successful OTP verification
  async resetPassword(phone, otp, newEpin) {
    await this.verifyResetOtp(phone, otp);

    const newPinHash = await hashPassword(newEpin);

    await query(
      'UPDATE users SET epin_hash = $1, reset_otp = NULL, reset_otp_expiry = NULL WHERE phone = $2',
      [newPinHash, phone]
    );

    return { message: 'PIN has been reset successfully. You can now log in.' };
  }
}


export default new AuthService();
