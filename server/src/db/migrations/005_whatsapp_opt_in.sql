ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT false;

UPDATE users
SET whatsapp_opt_in = false
WHERE whatsapp_opt_in IS NULL;