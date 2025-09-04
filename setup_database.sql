-- Quick database setup for testing
-- Create a simple user for testing (since we don't have authentication yet)
INSERT INTO users (username, email, password_hash, first_name, last_name) 
VALUES ('testuser', 'test@example.com', 'hashed_password', 'Test', 'User')
ON CONFLICT (email) DO NOTHING;

-- Verify categories exist (these should be created by the schema)
SELECT COUNT(*) as category_count FROM categories;