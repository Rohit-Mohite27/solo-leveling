-- Run in TiDB SQL Editor (database: solo_leveling) before enabling email OTP.

USE solo_leveling;

-- Hunters: add email, allow null phone
ALTER TABLE hunters ADD COLUMN email VARCHAR(255) NULL;
ALTER TABLE hunters MODIFY COLUMN phone VARCHAR(15) NULL;

-- OTP challenges: widen key column for emails
ALTER TABLE otp_challenges CHANGE COLUMN phone identifier VARCHAR(255) NOT NULL;
-- Drop old unique name if it exists, add new one (TiDB may keep old index name)
ALTER TABLE otp_challenges DROP INDEX otp_challenges_phone_uq;
ALTER TABLE otp_challenges ADD UNIQUE KEY otp_challenges_identifier_uq (identifier);

-- Unique email (ignore if already exists)
ALTER TABLE hunters ADD UNIQUE KEY hunters_email_uq (email);
