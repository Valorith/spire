package models

type DbStr struct {
	ID    int    `json:"id" gorm:"Column:id;primaryKey;autoIncrement:false"`
	Type  int    `json:"type" gorm:"Column:type;primaryKey;autoIncrement:false"`
	Value string `json:"value" gorm:"Column:value"`
}

func (DbStr) TableName() string {
    return "db_str"
}

func (DbStr) Relationships() []string {
    return []string{}
}

func (DbStr) Connection() string {
    return ""
}
