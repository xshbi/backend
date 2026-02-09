
import { Elysia } from "elysia";
import { AddressController } from "../controller/address.controller";
import { jwtMiddleware, type AuthContext } from "../middleware/jwt.middleware";

export const addressRoutes = new Elysia({ prefix: "/api/addresses" })
    .onBeforeHandle(jwtMiddleware)

    .get("/", (context) => AddressController.getAddresses(context as unknown as AuthContext))

    .post("/", (context) => AddressController.createAddress(context as unknown as AuthContext))

    .delete("/:id", (context) => AddressController.deleteAddress(context as unknown as AuthContext));
