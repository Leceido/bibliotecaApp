module.exports = {
    eFunc: function(req, res, next) {
        if(req.isAuthenticated() && req.user.isFuncionario && req.user.nivelPermissao == 1) {
            return next()
        }

        req.flash("error_msg", "Voce precisa ser um admin")
        res.redirect('/')
    }
}