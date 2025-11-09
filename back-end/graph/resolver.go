package graph

import "back-end/feature/dashboard"

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	DashboardService *dashboard.Service
}
