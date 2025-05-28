import express from "npm:express@4.18.2";
import cors from "npm:cors";
import jwt from 'npm:jsonwebtoken'
import * as db from './dbConnection.ts'
import * as tokenVerification from './tokenVerification.ts'
import "jsr:@std/dotenv/load";
import * as t from './interfaces.ts'
import console from "node:console";

const port = Deno.env.get("PORT")
const secret = Deno.env.get("SECRET")

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.post('/api/login', async (req, res) => {	//inicio de sesion
	const {passwordHash} = req.body
	try{
		const dbResponse: t.userData[] = await db.login(req.body)
		if(dbResponse.length == 0){
			res.status(404).send('Usuario no encontrado')
		}else if(dbResponse[0].passwordSHA256 != passwordHash){
			res.status(401).send('Contraseña Incorrecta')
		}else if(dbResponse[0].active == false){
			res.status(404).send('Este usuario se encuentra inactivo')
		}else if(dbResponse[0].type != 3){
			res.status(401).send('Usted no es un trabajador de control de estudios')
		}else{
			const token = jwt.sign({
				id: dbResponse[0].id,
				name: dbResponse[0].name,
				type: dbResponse[0].type,
				exp: Date.now() + 600000
			}, secret)
			res.status(200).send({...dbResponse[0], jwt: token})
		}
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.post('/api/createUser', tokenVerification.forStudyControl, async (req, res) => {	//Crea un usuario nuevo (un estudiante)
	try{
		const dbResponse = await db.createUser(req.body)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('Error del servidor')
	}
})

app.delete('/api/deleteUser/:id', tokenVerification.forStudyControl, async (req, res) => {	//Desactivar un usuario (un estudiante)
	try{
		const dbResponse = await db.deleteUser(req.params.id)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.patch('/api/reactivateUser/:userId', tokenVerification.forStudyControl, async (req, res) => {	//Reactivar un usuario (un estudiante)

	const userId = req.params.userId
	
	try{
		const dbResponse = await db.reactivateUser(userId)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

// app.get('/api/getSectioninfo/:section', tokenVerification.forStudyControl, async (req, res) => {	//Devuelve la cantidad de estudiantes de una seccion (falta optimizar)
// 	const section = req.params.section
// 	try{
// 		const dbResponse = await db.getSectionInfo(section)
// 		res.status(200).send(dbResponse)
// 	}catch(err){
// 		console.log(err)
// 		res.status(500).send('Error del servidor')
// 	}
// })

app.get("/api/getInfoByIdentification/:identification", tokenVerification.forStudyControl, async(req, res) => {	//Devuelve la informacion de un usuario (alumno o profesor)
	
	const identification = req.params.identification

	try{
		const dbResponse = await db.getInfoByIdentification(identification)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.get("/api/verifyStudentForAssign/:identification", tokenVerification.forStudyControl, async(req, res) => {		//Verifica quer un estudiante exista y no este asignado

	const identification = req.params.identification

	try{
		const dbResponde = await db.verifyStudentForAssign(identification)
		res.status(200).send(dbResponde)
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.get("/api/searchByNameOrId/:searchParam", tokenVerification.forStudyControl, async(req, res) => {	//Devuelve estudiantes segun criterio de busqueda
	const searchParam = req.params.searchParam

	try{
		const dbResponse = await db.searchByNameOrId(searchParam)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.post("/api/asignIntoAsignature", tokenVerification.forStudyControl, async(req, res) => {	//Asigna un estudiante o profesor a una seccion
	const data: t.asignData = req.body

	try{
		const _dbResponse = await db.asignIntoAsignature(data)
		res.status(200).send("Asignado con exito")
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.get("/api/aviableTeachersList", tokenVerification.forStudyControl, async(req, res) => {		//Devuelve una lista de profesores
	try{
		const dbResponse = await db.aviableTeacherslist()
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.put("/api/asignTeacher", tokenVerification.forStudyControl, async(req, res) => {	//Asigna un profesor a una seccion de forma unica
	const data: t.asignData = req.body

	try{
		const dbResponse = await db.asignTeacher(data)
		console.log(dbResponse)
		res.status(200).send(true)
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

// app.delete("/api/clearAsignature/:asignature", tokenVerification.forStudyControl, async(req, res) => {	//Elimina todos los registros relacionados a una asignatura de una seccion
// 	const asignature = req.params.asignature

// 	try{
// 		const _dbResponse = await db.clearAsignature(asignature)
// 		res.status(200).send("Materia despejada")
// 	}catch(err){
// 		console.log(err)
// 		res.status(500).send("Error del servidor")
// 	}
// })

// app.delete("/api/clearAllAsignatures", tokenVerification.forStudyControl, async(req, res) => {		//Elimina todos los registros de todas las asignaturas
// 	try{
// 		const _dbResponse = await db.clearAllAsigantures()
// 		res.status(200).send("Todas las materias despejadas")
// 	}catch(err){
// 		console.log(err)
// 		res.status(500).send("Error del servidor")
// 	}
// })

// app.get("/api/getAsignatureList/:section/:asignature", tokenVerification.forStudyControl, async(req, res) => {	//Devuelve una lista de alumnos y profesor asignados a una seccion
// 	const asignature = req.params.asignature
// 	const section = req.params.section

// 	try{
// 		const dbResponse = await db.getAsignatureList(section, asignature)
// 		res.status(200).send(dbResponse)
// 	}catch(err){
// 		console.log(err)
// 		res.status(500).send("Error del servidor")
// 	}
// })

app.delete("/api/removeFromAsignature/:identification", tokenVerification.forStudyControl, async(req, res) => {		//Elimina el registro de un alumno asigando a una Seccion
	const id = req.params.identification

	try{
		const _dbResponse = await db.removeFromAsignature(id)
		res.status(200).send(true) 
	}catch(err){
		console.log(err)
		res.status(500).send("error del servidor")
	}
})

app.get("/api/getSettingsStartedPeriod", tokenVerification.forStudyControl, async(req, res) => {	//Devuelve si el periodo academico se encuentra en curso
	try{
		const dbResponse = await db.getSettingsStartedPeriod()
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send("error del servidor")
	}
})

app.post("/api/endOrStartPeriod", tokenVerification.forStudyControl, async(req, res) => {	//Pone en marcha curso el periodo academico o en su defecto lo finaliza
	try{
		const dbResponse = await db.endOrStartPeriod()
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send(err)
	}
})

app.get("/api/verifyForReactivate/:id", tokenVerification.forStudyControl, async(req, res) => {
	const id = req.params.id
	try{
		const dbResponde = await db.verifyForReactivate(id)
		res.status(200).send(dbResponde)
	}catch(err){
		console.log(err)
		res.status(500).send("err")
	}
})

app.listen(port, "0.0.0.0", () => {
	console.log(`Puerto: ${port}`)
})