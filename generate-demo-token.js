import jwt from 'jsonwebtoken';

// 使用与 authService 相同的密钥
const JWT_SECRET = 'onekeyrelease-secret-key';
const JWT_EXPIRES_IN = '7d';

// 生成演示用户的 token
const demoUserId = 'demo-1234567890';
const token = jwt.sign(
  {
    userId: demoUserId,
    iat: Math.floor(Date.now() / 1000),
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

console.log('演示 Token:');
console.log(token);
console.log('\n可以在测试时使用这个 token 作为 Authorization 头');
