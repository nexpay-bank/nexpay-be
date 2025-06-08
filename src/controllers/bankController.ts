import { Request, ResponseToolkit } from '@hapi/hapi';
import { db } from '../db/drizzleClient';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { accounts, transactions, mutationHistory } from '../db/schema';

export const bankController = {
    getUserBalance: async (request: Request, h: ResponseToolkit) => {
        try {
            const { uuid, account_id } = request.params as { uuid: string, account_id?: number };

            // Validasi ownership akun bisa ditambah di sini

            const account = await db.select()
                .from(accounts)
                .where(
                    and(
                        eq(accounts.accountId, Number(account_id)),
                        eq(accounts.uuid, uuid)
                    )
                )
                .limit(1);


            if (!account.length) {
                return h.response({ error: 'Account not found' }).code(404);
            }

            return h.response({ balance: account[0].balance }).code(200);
        } catch (error) {
            const err = error as Error;
            return h.response({ error: err.message }).code(500);
        }
    },

    createBankAccount: async (request: Request, h: ResponseToolkit) => {
        try {
            const { uuid, initialBalance = 0 } = request.payload as { uuid: string, initialBalance?: number | string };

            const newAccount = await db.insert(accounts).values({
                uuid,
                balance: String(initialBalance)
            }).returning();

            return h.response(newAccount[0]).code(201);
        } catch (error) {
            const err = error as Error;
            return h.response({ error: err.message }).code(500);
        }
    },

    transfer: async (request: Request, h: ResponseToolkit) => {
        try {
            const { from_account_id, to_account_id, amount } = request.payload as { from_account_id: number, to_account_id: number, amount: number };

            // Mulai transaksi DB
            await db.transaction(async (tx) => {
                // Cek saldo dari akun pengirim
                const senderAccount = await tx.select()
                    .from(accounts)
                    .where(eq(accounts.accountId, from_account_id))
                    .limit(1);

                const balance = parseFloat(senderAccount[0].balance.toString());
                if (balance < amount) {
                    throw new Error('Insufficient balance');
                }


                // Kurangi saldo pengirim
                await tx.update(accounts)
                    .set({ balance: (balance - amount).toString() })
                    .where(eq(accounts.accountId, from_account_id));


                // Tambah saldo penerima
                const receiverAccount = await tx.select()
                    .from(accounts)
                    .where(eq(accounts.accountId, to_account_id))
                    .limit(1);

                if (!receiverAccount.length) {
                    throw new Error('Receiver account not found');
                }

                const receiverBalance = parseFloat(receiverAccount[0].balance.toString());
                await tx.update(accounts)
                    .set({ balance: (receiverBalance + amount).toString() })
                    .where(eq(accounts.accountId, to_account_id));


                // Catat transaksi
                await tx.insert(transactions).values([
                    {
                        accountId: from_account_id,
                        relatedAccountId: to_account_id,
                        type: 'transfer_out',
                        amount: String(amount),
                        timestamp: new Date(),
                    },
                    {
                        accountId: to_account_id,
                        relatedAccountId: from_account_id,
                        type: 'transfer_in',
                        amount: String(amount),
                        timestamp: new Date(),
                    }
                ]);

            });

            return h.response({ message: 'Transfer successful' }).code(200);
        } catch (error) {
            const err = error as Error;
            return h.response({ error: err.message }).code(400);
        }
    },

    transactionHistory: async (request: Request, h: ResponseToolkit) => {
        try {
            const { uuid } = request.auth.credentials as { uuid: string };

            const userAccounts = await db.select()
                .from(accounts)
                .where(eq(accounts.uuid, uuid));

            const accountIds = userAccounts.map(acc => acc.accountId);

            if (accountIds.length === 0) {
                return h.response({ transactions: [] }).code(200);
            }

            const history = await db.select()
                .from(transactions)
                .where(inArray(transactions.accountId, accountIds))
                .orderBy(desc(transactions.timestamp));

            return h.response({ transactions: history }).code(200);
        } catch (error) {
            const err = error as Error;
            return h.response({ error: err.message }).code(500);
        }
    },

    mutationHistory: async (request: Request, h: ResponseToolkit) => {
        try {
            const { uuid } = request.auth.credentials as { uuid: string };

            const userAccounts = await db.select()
                .from(accounts)
                .where(eq(accounts.uuid, uuid));

            const accountIds = userAccounts.map(acc => acc.accountId);

            const history = await db.select()
                .from(mutationHistory)
                .where(inArray(mutationHistory.accountId, accountIds))
                .orderBy(desc(mutationHistory.timestamp));

            return h.response({ mutations: history }).code(200);
        } catch (error) {
            const err = error as Error;
            return h.response({ error: err.message }).code(500);
        }
    },
};
