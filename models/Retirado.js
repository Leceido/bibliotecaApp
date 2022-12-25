const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Retirado = new Schema({
    pessoa: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    livro: {
        type: Schema.Types.ObjectId,
        ref: "livros",
        required: true
    },
    data: {
        type: Date,
        default: Date.now()
    },
    entrega: {
        type: Date,
    }
})

mongoose.model("retirados", Retirado)