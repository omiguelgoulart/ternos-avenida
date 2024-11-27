
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { enviaEmail } from "../utils/enviaEmail";
import { gerarCodigoAleatorio } from "../utils/geraCodigo";
import { verificaCodigoRecuperacao } from "../middlewares/verificaCodigoRecuperacao";
import validaSenha from '../utils/validaSenha'


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
          const ultimoLogin = usuario.ultimoLogin ? usuario.ultimoLogin : "Este é o seu primeiro acesso ao sistema";
          await prisma.usuario.update({
            where: { email },
            data: {
                ultimoLogin: new Date() 
            }
        });

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
                ultimoLogin: ultimoLogin,
                token
            });         

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

// recuperar a senha 
router.post("/recupera-senha", async (req, res) => {
    const { email } = req.body;
  
    try {
      const usuario = await prisma.usuario.findUnique({ where: { email } });
  
      if (!usuario) {
        res.status(404).json({ error: "E-mail não encontrado" });
        return;
      }
  
      const codigo = gerarCodigoAleatorio();
      const expiraEm = new Date();
      expiraEm.setMinutes(expiraEm.getMinutes() + 10); // Expira em 10 minutos
  
      // Atualizar o código e a validade no banco
      await prisma.usuario.update({
        where: { email },
        data: {
          resetToken: codigo,
          resetTokenExpires: expiraEm,
        },
      });
  
      // Enviar e-mail com o código
      await enviaEmail(email, usuario.nome, codigo);


      res.status(200).json({ message: "E-mail enviado com sucesso" });
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  });

  router.patch("/recupera-senha", verificaCodigoRecuperacao, async (req, res) => {
    const { novaSenha, usuario } = req.body;
  
    try {
      console.log("Iniciando processo de redefinição de senha...");
  
      // Valida a nova senha
      const erros = validaSenha(novaSenha);
      if (erros.length > 0) {
        console.log("Erro na validação da senha:", erros);
        res.status(400).json({ error: erros.join("; ") });
        return;
      }
  
      console.log("Senha validada com sucesso. Gerando hash...");
      // Cria o hash da nova senha
      const salt = await bcrypt.genSalt(12);
      const senhaHash = await bcrypt.hash(novaSenha, salt);
  
      console.log("Atualizando senha no banco de dados...");
      // Atualiza a senha do usuário e invalida o código
      await prisma.usuario.update({
        where: { email: usuario.email },
        data: {
          senha: senhaHash,
          resetToken: null,
          resetTokenExpires: null,
        },
      });
  
      console.log("Senha atualizada com sucesso.");
      res.status(200).json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", (error as Error).message);
      res.status(500).json({ error: "Erro ao redefinir senha. Tente novamente mais tarde." });
    }
  });  

export default router
