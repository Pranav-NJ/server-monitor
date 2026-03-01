-- =============================================================================
-- Stored Procedures – Encapsulated Business Logic
-- =============================================================================

USE server_monitor;

DELIMITER $$

-- -----------------------------------------------------------------------------
-- GetServerHealth(server_id)
-- Returns latest metrics, server status, and active alert count.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE GetServerHealth(IN p_server_id INT)
BEGIN
    SELECT
        s.server_id,
        s.hostname,
        s.ip_address,
        s.os_info,
        s.status,
        m.cpu_percent   AS latest_cpu,
        m.ram_percent   AS latest_ram,
        m.disk_percent  AS latest_disk,
        m.recorded_at   AS last_seen,
        COALESCE(a.active_alerts, 0) AS active_alerts
    FROM Servers s
    LEFT JOIN (
        SELECT server_id, cpu_percent, ram_percent, disk_percent, recorded_at
        FROM Metrics
        WHERE server_id = p_server_id
        ORDER BY recorded_at DESC
        LIMIT 1
    ) m ON m.server_id = s.server_id
    LEFT JOIN (
        SELECT server_id, COUNT(*) AS active_alerts
        FROM Alerts
        WHERE server_id = p_server_id
          AND status IN ('PENDING', 'SENT')
        GROUP BY server_id
    ) a ON a.server_id = s.server_id
    WHERE s.server_id = p_server_id;
END$$

-- -----------------------------------------------------------------------------
-- GetLatestMetrics(server_id)
-- Returns last 50 metric entries for charting.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE GetLatestMetrics(IN p_server_id INT)
BEGIN
    SELECT
        metric_id,
        server_id,
        cpu_percent,
        ram_percent,
        disk_percent,
        recorded_at
    FROM Metrics
    WHERE server_id = p_server_id
    ORDER BY recorded_at DESC
    LIMIT 50;
END$$

-- -----------------------------------------------------------------------------
-- GetMetricHistory(server_id, hours_back)
-- Returns metric data points for the given time range.
-- Uses AVG() with time bucketing for large ranges to keep chart smooth.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE GetMetricHistory(IN p_server_id INT, IN p_hours INT)
BEGIN
    IF p_hours <= 1 THEN
        -- Last 1 hour: raw data points (every 10s = ~360 rows max)
        SELECT
            metric_id,
            cpu_percent,
            ram_percent,
            disk_percent,
            recorded_at
        FROM Metrics
        WHERE server_id = p_server_id
          AND recorded_at >= NOW() - INTERVAL p_hours HOUR
        ORDER BY recorded_at ASC;

    ELSEIF p_hours <= 6 THEN
        -- Last 6 hours: average per minute (~360 data points)
        SELECT
            NULL AS metric_id,
            ROUND(AVG(cpu_percent), 1) AS cpu_percent,
            ROUND(AVG(ram_percent), 1) AS ram_percent,
            ROUND(AVG(disk_percent), 1) AS disk_percent,
            DATE_FORMAT(recorded_at, '%Y-%m-%d %H:%i:00') AS recorded_at
        FROM Metrics
        WHERE server_id = p_server_id
          AND recorded_at >= NOW() - INTERVAL p_hours HOUR
        GROUP BY DATE_FORMAT(recorded_at, '%Y-%m-%d %H:%i')
        ORDER BY recorded_at ASC;

    ELSEIF p_hours <= 24 THEN
        -- Last 24 hours: average per 5 minutes (~288 data points)
        SELECT
            NULL AS metric_id,
            ROUND(AVG(cpu_percent), 1) AS cpu_percent,
            ROUND(AVG(ram_percent), 1) AS ram_percent,
            ROUND(AVG(disk_percent), 1) AS disk_percent,
            DATE_FORMAT(
                DATE_SUB(recorded_at, INTERVAL MINUTE(recorded_at) MOD 5 MINUTE),
                '%Y-%m-%d %H:%i:00'
            ) AS recorded_at
        FROM Metrics
        WHERE server_id = p_server_id
          AND recorded_at >= NOW() - INTERVAL p_hours HOUR
        GROUP BY DATE_FORMAT(
            DATE_SUB(recorded_at, INTERVAL MINUTE(recorded_at) MOD 5 MINUTE),
            '%Y-%m-%d %H:%i'
        )
        ORDER BY recorded_at ASC;

    ELSE
        -- 7 days+: average per hour (~168 data points)
        SELECT
            NULL AS metric_id,
            ROUND(AVG(cpu_percent), 1) AS cpu_percent,
            ROUND(AVG(ram_percent), 1) AS ram_percent,
            ROUND(AVG(disk_percent), 1) AS disk_percent,
            DATE_FORMAT(recorded_at, '%Y-%m-%d %H:00:00') AS recorded_at
        FROM Metrics
        WHERE server_id = p_server_id
          AND recorded_at >= NOW() - INTERVAL p_hours HOUR
        GROUP BY DATE_FORMAT(recorded_at, '%Y-%m-%d %H')
        ORDER BY recorded_at ASC;
    END IF;
END$$

-- -----------------------------------------------------------------------------
-- ResolveAlert(alert_id, user_id)
-- Marks an alert as RESOLVED within a transaction.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE ResolveAlert(IN p_alert_id BIGINT, IN p_user_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Failed to resolve alert. Transaction rolled back.';
    END;

    START TRANSACTION;

    UPDATE Alerts
    SET status      = 'RESOLVED',
        resolved_at = NOW(),
        resolved_by = p_user_id
    WHERE alert_id  = p_alert_id
      AND status   IN ('PENDING', 'SENT', 'ACKNOWLEDGED');

    IF ROW_COUNT() = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Alert not found or already resolved.';
    END IF;

    COMMIT;

    SELECT alert_id, status, resolved_at, resolved_by
    FROM Alerts
    WHERE alert_id = p_alert_id;
END$$

-- -----------------------------------------------------------------------------
-- GetAlertSummary()
-- Returns aggregated alert counts by severity and status.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE GetAlertSummary()
BEGIN
    SELECT
        severity,
        status,
        COUNT(*) AS alert_count
    FROM Alerts
    GROUP BY severity, status
    ORDER BY
        FIELD(severity, 'CRITICAL', 'WARNING', 'INFO'),
        FIELD(status, 'PENDING', 'SENT', 'ACKNOWLEDGED', 'RESOLVED');
END$$

-- -----------------------------------------------------------------------------
-- GetPendingAlerts()
-- Returns CRITICAL alerts ready to be dispatched via SMS.
-- WARNING alerts are shown on the dashboard only (no SMS).
-- -----------------------------------------------------------------------------
CREATE PROCEDURE GetPendingAlerts()
BEGIN
    SELECT
        a.alert_id,
        a.server_id,
        s.hostname,
        a.metric_name,
        a.metric_value,
        a.threshold,
        a.severity,
        a.message,
        a.created_at
    FROM Alerts a
    JOIN Servers s ON s.server_id = a.server_id
    WHERE a.status = 'PENDING'
      AND a.severity = 'CRITICAL'
    ORDER BY a.created_at ASC;
END$$

-- -----------------------------------------------------------------------------
-- MarkAlertSent(alert_id)
-- Updates alert status to SENT after SMS dispatch.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE MarkAlertSent(IN p_alert_id BIGINT)
BEGIN
    UPDATE Alerts
    SET status = 'SENT'
    WHERE alert_id = p_alert_id AND status = 'PENDING';
END$$

-- -----------------------------------------------------------------------------
-- LogSMS(alert_id, phone, body, sid, status)
-- Inserts an SMS log entry.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE LogSMS(
    IN p_alert_id     BIGINT,
    IN p_phone        VARCHAR(20),
    IN p_body         TEXT,
    IN p_twilio_sid   VARCHAR(100),
    IN p_status       VARCHAR(10)
)
BEGIN
    INSERT INTO SMSLogs (alert_id, phone_number, message_body, twilio_sid, status, sent_at)
    VALUES (p_alert_id, p_phone, p_body, p_twilio_sid, p_status, NOW());
END$$

-- -----------------------------------------------------------------------------
-- GetAllServers()
-- Returns all registered servers.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE GetAllServers()
BEGIN
    SELECT server_id, hostname, ip_address, os_info, status, created_at, updated_at
    FROM Servers
    ORDER BY hostname;
END$$

-- -----------------------------------------------------------------------------
-- GetAlerts(limit, offset)
-- Returns paginated alert history.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE GetAlerts(IN p_limit INT, IN p_offset INT)
BEGIN
    SELECT
        a.alert_id,
        a.server_id,
        s.hostname,
        a.metric_name,
        a.metric_value,
        a.threshold,
        a.severity,
        a.status,
        a.message,
        a.created_at,
        a.resolved_at,
        a.resolved_by
    FROM Alerts a
    JOIN Servers s ON s.server_id = a.server_id
    ORDER BY a.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END$$

DELIMITER ;
