import Joi from "joi";

// ----------- AUTH & USER -----------
export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const registerUser = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const updatePhotoSchema = Joi.object({
  avatar: Joi.any()
    .meta({ swaggerType: "file" })
    .required()
    .description("Avatar image file")
    .custom((value, helpers) => {
      if (value._data && value._data.length > 2 * 1024 * 1024) {
        return helpers.error("file.max");
      }
      return value;
    }, "Max file size validation"),
}).messages({
  "file.max": "Ukuran gambar tidak boleh lebih dari 2MB",
});

export const addUserSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
});

// ----------- ACCOUNT -----------
export const createBankAccountSchema = Joi.object({
  initialBalance: Joi.number().min(0).default(0),
});

// ----------- TRANSACTION -----------
export const transferSchema = Joi.object({
  from_account_id: Joi.number().required(),
  to_account_id: Joi.number().required(),
  amount: Joi.number().positive().required(),
});

// ----------- BALANCE CHANGE (ADMIN) -----------
export const modifyBalanceSchema = Joi.object({
  amount: Joi.number().positive().required(),
  note: Joi.string().allow("").optional(),
});

// ----------- ROLE -----------
export const roleSchema = Joi.object({
  role: Joi.string().required(),
});
