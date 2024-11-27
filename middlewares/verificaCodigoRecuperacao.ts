import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { isBefore } from "date-fns";

const prisma = new PrismaClient();

export async function verificaCodigoRecuperacao(req: Request, res: Response, next: NextFunction) {
  const { email, codigo } = req.body;

  try {
    console.log("Recebendo email:", email);
    console.log("Recebendo código:", codigo);

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    console.log("Usuário encontrado no banco:", usuario);

    if (!usuario || usuario.resetToken !== codigo) {
      console.log("Código inválido ou usuário não encontrado.");
      res.status(400).json({ error: "Código inválido" });
      return;
    }

    if (!usuario.resetTokenExpires || isBefore(new Date(usuario.resetTokenExpires), new Date())) {
      console.log("Código expirado ou data de expiração inválida.");
      res.status(400).json({ error: "O código expirou" });
      return;
    }

    console.log("Código válido. Continuando...");
    req.body.usuario = usuario;

    next();
  } catch (error) {
    console.error("Erro ao verificar código de recuperação:", error);
    res.status(500).json({ error: "Erro ao verificar código de recuperação" });
  }
}

