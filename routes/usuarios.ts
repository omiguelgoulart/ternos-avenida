import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import validaSenha from '../validaSenha'

const prisma = new PrismaClient()
const router = Router()

const usuarioSchema = z.object({
    nome: z.string().min(3),
    email: z.string().email(),
    senha: z.string().min(6),
    papel: z.enum(['FUNCIONARIO', 'CLIENTE'])
})

  

router.get('/', async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany()
        res.json(usuarios)
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários' })
    }
})

router.post("/", async (req, res) => {

    const valida = usuarioSchema.safeParse(req.body)
    if (!valida.success) {
      res.status(400).json({ erro: valida.error })
      return
    }
  
    const erros = validaSenha(valida.data.senha)
    if (erros.length > 0) {
      res.status(400).json({ erro: erros.join("; ") })
      return
    }
  
    const salt = bcrypt.genSaltSync(12)
    const hash = bcrypt.hashSync(valida.data.senha, salt)
  
    try {
      const usuario = await prisma.usuario.create({
        data: { ...valida.data, senha: hash }
      })
      res.status(201).json(usuario)
    } catch (error) {
      res.status(400).json(error)
    }
  })
  

export default router