-- =============================================================================
-- Log Viewer (paginated) + Server Uptime History procedures
-- =============================================================================

USE server_monitor;

DELIMITER $$

-- -----------------------------------------------------------------------------
-- GetPaginatedLogs(log_type, severity_filter, page, page_size)
--   log_type: 'alerts' | 'sms' | 'email' | 'audit'
--   severity_filter: 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'
--   Returns paginated rows + total_count in a second result-set.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetPaginatedLogs$$
CREATE PROCEDURE GetPaginatedLogs(
    IN p_log_type       VARCHAR(10),
    IN p_severity       VARCHAR(10),
    IN p_page           INT,
    IN p_page_size      INT
)
BEGIN
    DECLARE v_offset INT DEFAULT (p_page - 1) * p_page_size;

    IF p_log_type = 'alerts' THEN
        SELECT SQL_CALC_FOUND_ROWS
            a.alert_id      AS id,
            s.hostname,
            a.metric_name,
            a.metric_value,
            a.threshold,
            a.severity,
            a.status,
            a.message,
            a.created_at,
            a.resolved_at
        FROM Alerts a
        JOIN Servers s ON s.server_id = a.server_id
        WHERE (p_severity = 'ALL' OR a.severity = p_severity)
        ORDER BY a.created_at DESC
        LIMIT p_page_size OFFSET v_offset;

    ELSEIF p_log_type = 'sms' THEN
        SELECT SQL_CALC_FOUND_ROWS
            sl.sms_id       AS id,
            sl.phone_number,
            sl.message_body  AS message,
            sl.twilio_sid,
            sl.status,
            sl.sent_at       AS created_at
        FROM SMSLogs sl
        ORDER BY sl.sent_at DESC
        LIMIT p_page_size OFFSET v_offset;

    ELSEIF p_log_type = 'email' THEN
        SELECT SQL_CALC_FOUND_ROWS
            el.email_id     AS id,
            el.recipient,
            el.subject,
            el.status,
            el.sent_at       AS created_at
        FROM EmailLogs el
        ORDER BY el.created_at DESC
        LIMIT p_page_size OFFSET v_offset;

    ELSEIF p_log_type = 'audit' THEN
        SELECT SQL_CALC_FOUND_ROWS
            al.log_id       AS id,
            al.table_name,
            al.action,
            al.old_value,
            al.new_value,
            al.changed_by,
            al.changed_at   AS created_at
        FROM AuditLogs al
        ORDER BY al.changed_at DESC
        LIMIT p_page_size OFFSET v_offset;
    END IF;

    -- Second result-set: total row count for pagination controls
    SELECT FOUND_ROWS() AS total_count;
END$$

-- -----------------------------------------------------------------------------
-- GetUptimeHistory(server_id, hours_back)
--   Aggregates server status per hour based on metric presence.
--   A server is "UP" in an hour if it has >0 metrics in that hour.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetUptimeHistory$$
CREATE PROCEDURE GetUptimeHistory(
    IN p_server_id INT,
    IN p_hours     INT
)
BEGIN
    SELECT
        DATE_FORMAT(recorded_at, '%Y-%m-%d %H:00:00') AS hour_bucket,
        COUNT(*)                                        AS metric_count,
        ROUND(AVG(cpu_percent), 1)                      AS avg_cpu,
        ROUND(AVG(ram_percent), 1)                      AS avg_ram,
        ROUND(AVG(disk_percent), 1)                     AS avg_disk,
        CASE
            WHEN COUNT(*) > 0 THEN 'UP'
            ELSE 'DOWN'
        END                                              AS status
    FROM Metrics
    WHERE server_id = p_server_id
      AND recorded_at >= NOW() - INTERVAL p_hours HOUR
    GROUP BY DATE_FORMAT(recorded_at, '%Y-%m-%d %H:00:00')
    ORDER BY hour_bucket ASC;
END$$

-- -----------------------------------------------------------------------------
-- GetLogCounts()
--   Quick counts for the log viewer badges.
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetLogCounts$$
CREATE PROCEDURE GetLogCounts()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM Alerts)   AS alert_count,
        (SELECT COUNT(*) FROM SMSLogs)  AS sms_count,
        (SELECT COUNT(*) FROM EmailLogs) AS email_count,
        (SELECT COUNT(*) FROM AuditLogs) AS audit_count;
END$$

DELIMITER ;
