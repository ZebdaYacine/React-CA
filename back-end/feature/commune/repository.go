package commune

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	if db == nil {
		panic("commune repository: nil database handle")
	}
	return &Repository{db: db}
}

func (r *Repository) AutoMigrate(ctx context.Context) error {
	if err := r.db.WithContext(ctx).AutoMigrate(&Commune{}); err != nil {
		return fmt.Errorf("commune repository: migrate table: %w", err)
	}
	return nil
}

func (r *Repository) EnsureSeedData(ctx context.Context) error {
	var count int64
	if err := r.db.WithContext(ctx).Model(&Commune{}).Count(&count).Error; err != nil {
		return fmt.Errorf("commune repository: count rows: %w", err)
	}
	if count > 0 {
		return nil
	}

	if err := r.db.WithContext(ctx).Create(seedCommunes).Error; err != nil {
		return fmt.Errorf("commune repository: seed rows: %w", err)
	}
	return nil
}

func (r *Repository) List(ctx context.Context) ([]Commune, error) {
	var communes []Commune
	if err := r.db.WithContext(ctx).Order("code ASC").Find(&communes).Error; err != nil {
		return nil, fmt.Errorf("commune repository: list communes: %w", err)
	}
	return communes, nil
}

var seedCommunes = []Commune{
	{Code: "0301", Name: "Laghouat"},
	{Code: "0302", Name: "Ksar El Hirane"},
	{Code: "0303", Name: "Benacer Benchohra"},
	{Code: "0304", Name: "Sidi Makhlouf"},
	{Code: "0305", Name: "Hassi Dalaa"},
	{Code: "0306", Name: "Hassi R'mel"},
	{Code: "0307", Name: "Ain Madhi"},
	{Code: "0308", Name: "Tadjmout"},
	{Code: "0309", Name: "Kheneg"},
	{Code: "0310", Name: "Gueltat Sidi Saad"},
	{Code: "0311", Name: "Ain Sidi Ali"},
	{Code: "0312", Name: "El Beidha"},
	{Code: "0313", Name: "Brida"},
	{Code: "0314", Name: "El Ghicha"},
	{Code: "0315", Name: "Hadj Mechri"},
	{Code: "0316", Name: "Sebgag"},
	{Code: "0317", Name: "Taouiala"},
	{Code: "0318", Name: "Tadjerouna"},
	{Code: "0319", Name: "Aflou"},
	{Code: "0320", Name: "El Assafia"},
	{Code: "0321", Name: "Oued Morra"},
	{Code: "0322", Name: "Oued M'Zi"},
	{Code: "0323", Name: "El Houita"},
	{Code: "0324", Name: "Sidi Bouzid"},
}
