export const testUsers = {
  admin: {
    email: 'admin@alliance-courtage.fr',
    password: process.env.ADMIN_PASSWORD || 'admin-password',
    role: 'admin'
  },
  regularUser: {
    email: 'hamza@test.com',
    password: 'Hamza1234..',
    role: 'user'
  },
  newUser: {
    email: 'nouvel-user@test.fr',
    password: 'temp-password',
    mustChangePassword: true
  },
  thierinvest: {
    email: 'laurent.serre@thierinvest-conseils.fr',
    password: process.env.THIERVINVEST_PASSWORD || 'password123',
    denomination_sociale: 'THIERINVEST CONSEILS'
  },
  lsConseil: {
    email: 'lsconseil75@gmail.com',
    password: process.env.LS_CONSEIL_PASSWORD || 'password123',
    denomination_sociale: 'LS CONSEIL'
  }
};

export const testData = {
  baseURL: process.env.BASE_URL || 'http://localhost:5173',
  apiURL: process.env.API_URL || 'http://localhost:3001',
};

