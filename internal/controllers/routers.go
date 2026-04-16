package controllers

import (
	"errors"
	"net/http"

	"github.com/armylong/armylong-go/internal/common/auth"
	authController "github.com/armylong/armylong-go/internal/controllers/auth"
	"github.com/armylong/armylong-go/internal/controllers/index"
	"github.com/armylong/armylong-go/internal/controllers/settings"
	"github.com/armylong/armylong-go/internal/controllers/sqlite_long"
	"github.com/armylong/armylong-go/internal/controllers/user"
	"github.com/armylong/armylong-go/internal/controllers/yangfen"

	"github.com/armylong/go-library/service/longgin"
	"github.com/gin-gonic/gin"
)

func RegisterRouters(engine *gin.Engine) {

	engine.LoadHTMLGlob(`./templates/*.gohtml`)

	engine.Static("/static", "./static")

	engine.Any(`/`, homepage)

	engine.NoRoute(func(ctx *gin.Context) {
		ctx.JSON(http.StatusNotFound, longgin.ErrorWithContext(ctx, errors.New("not found"), longgin.ErrorNotFound))
	})

	authGroup := engine.Group("/auth")
	longgin.RegisterJsonController(authGroup, &authController.AuthController{})

	userRoot := engine.Group("/user", auth.Middleware)
	longgin.RegisterJsonController(userRoot.Group("/demo"), &user.DemoController{})

	yangfenRoot := engine.Group("/yangfen", auth.Middleware)
	longgin.RegisterJsonController(yangfenRoot, &yangfen.YangfenController{})

	settingsRoot := engine.Group("/settings", auth.Middleware)
	longgin.RegisterJsonController(settingsRoot, &settings.SettingsController{})

	indexRoot := engine.Group("/index", auth.Middleware)
	longgin.RegisterJsonController(indexRoot, &index.IndexController{})

	sqliteLongRoot := engine.Group("/sqlite_long", auth.Middleware)
	longgin.RegisterJsonController(sqliteLongRoot, &sqlite_long.SqliteLongController{})
}
