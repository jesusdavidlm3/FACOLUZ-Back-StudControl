import jwt from 'npm:jsonwebtoken'
const secret = Deno.env.get("SECRET")


export function forTeachOrStud(req, res, next){
	try{
		const token = req.headers.authorization.split(" ")[1]
		const payload = jwt.verify(token, secret)
		if(Date().now > payload.exp){
			return res.status(401).send('Sesion expirada')
		}else if(payload.type != 1 || payload.type != 2){
            return res.status(401).send('Usted no se encuentra registrado como estudiante o profesor')
        }
		next()
	}catch(err){
		return res.status(401).send('Token no válido');
	}
}

export function forTeachers(req, res, next){
	try{
		const token = req.headers.authorization.split(" ")[1]
		const payload = jwt.verify(token, secret)
		if(Date().now > payload.exp){
			return res.status(401).send('Sesion expirada')
		}else if(payload.type != 1){
            return res.status(401).send('Usted no se encuentra registrado como profesor')
        }
		next()
	}catch(err){
		return res.status(401).send('Token no válido');
	}
}

export function forSysAdmins(req, res, next){
	try{
		const token = req.headers.authorization.split(" ")[1]
		const payload = jwt.verify(token, secret)
		if(Date().now > payload.exp){
			return res.status(401).send('Sesion expirada')
		}else if(payload.type != 0){
			return res.status(401).send('Usted no es un administrador de sistemas')
		}
		next()
	}catch(err){
		return res.status(401).send('Token no válido');
	}
}

export async function forStudyControl(req, res, next: () => Promise<void>){
	try{
		const token = req.headers.authorization.split(" ")[1]
		const payload = jwt.verify(token, secret)
		if(Date().now > payload.exp){
			return res.status(401).send('Sesion expirada')
		}else if(payload.type != 3){
			return res.status(401).send('Usted no es un trabajador de control de estudios')
		}
		await next()
	}catch(err){
		return res.status(401).send('Token no válido');
	}
}
