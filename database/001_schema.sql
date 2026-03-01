-- =============================================================================
-- Server Monitoring System - Database Schema (3NF Normalized)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS server_monitor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE server_monitor;

-- -----------------------------------------------------------------------------
-- 1. Roles
-- -----------------------------------------------------------------------------
CREATE TABLE Roles (
    role_id     INT AUTO_INCREMENT PRIMARY KEY,
    role_name   VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO Roles (role_name, description) VALUES
  ('admin',    'Full system access'),
  ('operator', 'Can view dashboards and resolve alerts'),
  ('viewer',   'Read-only access');

-- -----------------------------------------------------------------------------
-- 2. Users
-- -----------------------------------------------------------------------------
CREATE TABLE Users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(100) NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    phone          VARCHAR(20)  NULL,
    role_id        INT          NOT NULL DEFAULT 2,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES Roles(role_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. Servers
-- -----------------------------------------------------------------------------
CREATE TABLE Servers (
    server_id   INT AUTO_INCREMENT PRIMARY KEY,
    hostname    VARCHAR(255) NOT NULL UNIQUE,
    ip_address  VARCHAR(45)  NOT NULL,
    os_info     VARCHAR(255) NULL,
    status      ENUM('ONLINE','OFFLINE','DEGRADED') NOT NULL DEFAULT 'ONLINE',
    registered_by INT        NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_servers_user FOREIGN KEY (registered_by) REFERENCES Users(user_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. Metrics  (time-series, partitioned by year)
-- -----------------------------------------------------------------------------
CREATE TABLE Metrics (
    metric_id   BIGINT AUTO_INCREMENT,
    server_id   INT            NOT NULL,
    cpu_percent DECIMAL(5,2)   NOT NULL,
    ram_percent DECIMAL(5,2)   NOT NULL,
    disk_percent DECIMAL(5,2)  NOT NULL,
    recorded_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (metric_id, recorded_at),
    INDEX idx_metrics_server_time (server_id, recorded_at)
    -- NOTE: FK on server_id omitted because MySQL does not support
    --       foreign keys on partitioned tables.  Referential integrity
    --       is enforced at the application layer.
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(recorded_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p2027 VALUES LESS THAN (2028),
    PARTITION pmax  VALUES LESS THAN MAXVALUE
);

-- -----------------------------------------------------------------------------
-- 5. AlertRules
-- -----------------------------------------------------------------------------
CREATE TABLE AlertRules (
    rule_id        INT AUTO_INCREMENT PRIMARY KEY,
    server_id      INT          NULL,              -- NULL = global rule
    metric_name    ENUM('cpu_percent','ram_percent','disk_percent') NOT NULL,
    operator       ENUM('>','>=','<','<=','=') NOT NULL DEFAULT '>',
    threshold      DECIMAL(5,2) NOT NULL,
    severity       ENUM('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alertrules_server (server_id),
    CONSTRAINT fk_alertrules_server FOREIGN KEY (server_id) REFERENCES Servers(server_id)
) ENGINE=InnoDB;

-- Default global alert rules
INSERT INTO AlertRules (server_id, metric_name, operator, threshold, severity) VALUES
  (NULL, 'cpu_percent',  '>', 90.00, 'CRITICAL'),
  (NULL, 'ram_percent',  '>', 85.00, 'WARNING'),
  (NULL, 'disk_percent', '>', 90.00, 'CRITICAL');

-- -----------------------------------------------------------------------------
-- 6. Alerts
-- -----------------------------------------------------------------------------
CREATE TABLE Alerts (
    alert_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id   INT          NOT NULL,
    rule_id     INT          NOT NULL,
    metric_name VARCHAR(50)  NOT NULL,
    metric_value DECIMAL(5,2) NOT NULL,
    threshold   DECIMAL(5,2) NOT NULL,
    severity    ENUM('INFO','WARNING','CRITICAL') NOT NULL,
    status      ENUM('PENDING','SENT','ACKNOWLEDGED','RESOLVED') NOT NULL DEFAULT 'PENDING',
    message     TEXT         NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME     NULL,
    resolved_by INT          NULL,
    INDEX idx_alerts_server (server_id),
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_created (created_at),
    CONSTRAINT fk_alerts_server FOREIGN KEY (server_id) REFERENCES Servers(server_id),
    CONSTRAINT fk_alerts_rule   FOREIGN KEY (rule_id)   REFERENCES AlertRules(rule_id),
    CONSTRAINT fk_alerts_resolver FOREIGN KEY (resolved_by) REFERENCES Users(user_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. SMSLogs
-- -----------------------------------------------------------------------------
CREATE TABLE SMSLogs (
    sms_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id     BIGINT       NOT NULL,
    phone_number VARCHAR(20)  NOT NULL,
    message_body TEXT         NOT NULL,
    twilio_sid   VARCHAR(100) NULL,
    status       ENUM('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
    sent_at      DATETIME     NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_smslogs_alert FOREIGN KEY (alert_id) REFERENCES Alerts(alert_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. AuditLogs
-- -----------------------------------------------------------------------------
CREATE TABLE AuditLogs (
    log_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NULL,
    action      VARCHAR(100) NOT NULL,
    table_name  VARCHAR(100) NULL,
    record_id   BIGINT       NULL,
    old_value   JSON         NULL,
    new_value   JSON         NULL,
    ip_address  VARCHAR(45)  NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES Users(user_id)
) ENGINE=InnoDB;
