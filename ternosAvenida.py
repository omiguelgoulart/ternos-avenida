import requests
import matplotlib.pyplot as plt
import numpy as np
import pwinput
from datetime import datetime

url_login = "http://localhost:3000/login"
url_usuario = "http://localhost:3000/usuarios"
url_recupera = "http://localhost:3000/login/recupera-senha"
url_pedido = "http://localhost:3000/pedidos"
url_produto = "http://localhost:3000/produtos"

def titulo(texto, traco = '-'):
    print()
    print(texto)
    print(traco*40)

def formataData(data_iso):
    data = datetime.fromisoformat(data_iso.replace("Z", "+00:00"))

    return data.strftime("%d/%m/%Y às %H:%M")

def formatar_tempo_restante(segundos):
    minutos = segundos // 60
    segundos_restantes = segundos % 60
    return f"{minutos} minuto(s) e {segundos_restantes} segundo(s)"


   
usuario = ""
token = ""
codigo = ""
criadoPorId = ""
dataLogVelho = ""
dataLogNovo = ""
ultimoLogin = ""


#----------------------- Login -----------------------#
def login():
    titulo("Login do Usuário")
    
    email = input("Email:  ")
    senha = pwinput.pwinput("Senha: ")
    
    response = requests.post(url_login, json={
        "email": email,
        "senha": senha
    })
    
    if response.status_code == 200:
        resposta = response.json()
        
        global usuario
        global usuarioId
        global token
        global ultimoLogin
    
        usuario = resposta['nome']
        usuarioId = resposta['id']
        token = resposta['token']
        ultimoLogin = resposta.get('ultimoLogin')
        
        if ultimoLogin:
            try:
                ultimoLoginFormatado = formataData(ultimoLogin)
                print(f"Bem-vindo {usuario}, seu último login foi em {ultimoLoginFormatado}")
            except Exception as e:
                print(f"Erro ao formatar a data do último login: {e}")
                print(f"Bem-vindo {usuario}, não foi possível exibir o último login.")
        else:
            print(f"Bem-vindo {usuario}, este é seu primeiro acesso!")
    elif response.status_code == 403:
        resposta = response.json()
        tempoRestante = resposta.get('tempoRestante', 0)
        tempoFormatado = formatar_tempo_restante(tempoRestante)
        print(f"Usuário bloqueado! Tente novamente em {tempoFormatado}.")
    elif response.status_code == 400:
        print("Login ou senha incorretos.")
    else:
        print("Erro ao realizar login. Por favor, tente novamente mais tarde.")



        
        
def esqueceuSenha():
    titulo("Recuperação de Senha")
    
    global email  # Torna o email acessível para outras funções
    email = input("Email: ")
    
    # Solicita a recuperação de senha
    response = requests.post(url_recupera, json={"email": email})
    
    if response.status_code == 200:
        print("E-mail enviado com sucesso! Por favor, insira o código enviado para o seu e-mail.")
        
        # Solicita que o usuário insira o código manualmente
        global codigo
        codigo = input("Insira o código de recuperação: ")
        
        alterarSenha()
    else:
        print("Erro ao enviar e-mail!")
        print("Status code:", response.status_code)
        print("Resposta da API:", response.text)


def alterarSenha():
    titulo("Alteração de Senha")
    
    senha = pwinput.pwinput("Nova Senha: ")
    
    # Envia o PATCH para alterar a senha
    response = requests.patch(url_recupera, json={
        "email": email,
        "codigo": codigo,  # Inclui o código manualmente inserido
        "novaSenha": senha
    }, headers={
        "Authorization": f"Bearer {codigo}"  # Utiliza o código como token
    })
    
    if response.status_code == 200:
        print("Senha alterada com sucesso!")
    else:
        print("Erro ao alterar senha!")
        print("Status code:", response.status_code)
        print("Resposta da API:", response.text)

        
#----------------------- Cadastro Usuário -----------------------#    
def cadastro():
    titulo("Cadastro de Usuário")
    
    nome = input("Nome: ")
    email = input("Email: ")
    senha = pwinput.pwinput("Senha: ")
    
    response = requests.post(url_usuario, json = {
        "nome": nome,
        "email": email,
        "senha": senha
    })
    
    if response.status_code == 201:
        print("Usuário cadastrado com sucesso!")
    else:
        print("Erro ao cadastrar usuário!")
        
#----------------------- Produtos -----------------------#
def listarProdutos():
    titulo("Lista de Produtos")
    response = requests.get(url_produto)
    
    if response.status_code == 200:
        produtos = response.json()
        
        headers = ["ID", "Nome", "Descrição", "Preço", "Estoque", "Categoria"]
        table_data = [
            [produto['id'], produto['nome'], produto['descricao'], f"R$ {produto['preco']:.2f}", produto['estoque'], produto['categoria']]
            for produto in produtos
        ]

        col_widths = [max(len(str(item)) for item in col) for col in zip(*([headers] + table_data))]

        header_row = " | ".join(f"{header:<{col_widths[i]}}" for i, header in enumerate(headers))
        print(header_row)
        print("-" * len(header_row))

        for row in table_data:
            print(" | ".join(f"{item:<{col_widths[i]}}" for i, item in enumerate(row)))
    else:
        print("Erro ao listar produtos!")
        print("Status code:", response.status_code)
        print("Resposta da API:", response.text)
        
              
def cadastroProduto():
    
    titulo("Cadastro de Produto")
    
    if token == "":
        print("Você precisa estar logado para cadastrar um produto!")
        return
    
    nome = input("Nome: ")
    descricao = input("Descrição: ")
    preco = float(input("Preço: "))
    estoque = int(input("Estoque: "))
    categoria = input("Categoria: ").upper()
    
    response = requests.post(url_produto, json = {
        
        
        
       
        
        "nome": nome,
        "descricao": descricao,
        "preco": preco,
        "estoque": estoque,
        "categoria": categoria,
        "criadoPorId": usuarioId
    }, headers = {
        "Authorization": f"Bearer {token}"
    })
    
    if response.status_code == 201:
        print("Produto cadastrado com sucesso!")
    else:
        print("Erro ao cadastrar produto!")
        print("Status code:", response.status_code)
        print("Resposta da API:", response.text)


def alterarProduto():  
    titulo("Alteração de Produto")
    
    if token == "":
        print("Você precisa estar logado para alterar um produto!")
        return
    
    listarProdutos()
    
    id = int(input("ID do produto a ser alterado: "))
    
    
    preco = float(input("Preço: "))
    estoque = int(input("Estoque: "))
    
    response = requests.patch(f"{url_produto}/{id}", json = {
        
        "preco": preco,
        "estoque": estoque
    }, headers = {
        "Authorization": f"Bearer {token}"
    })
    
    if response.status_code == 200:
        print("Produto alterado com sucesso!")
    else:
        print("Erro ao alterar produto!")
        print("Status code:", response.status_code)
        print("Resposta da API:", response.text)
        
        
def excluirProduto():
    titulo("Exclusão de Produto")
    
    if token == "":
        print("Você precisa estar logado para excluir um produto!")
        return
    
    listarProdutos()
    
    id = int(input("ID do produto a ser excluído: "))
    
    response = requests.delete(f"{url_produto}/{id}", headers = {
        "Authorization": f"Bearer {token}"
    })
    
    if response.status_code == 200:
        print("Produto excluído com sucesso!")
    else:
        print("Erro ao excluir produto!")
        print("Status code:", response.status_code)
        print("Resposta da API:", response.text)


#----------------------- Menu Produtos -----------------------#
def menuProdutos():
    while True:
        titulo("Menu de Produtos")
        print("1 - Listar Produtos")
        print("2 - Cadastrar Produto")
        print("3 - Alterar Produto")
        print("4 - Excluir Produto")
        print("0 - Voltar")
        
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            listarProdutos()
        elif opcao == "2":
            cadastroProduto()
        elif opcao == "3":
            alterarProduto()
        elif opcao == "4":
            excluirProduto()
        elif opcao == "0":
            menuPrincipal()
        else:
            print("Opção inválida!")
            

#----------------------- Grafico -----------------------#
# Grafico de barras 
def graficoEstoque():
    response = requests.get(url_produto)
    
    if response.status_code != 200:
        print('Erro ao recuperar produtos!')
        return
    
    produtos = response.json()
    categorias = tuple(set([produto['categoria'] for produto in produtos]))
    total_estoque = [0] * len(categorias)
    
    for produto in produtos:
        index = categorias.index(produto['categoria'])
        total_estoque[index] += 1

    fig, ax = plt.subplots()
    ax.bar(categorias, total_estoque, color='gray')
    
    ax.set_title("Total de Produtos por Categoria")
    ax.set_xlabel("Categorias")
    ax.set_ylabel("Quantidade de Produtos")
    plt.xticks 
    
    plt.show()


    
    
# Gráfico de Pizza 
def graficoProduto():
    response = requests.get(url_produto)
    
    if response.status_code != 200:
        print('Erro ao recuperar produtos!')
        return
    
    produtos = response.json()
    labels = list(set([x['categoria'] for x in produtos]))
    sizes = [0] * len(labels)
    
    for produto in produtos:
        index = labels.index(produto['categoria'])
        sizes[index] += 1
    
    fig, ax = plt.subplots()
    ax.pie(
        sizes, 
        labels=labels, 
        autopct='%1.1f%%',  
        startangle=90       
    )
    ax.set_title("Distribuição de Produtos por Categoria")
    plt.show()

    

    
    
#----------------------- Menu Grágico -----------------------#
def menuGrafico():
    while True:
        titulo("Menu de Gráficos")
        print("1 - Gráfico de Estoque")
        print("2 - Gráfico de Produtos")
        print("0 - Voltar")
        
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            graficoEstoque()
        elif opcao == "2":
            graficoProduto()
        elif opcao == "0":
            menuPrincipal()
        else:
            print("Opção inválida!")
    
    
    
#----------------------- Menu Principal -----------------------#

def menuPrincipal():
    while True:
        titulo("Menu Principal")
        print("1 - Login")
        print("2 - Cadastro")
        print("3 - Recuperação de Senha")
        print("4 - Produtos")
        print("5 - Gráficos")
        print("0 - Sair")
        
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            login()
        elif opcao == "2":
            cadastro()
        elif opcao == "3":
            esqueceuSenha()
        elif opcao == "4":
            menuProdutos()
        elif opcao == "5":
            menuGrafico()
        elif opcao == "0":
            break
        else:
            print("Opção inválida!")

    
menuPrincipal()