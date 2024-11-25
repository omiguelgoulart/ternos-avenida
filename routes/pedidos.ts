// routes/pedidos.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// Schema de validação para itens do pedido
export const itemPedidoSchema = z.object({
  produtoId: z.number({ required_error: "O ID do produto é obrigatório" }),
  quantidade: z.number({ required_error: "A quantidade é obrigatória" }).min(1, "A quantidade deve ser maior que 0"),
});

// Schema de validação para pedidos
export const pedidoSchema = z.object({
  usuarioId: z.number({ required_error: "O ID do usuário é obrigatório" }),
  itens: z.array(itemPedidoSchema).min(1, "O pedido deve conter pelo menos um item"),
});

// Endpoint para buscar todos os pedidos
router.get("/", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { id: "desc" },
      include: { itens: { include: { produto: true } } },
    });
    res.json(pedidos);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

// Endpoint para criar um novo pedido
router.post("/", verificaToken, async (req, res) => {
  const validaPedido = pedidoSchema.safeParse(req.body);

  if (!validaPedido.success) {
    res.status(400).json({ erro: validaPedido.error.errors });
    return;
  }

  const { usuarioId, itens } = validaPedido.data;

  try {
    let totalPedido = 0;

    // Calculando o total do pedido baseado no preço dos produtos
    const itensCriacao = await Promise.all(
      itens.map(async (item) => {
        const produto = await prisma.produto.findUnique({
          where: { id: item.produtoId },
        });

        if (!produto) {
          throw new Error(`Produto com ID ${item.produtoId} não encontrado`);
        }

        // Atualiza o total do pedido
        totalPedido += produto.preco * item.quantidade;

        return {
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          preco: produto.preco,
        };
      })
    );

    // Criar o pedido no banco
    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        total: totalPedido,
        itens: {
          create: itensCriacao,
        },
      },
      include: { itens: true },
    });

    res.status(201).json(pedido);
  } catch (error: any) {
    console.error("Erro ao criar pedido:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para deletar um pedido
router.delete("/:id", verificaToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    await prisma.pedido.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar pedido:", error.message);
    res.status(400).json({ error: "Erro ao deletar pedido" });
  }
});

// Endpoint para atualizar o status de um pedido
router.patch("/:id", verificaToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  if (!status) {
    res.status(400).json({ error: "O status é obrigatório" });
    return;
  }

  try {
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { status },
    });

    res.json(pedido);
  } catch (error: any) {
    console.error("Erro ao atualizar pedido:", error.message);
    res.status(400).json({ error: "Erro ao atualizar pedido" });
  }
});

export default router;
