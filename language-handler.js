// Ngôn ngữ mặc định
let currentLanguage = 'vi';

// Hàm thay đổi ngôn ngữ
function changeLanguage(lang) {
  currentLanguage = lang;
  document.documentElement.setAttribute('lang', lang);
  
  // Lưu ngôn ngữ được chọn vào localStorage
  localStorage.setItem('preferred-language', lang);
  
  // Cập nhật tất cả các phần tử có thuộc tính data-i18n
  updateLanguage();
}

// Hàm cập nhật văn bản cho tất cả các phần tử
function updateLanguage() {
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    
    // Lấy văn bản dịch từ đối tượng ngôn ngữ hiện tại
    let translation = '';
    switch(currentLanguage) {
      case 'en':
        translation = en[key] || '';
        break;
      case 'zh':
        translation = zh[key] || '';
        break;
      case 'ja':
        translation = ja[key] || '';
        break;
      default:
        // Ngôn ngữ mặc định là tiếng Việt, giữ nguyên nội dung
        return;
    }
    
    // Cập nhật nội dung nếu có bản dịch
    if (translation) {
      element.innerHTML = translation;
    }
  });
}

// Khi trang tải xong
document.addEventListener('DOMContentLoaded', function() {
  // Kiểm tra xem người dùng đã chọn ngôn ngữ trước đó chưa
  const savedLanguage = localStorage.getItem('preferred-language');
  
  if (savedLanguage) {
    // Đặt ngôn ngữ đã lưu
    currentLanguage = savedLanguage;
    document.getElementById('languageSelect').value = savedLanguage;
    
    // Chỉ cập nhật nếu không phải ngôn ngữ mặc định
    if (savedLanguage !== 'vi') {
      updateLanguage();
    }
  }
});
