USE server_monitor;

DELIMITER $$

CREATE TRIGGER trg_metrics_after_insert
AFTER INSERT ON Metrics
FOR EACH ROW
BEGIN
    INSERT INTO Alerts (server_id, rule_id, metric_name, metric_value, threshold, severity, message)
    SELECT
        NEW.server_id,
        ar.rule_id,
        ar.metric_name,
        CASE ar.metric_name
            WHEN 'cpu_percent'  THEN NEW.cpu_percent
            WHEN 'ram_percent'  THEN NEW.ram_percent
            WHEN 'disk_percent' THEN NEW.disk_percent
        END,
        ar.threshold,
        ar.severity,
        CONCAT(
            UPPER(ar.severity), ': ', ar.metric_name,
            ' = ',
            CASE ar.metric_name
                WHEN 'cpu_percent'  THEN NEW.cpu_percent
                WHEN 'ram_percent'  THEN NEW.ram_percent
                WHEN 'disk_percent' THEN NEW.disk_percent
            END,
            '% exceeded threshold ', ar.threshold, '%',
            ' on server ', NEW.server_id
        )
    FROM AlertRules ar
    WHERE ar.is_active = TRUE
      AND (ar.server_id IS NULL OR ar.server_id = NEW.server_id)
      -- 5-minute cooldown: skip if same rule+server fired recently
      AND NOT EXISTS (
          SELECT 1 FROM Alerts a
          WHERE a.server_id = NEW.server_id
            AND a.rule_id   = ar.rule_id
            AND a.created_at >= NOW() - INTERVAL 5 MINUTE
      )
      AND (
            (ar.operator = '>'  AND
                CASE ar.metric_name
                    WHEN 'cpu_percent'  THEN NEW.cpu_percent
                    WHEN 'ram_percent'  THEN NEW.ram_percent
                    WHEN 'disk_percent' THEN NEW.disk_percent
                END > ar.threshold)
         OR (ar.operator = '>=' AND
                CASE ar.metric_name
                    WHEN 'cpu_percent'  THEN NEW.cpu_percent
                    WHEN 'ram_percent'  THEN NEW.ram_percent
                    WHEN 'disk_percent' THEN NEW.disk_percent
                END >= ar.threshold)
         OR (ar.operator = '<'  AND
                CASE ar.metric_name
                    WHEN 'cpu_percent'  THEN NEW.cpu_percent
                    WHEN 'ram_percent'  THEN NEW.ram_percent
                    WHEN 'disk_percent' THEN NEW.disk_percent
                END < ar.threshold)
         OR (ar.operator = '<=' AND
                CASE ar.metric_name
                    WHEN 'cpu_percent'  THEN NEW.cpu_percent
                    WHEN 'ram_percent'  THEN NEW.ram_percent
                    WHEN 'disk_percent' THEN NEW.disk_percent
                END <= ar.threshold)
         OR (ar.operator = '='  AND
                CASE ar.metric_name
                    WHEN 'cpu_percent'  THEN NEW.cpu_percent
                    WHEN 'ram_percent'  THEN NEW.ram_percent
                    WHEN 'disk_percent' THEN NEW.disk_percent
                END = ar.threshold)
      );
END$$

DELIMITER ;
