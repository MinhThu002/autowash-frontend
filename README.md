# AutoWash Pro - Frontend

Frontend cho **AutoWash Pro** - Hệ thống quản lý rửa xe tự động thông minh với
đặt lịch trước, chương trình tích điểm (loyalty) và quản lý khuyến mãi.

Toàn bộ giao diện là **static HTML/CSS/JS** (không cần framework, không cần
backend). Dữ liệu mẫu được nạp từ `assets/js/mock-data.js` và lưu trên
`localStorage` của trình duyệt.

## Tech stack

- HTML5 / CSS3 / Vanilla JavaScript (không build, không bundler)
- Lưu trữ phía client bằng `localStorage` (prefix `autowash_`)
- Script Node.js tùy chọn (`build-pages.cjs`) để tái tạo các trang dashboard

## Cấu trúc thư mục

```
.
├── index.html                 # Landing page
├── login.html                 # Đăng nhập
├── register.html              # Đăng ký
│
├── customer-dashboard.html    # Dashboard khách hàng
├── customer-vehicles.html     # Quản lý xe
├── booking.html               # Đặt lịch rửa xe
├── booking-history.html       # Lịch sử đặt lịch
├── loyalty.html               # Chương trình tích điểm
├── promotions.html            # Khuyến mãi
│
├── admin-dashboard.html       # Dashboard quản trị
├── admin-customers.html       # Quản lý khách hàng
├── admin-bookings.html        # Quản lý booking
├── admin-services.html        # Quản lý dịch vụ
├── admin-loyalty-tiers.html   # Cấu hình hạng thành viên
├── admin-promotions.html      # Quản lý khuyến mãi
├── admin-analytics.html       # Báo cáo / phân tích
│
├── staff-schedule.html        # Lịch làm việc của nhân viên
│
├── build-pages.cjs            # Script Node sinh lại các trang dashboard
│
└── assets/
    ├── css/
    │   ├── style.css          # Style chính (landing + auth + components)
    │   ├── dashboard.css      # Style cho layout dashboard (sidebar, navbar)
    │   └── responsive.css     # Media queries
    ├── js/
    │   ├── mock-data.js       # MOCK_DATA + helpers (currency, badge, storage)
    │   ├── main.js            # Auth, sidebar, toast, filter, requireAuth
    │   ├── dashboard.js       # Renderer cho từng trang (data-page)
    │   ├── booking.js         # Logic form đặt lịch
    │   └── modal.js           # Mở/đóng modal
    └── images/
```

## Các vai trò người dùng

`assets/js/main.js` quyết định vai trò dựa trên email khi đăng nhập:

| Vai trò    | Cách đăng nhập (demo)   | Trang sau đăng nhập       |
| ---------- | ----------------------- | ------------------------- |
| Customer   | email bất kỳ            | `customer-dashboard.html` |
| Admin      | email chứa `admin`      | `admin-dashboard.html`    |
| Staff      | email chứa `staff`      | `staff-schedule.html`     |

Tài khoản demo gợi ý (mật khẩu bất kỳ khi mock):
- Customer: `vana@gmail.com` (hoặc `thib@gmail.com`)
- Admin: `admin` (Manager)
- Staff: `staff1`

## Tính năng chính

- **Landing page** giới thiệu dịch vụ, gói rửa, hạng thành viên
- **Đăng ký / Đăng nhập** lưu user vào `localStorage` (`autowash_user`)
- **Customer**
  - Dashboard: điểm tích lũy, tổng lượt rửa, tiến độ lên hạng, lịch hẹn sắp tới
  - Quản lý xe (thêm/sửa/xóa qua modal)
  - Đặt lịch theo khung giờ + áp dụng khuyến mãi + tự tính giảm hạng / điểm
  - Lịch sử đặt lịch có lọc theo trạng thái/ngày
  - Loyalty: hiển thị hạng, lịch sử điểm, đổi quà
  - Khuyến mãi đang hoạt động
- **Admin**
  - Dashboard tổng quan, doanh thu, KH theo hạng
  - CRUD: khách hàng, booking, dịch vụ, hạng thành viên, khuyến mãi
  - Analytics: doanh thu, xu hướng booking, top KH, top dịch vụ
- **Staff**
  - Xem lịch rửa xe trong ngày

## Hạng thành viên (mock)

| Hạng     | Lượt rửa | Chi tiêu | Pt rate | Cửa sổ đặt | Priority |
| -------- | -------- | -------- | ------- | ---------- | -------- |
| Member   | 0        | 0đ       | 1.0x    | 7 ngày     | 1        |
| Silver   | 10       | 2M       | 1.2x    | 10 ngày    | 2        |
| Gold     | 20       | 5M       | 1.5x    | 12 ngày    | 3        |
| Platinum | 40       | 10M      | 2.0x    | 14 ngày    | 4        |

Giảm giá/quyền lợi lấy từ bảng **Perk** + **TierPerk** (không gắn trực tiếp trên LoyaltyTier).

## Cách chạy

Project là static site, chỉ cần mở file `index.html` bằng trình duyệt.

```powershell
start index.html
```

Để tránh lỗi CORS hoặc đường dẫn tương đối, nên phục vụ qua HTTP server:

```powershell
# Python 3
python -m http.server 8080

# hoặc Node.js
npx serve .
```

Sau đó truy cập http://localhost:8080.

## Tái tạo các trang dashboard

Đa số trang dashboard (`customer-*`, `admin-*`, `booking*`, `loyalty.html`,
`promotions.html`, `staff-schedule.html`, `register.html`) được sinh bởi
`build-pages.cjs`. Khi cần chỉnh layout/sidebar/navbar dùng chung, sửa script
rồi chạy:

```powershell
node build-pages.cjs
```

Script sẽ ghi đè các file HTML tương ứng trong thư mục gốc.

## Reset dữ liệu

Mock data được nạp vào `localStorage` lần đầu (`autowash_schema_version = db-v2`). Để
nạp lại từ đầu, mở DevTools console và chạy:

```js
localStorage.clear();
location.reload();
```
