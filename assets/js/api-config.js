/* AutoWash Pro - API configuration
   useMock: false = gọi Spring Boot thật (lưu vào SQL Server)
   useMock: true  = chỉ demo trên localStorage (không vào DB) */
window.AutoWashConfig = {
  baseUrl: 'http://localhost:8080',
  useMock: false
};
