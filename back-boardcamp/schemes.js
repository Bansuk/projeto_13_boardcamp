import joi from "joi";

const categoriesSchema = joi.object({
    name: joi.string().required(),
});

const gamesSchema = joi.object({
    name: joi.string().required(),
    image: joi
        .string()
        .pattern(
            /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/
        ),
    stockTotal: joi.number().integer().greater(0),
    categoryId: joi.number().integer(),
    pricePerDay: joi.number().integer().greater(0),
});

const customersSchema = joi.object({
    name: joi.string().required(),
    phone: joi.string().min(10).max(11),
    cpf: joi.string().length(11),
    birthday: joi.date().iso(),
});

export { categoriesSchema, gamesSchema, customersSchema };
