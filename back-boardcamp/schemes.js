import joi from "joi";

const categoriesSchema = joi.object({
    name: joi.string().required(),
});

const customersSchema = joi.object({
    name: joi.string().required(),
    phone: joi.string().min(10).max(11),
    cpf: joi.string().length(11),
    birthday: joi.date().iso(),
});

export { categoriesSchema, customersSchema };
