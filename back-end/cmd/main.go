package main

import (
	"back-end/api/servers"
	"back-end/core"
	"back-end/pkg/config"
	"log"
)

func main() {
	if err := config.LoadEnv(); err != nil {
		log.Fatalf("failed to load environment: %v", err)
	}
	servers.InitServer(core.GIN)
}
