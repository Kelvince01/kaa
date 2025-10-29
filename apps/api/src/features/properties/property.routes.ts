import Elysia from "elysia";

import { propertyFavoriteController } from "./favorite.controller";
import { propertyController } from "./property.controller";
import {
  propertyAIController,
  propertyMonitoringController,
} from "./property.integration";
import { propertyConditionController } from "./property-condition.controller";
import { propertyInspectionController } from "./property-inspection.controller";
import { searchController } from "./search/search.controller";
import { valuationController } from "./valuation.controller";

export const propertyRoutes = new Elysia({
  // prefix: "/properties",
  detail: {
    tags: ["properties"],
    summary: "Property",
    description: "Property endpoints",
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .use(propertyController)
  .use(propertyFavoriteController)
  .use(propertyInspectionController)
  .use(propertyConditionController)
  .use(valuationController)
  .use(searchController)
  .use(propertyMonitoringController)
  .use(propertyAIController);
