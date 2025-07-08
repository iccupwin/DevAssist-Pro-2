-- Инициализация базы данных DevAssist Pro
-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Создание индексов для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Создание схем
CREATE SCHEMA IF NOT EXISTS public;

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Предварительные настройки для оптимизации
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Создание пользователей и ролей
DO $$
BEGIN
    -- Создание роли для чтения
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'devassist_readonly') THEN
        CREATE ROLE devassist_readonly;
    END IF;
    
    -- Создание роли для записи
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'devassist_readwrite') THEN
        CREATE ROLE devassist_readwrite;
    END IF;
    
    -- Предоставление прав
    GRANT CONNECT ON DATABASE devassist_pro TO devassist_readonly;
    GRANT USAGE ON SCHEMA public TO devassist_readonly;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO devassist_readonly;
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO devassist_readonly;
    
    GRANT CONNECT ON DATABASE devassist_pro TO devassist_readwrite;
    GRANT USAGE ON SCHEMA public TO devassist_readwrite;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO devassist_readwrite;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO devassist_readwrite;
    
    -- Предоставление прав на будущие таблицы
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO devassist_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO devassist_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO devassist_readwrite;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO devassist_readwrite;
    
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Roles already exist, skipping creation.';
END
$$;