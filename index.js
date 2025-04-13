const express = require('express');
const cors = require('cors');

const app = express();

// Sử dụng middleware
app.use(cors());
app.use(express.json());

// Route chính
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// API: Lấy danh sách sản phẩm
app.get('/api/products', (req, res) => {
    const products = [
        { id: 1, name: 'Pi Node Basic', price: 7000000 },
        { id: 2, name: 'Pi Node Advanced', price: 15000000 }
    ];
    res.json(products);
});

// API: Gửi thông tin liên hệ
app.post('/api/contact', (req, res) => {
    const { name, message } = req.body;
    res.json({ status: 'success', name, message });
});

// Khởi chạy server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
const axios = require('axios');

// Thực hiện một yêu cầu GET đến API thử nghiệm
axios.get('https://jsonplaceholder.typicode.com/posts')
    .then(response => {
        console.log(response.data); // Hiển thị dữ liệu trả về từ API
    })
    .catch(error => {
        console.error('Error:', error); // Xử lý lỗi nếu có
    });