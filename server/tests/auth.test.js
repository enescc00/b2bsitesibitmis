const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Test kullanıcı bilgileri
const testUser = { email: 'test@example.com', password: '123456' };

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Test DB bağlantısı
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('giriş başarısız (kullanıcı yok)', async () => {
    const res = await request(app)
      .post('/api/users/auth/login')
      .send(testUser);
    expect(res.statusCode).toBe(401);
  });
});
