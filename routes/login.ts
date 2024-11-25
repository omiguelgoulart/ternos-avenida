
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
    const { email, senha } = req.body

    const mensagemPadrao = "Login ou senha incorretos"

    if (!email || !senha) {
        res.status(400).json({ erro: mensagemPadrao })
        return
    }

    try {
        const usuario = await prisma.usuario.findFirst({
            where: { email }
        })

        if (!usuario) {
            res.status(400).json({ erro: mensagemPadrao })
            return
        }

        if (bcrypt.compareSync(senha, usuario.senha)) {
            const token = jwt.sign({
                userLogadoId: usuario.id,
                userLogadoNome: usuario.nome
            },
                process.env.JWT_KEY as string,
                { expiresIn: "1h" }
            )

            res.status(200).json({
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                token
            })
        } else {
            await prisma.log.create({
                data: { 
                    descricao: "Tentativa de Acesso Inválida", 
                    complemento: `Email ${usuario.email}`,
                    usuarioId: usuario.id
                }
            })

            res.status(400).json({ erro: mensagemPadrao })
        }
    } catch (error) {
        res.status(400).json(error)
    }
})

export default router
