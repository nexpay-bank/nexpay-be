import { Request, ResponseToolkit } from "@hapi/hapi";
import { db } from "../db/drizzleClient";
import { sql, eq, and, inArray, desc } from "drizzle-orm";
import { accounts, transactions, mutationHistory } from "../db/schema";

// Handler: Get User Balance
export const getUserBalance = async (request: Request, h: ResponseToolkit) => {
  try {
    const { account_id } = request.params as {
      account_id?: number;
    };

    const { uuid } = request.auth.credentials as { uuid: string };

    const account = await db
      .select()
      .from(accounts)
      .where(
        and(eq(accounts.accountId, Number(account_id)), eq(accounts.uuid, uuid))
      )
      .limit(1);

    if (!account.length) {
      return h.response({ error: "Account not found" }).code(404);
    }

    return h
      .response({ accountId: account_id, balance: account[0].balance })
      .code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};

// Handler: Get All Bank Accounts by UUID
export const getAllBankAccounts = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { uuid } = request.auth.credentials as { uuid: string };

    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.uuid, uuid));

    return h.response({ accounts: userAccounts }).code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};

// Handler: Create Bank Account
export const createBankAccount = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { initialBalance = 0 } = request.payload as {
      initialBalance?: number | string;
    };
    const { uuid } = request.auth.credentials as { uuid: string };

    const newAccount = await db
      .insert(accounts)
      .values({
        uuid,
        balance: String(initialBalance),
      })
      .returning();

    return h.response(newAccount[0]).code(201);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};

// Handler: Transfer
export const transfer = async (request: Request, h: ResponseToolkit) => {
  try {
    const { from_account_id, to_account_id, amount } = request.payload as {
      from_account_id: number;
      to_account_id: number;
      amount: number;
    };

    // Ambil uuid dari user yang request (sesuaikan sesuai auth kamu)
    const { uuid } = request.auth.credentials as { uuid: string };

    await db.transaction(async (tx) => {
      const senderAccount = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.accountId, from_account_id))
        .limit(1);

      const balance = parseFloat(senderAccount[0].balance.toString());
      if (balance < amount) {
        throw new Error("Insufficient balance");
      }

      await tx
        .update(accounts)
        .set({ balance: (balance - amount).toString() })
        .where(eq(accounts.accountId, from_account_id));

      const receiverAccount = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.accountId, to_account_id))
        .limit(1);

      if (!receiverAccount.length) {
        throw new Error("Receiver account not found");
      }

      const receiverBalance = parseFloat(receiverAccount[0].balance.toString());
      await tx
        .update(accounts)
        .set({ balance: (receiverBalance + amount).toString() })
        .where(eq(accounts.accountId, to_account_id));

      // Insert ke table transaksi
      await tx.insert(transactions).values([
        {
          accountId: from_account_id,
          relatedAccountId: to_account_id,
          type: "transfer_out",
          amount: String(amount),
          timestamp: new Date(),
        },
        {
          accountId: to_account_id,
          relatedAccountId: from_account_id,
          type: "transfer_in",
          amount: String(amount),
          timestamp: new Date(),
        },
      ]);

      // Insert ke mutation_history
      await tx.insert(mutationHistory).values([
        {
          accountId: from_account_id,
          relatedAccountId: to_account_id,
          uuid, // pemilik akun pengirim
          actionType: "transfer_out",
          amount: String(amount),
          timestamp: new Date(),
          note: "Transfer ke akun lain",
        },
        {
          accountId: to_account_id,
          relatedAccountId: from_account_id,
          uuid, // kamu bisa sesuaikan kalau perlu uuid pemilik akun penerima,
          actionType: "transfer_in",
          amount: String(amount),
          timestamp: new Date(),
          note: "Transfer dari akun lain",
        },
      ]);
    });

    return h.response({ message: "Transfer successful" }).code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(400);
  }
};

// Handler: Transaction History
export const transactionHistory = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { uuid } = request.auth.credentials as { uuid: string };
    const page = Number(request.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.uuid, uuid));

    const accountIds = userAccounts.map((acc) => acc.accountId);

    if (accountIds.length === 0) {
      return h.response({ transactions: [], page, total: 0 }).code(200);
    }

    const transactionsList = await db
      .select()
      .from(transactions)
      .where(inArray(transactions.accountId, accountIds))
      .orderBy(desc(transactions.timestamp))
      .limit(limit)
      .offset(offset);

    const result = await db.execute(
      sql`SELECT COUNT(*)::int AS count
          FROM ${transactions}
          WHERE ${transactions.accountId} = ANY(ARRAY[${sql.join(
        accountIds,
        sql.raw(", ")
      )}]::int[])`
    );

    const total = result[0].count as number;

    return h
      .response({
        transactions: transactionsList,
        page,
        total,
        totalPages: Math.ceil(total / limit),
      })
      .code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};

// Handler: Mutation History
export const mutationHistoryHandler = async (
  request: Request,
  h: ResponseToolkit
) => {
  try {
    const { uuid } = request.auth.credentials as { uuid: string };
    const page = Number(request.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.uuid, uuid));

    const accountIds = userAccounts.map((acc) => acc.accountId);

    if (accountIds.length === 0) {
      return h.response({ mutations: [], page, total: 0 }).code(200);
    }

    const mutationsList = await db
      .select()
      .from(mutationHistory)
      .where(inArray(mutationHistory.accountId, accountIds))
      .orderBy(desc(mutationHistory.timestamp))
      .limit(limit)
      .offset(offset);

    const result = await db.execute(
      sql`SELECT COUNT(*)::int AS count
          FROM ${mutationHistory}
          WHERE ${mutationHistory.accountId} = ANY(ARRAY[${sql.join(
        accountIds,
        sql.raw(", ")
      )}]::int[])`
    );

    const total = result[0].count as number;

    return h
      .response({
        mutations: mutationsList,
        page,
        total,
        totalPages: Math.ceil(total / limit),
      })
      .code(200);
  } catch (error) {
    const err = error as Error;
    return h.response({ error: err.message }).code(500);
  }
};
