package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Service struct {
	users  map[string]string
	secret []byte
	ttl    time.Duration
}

func NewService(users map[string]string, secret []byte, ttl time.Duration) *Service {
	copied := make(map[string]string, len(users))
	for k, v := range users {
		copied[k] = v
	}
	return &Service{
		users:  copied,
		secret: secret,
		ttl:    ttl,
	}
}

func (s *Service) Authenticate(username, password string) (string, error) {
	expected, ok := s.users[username]
	if !ok || expected != password {
		return "", errors.New("invalid credentials")
	}
	return s.signToken(username)
}

func (s *Service) signToken(username string) (string, error) {
	claims := jwt.MapClaims{
		"sub": username,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(s.ttl).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func (s *Service) ValidateToken(tokenString string) (string, error) {
	if tokenString == "" {
		return "", errors.New("missing token")
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return "", err
	}

	if !token.Valid {
		return "", errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid token claims")
	}

	username, _ := claims["sub"].(string)
	if username == "" {
		return "", errors.New("token missing subject")
	}

	return username, nil
}

func DefaultUsers() map[string]string {
	return map[string]string{
		"admin": "password123",
		"coder": "secret",
		"guest": "guest",
	}
}
