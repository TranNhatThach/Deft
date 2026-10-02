-- ==============================================================================
-- DEFT (Personal Budgeting & Expense Tracking System)
-- Database Schema Script (PostgreSQL DDL)
-- ==============================================================================

-- Kích hoạt extension hỗ trợ sinh UUID tự động
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUM TYPES (Các kiểu dữ liệu liệt kê)
-- ------------------------------------------------------------------------------

-- Loại danh mục thu/chi
CREATE TYPE category_type AS ENUM (
    'expense', -- Chi tiêu
    'income'   -- Thu nhập
);

-- Trạng thái của chu kỳ ngân sách
CREATE TYPE budget_period_status AS ENUM (
    'open',   -- Đang mở (đang hoạt động)
    'closed'  -- Đã đóng
);

-- Loại giao dịch
CREATE TYPE transaction_type AS ENUM (
    'expense', -- Chi tiêu
    'income'   -- Thu nhập
);

-- Loại thông báo hệ thống
CREATE TYPE notification_type AS ENUM (
    'threshold_alert', -- Cảnh báo chạm/vượt ngưỡng ngân sách (ví dụ: 80%, 100%)
    'period_reminder'  -- Nhắc nhở chu kỳ ngân sách
);


-- ------------------------------------------------------------------------------
-- 2. TABLES & CONSTRAINTS (Bảng dữ liệu và khóa ngoại)
-- ------------------------------------------------------------------------------

-- 2.1 Bảng Người dùng (users)
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(255) NOT NULL,
    currency      VARCHAR(10)  NOT NULL DEFAULT 'VND',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Quản lý thông tin tài khoản người dùng';
COMMENT ON COLUMN users.currency IS 'Đơn vị tiền tệ chính của người dùng (mặc định VND)';


-- 2.2 Bảng Refresh Token (refresh_tokens)
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE refresh_tokens IS 'Lưu trữ các Refresh Token dùng cho xác thực JWT';


-- 2.3 Bảng Danh mục thu/chi (categories)
CREATE TABLE categories (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL,
    name       VARCHAR(255) NOT NULL,
    icon       VARCHAR(100) NULL,
    type       category_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE categories IS 'Danh mục phân loại thu nhập hoặc chi tiêu của người dùng';


-- 2.4 Bảng Chu kỳ ngân sách (budget_periods)
CREATE TABLE budget_periods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      budget_period_status NOT NULL DEFAULT 'open',
    total_limit DECIMAL(14, 2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_budget_periods_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE budget_periods IS 'Quản lý các chu kỳ chi tiêu (VD: Ngân sách tháng 8/2026)';
COMMENT ON COLUMN budget_periods.total_limit IS 'Tổng hạn mức ngân sách đặt ra cho chu kỳ';


-- 2.5 Bảng Ngân sách chi tiết theo danh mục (budgets)
CREATE TABLE budgets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_period_id UUID NOT NULL,
    category_id      UUID NOT NULL,
    limit_amount     DECIMAL(14, 2) NOT NULL,
    spent_amount     DECIMAL(14, 2) NOT NULL DEFAULT 0.00,

    CONSTRAINT fk_budgets_period
        FOREIGN KEY (budget_period_id) 
        REFERENCES budget_periods(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE RESTRICT,

    CONSTRAINT uq_budget_period_category 
        UNIQUE (budget_period_id, category_id)
);

COMMENT ON TABLE budgets IS 'Phân bổ ngân sách hạn mức cụ thể cho từng danh mục trong một chu kỳ';
COMMENT ON COLUMN budgets.spent_amount IS 'Số tiền thực tế đã chi trong danh mục này của chu kỳ';


-- 2.6 Bảng Giao dịch thu/chi (transactions)
CREATE TABLE transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL,
    category_id      UUID NOT NULL,
    budget_period_id UUID NULL,
    amount           DECIMAL(14, 2) NOT NULL,
    type             transaction_type NOT NULL,
    note             VARCHAR(500) NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE RESTRICT,

    CONSTRAINT fk_transactions_period
        FOREIGN KEY (budget_period_id) 
        REFERENCES budget_periods(id) 
        ON DELETE SET NULL
);

COMMENT ON TABLE transactions IS 'Ghi nhận chi tiết từng khoản thu/chi của người dùng';


-- 2.7 Bảng Thông báo (notifications)
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL,
    type       notification_type NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    metadata   JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE notifications IS 'Thông báo đẩy gửi tới người dùng (cảnh báo vượt ngưỡng, nhắc nhở)';


-- 2.8 Bảng Lịch sử gửi cảnh báo (alert_logs)
CREATE TABLE alert_logs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_period_id UUID NOT NULL,
    category_id      UUID NULL,
    threshold        INT NOT NULL,

    CONSTRAINT fk_alert_logs_period
        FOREIGN KEY (budget_period_id) 
        REFERENCES budget_periods(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_alert_logs_category
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE CASCADE,

    CONSTRAINT uq_alert_period_category_threshold 
        UNIQUE (budget_period_id, category_id, threshold)
);

COMMENT ON TABLE alert_logs IS 'Ghi log tránh trùng lặp thông báo cảnh báo khi đạt ngưỡng (vd 80%, 100%)';


-- ------------------------------------------------------------------------------
-- 3. INDEXES (Tối ưu hóa hiệu năng truy vấn)
-- ------------------------------------------------------------------------------

CREATE INDEX idx_budgets_period_category ON budgets(budget_period_id, category_id);
CREATE INDEX idx_transactions_user_period ON transactions(user_id, budget_period_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
