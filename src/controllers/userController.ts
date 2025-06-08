/* eslint-disable @typescript-eslint/no-explicit-any */
// src/controllers/userController.ts
import { Request, ResponseToolkit } from "@hapi/hapi";
import { db } from "../db/drizzleClient";
import { users, roles } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseClient";
import { randomBytes, randomUUID } from "crypto";

// === Utility ===
function generateCustomUUID(prefix = "usr"): string {
  const uuid = randomUUID();
  const extraLength = 46 - uuid.length;
  const extra = randomBytes(extraLength)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, extraLength);

  return `${prefix}-${uuid}${extra}`;
}

// === Controllers ===
export const registerUser = async (request: Request, h: ResponseToolkit) => {
  const { username, password } = request.payload as {
    username: string;
    password: string;
  };

  const hashedPassword = await bcrypt.hash(password, 10);

  const [nasabahRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.role, "user"))
    .limit(1);
  if (!nasabahRole) {
    return h.response({ error: "Role nasabah tidak ditemukan" }).code(400);
  }

  const [newUser] = await db
    .insert(users)
    .values({
      uuid: generateCustomUUID(),
      username,
      password: hashedPassword,
      roleId: nasabahRole.roleId,
      isActive: true,
    })
    .returning();

  return h
    .response({
      message: "Registrasi berhasil",
      uuid: newUser.uuid,
      username: newUser.username,
    })
    .code(201);
};

export const login = async (request: Request, h: ResponseToolkit) => {
  const { username, password } = request.payload as {
    username: string;
    password: string;
  };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (!user || !user.isActive) {
    return h
      .response({ error: "Username tidak ditemukan atau akun nonaktif" })
      .code(401);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return h.response({ error: "Password salah" }).code(401);
  }

  if (!user.roleId) {
    return h.response({ error: "User has no role assigned" }).code(400);
  }

  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.roleId, user.roleId))
    .limit(1);

  const token = jwt.sign(
    { uuid: user.uuid, username: user.username, role: role.role },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  return h.response({ message: "Login berhasil", token }).code(200);
};

export const logout = async (_request: Request, h: ResponseToolkit) => {
  // Logout cukup hapus token di sisi client
  return h
    .response({ message: "Logout berhasil (token dihapus client)" })
    .code(200);
};

export const updateProfilePhoto = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { avatar } = request.payload as any;
  const userId = request.auth.credentials.user_id as string;

  if (!avatar || !avatar.hapi || !avatar._data) {
    return h.response({ error: "Gambar tidak valid" }).code(400);
  }

  const buffer = avatar._data;
  const fileExt = avatar.hapi.filename.split(".").pop();
  const fileName = `avatars/${userId}-${randomUUID()}.${fileExt}`;

  try {
    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: avatar.hapi.headers["content-type"],
        upsert: true,
      });

    if (error) {
      console.error("[Supabase Upload Error]", error);
      return h.response({ error: "Gagal mengupload gambar" }).code(500);
    }

    const avatarUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars-profile/${fileName}`;

    const [updatedUser] = await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.uuid, userId))
      .returning();

    return h
      .response({
        message: "Foto profil diperbarui",
        avatarUrl,
        user: updatedUser,
      })
      .code(200);
  } catch (err) {
    console.error("[Update Avatar]", err);
    return h.response({ error: "Terjadi kesalahan server" }).code(500);
  }
};

export const deleteOwnAccount = async (
  request: Request,
  h: ResponseToolkit
) => {
  const uuid = request.auth.credentials.uuid as string;

  const [deactivated] = await db
    .update(users)
    .set({ isActive: false })
    .where(eq(users.uuid, uuid))
    .returning();

  if (!deactivated) {
    return h
      .response({ message: "Akun tidak ditemukan atau sudah tidak aktif." })
      .code(404);
  }

  return h.response({ message: "Akun berhasil dinonaktifkan." }).code(200);
};
