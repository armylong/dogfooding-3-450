package index

import (
	"context"

	indexBusiness "github.com/armylong/armylong-go/internal/business/index"
	indexCs "github.com/armylong/armylong-go/internal/cs/index"
)

type IndexController struct{}

func (c *IndexController) ActionDesktopOs(ctx context.Context, req *indexCs.DesktopOsRequest) (*indexCs.DesktopOsResponse, error) {
	return indexBusiness.HomeBusiness.DesktopOs(ctx, req)
}
