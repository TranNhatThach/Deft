# Deft — Đặc tả UI/UX (dùng cho Stitch)

Ứng dụng quản lý tài chính cá nhân, nền tảng mobile (React/React Native), ngôn ngữ tiếng Việt, đơn vị tiền tệ mặc định VNĐ.

---

## 1. Nguyên tắc thiết kế

- **Phong cách:** fintech hiện đại, sạch, nhiều khoảng trắng, bo góc lớn (16–20px), độ tương phản rõ để số liệu dễ đọc.
- **Ưu tiên số liệu:** số tiền và % luôn là yếu tố nổi bật nhất trên mỗi card — không để chữ mô tả lấn át con số.
- **Phân cấp cảnh báo bằng màu, không chỉ bằng chữ:** người dùng phải nhận ra mức độ nghiêm trọng của một danh mục/thông báo chỉ bằng màu sắc, trước khi đọc nội dung.
- **Một màn hình — một tác vụ:** không dồn nhiều nhóm chức năng không liên quan vào cùng một trang.

---

## 2. Kiến trúc thông tin

**Tab bar dưới cùng — 5 tab:**

1. 🏠 Trang chủ (Dashboard)
2. 💸 Giao dịch
3. 🎯 Ngân sách
4. 🔔 Thông báo (có badge số chưa đọc)
5. ⚙️ Cài đặt

**Ngoài luồng chính (không có trong tab bar):** Đăng nhập, Đăng ký, Onboarding lần đầu.

---

## 3. Bảng màu theo mức độ sử dụng ngân sách (design token cốt lõi)

Đây là hệ màu xuyên suốt toàn app — dùng cho progress bar, badge, viền card, nút CTA cảnh báo:

| Mức | Điều kiện | Màu | Hex gợi ý |
|---|---|---|---|
| An toàn | < 50% | Xanh lá | `#2FBF71` |
| Chú ý | 50–69% | Vàng | `#FFC24B` |
| Cảnh báo | 70–79% | Cam | `#FF9F40` |
| Nghiêm trọng | 80–99% | Cam đỏ | `#FF6B4A` |
| Vượt ngân sách | ≥ 100% | Đỏ | `#FF4D5E` |

Màu thương hiệu chính (primary, dùng cho nút/link/active state) tách biệt khỏi bảng màu cảnh báo trên — gợi ý xanh dương `#5B7FFF` để không gây nhầm lẫn với các mức cảnh báo.

---

## 4. Danh sách màn hình

| # | Màn hình | Mục đích |
|---|---|---|
| 1 | Đăng nhập | Xác thực |
| 2 | Đăng ký | Tạo tài khoản |
| 3 | Dashboard | Tổng quan kỳ ngân sách hiện tại |
| 4 | Danh sách giao dịch | Xem/lọc/sửa/xoá giao dịch |
| 5 | Thêm/Sửa giao dịch | Nhập giao dịch mới |
| 6 | Quản lý danh mục | CRUD danh mục thu/chi |
| 7 | Quản lý kỳ ngân sách | Xem kỳ hiện tại, đặt hạn mức theo danh mục, tạo kỳ mới |
| 8 | Trung tâm thông báo | Nhật ký cảnh báo, đánh dấu đã đọc |
| 9 | Cài đặt tài khoản | Hồ sơ, đơn vị tiền tệ, công tắc thông báo, đăng xuất |

---

## 5. Chi tiết từng màn hình

### 5.1 Đăng nhập
- Logo/tên app ở trên, form: email, mật khẩu (có icon ẩn/hiện).
- Nút "Đăng nhập" full-width, primary color.
- Lỗi hiển thị inline dưới field bị sai (không dùng popup alert).
- Link nhỏ bên dưới: "Chưa có tài khoản? Đăng ký".

### 5.2 Đăng ký
- Form: tên hiển thị, email, mật khẩu, xác nhận mật khẩu.
- Validate độ mạnh mật khẩu hiển thị dạng thanh strength-meter nhỏ, không dùng alert.

### 5.3 Dashboard (Trang chủ)
- **Card tổng quan lớn ở đầu trang:** tổng hạn mức kỳ hiện tại, tổng đã chi, số tiền còn lại (số to, đậm), progress bar ngang lớn tô màu theo bảng mục 3, kèm % ở góc phải.
- **Danh sách card theo danh mục** bên dưới: mỗi card gồm tên danh mục + icon, progress bar nhỏ, dòng phụ "Đã chi X / Còn lại Y / Hạn mức Z". Viền trái hoặc màu progress bar đổi theo mức sử dụng (bảng màu mục 3).
- Bấm vào 1 card danh mục → điều hướng sang màn "Danh sách giao dịch" đã lọc sẵn theo danh mục đó.
- Nút nổi (FAB) góc dưới phải: "+" thêm giao dịch nhanh.
- Trạng thái rỗng (chưa có danh mục): illustration nhẹ + text + CTA "Thêm danh mục đầu tiên" dẫn sang màn Quản lý danh mục.

### 5.4 Danh sách giao dịch
- Thanh filter trên cùng: chip chọn danh mục (scroll ngang), nút chọn khoảng ngày.
- Mỗi item: icon danh mục, tên giao dịch, ngày; bên phải số tiền — màu đỏ nếu là khoản chi, xanh lá nếu là khoản thu.
- Vuốt trái item để hiện 2 nút Sửa/Xoá, hoặc menu 3 chấm nếu không hỗ trợ vuốt.
- Nhóm theo ngày (header "Hôm nay", "Hôm qua", "20/07/2026"...).
- Trạng thái rỗng: "Chưa có giao dịch nào trong khoảng thời gian này".

### 5.5 Thêm/Sửa giao dịch
- Dạng bottom sheet hoặc trang riêng (ưu tiên bottom sheet cho thao tác nhanh).
- Toggle 2 nút lớn ở đầu: **Chi tiêu / Thu nhập** (đổi màu theo lựa chọn: đỏ nhạt / xanh nhạt).
- Input số tiền lớn, canh giữa, font số nổi bật (giống các app ví điện tử).
- Select danh mục (chip hoặc dropdown có icon).
- Input tên giao dịch/ghi chú.
- Chọn ngày giao dịch (mặc định hôm nay).
- Nút "Lưu giao dịch" full-width.

### 5.6 Quản lý danh mục
- List danh mục dạng grid icon hoặc list dọc, mỗi item: icon, tên, loại (tag nhỏ "Chi"/"Thu").
- Nút "+ Thêm danh mục" nổi hoặc trên header.
- Form thêm: chọn icon từ bộ có sẵn, nhập tên, chọn loại.
- Xoá danh mục còn dữ liệu → dialog cảnh báo rõ ràng, không xoá âm thầm.

### 5.7 Quản lý kỳ ngân sách
- Card kỳ hiện tại: khoảng ngày (vd "01/07 – 31/07/2026"), tổng hạn mức, nút "Đóng kỳ này".
- Danh sách hạn mức theo từng danh mục trong kỳ: tên danh mục + input số tiền hạn mức (inline edit).
- Nút "Tạo kỳ ngân sách mới": mở form chọn ngày bắt đầu/kết thúc + tổng hạn mức, có cảnh báo "Kỳ hiện tại sẽ tự đóng".
- Tab phụ hoặc nút "Xem lịch sử các kỳ trước" (danh sách kỳ đã đóng, mỗi kỳ hiện tổng kết ngắn: tổng chi/tổng hạn mức).

### 5.8 Trung tâm thông báo
- List thông báo theo thời gian mới nhất trước.
- Mỗi item có **badge nhỏ ghi rõ mức** (Biến động / 50% / 70% / 80% / Vượt ngân sách), màu badge và viền trái theo bảng màu mục 3.
- **Độ nổi bật tăng dần theo mức nghiêm trọng**: mức càng cao thì viền dày hơn, có thể có icon cảnh báo lớn hơn hoặc nhấn nhẹ shadow — nhưng giữ tinh tế, tránh nhấp nháy gây khó chịu, animation chỉ nên dùng 1 lần khi thông báo mới xuất hiện chứ không lặp liên tục.
- Thông báo chưa đọc: chấm tròn nhỏ + nền nhấn nhẹ hơn thông báo đã đọc.
- Action button theo ngữ cảnh: "Xem giao dịch", "Xem ngân sách" (mức 50/70%); "Điều chỉnh hạn mức" (mức 80/100%).
- Toast pop-up ở đầu màn hình khi có thông báo mới lúc đang mở app khác, tự ẩn sau vài giây, bấm vào để mở thẳng Trung tâm thông báo.

### 5.9 Cài đặt tài khoản
- Hồ sơ: avatar (nếu có), tên hiển thị (sửa được), email (chỉ đọc).
- Chọn đơn vị tiền tệ.
- Công tắc "Bật thông báo biến động ngân sách" kèm mô tả ngắn: đây là điều kiện để nhận cảnh báo ngưỡng.
- Nút "Đăng xuất" (màu trung tính, đặt cuối trang, tách khỏi nhóm cài đặt khác).

---

## 6. Design tokens gợi ý

| Token | Giá trị |
|---|---|
| Primary | `#5B7FFF` |
| Primary dark (hover/pressed) | `#3E5FE0` |
| Nền chính | `#F4F6FB` |
| Nền card | `#FFFFFF` |
| Text chính | `#1E2233` |
| Text phụ/muted | `#7A8199` |
| Border | `#E7EAF3` |
| Bo góc card | 16–20px |
| Bo góc button/input | 10–12px |
| Font | hệ thống (SF Pro/Roboto), scale: Heading 20px / Subheading 16px / Body 13–14px / Caption 11px |

---

## 7. Component cần có trong hệ thống thiết kế

- Progress bar ngang (2 kích cỡ: lớn cho Dashboard tổng, nhỏ cho từng danh mục), màu động theo % .
- Card danh mục (icon + tên + progress + 3 số liệu phụ).
- Badge mức cảnh báo (5 màu theo bảng mục 3).
- Toggle 2 lựa chọn (Chi/Thu) dạng segmented control.
- Bottom sheet form (dùng cho thêm giao dịch, thêm danh mục).
- Toast thông báo (auto-dismiss, tap để điều hướng).
- Empty state (illustration + text + CTA).
- Input số tiền lớn có định dạng phân cách hàng nghìn tự động.

---

## 8. Micro-interaction gợi ý

- Progress bar animate khi cập nhật số liệu (transition mượt, không giật).
- Khi vượt ngưỡng mới (vd chạm 80%), card danh mục có hiệu ứng nhấn nhẹ 1 lần (scale hoặc glow ngắn) để thu hút chú ý, không lặp lại liên tục.
- Toast trượt từ trên xuống, tự ẩn sau 3–5 giây tuỳ mức độ (mức càng cao thời gian hiển thị càng lâu).
