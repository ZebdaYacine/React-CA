package database

import (
	"back-end/pkg/config"
	"errors"
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect() (*gorm.DB, error) {
	dsn := config.DatabaseDSN()
	if dsn == "" {
		return nil, errors.New("database DSN is not configured (missing DB_DSN env variable)")
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		SkipDefaultTransaction: true,
		Logger:                 logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve sql.DB handle: %w", err)
	}

	sqlDB.SetMaxIdleConns(config.DatabaseMaxIdleConns())
	sqlDB.SetMaxOpenConns(config.DatabaseMaxOpenConns())
	sqlDB.SetConnMaxLifetime(config.DatabaseConnMaxLifetime())

	return db, nil
}
