const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const admin = require('./routes/admin')
const { default: mongoose } = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Genero')
const Genero = mongoose.model('generos')
require('./models/Livro')
const Livro = mongoose.model('livros')
const usuarios = require('./routes/usuario')
const passport = require('passport')
require('./config/auth')(passport)
const path = require('path')
require('./models/User')
const User = mongoose.model('users')
require('./models/Retirado')
const Retirada = mongoose.model('retirados')
const bcrypt = require('bcryptjs')

mongoose.set('strictQuery', false)

//Sessao 
    app.use(session({
        secret: "qualquercoisa",
        resave: true,
        saveUninitialized: true
    }))

    app.use(passport.initialize())
    app.use(passport.session())

    app.use(flash())
//Middleware
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash("success_msg")
        res.locals.error_msg = req.flash("error_msg")
        res.locals.error = req.flash("error")
        res.locals.user = req.user || null
        //console.log(req.user);
        next()
    })
//Body Parser
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())
//Handlebars
    app.engine('handlebars', handlebars.engine({
        defaultLayout: 'main',
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
    }))
    app.set('view engine', 'handlebars');
    app.set('views', './views');

    app.use('/img', express.static(path.join(__dirname, "/public/img")))
    app.use('/css', express.static(path.join(__dirname, "/public/css")))
    app.use('/js', express.static(path.join(__dirname, '/public/js')))

//Mongoose
    mongoose.Promise = global.Promise
    mongoose.connect("mongodb://localhost/bibliotecaapp").then(() => {
        console.log("Conectado ao mongoDB");
    }).catch((err) => {
        console.log("Erro ao tentar se conectar com o mongoDB");
    })

//Rotas
    app.get("/", (req, res) => {
        Livro.find().populate('genero').sort({data: "desc"}).limit(3).then((livros) => {
            res.render('../views/index.handlebars', {livros: livros})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/404")
        })
    })

    app.get('/livro', (req, res) => {
        Livro.find().populate('genero').sort({data: "desc"}).then((livros) => {
            res.render('../views/livros/livros.handlebars', {livros: livros})
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro ao tentar listar os livros')
            res.redirect('/')
        })
    })

    app.get('/livro/retirada/:id', (req, res) => {
        if(req.user){
            if(req.user.isAdmin || req.user.isFuncionario) {
                req.flash('error_msg', "Usuario sem permissao para retirar livro!")
                res.redirect('/livro')
            } else {
                User.findOne({_id: req.user._id}).then((usuario) => {
                    Livro.findOne({_id: req.params.id}).then((livro) => {
                        if(usuario){
                            livro.disponibilidade = false

                            livro.save().then(() => {
                                const novaRetirada = {
                                    pessoa: usuario._id,
                                    livro: livro._id
                                }

                                new Retirada(novaRetirada).save().then(() => {
                                    req.flash("success_msg", "Livro pego com sucesso!")
                                    res.redirect('/livro')
                                }).catch((err) => {
                                    req.flash('error_msg', "Houve um erro ao tentar salvar o livro retirado!")
                                    res.redirect('/')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', "Houve um erro ao alterar a disponibilidade do livro!")
                                res.redirect('/')
                            })
                        }
                    }).catch((err) => {
                        req.flash('error_msg', "Houve um erro ao tentar encontrar o livro!")
                        res.redirect('/')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Houve um erro ao tentar carregar o usuario!")
                    res.redirect('/')
                })
            }
        } else {
            req.flash('error_msg', "Necessario login para retirar um livro!")
            res.redirect('/livro')
        }
    })

    app.get('/genero', (req, res) => {
        Genero.find().then((generos) => {
            Livro.find().then((livros) => {
                res.render('../views/genero/index.handlebars', {generos: generos, livros: livros})
            })
            
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao tentar carregar os generos")
            res.redirect('/')
        })
    })

    app.get('/genero/:slug', (req, res) => {
        Genero.findOne({slug: req.params.slug}).then((genero) => {
            if(genero){
                Livro.find({genero: genero.nome}).then((livros) => {
                    res.render("../views/genero/livros.handlebars", {livros: livros, genero: genero})
                })
            }
        })
    })

    app.get('/usuarios/:id', (req, res) => {
        if(req.user){
            if(req.user._id == req.params.id) {
                User.findOne({_id: req.params.id}).then((usuario) => {
                    Retirada.find({pessoa: usuario._id}).populate('livro').populate('pessoa').then((retirados) => {
                        Retirada.count({pessoa: usuario._id}).then((retiradoscount) => {
                            res.render('../views/usuarios/usuario.handlebars', {usuario: usuario, retirados: retirados, retiradoscount: retiradoscount})
                        })
                        
                    }).catch((err) => {
                        req.flash('error_msg', "Houve um erro interno")
                        res.redirect('/')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Houve um erro ao tentar carregar os dados do usuario")
                    res.redirect('/')
                })
            } else {
                req.flash('error_msg', "Usuario sem permissao")
                res.redirect('/')
            }
        } else {
            req.flash('error_msg', "Necessario login!")
            res.redirect('/')
        }
    })

    app.post('/livro/devolver/', (req, res) => {
        if(req.user){
            if(req.user._id == req.body.pessoa) {
                Livro.findOne({_id: req.body.livro}).then((livro) => {
                    livro.disponibilidade = true
            
                    livro.save().then(() => {
                        Retirada.deleteOne({_id: req.body.id}).then(() => {
                            req.flash("success_msg", "Livro devolvido com sucesso!")
                            res.redirect('/livro/')
                        }).catch((err) => {
                            req.flash("error_msg", "Nao foi possivel devolver o livro!")
                            res.redirect('/livro/o')
                        })
                    })
            
                    
                }).catch((err) => {
                    req.flash("error_msg", "Houve um erro ao tentar encontrar o livro na base de dados!")
                    res.redirect('/admin/livro/retirado')
                })
            } else {
                req.flash('error_msg', "Usuario sem permissao")
                res.redirect('/')
            }
        } else {
            req.flash('error_msg', "Necessario login!")
            res.redirect('/')
        }
    })

    app.get('/usuarios/edit/:id', (req, res) => {
        if (req.user) {
            if (req.user._id == req.params.id) {
                User.findOne({_id: req.params.id}).then((usuario) => {
                    res.render('../views/usuarios/editusuario.handlebars', {usuario: usuario})
                }).catch((err) => {
                    req.flash('error_msg', "Houve um erro ao tentar carregar o formulario de edicao!")
                    res.redirect('/')
                })
            } else {
                req.flash('error_msg', "Usuario sem permissao")
                res.redirect('/')
            }
        } else {
            req.flash('error_msg', "Necessario login!")
            res.redirect('/')
        }
    })

    app.post('/usuarios/edit', (req, res) => {
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


        User.findOne({_id: req.body.id}).then((usuario) => {
            if(erros.length > 0) {
                res.render('../views/usuarios/editusuario.handlebars', {erros: erros, usuario: usuario})
            } else {
                usuario.nome = req.body.nome
                usuario.email = req.body.email
                usuario.senha = req.body.senha

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(usuario.senha, salt, (erro, hash) => {
                        if(erro) {
                            req.flash("error_msg", "Houve um erro durante o salvamento do usuario!")
                            res.redirect("/")
                        }
                        usuario.senha = hash
                        
                        usuario.save().then(() => {
                            req.flash("success_msg", "Usuario editado com sucesso!")
                            res.redirect('/')
                        }).catch((err) => {
                            req.flash("error_msg", "Houve um erro ao editar o usuario")
                            res.redirect('/')
                        })
                    })
                })
            }
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro interno")
            res.redirect('/')
        })
    })

    app.get('/404', (req, res) => {
        res.send('Erro 404!')
    })

    app.use('/admin', admin)
    app.use('/usuario', usuarios)

const PORT = 8090
app.listen(PORT, () => {
    console.log(`Servidor rodando! http://localhost:${PORT}/`);
})