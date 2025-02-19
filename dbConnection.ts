import mariadb from "npm:mariadb";
import * as t from './interfaces.ts'
import "jsr:@std/dotenv/load";

const db = mariadb.createPool({
	host: Deno.env.get("BDD_HOST"),
	user: Deno.env.get("BDD_USER"),
	password: Deno.env.get("BDD_PASSWORD"),
	database: Deno.env.get("BDD_DATABASE"),
	port: Deno.env.get("BDD_PORT"),
	acquireTimeout: Deno.env.get("BDD_TIMEOUT"),
	conexionLimit: Deno.env.get("BDD_CONECTION_LIMITS"),
})

export async function login(data: t.loginData){		//Inicio de sesion
	const {identification, passwordHash} = data
	let connection
	try{
		connection = await db.getConnection()
		const user = await connection.query('SELECT * FROM users WHERE identification = ?', [identification])
		return user
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function createUser(data: t.createuserData) {		//Crea un usuario nuevo (un estudiante)
	const {idType, idNumber, name, lastname, password, userType} = data
	const uid = crypto.randomUUID()
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			INSERT INTO users(id, name, lastname, passwordSHA256, type, identification, identificationType) VALUES(?, ?, ?, ?, ?, ?, ?)
		`, [uid, name, lastname, password, userType, idNumber, idType])
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function deleteUser(id: string){		//Desactivar un usuario (un estudiante)
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			UPDATE users SET active = 0 WHERE id = ?
		`, [id])
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function reactivateUser(data: t.reactivateUser){		//Reactivar un usuario (un estudiante)
	const {id, newPassword} = data
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			UPDATE users SET active = 1, passwordSHA256 = ? WHERE id = ?
		`, [newPassword, id])
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function getSectionInfo(section: string){		//Devuelve la cantidad de estudiantes de una seccion (falta optimizar)
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
		return err
	}finally{
		connection?.release()
	}
}

export async function getInfoByIdentification(identification: string){	//Devuelve la informacion de un usuario (alumno o profesor)
	let connection
	console.log(identification)
	try{	
		connection = await db.getConnection()
		const res = await connection.query(`
			SELECT * FROM clases INNER JOIN users ON clases.userId = users.id WHERE users.identification = ?
		`, [identification])
		console.log(res)
		return res
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function aviableStudentsList(searchParam: string) {	//Devuelve estudiantes segun criterio de busqueda
	let connection
	const searchParamWith = `${searchParam}%`
	try{	
		connection = await db.getConnection()
		const res = await connection.query(`
			SELECT * FROM users WHERE identification LIKE ? OR name LIKE ? OR lastname LIKE ?
		`, [searchParamWith, searchParamWith, searchParamWith])
		return res
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function aviableTeacherslist() {		//Devuelve una lista de Profesores
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			SELECT id, name, lastname FROM users WHERE type = 1
		`)
		return res
	}catch(err){
		console.log(err)
		return err
	}finally{
		connection?.release()
	}
}

export async function asignIntoAsignature(data: t.asignData){		//Asigna un estudiante o profesor a una seccion
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			INSERT INTO clases(section, asignature, userId, role) VALUES(?, ?, ?, ?)
		`, [data.section, data.asignature, data.userId, data.role])
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function asignTeacher(data: t.asignData) {
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
			const deleting = await connection.execute(`
				DELETE FROM clases WHERE role = 1 AND section = ? AND asignature = ?
			`, [section, asignature])
		}
			
		const res = await connection.execute(`
			INSERT INTO clases(section, asignature, userId, role) VALUES(?, ?, ?, ?)
		`, [section, asignature, userId, role])
		return res
		
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function clearAsignature(asignature: string){	//Elimina todos los registros relacionados a una asignatura de una seccion
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			DELETE * FROM clases WHERE asignature = ?
		`, [asignature])
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function clearAllAsigantures(){	//Elimina todos los registros de todas las asignaturas
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			DELETE FROM clases
		`)
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function getAsignatureList(section: string, asignature: string){	//Devuelve una lista de alumnos y profesor asignados a una seccion
	let connection
	try{
		connection = await db.getConnection()
		const list = await connection.query(`
			SELECT * FROM clases INNER JOIN users ON clases.userId = users.id WHERE clases.section = ? AND	clases.asignature = ?
		`, [section, asignature])
		return list
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function removeFromAsignature(identification: string){		//Elimina el registro de un alumno asignado a una seccion
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			DELETE FROM clases WHERE userId = ?
		`, [identification])
		return res
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}