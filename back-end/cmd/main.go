package main

import (
	"back-end/api/servers"
	"back-end/core"
)

func main() {
	servers.InitServer(core.GIN)
}
