/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServerRoute } from '@hapi/hapi';
import * as bankController from '../controllers/bankController';
import * as adminController from '../controllers/adminController';
import * as bankSchemas from '../validations/bankSchema';
import authMiddleware from '../lib/middleware/authMiddleware';
import { userOnly, adminOnly } from '../lib/middleware/roleMiddleware';

const failAction = (request: any, h: any, err: any) => {
    return h.response({ error: err.details[0].message }).code(400).takeover();
};

export const bankRoutes: ServerRoute[] = [
    // ---------- AUTH ----------
    {
        method: 'POST',
        path: '/login',
        handler: bankController.login,
        options: {
            validate: { payload: bankSchemas.loginSchema, failAction }
        }
    },
    {
        method: 'POST',
        path: '/logout',
        handler: bankController.logout,
        options: {
            pre: [authMiddleware]
        }
    },

    // ---------- NASABAH ----------
    {
        method: 'POST',
        path: '/bank-accounts',
        handler: bankController.createBankAccount,
        options: {
            pre: [authMiddleware, userOnly],
            validate: { payload: bankSchemas.createBankAccountSchema, failAction }
        }
    },
    {
        method: 'POST',
        path: '/transactions/transfer',
        handler: bankController.transfer,
        options: {
            pre: [authMiddleware, userOnly],
            validate: { payload: bankSchemas.transferSchema, failAction }
        }
    },
    {
        method: 'GET',
        path: '/transactions/history',
        handler: bankController.transactionHistory,
        options: {
            pre: [authMiddleware, userOnly]
        }
    },
    {
        method: 'GET',
        path: '/mutations/history',
        handler: bankController.mutationHistory,
        options: {
            pre: [authMiddleware, userOnly]
        }
    },
    {
        method: 'PUT',
        path: '/users/photo',
        handler: bankController.updateProfilePhoto,
        options: {
            pre: [authMiddleware, userOnly],
            validate: { payload: bankSchemas.updatePhotoSchema, failAction }
        }
    },
    {
        method: 'DELETE',
        path: '/users/self',
        handler: bankController.deleteOwnAccount,
        options: {
            pre: [authMiddleware, userOnly]
        }
    },

    // ---------- ADMIN ----------
    {
        method: 'GET',
        path: '/admin/users/{uuid}/balance',
        handler: adminController.getUserBalance,
        options: {
            pre: [authMiddleware, adminOnly]
        }
    },
    {
        method: 'GET',
        path: '/admin/users/{uuid}/balance',
        handler: adminController.getUserBalance,
        options: {
            pre: [authMiddleware, adminOnly]
        }
    },
    {
        method: 'POST',
        path: '/admin/users/{user_id}/add-balance',
        handler: adminController.addBalance,
        options: {
            pre: [authMiddleware, adminOnly],
            validate: { payload: bankSchemas.modifyBalanceSchema, failAction }
        }
    },
    {
        method: 'POST',
        path: '/admin/users/{user_id}/deduct-balance',
        handler: adminController.deductBalance,
        options: {
            pre: [authMiddleware, adminOnly],
            validate: { payload: bankSchemas.modifyBalanceSchema, failAction }
        }
    },
    {
        method: 'DELETE',
        path: '/admin/users/{user_id}',
        handler: adminController.deleteUserByAdmin,
        options: {
            pre: [authMiddleware, adminOnly]
        }
    }
];
