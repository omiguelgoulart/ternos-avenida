import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { isBefore } from "date-fns";

const prisma = new PrismaClient();

export async function verificaCodigoRecuperacao(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body;
  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).json({ error: "Token não informado" });
    return;
  }

  const codigo = authorization.split(" ")[1]; // Extrai o código do header Authorization

  try {
    console.log("Recebendo email:", email);
    console.log("Recebendo código do header:", codigo);

    // Verifica se o email foi fornecido
    if (!email) {
      console.log("Email não fornecido.");
      res.status(400).json({ error: "Email é obrigatório" });
      return;
    }

    // Busca o usuário pelo email
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    console.log("Usuário encontrado no banco:", usuario);

    // Verifica se o usuário existe e se o código corresponde
    if (!usuario) {
      console.log("Usuário não encontrado.");
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    if (usuario.resetToken !== codigo) {
      console.log("Código inválido para o usuário.");
      res.status(400).json({ error: "Código inválido" });
      return;
    }

    // Verifica se o código expirou
    if (!usuario.resetTokenExpires || isBefore(new Date(usuario.resetTokenExpires), new Date())) {
      console.log("Código expirado ou data de expiração inválida.");
      res.status(400).json({ error: "O código expirou" });
      return;
    }

    console.log("Código válido. Continuando...");
    // Adiciona o usuário ao req.body para ser usado na próxima etapa
    req.body.usuario = usuario;

    next();
  } catch (error) {
    console.error("Erro ao verificar código de recuperação:", error);
    res.status(500).json({ error: "Erro ao verificar código de recuperação" });
  }
}
