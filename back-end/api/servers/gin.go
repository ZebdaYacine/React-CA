package servers

import (
	"back-end/api/controller"
	"back-end/api/router"
	"back-end/core"
	"back-end/feature/auth"
	"back-end/feature/upload"
	"back-end/graph"
	"back-end/pkg/config"
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
	graphQLServer := newGraphQLServer()
	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())

	authService := auth.NewService(auth.DefaultUsers(), config.JWTSecret(), config.TokenTTL())
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

func newGraphQLServer() *handler.Server {
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: &graph.Resolver{}}))
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
