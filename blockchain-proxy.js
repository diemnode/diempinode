<<<<<<< HEAD
/** 
 * Pi Network Blockchain Proxy Server
 *
 * Proxy server để kết nối với Pi Network API và cung cấp dữ liệu blockchain
 * cho website Diễm Node Pi.
 *
 * Bao gồm các tính năng:
 * - Xử lý lỗi mạnh mẽ
 * - Hệ thống cache thông minh
 * - Retry logic cho API calls
 * - Dữ liệu dự phòng khi API không phản hồi
 */

// Load biến môi trường từ file .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3000;
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_API_BASE_URL = process.env.PI_API_BASE_URL || 'https://api.minepi.com';

// Dữ liệu dự phòng khi API không phản hồi
const fallbackData = {
  'network-status': {
    mining_rewards: {
      total: 10554328661.146,
      distributed: 6860313629.745,
      locked: 5120820450.893,
      unlocked: 1739493178.852
    },
    supply: {
      circulating: 6860313629.745,
      effective_total: 10554328661.146
    }
  },
  'latest-transactions': [
    {
      id: 'sample-transaction-1',
      account: 'GBFX...6WGJ',
      amount: 62,
      type: 'Chuyển',
      status: 'Thành công',
      time: 'vài giây trước'
    },
    {
      id: 'sample-transaction-2',
      account: 'GDEE...4UJF',
      amount: 39.37,
      type: 'Chuyển',
      status: 'Thành công',
      time: '1 phút trước'
    }
  ],
  'latest-blocks': [
    {
      id: 'sample-block-1',
      timestamp: new Date().toISOString(),
      transactions: 15,
      time: 'vài giây trước'
    },
    {
      id: 'sample-block-2',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      transactions: 23,
      time: '1 phút trước'
    }
  ],
  'status': { 
    status: 'ok',
    api_version: '1.0',
    server_time: new Date().toISOString()
  }
};

// Bộ nhớ cache đơn giản
const cache = {
  data: {},
  timestamps: {},
  maxAge: 60000 // Thời gian cache tối đa: 1 phút
};

// Bật CORS cho tất cả các request
app.use(cors({
  origin: '*', // Cho phép tất cả các origin
  methods: ['GET', 'POST'], // Cho phép các phương thức HTTP
  allowedHeaders: ['Content-Type', 'Authorization'] // Cho phép các header
}));

// Middleware để log các request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Hàm kiểm tra xem dữ liệu cache còn hạn không
function isCacheValid(endpoint) {
  if (!cache.timestamps[endpoint]) return false;
  const now = Date.now();
  return (now - cache.timestamps[endpoint]) < cache.maxAge;
}

// Hàm nỗ lực thử lại khi gặp lỗi
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await axios(url, options);
    } catch (error) {
      console.error(`Lần thử ${attempt}/${maxRetries} không thành công: ${error.message}`);
      lastError = error;
      
      // Chờ một chút trước khi thử lại (tăng dần thời gian chờ)
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // 1s, 2s, 3s,...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Nếu tất cả các lần thử đều thất bại, ném ra lỗi cuối cùng
  throw lastError;
}

// Route: Kiểm tra server health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    api_key_configured: !!PI_API_KEY
  });
});

// Route: Trạng thái API
app.get('/api/status', async (req, res) => {
  const endpoint = 'status';
  
  // Sử dụng cache nếu có và còn hạn
  if (isCacheValid(endpoint)) {
    return res.json(cache.data[endpoint]);
  }
  
  try {
    const response = await fetchWithRetry(`${PI_API_BASE_URL}/v1/status`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    // Cập nhật cache
    cache.data[endpoint] = response.data;
    cache.timestamps[endpoint] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error(`[Error] Không thể xử lý yêu cầu trạng thái: ${error.message}`);
    
    // Sử dụng dữ liệu dự phòng
    res.json(fallbackData[endpoint] || { status: 'error', message: 'API không phản hồi' });
  }
});

// Route: Thông tin mạng lưới
app.get('/api/network-status', async (req, res) => {
  const endpoint = 'network-status';
  
  // Sử dụng cache nếu có và còn hạn
  if (isCacheValid(endpoint)) {
    return res.json(cache.data[endpoint]);
  }
  
  try {
    const response = await fetchWithRetry(`${PI_API_BASE_URL}/v1/network-status`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    // Cập nhật cache
    cache.data[endpoint] = response.data;
    cache.timestamps[endpoint] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error(`[Error] Không thể xử lý yêu cầu trong thời gian: ${error.message}`);
    
    // Sử dụng dữ liệu dự phòng
    res.json(fallbackData[endpoint] || { status: 'error', message: 'API không phản hồi' });
  }
});

// Route: Các giao dịch mới nhất
app.get('/api/transactions/latest', async (req, res) => {
  const endpoint = 'latest-transactions';
  
  // Sử dụng cache nếu có và còn hạn
  if (isCacheValid(endpoint)) {
    return res.json(cache.data[endpoint]);
  }
  
  try {
    const response = await fetchWithRetry(`${PI_API_BASE_URL}/v1/transactions/latest`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    // Cập nhật cache
    cache.data[endpoint] = response.data;
    cache.timestamps[endpoint] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error(`[Error] Không thể xử lý yêu cầu giao dịch: ${error.message}`);
    
    // Sử dụng dữ liệu dự phòng
    res.json(fallbackData[endpoint] || []);
  }
});

// Route: Các khối mới nhất
app.get('/api/blocks/latest', async (req, res) => {
  const endpoint = 'latest-blocks';
  
  // Sử dụng cache nếu có và còn hạn
  if (isCacheValid(endpoint)) {
    return res.json(cache.data[endpoint]);
  }
  
  try {
    const response = await fetchWithRetry(`${PI_API_BASE_URL}/v1/blocks/latest`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    // Cập nhật cache
    cache.data[endpoint] = response.data;
    cache.timestamps[endpoint] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error(`[Error] Không thể xử lý yêu cầu khối: ${error.message}`);
    
    // Sử dụng dữ liệu dự phòng
    res.json(fallbackData[endpoint] || []);
  }
});

// Route: Xử lý các API chung
app.get('/api/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  
  // Sử dụng cache nếu có và còn hạn
  if (isCacheValid(endpoint)) {
    return res.json(cache.data[endpoint]);
  }
  
  try {
    const response = await fetchWithRetry(`${PI_API_BASE_URL}/v1/${endpoint}`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    // Cập nhật cache
    cache.data[endpoint] = response.data;
    cache.timestamps[endpoint] = Date.now();
    
    res.json(response.data);
  } catch (error) {
    console.error(`[Error] Không thể xử lý yêu cầu ${endpoint}: ${error.message}`);
    
    // Sử dụng dữ liệu dự phòng nếu có
    if (fallbackData[endpoint]) {
      res.json(fallbackData[endpoint]);
    } else {
      res.status(500).json({ error: `Không thể lấy dữ liệu cho ${endpoint}` });
    }
  }
});

// Route: Trang chủ
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Pi Network Blockchain Proxy</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
          }
          h1 {
            color: #e14329;
          }
          .endpoint {
            background: #f4f4f4;
            padding: 10px;
            margin-bottom: 10px;
            border-left: 3px solid #e14329;
          }
        </style>
      </head>
      <body>
        <h1>Máy chủ Pi Blockchain Proxy</h1>
        <p>Proxy server đang chạy và sẵn sàng phục vụ các yêu cầu Pi Blockchain API.</p>
        
        <h2>Các Endpoints có sẵn:</h2>
        <div class="endpoint">GET /api/network-status</div>
        <div class="endpoint">GET /api/latest-transactions</div>
        <div class="endpoint">GET /api/latest-blocks</div>
        <div class="endpoint">GET /health</div>
        
        <p>Phát triển bởi Diễm Node Pi</p>
      </body>
    </html>
  `);
});

// Xử lý 404 - Không tìm thấy route
app.use((req, res) => {
  res.status(404).json({ error: 'Không tìm thấy endpoint' });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error('Lỗi server:', err);
  res.status(500).json({ error: 'Lỗi server nội bộ' });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`[Server] Máy chủ Pi Blockchain Proxy đang chạy tại http://localhost:${PORT}`);
  console.log('[Server] Endpoints có sẵn:');
  console.log('  - GET /api/network-status');
  console.log('  - GET /api/latest-transactions');
  console.log('  - GET /api/latest-blocks');
  console.log('  - GET /health');
});
=======
/** 
 * Pi Network Blockchain Proxy Server
 *
 * Proxy server để kết nối với Pi Network API và cung cấp dữ liệu blockchain
 * cho website Diễm Node Pi.
 *
 * Bao gồm các tính năng:
 * - Xử lý lỗi mạnh mẽ
 * - Hệ thống cache thông minh
 * - Retry logic cho API calls
 * - Dữ liệu dự phòng khi API không phản hồi
 */

// Load biến môi trường từ file .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3000;
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_API_BASE_URL = process.env.PI_API_BASE_URL || 'https://api.minepi.com';

// Dữ liệu dự phòng khi API không phản hồi
const fallbackData = {
  'network-status': {
    mining_rewards: {
      total: 10554328661.146,
      distributed: 6860313629.745,
      locked: 5120820450.893,
      unlocked: 1739493178.852
    },
    supply: {
      circulating: 6860313629.745,
      effective_total: 10554328661.146
    }
  },
  'latest-transactions': [
    {
      id: 'sample-transaction-1',
      account: 'GBFX...6WGJ',
      amount: 62,
      type: 'Chuyển',
      status: 'Thành công',
      time: 'vài giây trước'
    },
    {
      id: 'sample-transaction-2',
      account: 'GDEE...4UJF',
      amount: 39.37,
      type: 'Chuyển',
      status: 'Thành công',
      time: '1 phút trước'
    }
  ],
  'latest-blocks': [
    {
      id: 'sample-block-1',
      timestamp: new Date().toISOString(),
      transactions: 15,
      time: 'vài giây trước'
    },
    {
      id: 'sample-block-2',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      transactions: 23,
      time: '1 phút trước'
    }
  ],
  'status': { 
    status: 'ok',
    api_version: '1.0',
    server_time: new Date().toISOString()
  }
};

// Bộ nhớ cache đơn giản
const cache = {
  data: {},
  timestamps: {},
  maxAge: 60000 // Thời gian cache tối đa: 1 phút
};

// Bật CORS cho tất cả các request
app.use(cors({
  origin: '*', // Cho phép tất cả các origin
  methods: ['GET', 'POST'], // Cho phép các phương thức HTTP
  allowedHeaders: ['Content-Type', 'Authorization'] // Cho phép các header
}));

// Middleware để log các request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Hàm kiểm tra xem dữ liệu cache còn hạn không
function isCacheValid(endpoint) {
  if (!cache.timestamps[endpoint]) return false;
  const now = Date.now();
  return (now - cache.timestamps[endpoint]) < cache.maxAge;
}

// Hàm nỗ lực thử lại khi gặp lỗi
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await axios(url, options);
    } catch (error) {
      console.error(`Lần thử ${attempt}/${maxRetries} không thành công: ${error.message}`);
      lastError = error;
      
      // Chờ một chút trước khi thử lại (tăng dần thời gian chờ)
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // 1s, 2s, 3s,...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Nếu tất cả các lần thử đều thất bại, ném ra lỗi cuối cùng
  throw lastError;
}

