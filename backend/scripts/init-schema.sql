-- Fresh install (TiDB / MySQL)

CREATE DATABASE IF NOT EXISTS solo_leveling;
USE solo_leveling;

CREATE TABLE IF NOT EXISTS hunters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(15) NULL,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY hunters_email_uq (email),
  UNIQUE KEY hunters_phone_uq (phone)
);

CREATE TABLE IF NOT EXISTS otp_challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  code_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY otp_challenges_identifier_uq (identifier),
  KEY otp_challenges_expires_idx (expires_at)
);

CREATE TABLE IF NOT EXISTS quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hunter_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  kind ENUM('count', 'distance', 'duration', 'yesno', 'steps') NOT NULL,
  target DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(32) NOT NULL,
  accent VARCHAR(16) NOT NULL DEFAULT '#7c6cf0',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY quests_hunter_idx (hunter_id),
  CONSTRAINT quests_hunter_id_hunters_id_fk
    FOREIGN KEY (hunter_id) REFERENCES hunters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hunter_id INT NOT NULL,
  date_key VARCHAR(10) NOT NULL,
  status ENUM('complete', 'partial', 'failed', 'empty') NOT NULL DEFAULT 'empty',
  submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY daily_logs_hunter_date_uq (hunter_id, date_key),
  KEY daily_logs_hunter_idx (hunter_id),
  CONSTRAINT daily_logs_hunter_id_hunters_id_fk
    FOREIGN KEY (hunter_id) REFERENCES hunters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_log_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  daily_log_id INT NOT NULL,
  quest_id INT NOT NULL,
  value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cleared BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY daily_log_items_uq (daily_log_id, quest_id),
  KEY daily_log_items_log_idx (daily_log_id),
  CONSTRAINT daily_log_items_daily_log_id_daily_logs_id_fk
    FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
  CONSTRAINT daily_log_items_quest_id_quests_id_fk
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ally_unlocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hunter_id INT NOT NULL,
  ally_id VARCHAR(64) NOT NULL,
  unlock_level INT NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ally_unlocks_uq (hunter_id, ally_id),
  KEY ally_unlocks_hunter_idx (hunter_id),
  CONSTRAINT ally_unlocks_hunter_id_hunters_id_fk
    FOREIGN KEY (hunter_id) REFERENCES hunters(id) ON DELETE CASCADE
);
