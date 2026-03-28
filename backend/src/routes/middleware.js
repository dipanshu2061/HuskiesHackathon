function notFound(req, res, next) {
	const error = new Error(`NOT FOUND | ${req.originalUrl}`);
	res.status(404);
	next(error);
}

function errorHandler(error, req, res, next) {
	const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
	res.status(statusCode);
	res.json({
		status: statusCode,
		msg: error.message,
		errors: error.errors || undefined,
	});
}


module.exports = {notFound, errorHandler};
