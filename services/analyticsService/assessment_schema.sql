CREATE TABLE IF NOT EXISTS default.assessment_events
(
    `user_id` String,
    `template_id` String,
    `score` Float32,
    `timestamp` DateTime DEFAULT now()
)
ENGINE = MergeTree
PRIMARY KEY (user_id, template_id, timestamp); 