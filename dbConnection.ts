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

export async function login(data: t.loginData){
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

export async function createUser(data: t.createuserData) {
	console.log(data)
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

export async function deleteUser(id: string){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			UPDATE users SET active = 0 WHERE id = ?
		`, [id])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function reactivateUser(data: t.reactivateUser){
	const {id, newPassword} = data
	console.log(data)
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			UPDATE users SET active = 1, passwordSHA256 = ? WHERE id = ?
		`, [newPassword, id])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function getSectionInfo(section: string){
	let connection
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

export async function getInfoByIdentification(identification: string){
	let connection
	try{	
		connection = await db.getConnection()
		const res = await connection.query(`
			SELECT * FROM clases WHERE userId = ?
		`, [identification])
		return res
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

	export async function aviableStudentsList(searchParam: string) {
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

export async function asignIntoAsignature(data: t.asignData){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			INSERT INTO clases(section, asignature, userId, role) VALUES(?, ?, ?, ?)
		`, [data.section, data.asignature, data.userId, data.role])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function clearAsignature(asignature: string){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			DELETE * FROM clases WHERE asignature = ?
		`, [asignature])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function clearAllAsigantures(){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			DELETE * FROM clases
		`)
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function getAsignatureInfo(section: string, asignature: string){
	let connection
	try{
		connection = await db.getConnection()
		const list = await connection.query(`
			SELECT * FROM clases INNER JOIN users ON clases.userId = users.is WHERE clases.section = ? AND	clases.asignature = ?
		`, [section, asignature])
		console.log(list)
		return list
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

export async function removeFromAsignature(identification: string){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(`
			DELETE * FROM clases WHERE userId = ?
		`, [identification])
		return res
	}catch(err){
		return err
	}finally{
		connection?.release()
	}
}

