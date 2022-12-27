const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Genero')
const Genero = mongoose.model('generos')
require('../models/Livro')
const Livro = mongoose.model('livros')
require('../models/User')
const User = mongoose.model('users')
const bcrypt = require('bcryptjs')
require('../models/Retirado')
const Retirada = mongoose.model('retirados')
const {eAdmin} = require('../helpers/eAdmin')
const {eFunc} = require('../helpers/eFunc')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/img/')
    },
    filename: function(req, file, cb) {
        cb(null, req.body.slug + path.extname(file.originalname))
    }
})
const upload = multer({storage})


router.get('/', (eAdmin || eFunc), (req, res) => {
    res.render('../views/admin/index.handlebars')
})

router.get('/livro/genero', (eAdmin || eFunc), (req, res) => {
    Genero.find().sort({date: 'desc'}).then((generos) => {
        res.render('../views/admin/genero.handlebars', {generos: generos})
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao listar os generos")
        res.redirect('/admin')
    })
})

router.get('/livro/genero/cadastrar', (eAdmin || eFunc), (req, res) => {
    res.render('../views/admin/cadastrargenero.handlebars')
})

router.post('/livro/genero/novo', (eAdmin || eFunc), (req, res) => {
    let erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: "Nome invalido"})
    }

    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({texto: "Slug invalido"})
    }

    if(erros.length > 0) {
        res.render('../views/admin/cadastrargenero.handlebars', {erros: erros})
    } else {
        const novoGenero = {
            nome: req.body.nome,
            slug: req.body.slug,
        }
        new Genero(novoGenero).save().then(() => {
            req.flash('success_msg', "Genero criado com sucesso!")
            res.redirect('/admin/livro/genero/cadastrar')
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao salvar o genero, tente novamente!")
            res.redirect('/admin/livro/')
        })
    }
})

router.get('/livro/genero/edit/:id', (eAdmin || eFunc), (req, res) => {
    Genero.findOne({_id: req.params.id}).then((genero) => {
        res.render('../views/admin/editgenero.handlebars', {genero: genero})
    }).catch((err) => {
        req.flash('error_msg', "Este genero nao existe")
        res.redirect('/admin/livro/genero')
    })
})

router.post('/livro/genero/edit',   (eAdmin || eFunc), (req, res) => {
    
    let erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: "Nome invalido"})
    }

    if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({texto: "Slug invalido"})
    }

    Genero.findOne({_id: req.body.id}).then((genero) => {
        if(erros.length > 0) {
            res.render('../views/admin/editgenero.handlebars', {genero: genero, erros: erros})
        } else {
            genero.nome = req.body.nome
            genero.slug = req.body.slug

            genero.save().then(() => {
                req.flash('success_msg', "Genero editado com sucesso")
                res.redirect('/admin/livro/genero')
            }).catch((err) => {
                req.flash('error_msg', "Erro ao tentar editar o genero, tente novamente!")
                res.redirect('/admin/livro/genero')
            })
        }
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao selecionar a categoria")
        res.redirect('/admin/livro/genero')
    })
})

router.post('/livro/genero/deletar',   (eAdmin || eFunc), (req, res) => {
    Genero.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Genero deletado com sucesso")
        res.redirect('/admin/livro/genero')
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao deletar o genero!")
        res.redirect('/admin/livro/genero')
    })
})

router.get('/livro/',   (eAdmin || eFunc), (req, res) => {
    Livro.find().lean().populate('genero').sort({data: "desc"}).then((livros, generos) => {
        res.render('../views/admin/livros.handlebars', {livros: livros, generos: generos})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar os livros")
        res.redirect('/admin')
    })
})

router.get('/livro/cadastrar',  (eAdmin || eFunc), (req, res) => {
    Genero.find().then((generos) => {
        res.render('../views/admin/cadastrarlivro.handlebars', {generos: generos})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulario")
        res.redirect("/livro/")
    })
})

router.post('/livro/novo', upload.single('arquivo'),  (eAdmin || eFunc), (req, res) => {
    let erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Titulo invalido"})
    }
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "Slug invalido"})
    }
    if(req.body.categoria == 0) {
        erros.push({texto: "Selecione algum genero!"})
    }
    
    if(erros.length > 0) {
        Genero.find().then((generos) => {
            res.render('../views/admin/cadastrarlivro.handlebars', {generos: generos, erros: erros})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar o formulario")
            res.redirect("/admin/livro")
        })
    } else { 
        const novoLivro = {
            nome: req.body.nome,
            slug: req.body.slug,
            genero: req.body.categoria,
            sinopse: req.body.sinopse,
        }

        new Livro(novoLivro).save().then(() => {
            req.flash("success_msg", 'Livro cadastrado com sucesso!')
            res.redirect('/admin/livro')
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro durante o salvamento do livro")
            res.redirect('/admin/livro')
        })
    }
})

router.get("/livro/edit/:id",   (eAdmin || eFunc), (req ,res) => {
    Livro.findOne({_id: req.params.id}).then((livros) => {
        Genero.find().then((generos) => {
            res.render('../views/admin/editlivro.handlebars', {livros: livros, generos: generos})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao listar os generos")
            res.redirect("/admin/livros")
        })

    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulario de edicao")
    })
})

router.post('/livro/edit' ,   (eAdmin || eFunc), (req, res) => {
    let erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Titulo invalido"})
    }
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "Slug invalido"})
    }
    if(req.body.categoria == 0) {
        erros.push({texto: "Selecione algum genero!"})
    }
    if(erros.length > 0) {
        Genero.find().then((generos) => {
            res.render('../views/admin/cadastrarlivro.handlebars', {generos: generos, erros: erros})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar o formulario")
            res.redirect("/admin/livro")
        })
    } else { 
        Livro.findOne({_id: req.body.id}).then((livro) => {
            livro.nome = req.body.nome
            livro.slug = req.body.slug
            livro.genero = req.body.categoria
            livro.sinopse = req.body.sinopse

            livro.save().then(() => {
                req.flash("success_msg", "Livro editado com sucesso!")
                res.redirect('/admin/livro')
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao tentar salvar a edicao")
                res.redirect("/admin/livro")
            })
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao tentar editar")
            res.redirect("/admin/livro")
        })
    }
})

router.get('/livro/deletar/:id',   (eAdmin || eFunc), (req, res) => {
    Livro.deleteOne({_id: req.params.id}).then(() => {
        req.flash("success_msg", "Livro deletado com sucesso!")
        res.redirect('/admin/livro')
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro interno")
        res.redirect('/admin/livro')
    })
})

router.get('/livro/genero/:slug',   (eAdmin || eFunc), (req, res) => {
    Genero.findOne({slug: req.params.slug}).then((genero) => {
        if(genero){
            Livro.find({genero: genero.nome}).then((livros) => {
                res.render("../views/admin/buscaporgenero.handlebars", {livros: livros, genero: genero})
            })
        }
    })
})

router.get('/funcionarios', eAdmin, (req, res) => {
    User.find({isFuncionario: true}).then((funcionarios) => {
        res.render('../views/admin/funcionarios.handlebars', {funcionarios: funcionarios})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar os funcionarios")
        res.redirect('/admin/')
    })
})

router.get('/funcionarios/cadastrar', eAdmin, (req, res) => {
    res.render('../views/admin/registrofuncionario.handlebars')
})

router.post('/funcionarios/cadastrar', eAdmin, (req, res) => {
    let erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: "Nome invalido"})
    }

    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({texto: "Nome invalido"})
    }

    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({texto: "Nome invalido"})
    }

    if(req.body.senha < 4) {
        erros.push({texto: "Senha muito curta"})
    }

    if (erros.length > 0) {

        res.render('../views/admin/registrofuncionario.handlebars', {erros: erros})

    } else {
        User.findOne({email: req.body.email}).then((usuario) => {
            if(usuario){
                req.flash("error_msg", "Ja existe um funcionario com esse email")
                res.redirect("/admin/funcionarios/")
            } else {
                const novoUser = new User({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha,
                    isFuncionario: true,
                    nivelPermissao: 1,
                })

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(novoUser.senha, salt, (erro, hash) => {
                        if(erro) {
                            req.flash("error_msg", "Houve um erro durante o salvamento do usuario!")
                            res.redirect("/admin/")
                        }

                        novoUser.senha = hash

                        novoUser.save().then(() => {
                            req.flash("success_msg", "Usuario criado com sucesso!")
                            res.redirect('/admin/')
                        }).catch((err) => {
                            req.flash("error_msg", "Houve um erro ao criar o usuario")
                            res.redirect('/admin/')
                        })
                    })
                })
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect('/admin/')
        })
    }
})

router.get('/funcionarios/edit/:id', eAdmin, (req, res) => {
    User.findOne({_id: req.params.id}).then((funcionario) => {
        res.render('../views/admin/editfuncionario.handlebars', {funcionario: funcionario})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao tentar carregar o formulario de edicao")
        res.redirect('/admin/funcionarios')
    })
})

router.post('/funcionarios/edit', eAdmin, (req, res) => {
    let erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: "Nome invalido"})
    }

    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({texto: "Nome invalido"})
    }

    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({texto: "Nome invalido"})
    }

    if(req.body.senha < 4) {
        erros.push({texto: "Senha muito curta"})
    }


    User.findOne({_id: req.body.id}).then((funcionario) => {
        if(erros.length > 0) {
            res.render('../views/admin/editfuncionario.handlebars', {erros: erros, funcionario: funcionario})
        } else {
            funcionario.nome = req.body.nome
            funcionario.email = req.body.email
            funcionario.senha = req.body.senha

            bcrypt.genSalt(10, (erro, salt) => {
                bcrypt.hash(funcionario.senha, salt, (erro, hash) => {
                    if(erro) {
                        req.flash("error_msg", "Houve um erro durante o salvamento do usuario!")
                        res.redirect("/admin/")
                    }
                    funcionario.senha = hash
                    
                    funcionario.save().then(() => {
                        req.flash("success_msg", "Usuario editado com sucesso!")
                        res.redirect('/admin/')
                    }).catch((err) => {
                        req.flash("error_msg", "Houve um erro ao editar o usuario")
                        res.redirect('/admin/')
                    })
                })
            })
        }
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro interno")
        res.redirect('/admin/funcionarios')
    })
}) 

router.get('/funcionarios/deletar/:id', eAdmin, (req, res) => {
    User.deleteOne({_id: req.params.id}).then(() => {
        req.flash("success_msg", "Usuario deletado com sucesso!")
        res.redirect("/admin/funcionarios")
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao tentar deletar o usuario!")
        res.redirect("/admin/funcionarios")
    })
})

router.get('/livro/retirado',   (eAdmin || eFunc), (req, res) => {
    Retirada.find().lean().populate('livro').populate('pessoa').sort({data: 'desc'}).then((retirados) => {
        res.render('../views/admin/livrosretirados.handlebars', {retirados: retirados})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao tentar carregar os livros retirados!")
        res.redirect('/admin')
        console.log(err);
    })
})

router.get('/livro/retirado/registrar',  (eAdmin || eFunc), (req, res) => {
    Livro.find({disponibilidade: true}).then((livros) => {
        User.find({nivelPermissao: 0, isFuncionario: false, isAdmin: false}).then((usuarios) => {
            res.render('../views/admin/registrarretirada.handlebars', {livros: livros, usuarios: usuarios})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar os usuarios!")
            res.redirect('/admin')
        })
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar os livros!")
        res.redirect('/admin')
    })
})

router.post('/livro/retirar',  (eAdmin || eFunc), (req, res) => {
    let erros = []

    if(req.body.livro == 0) {
        erros.push({texto: "Livro invalido, cadastre um livro antes!"})
    }

    if(req.body.pessoa == 0) {
        erros.push({texto: "Usuario invalido, cadastre um usuario antes!"})
    }

    if (erros.length > 0) {
        Livro.find({disponibilidade: true}).then((livros) => {
            User.find({nivelPermissao: 0, isFuncionario: false, isAdmin: false}).then((usuarios) => {
                res.render('../views/admin/registrarretirada.handlebars', {livros: livros, usuarios: usuarios, erros: erros})
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao carregar os usuarios!")
                res.redirect('/admin')
            })
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar os livros!")
            res.redirect('/admin')
        })
    } else {
        Livro.findOne({_id: req.body.livro}).then((livro) => {
            livro.disponibilidade = false

            livro.save().then(() => {
                const novaRetirada = {
                    pessoa: req.body.pessoa,
                    livro: req.body.livro,
                    entrega: req.body.entrega
                }

                new Retirada(novaRetirada).save().then(() => {
                    req.flash("success_msg", "Retirada registrada com sucesso!")
                    res.redirect('/admin/livro/retirado')
                }).catch((err) => {
                    req.flash("error_msg", "Houve um erro ao tentar registrar uma retirada!")
                    res.redirect('/admin/livro/retirada')
                })
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao tentar alterar a disponibilidade do livro!")
                res.redirect('/admin/livro/retirado')
            })
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao tentar encontrar o livro na base de dados!")
            res.redirect('/admin/livro/retirado')
        })
    }
})

router.post('/livro/devolver/',  (eAdmin || eFunc), (req, res) => {
    Livro.findOne({_id: req.body.livro}).then((livro) => {
        livro.disponibilidade = true

        livro.save().then(() => {
            Retirada.deleteOne({_id: req.body.id}).then(() => {
                req.flash("success_msg", "Livro devolvido com sucesso!")
                res.redirect('/admin/livro/retirado')
            }).catch((err) => {
                req.flash("error_msg", "Nao foi possivel devolver o livro!")
                res.redirect('/admin/livro/retirado')
            })
        })

        
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao tentar encontrar o livro na base de dados!")
        res.redirect('/admin/livro/retirado')
    })
})

router.get('/usuarios',  (eAdmin || eFunc), (req, res) => {
    User.find({nivelPermissao: 0, isAdmin: false, isFuncionario: false}).then((usuarios) => {
        res.render('../views/admin/usuarios.handlebars', {usuarios: usuarios})
    })
})

router.get('/usuarios/:id',  (eAdmin || eFunc), (req, res) => {
    User.findOne({_id: req.params.id}).then((usuario) => {
        if(usuario) {
            Retirada.find({pessoa: req.params.id}).lean().populate('livro').populate('pessoa').sort({data: 'desc'}).then((retirados) => {
                res.render('../views/admin/usuariosretirados.handlebars', {retirados: retirados, usuario: usuario})
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao tentar listar os livros retirados")
                res.redirect('/admin/livro/retirado')
            })
        }
        
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao tentar carregar as informacoes do usuario!")
        res.redirect('/admin/livro/retirado')
    })
})
    



module.exports = router