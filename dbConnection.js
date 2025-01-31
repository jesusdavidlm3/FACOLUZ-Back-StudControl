import mariadb from 'mariadb'
import { v4 as UIDgenerator } from 'uuid';


const db = mariadb.createPool({
	host: process.env.BDD_HOST,
	user: process.env.BDD_USER,
	password: process.env.BDD_PASSWORD,
	database: process.env.BDD_DATABASE,
	port: process.env.BDD_PORT,
	acquireTimeout: process.env.BDD_TIMEOUT,
	conexionLimit: process.env.BDD_CONECTION_LIMITS
})

export async function login(data){
	const {identification, passwordHash} = data
	let connection
	try{
		connection = await db.getConnection()
		const user = await connection.query('SELECT * FROM users WHERE identification = ?', [identification])
		return user
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function createUser(data, currentUser) {
	console.log(data)
	const {idType, idNumber, name, lastname, password, userType} = data
	const uid = UIDgenerator()
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			INSERT INTO users(id, name, lastname, passwordSHA256, type, identification, identificationType) VALUES(?, ?, ?, ?, ?, ?, ?)
		`, [uid, name, lastname, password, userType, idNumber, idType])
		generateLogs(0, uid, currentUser)
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function deleteUser(id, currentUser){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			UPDATE users SET active = 0 WHERE id = ?
		`, [id])
		generateLogs(1, userId, currentUser)
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function reactivateUser(data, currentUser){
	const {id, newPassword} = data
	console.log(data)
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			UPDATE users SET active = 1, passwordSHA256 = ? WHERE id = ?
		`, [newPassword, id])
		generateLogs(2, id, currentUser)
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function getSectionInfo(section){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			SELECT * FROM clases WHERE section = ?
		`, [section])
		const studentsListPP3 = res.filter(item => item.role == 0 && item.asignature == 'pp3').lenght
		const teachersListPP3 = res.filter(item => item.role == 1 && item.asignature == 'pp3').lenght
		const teachersListpp4 = res.filter(item => item.role == 1 && item.asignature == 'pp4').lenght
		const studentsListpp4 = res.filter(item => item.role == 0 && item.asignature == 'pp4').lenght

		const result = {
			studentsListPP3: studentsListPP3,
			teachersListPP3: teachersListPP3,
			teachersListpp4: teachersListpp4,
			studentsListpp4: studentsListpp4
		}

		return result
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function getInfoByIdentification(identification){
	let connection
	try{	
		connection = await db.getConnection()
		const res = await connection.query(`
			SELECT * FROM clases WHERE iserId = ?
		`, [identification])
		return res
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function asignIntoAsignature(data){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			INSERT INTO clases(section, asignature, userId, role) VALUES(?, ?, ?, ?)
		`, [data.section, data.asignature, data.userId, data.role])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function clearAsignature(asignature){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			DELETE * FROM clases WHERE asignature = ?
		`, [asignature])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function clearAllAsigantures(){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			DELETE * FROM clases
		`)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function getAsignatureInfo(section, asignature){
	let connection
	try{
		connection = await db.getConnection()
		const list = await connection.query(`
			SELECT * FROM clases INNER JOIN users WHERE clases.section = ? AND	clases.asignature = ?
		`, [section, asignature])
		return list
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function removeFromAsignature(identification){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			DELETE * FROM clases WHERE userId = ?
		`, [identification])
		return res
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

