-- =============================================================================
-- Seed data for development / demonstration
-- =============================================================================
USE server_monitor;

-- Default admin user (password: admin123 – bcrypt hash)
INSERT INTO Users (username, email, password_hash, phone, role_id) VALUES
  ('admin', 'admin@monitor.local',
   '$2b$12$71NPQHkWFSP3UScGwjgc..3BK9URy0onWrB9QFbXJgCMd8jfymQlm',
   '+1234567890', 1);
