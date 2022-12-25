const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Livro = new Schema({
    nome: {
        type: String,
        required: false,
    },

    slug: {
        type: String,
        required: false,
    },

    data: {
        type: Date,
        required: true, 
        default: Date.now()
    },

    genero: {
        type: Array,
        required: true,
        //type: Schema.Types.ObjectId,
        //ref: "generos",
    },

    disponibilidade: {
        type: Boolean,
        required: true,
        default: true, 
    },

    sinopse: {
        type: String,
    },

})

mongoose.model('livros', Livro)