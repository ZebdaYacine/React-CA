package commune

type Commune struct {
	Code string `gorm:"column:code;type:varchar(8);primaryKey"`
	Name string `gorm:"column:name;type:varchar(128);not null"`
}

func (Commune) TableName() string {
	return "communes"
}
