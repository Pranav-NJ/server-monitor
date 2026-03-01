USE server_monitor;

DELIMITER $$

CREATE PROCEDURE GetMetricHistory(IN p_server_id INT, IN p_hours INT)
BEGIN
    IF p_hours <= 1 THEN
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

DELIMITER ;
