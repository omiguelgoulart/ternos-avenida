// routes/produtos.ts
import { Router } from "express";
import { CategoriaProduto, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// Schema de validação para produtos
const produtoSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  preco: z.number().min(0.01, "O preço deve ser maior que 0"),
  estoque: z.number().int().min(0, "O estoque deve ser maior ou igual a 0"),
  categoria: z.nativeEnum(CategoriaProduto),
  criadoPorId: z.number({ required_error: "O ID do criador é obrigatório" }),
});

// Endpoint para listar todos os produtos
router.get("/", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    res.json(produtos);
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error.message);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

// Endpoint para criar um produto
router.post("/", verificaToken, async (req, res) => {
  const validaProduto = produtoSchema.safeParse(req.body);

  if (!validaProduto.success) {
    res.status(400).json({ erro: validaProduto.error.errors });
    return;
  }

  try {
    const produto = await prisma.produto.create({
      data: {
        ...validaProduto.data,
        descricao: validaProduto.data.descricao ?? "",
        criadoEm: new Date(),
      },
    });
    res.status(201).json(produto);
  } catch (error: any) {
    console.error("Erro ao criar produto:", error.message);
    res.status(400).json({ error: "Erro ao criar produto" });
  }
});

// Endpoint para deletar um produto
router.delete("/:id", verificaToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    await prisma.produto.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar produto:", error.message);
    res.status(400).json({ error: "Erro ao deletar produto" });
  }
});

// Endpoint para atualizar um produto
router.put("/:id", verificaToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const validaProduto = produtoSchema.safeParse(req.body);

  if (!validaProduto.success) {
    res.status(400).json({ erro: validaProduto.error.errors });
    return;
  }

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ...validaProduto.data,
        descricao: validaProduto.data.descricao ?? "",
      },
    });
    res.json(produto);
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error.message);
    res.status(400).json({ error: "Erro ao atualizar produto" });
  }
});

export default router;
