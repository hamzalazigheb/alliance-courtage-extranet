CREATE TABLE IF NOT EXISTS bordereaux (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  archive_id INT NOT NULL,
  label VARCHAR(255) NOT NULL,
  period_month TINYINT NULL,
  period_year SMALLINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bordereaux_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bordereaux_archive FOREIGN KEY (archive_id) REFERENCES archives(id) ON DELETE CASCADE,
  INDEX idx_bordereaux_user (user_id),
  INDEX idx_bordereaux_period (period_year, period_month)
);


