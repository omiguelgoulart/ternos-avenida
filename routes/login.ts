
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { enviaEmail } from "../utils/enviaEmail";
import { gerarCodigoAleatorio } from "../utils/geraCodigo";
import { verificaCodigoRecuperacao } from "../middlewares/verificaCodigoRecuperacao";
import validaSenha from '../utils/validaSenha'
import { verificaBloqueio } from "../middlewares/verificaBloqueio";
import { mensagemBoasVindas } from "../utils/menssagem";


const prisma = new PrismaClient()
const router = Router()

async function autenticarUsuario(email: string, senha: string) {
  const usuario = await prisma.usuario.findFirst({ where: { email } });
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
    return null;
  }
  return usuario;
}

async function atualizarLoginBemSucedido(usuario: any) {
  await prisma.usuario.update({
    where: { email: usuario.email },
    data: {
      ultimoLogin: new Date(),
      tentativasLogin: 0,
      bloqueadoAte: null,
    },
  });
}

async function tratarTentativaInvalida(usuario: any) {
  const tentativasInvalidas = (usuario.tentativasLogin ?? 0) + 1;
  let bloqueadoAte: Date | null = null;

  if (tentativasInvalidas >= 3) {
    bloqueadoAte = new Date();
    bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + 60);
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      tentativasLogin: tentativasInvalidas,
      bloqueadoAte,
    },
  });

  await prisma.log.create({
    data: {
      descricao: "Tentativa de Acesso Inválida",
      complemento: `Email ${usuario.email}`,
      usuarioId: usuario.id,
    },
  });

  return bloqueadoAte;
}

router.post("/", verificaBloqueio, async (req, res) => {
  const { email, senha } = req.body;
  const mensagemPadrao = "Login ou senha incorretos";

  if (!email || !senha) {
    res.status(400).json({ erro: mensagemPadrao });
    return;
  }

  try {
    const usuario = await autenticarUsuario(email, senha);

    if (usuario) {
      const boasVindas = mensagemBoasVindas(usuario);
      await atualizarLoginBemSucedido(usuario);

      const token = jwt.sign(
        { userLogadoId: usuario.id, userLogadoNome: usuario.nome },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        mensagem: boasVindas,
        token,
      })
      return;
    } else {
      const usuarioExistente = await prisma.usuario.findFirst({ where: { email } });

      if (usuarioExistente) {
        const bloqueadoAte = await tratarTentativaInvalida(usuarioExistente);

        res.status(400).json({
          erro: mensagemPadrao,
          ...(bloqueadoAte && {
            mensagem: "Usuário bloqueado após múltiplas tentativas inválidas.",
            tempoRestante: Math.ceil((bloqueadoAte.getTime() - new Date().getTime()) / 60),
          }),
        })
        return
        ;
      }

      res.status(400).json({ erro: mensagemPadrao })
      return;
    }
  } catch (error) {
    console.error("Erro ao realizar login:", error);
    res.status(500).json({ erro: "Erro ao processar login." })
    return;
  }
});


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
