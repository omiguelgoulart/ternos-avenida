import express from 'express'
import routesLogin from "./routes/login";
import routesUsuario from "./routes/usuarios";
import routesProduto from "./routes/produtos"; 
import routesPedido from "./routes/pedidos"; 

const app = express()
const port = 3000

app.use(express.json())

app.use("/login", routesLogin);
app.use("/usuarios", routesUsuario);
app.use("/produtos", routesProduto);
app.use("/pedidos", routesPedido);

app.get("/", (req, res) => {
    res.send("API Ternos Avenida")
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})