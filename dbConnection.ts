import mariadb from "npm:mariadb";
import * as t from './interfaces.ts'
import "jsr:@std/dotenv/load";
import console from "node:console";

const db = mariadb.createPool({
	host: Deno.env.get("BDD_HOST"),
	user: Deno.env.get("BDD_USER"),
	password: Deno.env.get("BDD_PASSWORD"),
	database: Deno.env.get("BDD_DATABASE"),
	port: Number(Deno.env.get("BDD_PORT")),
	acquireTimeout: Number(Deno.env.get("BDD_TIMEOUT")),
	connectionLimit: Number(Deno.env.get("BDD_CONECTION_LIMITS")),
})

async function query(query: string, params?: object): Promise<object> {
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(query, params)
		return res
	}catch(err){
		console.log(err)
		throw err
	}finally{
		connection?.release()
	}
}

async function execute(query: string, params?: object): Promise<object> {
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(query, params)
		return res
	}catch(err){
		console.log(err)
		throw err
	}finally{
		connection?.release()
	}
}

export async function login(data: t.loginData): Promise<t.userData[]>{		//Inicio de sesion
	const {id} = data
	const res = await query('SELECT * FROM users WHERE id = ?', [id])
	return res
}

export async function createUser(data: t.createuserData) {		//Crea un usuario nuevo (un estudiante)
	const {id, idType, name, lastname, passwordSHA256, userType} = data
	const _res = await execute(`
		INSERT INTO users(id, name, lastname, passwordSHA256, type, identificationType) VALUES(?, ?, ?, ?, ?, ?)
	`, [id, name, lastname, passwordSHA256, userType, idType])
}

export async function deleteUser(id: number){		//Desactivar un usuario (un estudiante)
	const _res = await execute("UPDATE users SET active = 0 WHERE id = ?", [id])
}

export async function reactivateUser(userId: number){		//Reactivar un usuario (un estudiante)
	const _res = await execute("UPDATE users SET active = 1 WHERE id = ?", [userId])
}

export async function getInfoByIdentification(id: number): Promise<object>{	//Devuelve la informacion de un usuario (alumno o profesor)
	const res = await query("SELECT * FROM clases INNER JOIN users ON clases.userId = users.id WHERE users.id = ?", [id])
	return res
}

export async function verifyStudentForAssign(identification:number) {	//Verifica que un estudiante exista y no este asignado
	const res = await query("SELECT name, lastname from users WHERE id = ? AND type = 2", [identification])
	return res
}

export async function searchByNameOrId(searchParam: string, page: number): Promise<object> {	//Devuelve estudiantes segun criterio de busqueda
	const searchParamWith = `${searchParam}%`
	const res = await query(`
		SELECT * FROM users
		WHERE (id LIKE ? OR name LIKE ? OR lastname LIKE ?) AND active = 1 AND type = 2
		LIMIT 10 OFFSET ?
		`, [`${searchParamWith}`, searchParamWith, searchParamWith, (page-1)*10])
	return res
}

export async function aviableTeacherslist(): Promise<object> {		//Devuelve una lista de Profesores
	const res = await query("SELECT id, name, lastname FROM users WHERE type = 1 AND active = 1")
	return res
}

export async function asignIntoAsignature(data: t.asignData): Promise<object>{		//Asigna un estudiante o profesor a una seccion
	const res = await execute("INSERT INTO clases(section, asignature, userId, role) VALUES(?, ?, ?, ?)", [data.section, data.asignature, data.userId, data.role])
	return res
}

export async function asignTeacher(data: t.asignData): Promise<object> {	//Asigna un profesor a una seccion de manera unica
	let connection
	const section = data.section
	const asignature = data.asignature
	const userId = data.userId
	const role = data.role
	try{
		connection = await db.getConnection()
		const check = await connection.query(`
			SELECT * FROM clases WHERE role = 1 AND section = ? AND asignature = ?
		`, [section, asignature])
		console.log(check)
		if(check.length != 0){
			const _deleting = await connection.execute(`
				DELETE FROM clases WHERE role = 1 AND section = ? AND asignature = ?
			`, [section, asignature])
		}
			
		const res = await connection.execute(`
			INSERT INTO clases(section, asignature, userId, role) VALUES(?, ?, ?, ?)
		`, [section, asignature, userId, role])
		return res
		
	}catch(err){
		throw err
	}finally{
		connection?.release()
	}
}

// export async function clearAsignature(asignature: string){	//Elimina todos los registros relacionados a una asignatura de una seccion
// 	const _res = await execute("DELETE * FROM clases WHERE asignature = ?", [asignature])
// }

// export async function clearAllAsigantures(){	//Elimina todos los registros de todas las asignaturas
// 	const _res = await execute("DELETE FROM clases")
// }

export async function getAsignatureList(section: string, asignature: string): Promise<object>{	//Devuelve una lista de alumnos y profesor asignados a una seccion
	const res = await query("SELECT * FROM clases INNER JOIN users ON clases.userId = users.id WHERE clases.section = ? AND	clases.asignature = ?", [section, asignature])
	return res
}

export async function removeFromAsignature(id: number){		//Elimina el registro de un alumno asignado a una seccion
	const _res = await execute("DELETE FROM clases WHERE userId = ?", [id])
}

export async function getSettingsStartedPeriod(){			//Devuelve si el periodo academico se encuentra en curso 
	const res = await query("SELECT * FROM settings WHERE label = 'startedPeriod'")
	return res
}

export async function endOrStartPeriod(){					//Pone en marcha curso el periodo academico o en su defecto lo finaliza
	const currentState = await query ("SELECT value FROM settings WHERE label = 'startedPeriod'")
	if(currentState[0].value == 0){
		await execute("UPDATE settings SET value = 1 WHERE label = 'startedPeriod'")
		return "Periodo academico iniciado"
	}else{
		await execute("UPDATE settings SET value = 0 WHERE label = 'startedPeriod'")
		return "Periodo academico Finalizado"
	}
}

export async function verifyForReactivate(id: number) {
	const res = await query("SELECT active, name, lastname FROM users WHERE id = ?", [id])
	console.log(res)
	return res[0]
}