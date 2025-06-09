/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServerRoute } from "@hapi/hapi";
import * as userController from "../controllers/userController";
import * as bankController from "../controllers/bankController";
import * as adminController from "../controllers/adminController";
import * as bankSchemas from "../validations/bankSchema";
import authMiddleware from "../lib/middleware/authMiddleware";
import { userOnly, adminOnly } from "../lib/middleware/roleMiddleware";

const failAction = (_request: any, h: any, err: any) => {
  return h.response({ error: err.details[0].message }).code(400).takeover();
};

export const routes: ServerRoute[] = [
  // --------------------- HOMEPAGE ---------------------
  {
    method: "GET",
    path: "/",
    handler: async (_request, h) => {
      const welcomeMessage = "Welcome to our Nexpay APIs";
      return h
        .response({ status: "success", message: welcomeMessage })
        .code(200);
    },
  },

  // ---------- USER ----------
  {
    method: "POST",
    path: "/login",
    handler: userController.login,
    options: {
      validate: { payload: bankSchemas.loginSchema, failAction },
    },
  },
  {
    method: "POST",
    path: "/logout",
    handler: userController.logout,
    options: {
      pre: [authMiddleware],
    },
  },
  {
    method: "GET",
    path: "/users/info",
    handler: userController.userInfo,
    options: {
      pre: [authMiddleware],
    },
  },
  {
    method: "POST",
    path: "/users/register",
    handler: userController.registerUser, // otomatis role user
    options: {
      validate: { payload: bankSchemas.registerUser, failAction },
    },
  },
  {
    method: "PUT",
    path: "/users/photo",
    handler: userController.updateProfilePhoto,
    options: {
      pre: [authMiddleware, userOnly],
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        maxBytes: 2 * 1024 * 1024,
        allow: "multipart/form-data",
      },
      validate: {
        payload: bankSchemas.updatePhotoSchema,
        failAction,
      },
    },
  },
  {
    method: "DELETE",
    path: "/users/self",
    handler: userController.deleteOwnAccount,
    options: {
      pre: [authMiddleware, userOnly],
    },
  },

  // ---------- NASABAH ----------
  {
    method: "GET",
    path: "/users/balance/{account_id}",
    handler: bankController.getUserBalance,
    options: {
      pre: [authMiddleware, userOnly],
    },
  },
  {
    method: "GET",
    path: "/bank-accounts",
    handler: bankController.getAllBankAccounts,
    options: {
      pre: [authMiddleware, userOnly],
    },
  },
  {
    method: "POST",
    path: "/bank-accounts",
    handler: bankController.createBankAccount,
    options: {
      pre: [authMiddleware, userOnly],
      validate: { payload: bankSchemas.createBankAccountSchema, failAction },
    },
  },
  {
    method: "POST",
    path: "/transactions/transfer",
    handler: bankController.transfer,
    options: {
      pre: [authMiddleware, userOnly],
      validate: { payload: bankSchemas.transferSchema, failAction },
    },
  },
  {
    method: "GET",
    path: "/transactions/history", //?page=int
    handler: bankController.transactionHistory,
    options: {
      pre: [authMiddleware, userOnly],
    },
  },
  {
    method: "GET",
    path: "/mutations/history", //?page=int
    handler: bankController.mutationHistoryHandler,
    options: {
      pre: [authMiddleware, userOnly],
    },
  },

  // ---------- ADMIN ----------
  {
    method: "GET",
    path: "/admin/users/account",
    handler: adminController.getAllUserAccount,
    options: {
      pre: [authMiddleware, adminOnly],
    },
  },
  {
    method: "GET",
    path: "/admin/users/{uuid}/balance",
    handler: adminController.getUserBalance,
    options: {
      pre: [authMiddleware, adminOnly],
    },
  },
  {
    method: "POST",
    path: "/admin/users/{user_id}/add-balance",
    handler: adminController.addBalance,
    options: {
      pre: [authMiddleware, adminOnly],
      validate: { payload: bankSchemas.modifyBalanceSchema, failAction },
    },
  },
  {
    method: "POST",
    path: "/admin/users/{user_id}/deduct-balance",
    handler: adminController.deductBalance,
    options: {
      pre: [authMiddleware, adminOnly],
      validate: { payload: bankSchemas.modifyBalanceSchema, failAction },
    },
  },
  {
    method: "DELETE",
    path: "/admin/users/{user_id}",
    handler: adminController.deleteUserByAdmin,
    options: {
      pre: [authMiddleware, adminOnly],
    },
  },
];
