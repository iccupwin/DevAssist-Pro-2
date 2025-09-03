"""Add dashboard models

Revision ID: 0002
Revises: 0001
Create Date: 2025-01-17 12:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create dashboard_modules table
    op.create_table('dashboard_modules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=100), nullable=True),
        sa.Column('route', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False),
        sa.Column('is_premium', sa.Boolean(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dashboard_modules_id'), 'dashboard_modules', ['id'], unique=False)
    op.create_index(op.f('ix_dashboard_modules_name'), 'dashboard_modules', ['name'], unique=True)
    
    # Create user_activities table
    op.create_table('user_activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('activity_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('module', sa.String(length=100), nullable=True),
        sa.Column('entity_type', sa.String(length=100), nullable=True),
        sa.Column('entity_id', sa.String(length=100), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_activities_id'), 'user_activities', ['id'], unique=False)
    op.create_index('ix_user_activities_user_created', 'user_activities', ['user_id', 'created_at'], unique=False)
    
    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('action_url', sa.String(length=500), nullable=True),
        sa.Column('action_label', sa.String(length=100), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index('ix_notifications_user_read', 'notifications', ['user_id', 'is_read'], unique=False)
    
    # Create dashboard_preferences table
    op.create_table('dashboard_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.JSON(), nullable=False),
        sa.Column('is_global', sa.Boolean(), nullable=False),
        sa.Column('module', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dashboard_preferences_id'), 'dashboard_preferences', ['id'], unique=False)
    op.create_index('ix_dashboard_preferences_user_key', 'dashboard_preferences', ['user_id', 'key'], unique=True)
    
    # Create system_metrics table
    op.create_table('system_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('metric_type', sa.String(length=50), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_metrics_id'), 'system_metrics', ['id'], unique=False)
    op.create_index('ix_system_metrics_name_time', 'system_metrics', ['metric_name', 'recorded_at'], unique=False)
    
    # Create search_indices table
    op.create_table('search_indices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('keywords', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('search_vector', postgresql.TSVECTOR(), nullable=True),
        sa.Column('last_indexed', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_search_indices_entity'), 'search_indices', ['entity_type', 'entity_id'], unique=True)
    op.create_index(op.f('ix_search_indices_id'), 'search_indices', ['id'], unique=False)
    op.create_index('ix_search_indices_search_vector', 'search_indices', ['search_vector'], unique=False, postgresql_using='gin')
    
    # Insert default dashboard modules
    dashboard_modules_data = [
        ('kp-analyzer', 'КП Анализатор', 'Анализ коммерческих предложений', 'document-text', '/kp-analyzer', 'analysis', True, False, 1),
        ('tz-generator', 'ТЗ Генератор', 'Генерация технических заданий', 'file-plus', '/tz-generator', 'creation', True, True, 2),
        ('project-evaluation', 'Оценка проектов', 'Комплексная оценка проектов', 'trending-up', '/project-evaluation', 'analysis', True, True, 3),
        ('marketing-planner', 'Маркетинг план', 'Планирование маркетинговых кампаний', 'megaphone', '/marketing-planner', 'planning', True, True, 4),
        ('knowledge-base', 'База знаний', 'Управление знаниями и документами', 'book-open', '/knowledge-base', 'management', True, False, 5),
        ('reports', 'Отчеты', 'Генерация и управление отчетами', 'file-text', '/reports', 'reporting', True, False, 6),
        ('analytics', 'Аналитика', 'Бизнес-аналитика и метрики', 'bar-chart', '/analytics', 'analysis', True, True, 7),
        ('settings', 'Настройки', 'Настройки системы и профиля', 'settings', '/settings', 'system', True, False, 8),
    ]
    
    for module_data in dashboard_modules_data:
        op.execute(f"""
            INSERT INTO dashboard_modules (name, display_name, description, icon, route, category, is_enabled, is_premium, order_index, config)
            VALUES ('{module_data[0]}', '{module_data[1]}', '{module_data[2]}', '{module_data[3]}', '{module_data[4]}', '{module_data[5]}', {module_data[6]}, {module_data[7]}, {module_data[8]}, '{{}}')
        """)


def downgrade() -> None:
    op.drop_table('search_indices')
    op.drop_table('system_metrics')
    op.drop_table('dashboard_preferences')
    op.drop_table('notifications')
    op.drop_table('user_activities')
    op.drop_table('dashboard_modules')