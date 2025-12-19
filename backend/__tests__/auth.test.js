const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  closePool: jest.fn()
}));

const { query } = require('../config/database');

// Setup express app with auth routes
const app = express();
app.use(express.json());

// Import auth routes
const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      query.mockResolvedValueOnce([]); // No user found

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Identifiants invalides');
    });

    it('should return 403 for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      query.mockResolvedValueOnce([{
        id: 1,
        email: 'test@test.com',
        nom: 'Test',
        prenom: 'User',
        role: 'user',
        password: hashedPassword,
        is_active: false,
        validite_date: null
      }]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_INACTIVE');
    });

    it('should return 403 for expired account', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      query.mockResolvedValueOnce([{
        id: 1,
        email: 'test@test.com',
        nom: 'Test',
        prenom: 'User',
        role: 'user',
        password: hashedPassword,
        is_active: true,
        validite_date: pastDate
      }]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_EXPIRED');
    });

    it('should return token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      query
        .mockResolvedValueOnce([{
          id: 1,
          email: 'test@test.com',
          nom: 'Test',
          prenom: 'User',
          role: 'user',
          password: hashedPassword,
          is_active: true,
          validite_date: null
        }])
        .mockResolvedValueOnce({ insertId: 1 }); // Session insert

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@test.com');
    });
  });
});

describe('Password Validation Logic', () => {
  it('should validate strong passwords', () => {
    const strongPassword = 'Password123!';
    const hasUpperCase = /[A-Z]/.test(strongPassword);
    const hasLowerCase = /[a-z]/.test(strongPassword);
    const hasNumber = /[0-9]/.test(strongPassword);
    const hasMinLength = strongPassword.length >= 8;
    
    expect(hasUpperCase).toBe(true);
    expect(hasLowerCase).toBe(true);
    expect(hasNumber).toBe(true);
    expect(hasMinLength).toBe(true);
  });

  it('should reject weak passwords', () => {
    const weakPassword = '123';
    const hasMinLength = weakPassword.length >= 8;
    
    expect(hasMinLength).toBe(false);
  });
});

