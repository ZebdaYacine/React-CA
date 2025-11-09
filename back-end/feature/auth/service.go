package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type Service struct {
	db     *gorm.DB
	secret []byte
	ttl    time.Duration
}

type User struct {
	ID       uint   `gorm:"column:ID;primaryKey"`
	Username string `gorm:"column:USERNAME"`
	Password string `gorm:"column:PASSWORD"`
	Role     string `gorm:"column:ROLE"`
}

func (User) TableName() string {
	return "USERS"
}

type Claims struct {
	Username string
	Role     string
}

func NewService(db *gorm.DB, secret []byte, ttl time.Duration) *Service {
	if db == nil {
		panic("auth service: nil database handle")
	}
	return &Service{
		db:     db,
		secret: secret,
		ttl:    ttl,
	}
}

func (s *Service) Authenticate(username, password string) (string, error) {
	if username == "" || password == "" {
		return "", errors.New("invalid credentials")
	}

	var user User
	if err := s.db.Where("USERNAME = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("invalid credentials")
		}
		return "", fmt.Errorf("failed to fetch user: %w", err)
	}

	if !strings.EqualFold(user.Password, hashPassword(password)) {
		return "", errors.New("invalid credentials")
	}

	return s.signToken(user.Username, user.Role)
}

func (s *Service) signToken(username, role string) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":  username,
		"role": role,
		"iat":  now.Unix(),
		"exp":  now.Add(s.ttl).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	if tokenString == "" {
		return nil, errors.New("missing token")
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	username, _ := mapClaims["sub"].(string)
	role, _ := mapClaims["role"].(string)
	if username == "" {
		return nil, errors.New("token missing subject")
	}

	return &Claims{Username: username, Role: role}, nil
}

func hashPassword(pwd string) string {
	sum := sha256.Sum256([]byte(pwd))
	return hex.EncodeToString(sum[:])
}
