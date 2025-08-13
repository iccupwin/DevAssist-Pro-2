import os
import pytest

# Ensure module-level settings can be imported without triggering validation
os.environ.setdefault('ENVIRONMENT', 'development')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret')

from backend.shared.config import BaseServiceSettings


def test_production_default_jwt_secret_raises():
    with pytest.raises(ValueError):
        BaseServiceSettings(
            environment='production',
            jwt_secret_key='your_jwt_secret_key_change_in_production',
            postgres_url='postgresql://user:secure@db:5432/dev',
            redis_url='redis://:secure@redis:6379/0',
        )


def test_production_default_postgres_password_raises():
    with pytest.raises(ValueError):
        BaseServiceSettings(
            environment='production',
            jwt_secret_key='supersecret',
            postgres_url='postgresql://user:devassist_password@db:5432/dev',
            redis_url='redis://:secure@redis:6379/0',
        )


def test_production_default_redis_password_raises():
    with pytest.raises(ValueError):
        BaseServiceSettings(
            environment='production',
            jwt_secret_key='supersecret',
            postgres_url='postgresql://user:secure@db:5432/dev',
            redis_url='redis://:redis_password@redis:6379/0',
        )


def test_production_valid_config_passes():
    settings = BaseServiceSettings(
        environment='production',
        jwt_secret_key='supersecret',
        postgres_url='postgresql://user:secure@db:5432/dev',
        redis_url='redis://:secure@redis:6379/0',
    )
    assert settings.environment == 'production'
