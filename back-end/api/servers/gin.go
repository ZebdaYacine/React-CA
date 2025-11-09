package servers

import (
	"back-end/api/controller"
	"back-end/api/router"
	"back-end/core"
	"back-end/feature/auth"
	"back-end/feature/commune"
	"back-end/feature/dashboard"
	"back-end/feature/upload"
	"back-end/graph"
	"back-end/pkg/config"
	"back-end/pkg/database"
	"context"
	"log"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gin-gonic/gin"
)

func InitServer(serverName string) {
	switch serverName {
	case core.GIN:
		startGinServer()
	default:
		log.Fatalf("unsupported server: %s", serverName)
	}
}

func startGinServer() {
	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())

	db, err := database.Connect()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	ctx := context.Background()
	communeRepo := commune.NewRepository(db)
	if err := communeRepo.AutoMigrate(ctx); err != nil {
		log.Fatalf("failed to prepare commune table: %v", err)
	}
	if err := communeRepo.EnsureSeedData(ctx); err != nil {
		log.Fatalf("failed to seed commune table: %v", err)
	}
	if communes, err := communeRepo.List(ctx); err != nil {
		log.Printf("warning: unable to load communes catalog: %v", err)
	} else {
		dashboard.UseCommuneCatalog(communes)
	}

	dashboardService := dashboard.NewService(db, communeRepo)
	graphQLServer := newGraphQLServer(&graph.Resolver{DashboardService: dashboardService})

	authService := auth.NewService(db, config.JWTSecret(), config.TokenTTL())
	uploadService, err := upload.NewService("uploads")
	if err != nil {
		log.Fatalf("failed to prepare upload directory: %v", err)
	}
	uploadController := controller.NewUploadController(uploadService)

	router.Setup(router.Config{
		Engine:           engine,
		GraphQLServer:    graphQLServer,
		AuthService:      authService,
		UploadController: uploadController,
	})

	if err := engine.Run(config.ServerPort()); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}

func newGraphQLServer(resolver *graph.Resolver) *handler.Server {
	if resolver == nil {
		log.Fatal("graph resolver is not configured")
	}

	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))
	srv.AroundOperations(func(ctx context.Context, next graphql.OperationHandler) graphql.ResponseHandler {
		if opCtx := graphql.GetOperationContext(ctx); opCtx != nil {
			log.Printf("GraphQL query received: name=%q query=%s", opCtx.OperationName, opCtx.RawQuery)
		} else {
			log.Println("GraphQL query received: <unknown operation>")
		}
		return next(ctx)
	})
	srv.AroundResponses(func(ctx context.Context, next graphql.ResponseHandler) *graphql.Response {
		resp := next(ctx)
		if resp == nil {
			log.Println("GraphQL response: <nil>")
			return nil
		}

		opName := "<unknown operation>"
		if opCtx := graphql.GetOperationContext(ctx); opCtx != nil {
			opName = opCtx.OperationName
		}

		if len(resp.Errors) > 0 {
			log.Printf("GraphQL response (op=%q) returned %d error(s): %v", opName, len(resp.Errors), resp.Errors)
		} else {
			log.Printf("GraphQL response (op=%q): %s", opName, string(resp.Data))
		}

		return resp
	})
	return srv
}
