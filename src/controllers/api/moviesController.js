const db = require('../../database/models')
const Op = db.Sequelize.Op;
const getUrl = (req) => {
    return `${req.protocol}://${req.get("host")}${req.originalUrl}`
}

module.exports = {
    create: (req, res) => {
        const {title, rating, awards, release_date, length, genre_id} = req.body
        db.Movie.create({
            title, rating, awards, release_date, length, genre_id
        })
        .then((movie) => {
            res.status(201).json({
                meta: {
                    endpoint: `${getUrl(req)}/${movie.id}`,
                    msg: "Movie added seccessfully"
                },
                data: movie
            })
        })
        .catch(error => {

            switch (error.name) {
                case "sequelizevalidationError":
                    let errorsMsg = []
                    let notNullErrors = []
                    let validationErrors = []
                    error.errors.forEach(error => {
                        errorsMsg.push(error.message)
                        if(error.type == "nutNull violation"){
                            notNullErrors.push(error.message)
                        }
                        if(error.type =="Validation errors" ){
                            validationErrors.push(error.message)
                        }
                    });
                    let response = {
                        status: 400,
                        message: "missing or wrong data",
                        errors: {
                            quantity: errorsMsg.length,
                            msg: errorMsg,
                            notNull: notNullErrors,
                            validations: validationErrors
                        }
                    }
                    return res.status(400).json(response)
            
                default:
                    return res.status(500).json({
                        error
                    })
                    break;
            }

        })
    },
    getAll: (req, res) => {
        db.Movie.findAll({
            include: [{association: "genre"}, {association: "actors"}]
        })
        .then(movies => {
            return res.json({
                meta: {
                    endpoint: getUrl(req),
                    status: 200,
                    total: movies.length
                },
                data: movies
            })
        })
        .catch(error => console.log(error))
    },
    getOne: (req, res) => {
        if(req.params.id % 1 !== 0 || req.params.id < 0){
            return res.status(404).json({
                meta: {
                    status: 404,
                    msg: "wrong ID"
                }
            })
        } else {
            db.Movie.findOne({
                where: {
                    id: req.params.id,
                },
                include: [{association: "genre"}, {association: "actors"}]
            })
            .then(movie => {
                if(movie){
                    return res.status(200).json({
                        meta: {
                            endpoint: getUrl(req),
                            status: 200
                        },
                        data: movie
                    })
                } else {
                    return res.status(404).json({
                        meta: {
                            status: 404,
                            msg: "ID not found"
                        }
                    })
                }
            })
            .catch(error => console.log(error))
        }
    },
    update: (req, res) => {
        const {title, rating, awards, release_date, length, genre_id} = req.body
        db.Movie.update({
            title, rating, awards, release_date, length, genre_id
        }, {
            where: {
                id: req.params.id,
            }
        })
        .then(result => {
            if(result){
                return res.status(201).json({
                    msg: "update succesfully",

                })
            } else {
                return res.status(201).json({
                    msg: "no changes",
                    
                })
            }
        })
        .catch(error => console.log(error))
    },
    delete: (req, res) => {
        let actorUpdate = db.Actor.update({
            favorite_movie_id: null,
        }, {
            where: {
                favorite_movie_id: +req.params.id
            }
        })
        let actorMovieUpdate = db.actor_movie.destroy({
            where: {
                movie_id: req.params.id,
            }
        })
        Promise.all([actorUpdate, actorMovieUpdate])
        .then(
            db.Movie.destroy({
                where: {
                    id: req.params.id
                }
            })
            .then(result => {
                if(result){
                    return res.status(200).json({
                        msg: "movie deleted successfully"
                    })
                } else {
                    return res.status(200).json({
                        msg: "no changes"
                    })
                }
            })
        )
    },
}