#!/bin/bash
# Initialize database by running migration scripts in order
set -e

echo "==> Waiting for MySQL to be ready..."
until mysqladmin ping -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" --silent; do
    sleep 2
done

echo "==> Running schema migration..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < /docker-entrypoint-initdb.d/001_schema.sql

echo "==> Creating triggers..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < /docker-entrypoint-initdb.d/002_triggers.sql

echo "==> Creating stored procedures..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < /docker-entrypoint-initdb.d/003_procedures.sql

echo "==> Seeding data..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < /docker-entrypoint-initdb.d/004_seed.sql

echo "==> Database initialization complete."
