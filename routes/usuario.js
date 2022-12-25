const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
require('../models/User')
const User = mongoose.model('users')
const bcrypt = require('bcryptjs')
const passport = require('passport')

router.get('/registro', (req, res) => {
    res.render('../views/usuarios/registro.handlebars')
})

router.post('/registro', (req, res) => {
    let erros = []

    if(!req.body.nome || req.body.nome == null || typeof req.body.nome == undefined) {
        erros.push({texto: "Nome invalido!"})
    }

    if(!req.body.email || req.body.email == null || typeof req.body.email == undefined) {
        erros.push({texto: "email invalido!"})
    }

    if(!req.body.senha || req.body.senha == null || typeof req.body.senha == undefined) {
        erros.push({texto: "Senha invalido!"})
    }

    if(req.body.senha < 4) {
        erros.push({texto: "Senha muito curta"})
    }

    if(req.body.senha != req.body.senha2) {
        erros.push({texto: "As senhas sao diferentes, tente novamente!"})
    }

    if(erros.length > 0) {
        res.render('../views/usuarios/registro.handlebars', {erros: erros})
    } else {
        User.findOne({email: req.body.email}).then((usuario) => {
            if(usuario) {
                req.flash("error_msg", "Ja existe um usuario com esse email")
                res.redirect('/usuario/registro')
            } else {
                const novoUser = new User({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha
                })

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(novoUser.senha, salt, (erro, hash) => {
                        if(erro) {
                            req.flash("error_msg", 'Houve um erro durante o salvamento do usuario')
                            res.redirect('/')
                        }

                        novoUser.senha = hash

                        novoUser.save().then(() => {
                            req.flash("success_msg", "Usuario criado com sucesso!")
                            res.redirect('/')
                        }).catch((err) => {
                            req.flash('error_msg', "Houve um erro ao criar o usuario!")
                            res.redirect('/')
                        })
                    })
                })
            }
        })
    }
})

router.get('/login', (req, res) => {
    res.render('../views/usuarios/login.handlebars')
})

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/usuario/login',
        failureFlash: true,
    })(req, res, next)
})

router.get('/logout', (req, res) => {
    req.logout((err) => {
        req.flash('success_msg', "Logout feito com sucesso")
        res.redirect('/')
    })
})


module.exports = router