-- =============================================================================
-- EmailLogs table & LogEmail stored procedure
-- =============================================================================

USE server_monitor;

-- -----------------------------------------------------------------------------
-- EmailLogs – stores every email notification attempt
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EmailLogs (
    email_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id     BIGINT       NOT NULL,
    recipient    VARCHAR(255) NOT NULL,
    subject      VARCHAR(255) NOT NULL,
    body         TEXT         NOT NULL,
    status       ENUM('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
    sent_at      DATETIME     NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_emaillogs_alert (alert_id),
    CONSTRAINT fk_emaillogs_alert FOREIGN KEY (alert_id) REFERENCES Alerts(alert_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- LogEmail(alert_id, recipient, subject, body, status)
-- Inserts an email log entry.
-- -----------------------------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE LogEmail(
    IN p_alert_id   BIGINT,
    IN p_recipient  VARCHAR(255),
    IN p_subject    VARCHAR(255),
    IN p_body       TEXT,
    IN p_status     VARCHAR(10)
)
BEGIN
    INSERT INTO EmailLogs (alert_id, recipient, subject, body, status, sent_at)
    VALUES (p_alert_id, p_recipient, p_subject, p_body, p_status, NOW());
END$$

DELIMITER ;
