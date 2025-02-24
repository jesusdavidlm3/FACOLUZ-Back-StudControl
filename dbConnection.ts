import mariadb from "npm:mariadb";
import * as t from './interfaces.ts'
import "jsr:@std/dotenv/load";

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

export async function login(data: t.loginData): Promise<object>{		//Inicio de sesion
	const {identification} = data
	const res = await query('SELECT * FROM users WHERE identification = ?', [identification])
	return res
}

export async function createUser(data: t.createuserData) {		//Crea un usuario nuevo (un estudiante)
	const {idType, idNumber, name, lastname, password, userType} = data
	const uid = crypto.randomUUID()
	const _res = await execute(`
		INSERT INTO users(id, name, lastname, passwordSHA256, type, identification, identificationType) VALUES(?, ?, ?, ?, ?, ?, ?)
	`, [uid, name, lastname, password, userType, idNumber, idType])
}

export async function deleteUser(id: string){		//Desactivar un usuario (un estudiante)
	const _res = await execute("UPDATE users SET active = 0 WHERE id = ?", [id])
}

export async function reactivateUser(data: t.reactivateUser){		//Reactivar un usuario (un estudiante)
	const {id, newPassword} = data
	const _res = await execute("UPDATE users SET active = 1, passwordSHA256 = ? WHERE id = ?", [newPassword, id])
}

export async function getSectionInfo(section: string): Promise<object>{		//Devuelve la cantidad de estudiantes de una seccion (falta optimizar)
	let connection											//Que la cuenta la haga la bdd, no el back
	try{
		connection = await db.getConnection()
		const res: t.clasesItem[] = await connection.query(`
			SELECT * FROM clases WHERE section = ?
		`, [section])

		const studentsListPP3 = res.filter(item => item.role == 2 && item.asignature == 'pp3').length
		const teachersListPP3 = res.filter(item => item.role == 1 && item.asignature == 'pp3').length
		const teachersListpp4 = res.filter(item => item.role == 1 && item.asignature == 'pp4').length
		const studentsListpp4 = res.filter(item => item.role == 2 && item.asignature == 'pp4').length

		if(Object.entries(res).length == 0){
			const result = {
				studentsListPP3: 0,
				teachersListPP3: 0,
				teachersListpp4: 0,
				studentsListpp4: 0
			}
			return result
		}else{
			const result = {
				studentsListPP3: studentsListPP3,
				teachersListPP3: teachersListPP3,
				teachersListpp4: teachersListpp4,
				studentsListpp4: studentsListpp4
			}
			return result
		}
	}catch(err){
		throw err
	}finally{
		connection?.release()
	}
}

export async function getInfoByIdentification(identification: string): Promise<object>{	//Devuelve la informacion de un usuario (alumno o profesor)
	const res = await query("SELECT * FROM clases INNER JOIN users ON clases.userId = users.id WHERE users.identification = ?", [identification])
	return res
}

export async function aviableStudentsList(searchParam: string): Promise<object> {	//Devuelve estudiantes segun criterio de busqueda
	const searchParamWith = `${searchParam}%`
	const res = await query("SELECT * FROM users WHERE identification LIKE ? OR name LIKE ? OR lastname LIKE ?", [searchParamWith, searchParamWith, searchParamWith])
	return res
}

export async function aviableTeacherslist(): Promise<object> {		//Devuelve una lista de Profesores
	const res = await query("SELECT id, name, lastname FROM users WHERE type = 1")
	return res
}

export async function asignIntoAsignature(data: t.asignData): Promise<object>{		//Asigna un estudiante o profesor a una seccion
	const res = await execute("INSERT INTO clases(section, asignature, userId, role) VALUES(?, ?, ?, ?)", [data.section, data.asignature, data.userId, data.role])
	return res
}

export async function asignTeacher(data: t.asignData): Promise<object> {
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

export async function clearAsignature(asignature: string){	//Elimina todos los registros relacionados a una asignatura de una seccion
	const _res = await execute("DELETE * FROM clases WHERE asignature = ?", [asignature])
}

export async function clearAllAsigantures(){	//Elimina todos los registros de todas las asignaturas
	const _res = await execute("DELETE FROM clases")
}

export async function getAsignatureList(section: string, asignature: string): Promise<object>{	//Devuelve una lista de alumnos y profesor asignados a una seccion
	const res = await query("SELECT * FROM clases INNER JOIN users ON clases.userId = users.id WHERE clases.section = ? AND	clases.asignature = ?", [section, asignature])
	return res
}

export async function removeFromAsignature(identification: string){		//Elimina el registro de un alumno asignado a una seccion
	const _res = await execute("DELETE FROM clases WHERE userId = ?", [identification])
}