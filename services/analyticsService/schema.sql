CREATE TABLE IF NOT EXISTS default.events
(
    `event_name` String,
    `user_id` String,
    `properties` String,
    `timestamp` DateTime DEFAULT now()
)
ENGINE = MergeTree
PRIMARY KEY (event_name, user_id, timestamp); 