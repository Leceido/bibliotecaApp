module.exports = {
    eAdmin: function(req, res, next) {
        if(req.isAuthenticated() && req.user.isAdmin && req.user.nivelPermissao == 2) {
            return next()
        }

        req.flash("error_msg", "Voce precisa ser um admin")
        res.redirect('/')
    }
}