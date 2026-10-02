-- ==============================================================================
-- DEFT (Personal Budgeting & Expense Tracking System)
-- Enterprise-Grade PostgreSQL Database Schema Script (DDL & Advanced Engine)
-- Version: 2.0 (High-Performance, Audit-Ready, Automated Integrity & Analytics)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS (Phần mở rộng cốt lõi của PostgreSQL)
-- ------------------------------------------------------------------------------

-- Kích hoạt extension hỗ trợ sinh UUID v4 tự động
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Kích hoạt extension mã hóa mật khẩu và băm an toàn
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Kích hoạt extension hỗ trợ chỉ mục GiST cho các kiểu dữ liệu cơ bản (Exclusion constraints)
CREATE EXTENSION IF NOT EXISTS "btree_gist";


-- ------------------------------------------------------------------------------
-- 2. ENUM TYPES (Các kiểu dữ liệu liệt kê chuẩn hóa)
-- ------------------------------------------------------------------------------

-- Phân loại danh mục: Chi tiêu (expense) hoặc Thu nhập (income)
DO $$ BEGIN
    CREATE TYPE category_type AS ENUM ('expense', 'income');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trạng thái chu kỳ ngân sách: Đang mở (open) hoặc Đã đóng (closed)
DO $$ BEGIN
    CREATE TYPE budget_period_status AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Loại giao dịch phát sinh
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('expense', 'income');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Loại thông báo hệ thống
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'threshold_alert',  -- Cảnh báo chạm/vượt ngưỡng ngân sách (50%, 70%, 80%, 100%)
        'period_reminder'   -- Nhắc nhở chu kỳ ngân sách và tổng kết dòng tiền
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ------------------------------------------------------------------------------
-- 3. TABLES & INTEGRITY CONSTRAINTS (Bảng dữ liệu & Ràng buộc tài chính chặt chẽ)
-- ------------------------------------------------------------------------------

-- 3.1 Bảng Người dùng (users)
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(255) NOT NULL,
    currency      VARCHAR(10)  NOT NULL DEFAULT 'VND',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ràng buộc kiểm tra định dạng email và độ dài đơn vị tiền tệ
    CONSTRAINT chk_users_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_users_currency_length
        CHECK (char_length(currency) >= 2)
);

COMMENT ON TABLE users IS 'Quản lý thông tin tài khoản người dùng và đơn vị tiền tệ mặc định';
COMMENT ON COLUMN users.currency IS 'Mã tiền tệ chính của người dùng (mặc định VND, hỗ trợ USD, EUR,...)';


-- 3.2 Bảng Refresh Token (refresh_tokens)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE refresh_tokens IS 'Lưu trữ Refresh Token dùng cho cơ chế xác thực JWT kép (Access/Refresh Token)';


-- 3.3 Bảng Danh mục thu/chi (categories)
CREATE TABLE IF NOT EXISTS categories (
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
        ON DELETE CASCADE,

    -- Tránh việc người dùng tạo trùng lặp tên danh mục trong cùng một phân loại (Thu hoặc Chi)
    CONSTRAINT uq_user_category_name_type 
        UNIQUE (user_id, name, type)
);

COMMENT ON TABLE categories IS 'Danh mục phân loại các khoản thu nhập hoặc chi tiêu';


-- 3.4 Bảng Chu kỳ ngân sách (budget_periods)
CREATE TABLE IF NOT EXISTS budget_periods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      budget_period_status NOT NULL DEFAULT 'open',
    total_limit DECIMAL(14, 2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_budget_periods_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,

    -- Ràng buộc ngày: ngày kết thúc phải sau ngày bắt đầu
    CONSTRAINT chk_budget_periods_dates 
        CHECK (start_date < end_date),

    -- Hạn mức tổng ngân sách không được phép là số âm
    CONSTRAINT chk_budget_periods_total_limit 
        CHECK (total_limit >= 0.00)
);

COMMENT ON TABLE budget_periods IS 'Quản lý các chu kỳ tài chính (VD: Ngân sách tháng 10/2026)';
COMMENT ON COLUMN budget_periods.total_limit IS 'Tổng hạn mức chi tiêu tối đa đặt ra cho chu kỳ';


-- 3.5 Bảng Ngân sách chi tiết theo danh mục (budgets)
CREATE TABLE IF NOT EXISTS budgets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_period_id UUID NOT NULL,
    category_id      UUID NOT NULL,
    limit_amount     DECIMAL(14, 2) NOT NULL,
    spent_amount     DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_budgets_period
        FOREIGN KEY (budget_period_id) 
        REFERENCES budget_periods(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE RESTRICT,

    -- Mỗi danh mục chỉ được cấp hạn mức 1 lần trong mỗi chu kỳ ngân sách
    CONSTRAINT uq_budget_period_category 
        UNIQUE (budget_period_id, category_id),

    -- Ràng buộc số tiền không âm
    CONSTRAINT chk_budgets_limit_amount 
        CHECK (limit_amount >= 0.00),
    CONSTRAINT chk_budgets_spent_amount 
        CHECK (spent_amount >= 0.00)
);

COMMENT ON TABLE budgets IS 'Phân bổ hạn mức chi tiêu cho từng danh mục cụ thể trong chu kỳ';
COMMENT ON COLUMN budgets.spent_amount IS 'Số tiền tích luỹ thực tế đã chi trong danh mục này';


-- 3.6 Bảng Giao dịch thu/chi (transactions)
CREATE TABLE IF NOT EXISTS transactions (
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
        ON DELETE SET NULL,

    -- Ràng buộc tài chính chuẩn mực: Số tiền giao dịch luôn phải lớn hơn 0
    CONSTRAINT chk_transactions_amount_positive 
        CHECK (amount > 0.00)
);

COMMENT ON TABLE transactions IS 'Sổ cái ghi nhận chi tiết từng khoản thu nhập hoặc chi tiêu thực tế';


-- 3.7 Bảng Thông báo (notifications)
CREATE TABLE IF NOT EXISTS notifications (
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

COMMENT ON TABLE notifications IS 'Hệ thống thông báo đẩy (Cảnh báo ngưỡng, dự báo tốc độ chi tiêu, cạn tiền)';


-- 3.8 Bảng Lịch sử gửi cảnh báo ngưỡng (alert_logs)
CREATE TABLE IF NOT EXISTS alert_logs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_period_id UUID NOT NULL,
    category_id      UUID NULL,
    threshold        INT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alert_logs_period
        FOREIGN KEY (budget_period_id) 
        REFERENCES budget_periods(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_alert_logs_category
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE CASCADE,

    -- Đảm bảo không bao giờ gửi thông báo trùng lặp cho cùng một mốc trong kỳ
    CONSTRAINT uq_alert_period_category_threshold 
        UNIQUE (budget_period_id, category_id, threshold),

    -- Các mốc cảnh báo tiêu chuẩn được công nhận
    CONSTRAINT chk_alert_threshold_valid
        CHECK (threshold IN (50, 70, 80, 100))
);

COMMENT ON TABLE alert_logs IS 'Nhật ký đánh dấu các mốc cảnh báo đã gửi nhằm triệt tiêu trùng lặp';


-- ------------------------------------------------------------------------------
-- 4. ADVANCED INDEXES (Chỉ mục chuyên sâu: Covering, Composite & Partial Index)
-- ------------------------------------------------------------------------------

-- 4.1 Covering Index: Tăng tốc truy vấn lịch sử giao dịch và phân trang (Index-Only Scan)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_type 
    ON transactions(user_id, transaction_date DESC, type) 
    INCLUDE (amount, category_id, budget_period_id);

-- 4.2 Composite Index: Hỗ trợ thống kê chi tiêu theo kỳ ngân sách
CREATE INDEX IF NOT EXISTS idx_transactions_period_type_amount 
    ON transactions(budget_period_id, type) 
    INCLUDE (amount, category_id);

-- 4.3 Tra cứu theo danh mục
CREATE INDEX IF NOT EXISTS idx_transactions_category_date 
    ON transactions(category_id, transaction_date DESC);

-- 4.4 Partial Index: Tối ưu tra cứu thông báo chưa đọc cực nhanh (bỏ qua thông báo đã đọc)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id, created_at DESC) 
    WHERE is_read = FALSE;

-- 4.5 Partial Index: Truy vấn tức thì kỳ ngân sách đang mở O(1)
CREATE INDEX IF NOT EXISTS idx_budget_periods_user_open 
    ON budget_periods(user_id) 
    WHERE status = 'open';

-- 4.6 Partial Index: Tra cứu Refresh Token còn hiệu lực
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active 
    ON refresh_tokens(user_id, token_hash) 
    WHERE revoked_at IS NULL;

-- 4.7 Index tra cứu phân bổ danh mục trong kỳ
CREATE INDEX IF NOT EXISTS idx_budgets_period_category 
    ON budgets(budget_period_id, category_id);

-- 4.8 Index phân loại danh mục người dùng
CREATE INDEX IF NOT EXISTS idx_categories_user_type 
    ON categories(user_id, type);


-- ------------------------------------------------------------------------------
-- 5. AUTOMATED TRIGGERS (Trigger tự động hoá cập nhật thời gian và tính toán)
-- ------------------------------------------------------------------------------

-- 5.1 Hàm cập nhật updated_at tự động khi bản ghi có thay đổi
CREATE OR REPLACE FUNCTION fn_auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger auto update timestamp cho các bảng chính
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

DROP TRIGGER IF EXISTS trg_budget_periods_updated_at ON budget_periods;
CREATE TRIGGER trg_budget_periods_updated_at
    BEFORE UPDATE ON budget_periods
    FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON budgets;
CREATE TRIGGER trg_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION fn_auto_update_timestamp();


-- ------------------------------------------------------------------------------
-- 6. ANALYTIC VIEWS (Các View phân tích số liệu tài chính chuyên sâu)
-- ------------------------------------------------------------------------------

-- 6.1 View Phân tích Tốc độ Chi tiêu (Burn Rate) & Dự báo Số ngày Cạn tiền
-- Tính toán trực tiếp bằng toán học thời gian thực
CREATE OR REPLACE VIEW v_budget_burn_rate_forecast AS
SELECT 
    bp.id AS budget_period_id,
    bp.user_id,
    bp.start_date,
    bp.end_date,
    bp.status,
    bp.total_limit,
    
    -- Tổng chi tiêu thực tế tích luỹ trong kỳ
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) AS total_spent,
    
    -- Số tiền ngân sách còn lại
    GREATEST(0.00, bp.total_limit - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00)) AS remaining_amount,
    
    -- Tỷ lệ phần trăm đã chi (%)
    ROUND(
        (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) / NULLIF(bp.total_limit, 0)) * 100, 
        2
    ) AS percent_used,
    
    -- Số ngày đã trôi qua trong kỳ (tối thiểu 1 ngày để triệt tiêu lỗi chia 0)
    GREATEST(1, (CURRENT_DATE - bp.start_date) + 1) AS days_passed,
    
    -- Tổng số ngày của kỳ ngân sách
    (bp.end_date - bp.start_date + 1) AS total_period_days,
    
    -- Số ngày còn lại trong kỳ
    GREATEST(0, (bp.end_date - CURRENT_DATE)) AS remaining_period_days,
    
    -- THUẬT TOÁN: Tốc độ chi tiêu bình quân mỗi ngày = Tổng chi / Số ngày đã qua
    ROUND(
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) / 
        GREATEST(1, (CURRENT_DATE - bp.start_date) + 1),
        2
    ) AS burn_rate_per_day,
    
    -- THUẬT TOÁN DỰ BÁO: Số ngày còn lại đến khi cạn kiệt ngân sách
    CASE 
        WHEN COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) <= 0 THEN 999
        WHEN (bp.total_limit - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00)) <= 0 THEN 0
        ELSE ROUND(
            (bp.total_limit - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00)) /
            NULLIF(
                COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) / 
                GREATEST(1, (CURRENT_DATE - bp.start_date) + 1), 
                0
            )
        )
    END AS forecast_days_until_depletion,
    
    -- Đánh giá mức độ cảnh báo tài chính
    CASE
        WHEN (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) / NULLIF(bp.total_limit, 0)) >= 1.00 THEN 'EXCEEDED_100'
        WHEN (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) / NULLIF(bp.total_limit, 0)) >= 0.80 THEN 'CRITICAL_80'
        WHEN (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) / NULLIF(bp.total_limit, 0)) >= 0.70 THEN 'WARNING_70'
        WHEN (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) / NULLIF(bp.total_limit, 0)) >= 0.50 THEN 'CAUTION_50'
        ELSE 'SAFE'
    END AS alert_level

FROM budget_periods bp
LEFT JOIN transactions t ON bp.id = t.budget_period_id
GROUP BY bp.id, bp.user_id, bp.start_date, bp.end_date, bp.status, bp.total_limit;

COMMENT ON VIEW v_budget_burn_rate_forecast IS 'View phân tích toán học tốc độ tiêu tiền/ngày và dự báo số ngày cạn kiệt ngân sách';


-- 6.2 View Phân tích Dòng tiền Ròng (Net Cashflow) và Sức khỏe Tài chính Người dùng
CREATE OR REPLACE VIEW v_user_financial_summary AS
SELECT 
    u.id AS user_id,
    u.email,
    u.display_name,
    u.currency,
    
    -- Tổng thu nhập tích luỹ
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0.00) AS total_income,
    
    -- Tổng chi tiêu tích luỹ
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00) AS total_expense,
    
    -- Dòng tiền ròng (Net Savings)
    (
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0.00) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00)
    ) AS net_cashflow,
    
    -- Tỷ lệ tiết kiệm (%) = (Thu nhập - Chi tiêu) / Thu nhập * 100
    CASE 
        WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0.00) > 0 THEN
            ROUND(
                ((COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0.00) -
                  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0.00)) /
                 SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END)) * 100,
                2
            )
        ELSE 0.00
    END AS savings_rate_percent,
    
    COUNT(t.id) AS total_transactions_count

FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.email, u.display_name, u.currency;

COMMENT ON VIEW v_user_financial_summary IS 'View tổng quan tình hình dòng tiền và tỷ lệ tiết kiệm tích lũy của từng người dùng';


-- 6.3 View Phân rã Chi tiêu theo Từng Danh mục trong Kỳ Ngân sách
CREATE OR REPLACE VIEW v_category_budget_breakdown AS
SELECT 
    b.id AS budget_id,
    b.budget_period_id,
    bp.user_id,
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    b.limit_amount,
    b.spent_amount,
    (b.limit_amount - b.spent_amount) AS remaining_amount,
    ROUND((b.spent_amount / NULLIF(b.limit_amount, 0)) * 100, 2) AS percent_used,
    
    -- Xếp hạng danh mục tiêu tốn nhiều tiền nhất trong kỳ
    DENSE_RANK() OVER (
        PARTITION BY b.budget_period_id 
        ORDER BY b.spent_amount DESC
    ) AS spending_rank

FROM budgets b
JOIN categories c ON b.category_id = c.id
JOIN budget_periods bp ON b.budget_period_id = bp.id;

COMMENT ON VIEW v_category_budget_breakdown IS 'Bảng phân rã chi tiết mức độ sử dụng ngân sách từng danh mục kèm xếp hạng tiêu dùng';


-- ------------------------------------------------------------------------------
-- 7. STORED PROCEDURES & BUSINESS FUNCTIONS (Hàm nghiệp vụ cốt lõi)
-- ------------------------------------------------------------------------------

-- 7.1 Hàm kiểm tra và kích hoạt cảnh báo ngưỡng tự động (50%, 70%, 80%, 100%)
CREATE OR REPLACE FUNCTION fn_audit_budget_thresholds(p_budget_period_id UUID)
RETURNS TABLE (
    threshold_hit INT,
    period_percent NUMERIC,
    burn_rate NUMERIC,
    forecast_days INT,
    alert_created BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
    v_total_limit NUMERIC;
    v_total_spent NUMERIC;
    v_percent NUMERIC;
    v_days_passed INT;
    v_remaining_days INT;
    v_burn_rate NUMERIC;
    v_forecast_days INT;
    v_threshold INT;
    v_thresholds INT[] := ARRAY[50, 70, 80, 100];
    v_alert_title TEXT;
    v_alert_msg TEXT;
    v_currency TEXT;
BEGIN
    -- Lấy thông tin chu kỳ ngân sách
    SELECT bp.user_id, bp.total_limit, u.currency,
           GREATEST(1, (CURRENT_DATE - bp.start_date) + 1),
           GREATEST(0, (bp.end_date - CURRENT_DATE))
    INTO v_user_id, v_total_limit, v_currency, v_days_passed, v_remaining_days
    FROM budget_periods bp
    JOIN users u ON bp.user_id = u.id
    WHERE bp.id = p_budget_period_id;

    IF NOT FOUND OR v_total_limit <= 0 THEN
        RETURN;
    END IF;

    -- Tính tổng chi tiêu
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_spent
    FROM transactions
    WHERE budget_period_id = p_budget_period_id AND type = 'expense';

    v_percent := ROUND((v_total_spent / v_total_limit) * 100, 2);
    v_burn_rate := ROUND(v_total_spent / v_days_passed, 2);

    IF v_burn_rate > 0 AND (v_total_limit - v_total_spent) > 0 THEN
        v_forecast_days := ROUND((v_total_limit - v_total_spent) / v_burn_rate);
    ELSE
        v_forecast_days := 0;
    END IF;

    -- Lặp qua từng mốc kiểm tra
    FOREACH v_threshold IN ARRAY v_thresholds LOOP
        IF v_percent >= v_threshold THEN
            -- Kiểm tra xem đã ghi log chưa
            IF NOT EXISTS (
                SELECT 1 FROM alert_logs 
                WHERE budget_period_id = p_budget_period_id 
                  AND category_id IS NULL 
                  AND threshold = v_threshold
            ) THEN
                -- Ghi log tránh trùng lặp
                INSERT INTO alert_logs (budget_period_id, category_id, threshold)
                VALUES (p_budget_period_id, NULL, v_threshold);

                -- Xây dựng thông điệp cảnh báo
                IF v_threshold = 70 THEN
                    v_alert_title := 'Cảnh báo 70% ngân sách: Đang chi tiêu nhanh';
                    v_alert_msg := format(
                        'Tổng chi tiêu đã đạt %s%% hạn mức kỳ. Tốc độ chi tiêu trung bình: %s %s/ngày. Dự báo ngân sách sẽ cạn trong khoảng %s ngày tới (kỳ còn %s ngày).',
                        ROUND(v_percent), to_char(v_burn_rate, 'FM999,999,999'), v_currency, v_forecast_days, v_remaining_days
                    );
                ELSIF v_threshold = 50 THEN
                    v_alert_title := 'Cảnh báo 50% ngân sách';
                    v_alert_msg := format(
                        'Tổng chi tiêu đã đạt %s%% ngân sách kỳ. Tốc độ chi tiêu: %s %s/ngày.',
                        ROUND(v_percent), to_char(v_burn_rate, 'FM999,999,999'), v_currency
                    );
                ELSIF v_threshold = 80 THEN
                    v_alert_title := 'Cảnh báo nghiêm trọng: Đạt 80% ngân sách';
                    v_alert_msg := format(
                        'Tổng chi tiêu đã đạt %s%% ngân sách kỳ. Bạn chỉ còn lại %s %s cho %s ngày còn lại.',
                        ROUND(v_percent), to_char(GREATEST(0, v_total_limit - v_total_spent), 'FM999,999,999'), v_currency, v_remaining_days
                    );
                ELSE
                    v_alert_title := 'Vượt ngân sách tổng kỳ';
                    v_alert_msg := format('Tổng chi tiêu đã vượt quá 100%% hạn mức cho phép của chu kỳ!');
                END IF;

                -- Thêm bản ghi thông báo
                INSERT INTO notifications (user_id, type, title, message, metadata)
                VALUES (
                    v_user_id,
                    'threshold_alert',
                    v_alert_title,
                    v_alert_msg,
                    jsonb_build_object(
                        'threshold', v_threshold,
                        'percent', ROUND(v_percent),
                        'budget_period_id', p_budget_period_id,
                        'total_spent', v_total_spent,
                        'total_limit', v_total_limit,
                        'days_passed', v_days_passed,
                        'burn_rate_per_day', v_burn_rate,
                        'forecast_days_left', v_forecast_days,
                        'period_days_left', v_remaining_days
                    )
                );

                threshold_hit := v_threshold;
                period_percent := v_percent;
                burn_rate := v_burn_rate;
                forecast_days := v_forecast_days;
                alert_created := TRUE;
                RETURN NEXT;
            END IF;
        END IF;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_audit_budget_thresholds(UUID) IS 'Thủ tục tự động kiểm tra ngưỡng 50%, 70%, 80%, 100% và tạo bản ghi thông báo kèm dự báo cạn tiền';


-- ------------------------------------------------------------------------------
-- 8. ROW-LEVEL SECURITY (RLS) TEMPLATE (Bảo mật cô lập dữ liệu cấp người dùng)
-- ------------------------------------------------------------------------------

-- Kích hoạt RLS để bảo đảm tính bảo mật tối thượng ở tầng Database
-- (Khi ứng dụng cấu hình SET LOCAL app.current_user_id = '...')

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Ví dụ Policy cô lập: Người dùng chỉ thấy dữ liệu của chính mình
DROP POLICY IF EXISTS p_user_isolation_categories ON categories;
CREATE POLICY p_user_isolation_categories ON categories
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID);

DROP POLICY IF EXISTS p_user_isolation_transactions ON transactions;
CREATE POLICY p_user_isolation_transactions ON transactions
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID);

DROP POLICY IF EXISTS p_user_isolation_notifications ON notifications;
CREATE POLICY p_user_isolation_notifications ON notifications
    FOR ALL
    USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID);

-- ==============================================================================
-- KẾT THÚC DDL SCRIPT - DEFT ENTERPRISE DATABASE SCHEMA 2.0
-- ==============================================================================
