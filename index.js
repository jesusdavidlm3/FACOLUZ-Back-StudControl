import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import * as db from './dbConnection.js'
import * as tokenVerification from './tokenVerification.js'

const port = process.env.PORT
const secret = process.env.SECRET

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.post('/api/login', async (req, res) => {
	const {identification, passwordHash} = req.body
	let dbResponse
	try{
		dbResponse = await db.login(req.body)
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

app.post('/api/createUser', tokenVerification.forStudyControl, async (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)
	try{
		let dbResponse = await db.createUser(req.body, payload.id)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('Error del servidor')
	}
})

app.delete('/api/deleteUser/:id', tokenVerification.forSysAdmins, async (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)
	try{
		let dbResponse = await db.deleteUser(req.params.id, payload.id)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.patch('/api/reactivateUser', tokenVerification.forSysAdmins, async (req, res) => {
	console.log(req.body)
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)
	try{
		let dbResponse = await db.reactivateUser(req.body, payload.id)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.get('/api/getSectioninfo', tokenVerification.forStudyControl, async (req, res) => {
	try{
		let dbResponse = await db.getSectionInfo()
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('Error del servidor')
	}
})

app.get("/api/getInfoByIdentification/:identification", async(req, res) => {
	
	const identification = req.params.identification

	try{
		let dbResponse = await db.getInfoByIdentification(identification)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.post("/api/asignIntoAsignature", async(req, res) => {
	const data = req.body

	try{
		const dbResponse = await db.asignIntoAsignature(data)
		res.status(200).send("Asignado con exito")
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.delete("/api/clearAsignature/:asignature", async(req, res) => {
	const asignature = req.params.asignature

	try{
		const dbResponse = await db.clearAsignature(asignature)
		res.status(200).send("Materia despejada")
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.delete("/api/clearAllAsignatures", async(req, res) => {
	try{
		const dbResponse = await db.clearAllAsigantures()
		res.status(200).send("Todas las materias despejadas")
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

app.get("/getAsignatureinfo/:section/:asignature", async(req, res) => {
	const asignature = req.params.asignature
	const section = req.params.section

	try{
		const dbResponse = await db.getAsignatureInfo(section, asignature) 
		return dbResponse
	}catch(err){
		console.log(err)
		res.status(500).send("Error del servidor")
	}
})

const server = createServer(app)
server.listen(port, () => {
	console.log(`Su puerto es: ${process.env.PORT}`)
})	