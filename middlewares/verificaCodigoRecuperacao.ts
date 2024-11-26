import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { isBefore } from "date-fns";

const prisma = new PrismaClient();

export async function verificaCodigoRecuperacao(req: Request, res: Response, next: NextFunction) {
  const { email, codigo } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || usuario.resetToken !== codigo) {
      res.status(400).json({ error: "Código inválido" });
      return;
    }

    if (!usuario.resetTokenExpires || isBefore(new Date(usuario.resetTokenExpires), new Date())) {
      res.status(400).json({ error: "O código expirou" });
      return;
    }

    req.body.usuario = usuario;

    next();
  } catch (error) {
    console.error("Erro ao verificar código de recuperação:", error);
    res.status(500).json({ error: "Erro ao verificar código de recuperação" });
  }
}
