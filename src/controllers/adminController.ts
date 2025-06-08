import { Request, ResponseToolkit } from "@hapi/hapi";
import { db } from "../db/drizzleClient";
import { accounts, users, mutationHistory } from "../db/schema";
import { eq, asc } from "drizzle-orm";

// GET /admin/users/{uuid}/balance
export const getUserBalance = async (request: Request, h: ResponseToolkit) => {
  try {
    const { uuid } = request.params;

    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.uuid, uuid));
    const totalBalance = userAccounts.reduce(
      (sum, acc) => sum + parseFloat(acc.balance.toString()),
      0
    );

    return h.response({ uuid, totalBalance }).code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};

// POST /admin/users/{user_id}/add-balance
export const addBalance = async (request: Request, h: ResponseToolkit) => {
  try {
    const { user_id } = request.params;
    const { amount, note } = request.payload as {
      amount: number;
      note: string;
    };

    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.uuid, user_id));
    if (!userAccounts.length) {
      return h.response({ error: "User has no bank account" }).code(404);
    }

    await db.transaction(async (tx) => {
      for (const account of userAccounts) {
        const currentBalance = parseFloat(account.balance.toString());
        const newBalance = currentBalance + amount;

        await tx
          .update(accounts)
          .set({ balance: newBalance.toString() })
          .where(eq(accounts.accountId, account.accountId));

        await tx.insert(mutationHistory).values({
          accountId: account.accountId,
          relatedAccountId: account.accountId,
          uuid: user_id,
          actionType: "add_balance",
          amount: amount.toString(),
          timestamp: new Date(),
          note,
        });
      }
    });

    return h.response({ message: "Balance added successfully" }).code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};

// POST /admin/users/{user_id}/deduct-balance
export const deductBalance = async (request: Request, h: ResponseToolkit) => {
  try {
    const { user_id } = request.params;
    const { amount, note } = request.payload as {
      amount: number;
      note: string;
    };

    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.uuid, user_id));
    if (!userAccounts.length) {
      return h.response({ error: "User has no bank account" }).code(404);
    }

    await db.transaction(async (tx) => {
      for (const account of userAccounts) {
        const currentBalance = parseFloat(account.balance.toString());
        if (currentBalance < amount) {
          throw new Error("Insufficient balance in one of the accounts");
        }

        const newBalance = currentBalance - amount;

        await tx
          .update(accounts)
          .set({ balance: newBalance.toString() })
          .where(eq(accounts.accountId, account.accountId));

        await tx.insert(mutationHistory).values({
          accountId: account.accountId,
          relatedAccountId: account.accountId,
          uuid: user_id,
          actionType: "deduct_balance",
          amount: amount.toString(),
          timestamp: new Date(),
          note,
        });
      }
    });

    return h.response({ message: "Balance deducted successfully" }).code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};

// DELETE /admin/users/{user_id}
export const deleteUserByAdmin = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { user_id } = request.params;

    await db.delete(users).where(eq(users.uuid, user_id));
    return h.response({ message: "User deleted successfully" }).code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};

// GET /admin/users/account
export const getAllUserAccount = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const PAGE_SIZE = 30;
    const page = Number(request.query.page) || 1;
    const offset = (page - 1) * PAGE_SIZE;

    const data = await db
      .select({
        accountId: accounts.accountId,
        uuid: users.uuid,
        username: users.username,
        balance: accounts.balance,
      })
      .from(accounts)
      .innerJoin(users, eq(accounts.uuid, users.uuid))
      .orderBy(asc(accounts.accountId))
      .limit(PAGE_SIZE)
      .offset(offset);

    return h.response({ page, pageSize: PAGE_SIZE, data }).code(200);
  } catch (error) {
    return h.response({ error: (error as Error).message }).code(500);
  }
};
