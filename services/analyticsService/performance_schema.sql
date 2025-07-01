CREATE TABLE IF NOT EXISTS default.performance_metrics
(
    `service_name` String,
    `endpoint` String,
    `response_time_ms` UInt32,
    `status_code` UInt16,
    `timestamp` DateTime DEFAULT now()
)
ENGINE = MergeTree
PRIMARY KEY (service_name, endpoint, timestamp); 