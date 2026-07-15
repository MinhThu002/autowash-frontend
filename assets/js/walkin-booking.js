document.addEventListener("DOMContentLoaded", () => {
  // 1. Khởi tạo giá trị mặc định
  const dateInput = document.getElementById("date");
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  dateInput.value = `${yyyy}-${mm}-${dd}`; // Mặc định là ngày hôm nay

  dateInput.readOnly = true; // Khóa không cho nhập/sửa dữ liệu trực tiếp
  dateInput.style.pointerEvents = "none"; // Chặn hoàn toàn việc click mở hộp thoại lịch (datepicker)
  dateInput.style.backgroundColor = "#e9ecef"; //Làm mờ ô nhập để người dùng biết là ô bị khóa
  // 2. Load danh sách dịch vụ (Gọi API thật v1/services)
  loadServicesDropdown();

  // 3. Lắng nghe sự kiện BLUR để tự động điền thông tin Khách hàng qua Email
  const emailInput = document.getElementById("email");
  emailInput.addEventListener("blur", async () => {
    const email = emailInput.value.trim();
    if (!email) return;

    try {
      // Lấy Token đồng bộ theo cấu trúc của file main.js
      const userStr = localStorage.getItem("autowash_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      // Gọi trực tiếp API localhost
      const response = await fetch(
        `http://localhost:8080/api/customers/walk-in?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Dữ liệu khách hàng trả về từ API:", data);

        // Nếu response tồn tại và có dữ liệu họ tên (Đã đăng ký tài khoản)
        if (data && data.fullName) {
          document.getElementById("fullName").value = data.fullName;
          document.getElementById("phoneNumber").value = data.phoneNumber || "";
        } else {
          // Nếu response trả về null hoặc object rỗng (Chưa đăng ký)
          resetCustomerFields();
        }
      } else {
        // Xử lý khi API trả về các lỗi như 404 Not Found hoặc lỗi khác
        resetCustomerFields();
        console.log(
          `Email chưa được đăng ký hoặc lỗi hệ thống (Status: ${response.status})`,
        );
      }
    } catch (error) {
      console.error("Lỗi hệ thống khi tìm kiếm khách hàng:", error);
      resetCustomerFields();
    }
  });
  function resetCustomerFields() {
    document.getElementById("fullName").value = "";
    document.getElementById("phoneNumber").value = "";
  }

  // 4. Lắng nghe sự kiện BLUR để tự động điền thông tin Xe
  const licensePlateInput = document.getElementById("licensePlate");
  licensePlateInput.addEventListener("blur", async () => {
    const plate = licensePlateInput.value.trim();
    if (!plate) return;

    try {
      // Lấy Token đồng bộ từ localStorage theo cấu trúc của hệ thống
      const userStr = localStorage.getItem("autowash_user");
      const token = userStr ? JSON.parse(userStr).token : "";

      // Gọi API GET theo đúng định dạng Swagger trong ảnh của bạn
      const response = await fetch(
        `http://localhost:8080/api/vehicles/walk-in?licensePlate=${encodeURIComponent(plate)}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      if (response.ok) {
        // Đọc dữ liệu dưới dạng text để kiểm tra xem response trả về null/trống hay không
        const text = await response.text();

        if (!text || text.trim() === "null" || text.trim() === "") {
          console.log("Biển số xe chưa được đăng ký. Khách hàng phải tự điền.");
          resetVehicleFields();
          return;
        }

        const data = JSON.parse(text);

        // Nếu API trả về dữ liệu xe (Đã đăng ký tài khoản trước đó)
        if (data && data.brand) {
          document.getElementById("brand").value = data.brand;
          document.getElementById("color").value = data.color;
          if (data.vehicleType) {
            document.getElementById("vehicleType").value = data.vehicleType;
          }
        } else {
          resetVehicleFields();
        }
      } else {
        // Xử lý khi API trả về các lỗi như 404 Not Found hoặc lỗi khác (Xem như xe mới)
        resetVehicleFields();
        console.log(
          `Không tìm thấy xe hoặc lỗi hệ thống (Status: ${response.status})`,
        );
      }
    } catch (error) {
      console.error("Lỗi hệ thống khi tìm kiếm thông tin xe:", error);
      resetVehicleFields();
    }
  });

  function resetVehicleFields() {
    document.getElementById("brand").value = "";
    document.getElementById("color").value = "";
    document.getElementById("vehicleType").value = "small"; // Đặt lại về giá trị mặc định đầu tiên
  }

  // 5. Lắng nghe sự kiện thay đổi Dịch vụ hoặc Ngày để lấy khung giờ trống[cite: 48]
  document
    .getElementById("washServiceId")
    .addEventListener("change", fetchAvailableSlots);
  document
    .getElementById("date")
    .addEventListener("change", fetchAvailableSlots);

  // 6. Xử lý Submit Form để tạo Walk-in Booking[cite: 48]
  const walkinForm = document.getElementById("walkinForm");
  if (walkinForm) {
    walkinForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // 1. Kiểm tra xem nhân viên đã chọn khung giờ (slotId) chưa
      const selectedSlot = document.querySelector(
        'input[name="slotId"]:checked',
      );
      if (!selectedSlot) {
        alert(
          "Vui lòng chọn một khung giờ trống trước khi tiến hành đặt lịch!",
        );
        return;
      }

      // 2. Thu thập và chuẩn hóa dữ liệu từ form nhập liệu
      const emailValue = document.getElementById("email").value.trim();
      const payload = {
        walkInCustomerName: document.getElementById("fullName").value.trim(),
        walkInPhoneNumber: document.getElementById("phoneNumber").value.trim(),
        email: emailValue !== "" ? emailValue : null, // Gửi null nếu không nhập email
        licensePlate: document.getElementById("licensePlate").value.trim(),
        vehicleType: document.getElementById("vehicleType").value,
        brand: document.getElementById("brand").value.trim(),
        color: document.getElementById("color").value.trim(),
        slotId: parseInt(selectedSlot.value),
        washServiceId: parseInt(document.getElementById("washServiceId").value),
      };

      // 3. Thay đổi trạng thái nút Submit (Tránh người dùng bấm liên tục nhiều lần)
      const btnSubmit = document.getElementById("btnSubmitWalkin");
      const originalBtnText = btnSubmit.innerText;
      btnSubmit.disabled = true;
      btnSubmit.innerText = "Đang xử lý tạo lịch...";

      try {
        // Lấy baseUrl từ cấu hình hệ thống hoặc fallback về localhost:8080
        const baseUrl =
          typeof API_URL !== "undefined" ? API_URL : "http://localhost:8080";

        // Lấy token xác thực của nhân viên/quản trị viên từ localStorage
        const userStr = localStorage.getItem("autowash_user");
        const token = userStr ? JSON.parse(userStr).token : "";

        // 4. Gửi Request POST lên API Endpoint tạo Walk-in Booking
        const response = await fetch(`${baseUrl}/api/v1/bookings/walk-in`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.message || "Không thể tạo lịch đặt tại quầy.",
          );
        }

        const result = await response.json();

        // 5. Ẩn form nhập và hiển thị khối thông tin hóa đơn (Receipt) phù hợp
        walkinForm.style.display = "none";
        showReceipt(result);
      } catch (error) {
        console.error("Lỗi khi thực hiện đặt lịch Walk-in:", error);
        alert("Đặt lịch thất bại: " + error.message);

        // Khôi phục lại trạng thái nút bấm nếu gặp lỗi để nhân viên thử lại
        btnSubmit.disabled = false;
        btnSubmit.innerText = originalBtnText;
      }
    });
  }
});

// Hàm gọi API trực tiếp lấy danh sách dịch vụ đang hoạt động đổ vào Dropdown
async function loadServicesDropdown() {
  try {
    // 1. Lấy Token xác thực từ localStorage để đính kèm vào Request
    const userStr = localStorage.getItem("autowash_user");
    const token = userStr ? JSON.parse(userStr).token : "";

    // 2. Gọi API trực tiếp bằng đường dẫn tuyệt đối
    const response = await fetch(
      "http://localhost:8080/api/admin/wash-services/active",
      {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: token ? `Bearer ${token}` : "",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Yêu cầu danh sách dịch vụ thất bại (Status: ${response.status})`,
      );
    }

    const services = await response.json();
    const select = document.getElementById("washServiceId");

    // 3. Dọn sạch các option cũ và giữ lại option mặc định ban đầu
    select.innerHTML = '<option value="">-- Chọn dịch vụ --</option>';

    // 4. Map chính xác các thuộc tính JSON thực tế từ API (serviceId, serviceName, price)
    services.forEach((svc) => {
      const option = document.createElement("option");
      option.value = svc.serviceId;
      option.textContent = `${svc.serviceName} - ${svc.price.toLocaleString("vi-VN")}đ`;
      select.appendChild(option);
    });

    console.log("Đã tải thành công danh sách dịch vụ từ API trực tiếp!");
  } catch (error) {
    console.error("Lỗi khi lấy danh sách dịch vụ:", error);
    const select = document.getElementById("washServiceId");
    select.innerHTML =
      '<option value="">-- Lỗi tải danh sách dịch vụ --</option>';
  }
}

// Hàm gọi API lấy khung giờ trống[cite: 48]
// Hàm gọi API lấy khung giờ trống và render lên giao diện
async function fetchAvailableSlots() {
  const dateInput = document.getElementById("date");
  const serviceSelect = document.getElementById("washServiceId");
  const container = document.getElementById("timeSlotsContainer");

  // 1. Lấy giá trị hiện tại của Date và Wash Service ID
  const date = dateInput.value;
  const washServiceId = serviceSelect.value;

  // 2. Kiểm tra điều kiện đầu vào (Phải chọn cả ngày và dịch vụ)
  if (!date || !washServiceId) {
    container.innerHTML = `
            <p class="text-muted">Vui lòng chọn dịch vụ và ngày để xem khung giờ.</p>
        `;
    return;
  }

  // Hiển thị trạng thái đang tải dữ liệu
  container.innerHTML =
    "<p class='text-muted'>Đang tải danh sách khung giờ trống...</p>";

  try {
    // 3. Khởi tạo URL endpoint kèm theo Query Parameters
    // Sử dụng API_URL có sẵn hoặc fallback về localhost:8080 nếu chưa định nghĩa
    const baseUrl =
      typeof API_URL !== "undefined" ? API_URL : "http://localhost:8080";
    const url = new URL(`${baseUrl}/api/v1/bookings/available-slots`);

    url.searchParams.append("date", date);
    url.searchParams.append("washServiceId", washServiceId);

    // 4. Thực hiện gửi request GET lên Server
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Lỗi kết nối API (Status: ${response.status})`);
    }

    const slots = await response.json();
    container.innerHTML = ""; // Xóa bỏ thông tin loading cũ

    // 5. Kiểm tra nếu không có khung giờ nào trả về
    if (!slots || slots.length === 0) {
      container.innerHTML =
        '<p class="text-danger">Không có khung giờ nào khả dụng trong ngày này.</p>';
      return;
    }

    // 6. Duyệt mảng và sinh mã HTML cho các khung giờ còn trống (available: true)
    let hasAvailableSlot = false;

    slots.forEach((slot) => {
      if (slot.available) {
        hasAvailableSlot = true;
        const div = document.createElement("div");
        div.className = "time-slot";
        div.innerHTML = `
          <input type="radio" name="slotId" id="slot_${slot.slotId}" value="${slot.slotId}" required>
          <label for="slot_${slot.slotId}">
              <strong>${slot.startTime.substring(0, 5)}</strong>
          </label>
`;
        container.appendChild(div);
      }
    });

    // Trường hợp API trả về danh sách khung giờ nhưng đều đã bị đặt hết (available: false)
    if (!hasAvailableSlot) {
      container.innerHTML =
        '<p class="text-danger">Rất tiếc, tất cả các khung giờ trong ngày đã được đặt kín!</p>';
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu khung giờ:", error);
    container.innerHTML =
      '<p class="text-danger">Không thể tải danh sách khung giờ. Vui lòng thử lại sau!</p>';
  }
}

// 7. Đăng ký sự kiện thay đổi (Event Listener) để tự động kích hoạt hàm fetch
document.addEventListener("DOMContentLoaded", () => {
  const serviceSelect = document.getElementById("washServiceId");
  const dateInput = document.getElementById("date");

  if (serviceSelect) {
    serviceSelect.addEventListener("change", fetchAvailableSlots);
  }
  if (dateInput) {
    dateInput.addEventListener("change", fetchAvailableSlots);
  }
});

// Hàm format giá tiền và hiện kết quả Bill[cite: 48]
function showReceipt(data) {
  const receiptBox = document.getElementById("receiptSummary");
  if (!receiptBox) return;

  // Hiển thị khung hóa đơn
  receiptBox.style.display = "block";

  // Định dạng hiển thị tiền tệ Việt Nam Đồng (VND)
  const formatVND = (num) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  // Ánh xạ chính xác các trường dữ liệu từ response API lên giao diện hóa đơn
  document.getElementById("resBasePrice").innerText = formatVND(
    data.basePrice || 0,
  );

  // Tính tổng số tiền được giảm từ hạng thành viên (Tier) và quà tặng đổi thưởng (Reward)
  const totalTierRewardDiscount =
    (data.discountFromTier || 0) + (data.discountFromReward || 0);
  document.getElementById("resTierDiscount").innerText =
    "-" + formatVND(totalTierRewardDiscount);

  // Số tiền cuối cùng thực tế khách hàng cần thanh toán
  document.getElementById("resFinalPrice").innerText = formatVND(
    data.finalPrice || 0,
  );

  // Số điểm tích lũy được cộng trực tiếp cho khách hàng sau dịch vụ
  document.getElementById("resTotalPoint").innerText =
    `+${data.totalPointEarned || 0} điểm`;
}
