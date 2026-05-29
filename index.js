document.addEventListener("DOMContentLoaded", async () => {

    // CAMADA DE DOMÍNIO 
    
    // Livro (ID e atributos próprios)
    class Livro {
        constructor(id, titulo, autor, precoDigital, imagem) {
            this.id = id;
            this.titulo = titulo;
            this.autor = autor;
            this.precoDigital = precoDigital;
            this.imagem = imagem; 
        }

        calcularPrecoFisico() {
            return this.precoDigital + 15.00;
        }
    }

    // Carrinho (controla as regras de agrupamento, totais e duplicidades)
    class CarrinhoDeCompras {
        constructor(itensIniciais = []) {
            this.itens = itensIniciais; 
        }

        adicionarItem(item) {
            this.itens.push(item);
        }

        removerItem(index) {
            this.itens.splice(index, 1);
        }

        // verifica se existem livros com o mesmo título
        verificarDuplicidade() {
            const titulosVistos = [];
            for (let item of this.itens) {
                if (titulosVistos.includes(item.titulo)) {
                    return true; 
                }
                titulosVistos.push(item.titulo);
            }
            return false;
        }

        // Calcula o valor total com base nos preços textuais armazenados
        calcularTotal() {
            return this.itens.reduce((soma, item) => {
                const valorNumerico = parseFloat(item.preco.replace("R$", "").replace(".", "").replace(",", "."));
                return soma + valorNumerico;
            }, 0);
        }

        obterItens() {
            return this.itens;
        }
    }

    // CAMADA DE INFRAESTRUTURA (LocalStorage e Google Books API)
    const CarrinhoRepository = {
        salvar(carrinho) {
            localStorage.setItem("itensCarrinho", JSON.stringify(carrinho.obterItens()));
        },
        buscar() {
            const dados = localStorage.getItem("itensCarrinho");
            const itens = dados ? JSON.parse(dados) : [];
            return new CarrinhoDeCompras(itens); 
        },
        limpar() {
            localStorage.removeItem("itensCarrinho");
        }
    };

// Serviço para conectar e buscar dados vivos na API Open Library (Sem necessidade de Key)
    const LivroService = {
        async buscarLivrosDeLiteratura() {
            try {
                // Busca livros populares em português
                const resposta = await fetch("https://openlibrary.org/search.json?q=literatura+brasileira&limit=12");
                const dados = await resposta.json();

                if (!dados.docs) return [];

                // Mapeia os dados brutos e retorna instâncias da entidade pura Livro
                return dados.docs.map((item, index) => {
                    const titulo = item.title || "Título Indisponível";
                    const autor = item.author_name ? item.author_name.join(", ") : "Autor Desconhecido";
                    
                    // Monta a imagem da capa usando o ID que a própria API fornece
                    const imagem = item.cover_i 
                        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` 
                        : "https://via.placeholder.com/200x300?text=Sem+Capa";
                    
                    // Lógica para simular preços baseados nos títulos
                    const precoBase = 20.00 + (titulo.length % 30); 

                    return new Livro(index + 1, titulo, autor, precoBase, imagem);
                });
            } catch (erro) {
                console.error("Erro na API Open Library:", erro);
                alert("Não foi possível carregar os livros externos. Verifique sua conexão.");
                return [];
            }
        }
    };


    // CAMADA DE INTERFACE & APRESENTAÇÃO: HTML e Eventos
    
    // renderização do (livros.html) 
    const gradeLivros = document.getElementById("grade-livros");
    if (gradeLivros) {
        
        // saudação pro usuario
        const saudacao = document.getElementById("saudacao-usuario");
        const dadosUsuario = localStorage.getItem("usuarioLivraria");
        if (dadosUsuario && saudacao) {
            saudacao.innerText = `Olá, ${JSON.parse(dadosUsuario).nome}!`;
        }

        // sair
        const btnSair = document.getElementById("btn-sair");
        if (btnSair) btnSair.addEventListener("click", () => { window.location.href = "index.html"; });

        // carrinho
        let carrinho = CarrinhoRepository.buscar();
        const elementoQtdCarrinho = document.getElementById("qtd-carrinho");
        if (elementoQtdCarrinho) elementoQtdCarrinho.innerText = carrinho.obterItens().length;

        // chamada para popular o catálogo diretamente com dados da API
        const catalogoLivros = await LivroService.buscarLivrosDeLiteratura();

        // livros
        catalogoLivros.forEach(livro => {
            const cartao = document.createElement("div");
            cartao.classList.add("cartao-livro");

            cartao.innerHTML = `
                <img src="${livro.imagem}" alt="Capa de ${livro.titulo}" class="capa-livro">
                <h3 class="titulo-livro">${livro.titulo}</h3>
                <p class="autor-livro">Por ${livro.autor}</p>
                
                <div class="opcoes-formato">
                    <label><input type="radio" name="formato-livro${livro.id}" value="digital" checked> Digital</label>
                    <label><input type="radio" name="formato-livro${livro.id}" value="fisico"> Físico</label>
                </div>

                <div class="preco-livro">
                    <span>R$ ${livro.precoDigital.toFixed(2).replace(".", ",")}</span>
                </div>

                <div class="campo-endereco" id="endereco-livro${livro.id}" style="display: none;">
                    <label for="cep-livro${livro.id}">CEP de Entrega (Frete +R$15):</label>
                    <input type="text" id="cep-livro${livro.id}" placeholder="00000-000">
                </div>

                <button class="btn-comprar">Adicionar ao Carrinho</button>
            `;

            gradeLivros.appendChild(cartao);

           
            const radios = cartao.querySelectorAll(`input[name="formato-livro${livro.id}"]`);
            const campoEndereco = cartao.querySelector(`#endereco-livro${livro.id}`);
            const elementoPreco = cartao.querySelector(".preco-livro span");

            radios.forEach(radio => {
                radio.addEventListener("change", (e) => {
                    if (e.target.value === "fisico") {
                        campoEndereco.style.display = "block";
                        
                        elementoPreco.innerText = `R$ ${livro.calcularPrecoFisico().toFixed(2).replace(".", ",")}`;
                    } else {
                        campoEndereco.style.display = "none";
                        elementoPreco.innerText = `R$ ${livro.precoDigital.toFixed(2).replace(".", ",")}`;
                    }
                });
            });
        });

        // botões de compra da interface
        const botoesComprar = document.querySelectorAll(".btn-comprar");
        botoesComprar.forEach((btn, index) => {
            btn.addEventListener("click", () => {
                const livro = catalogoLivros[index];
                const cartao = btn.closest(".cartao-livro");
                const formatoEscolhido = cartao.querySelector(`input[name="formato-livro${livro.id}"]:checked`).value;
                const precoAtual = cartao.querySelector(".preco-livro span").innerText;
                
                let cep = "";
                if (formatoEscolhido === "fisico") {
                    cep = cartao.querySelector(`#cep-livro${livro.id}`).value.trim();
                    if (cep === "") { alert("Por favor, preencha o CEP para a entrega física."); return; }
                }

                // cria o item
                const itemNovo = { titulo: livro.titulo, formato: formatoEscolhido.toUpperCase(), preco: precoAtual, cep: cep };
                
                // manda o domínio executar a ação
                carrinho.adicionarItem(itemNovo);
                // salva o novo estado usando o repositório da infraestrutura
                CarrinhoRepository.salvar(carrinho);

                if (elementoQtdCarrinho) elementoQtdCarrinho.innerText = carrinho.obterItens().length;
                alert(`"${livro.titulo}" adicionado ao carrinho!`);
            });
        });
    }

    // renderização do pagamento: (pagamento.html) ---
    const listaCarrinhoContainer = document.getElementById("lista-carrinho");
    if (listaCarrinhoContainer) {
        
        function renderizarCheckout() {
            // Busca o carrinho estruturado como Agregado através da Infraestrutura
            const carrinho = CarrinhoRepository.buscar();
            const elementoTotal = document.getElementById("valor-total");
            const alertaDuplicado = document.getElementById("alerta-duplicado");

            if (carrinho.obterItens().length === 0) {
                listaCarrinhoContainer.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
                if (elementoTotal) elementoTotal.innerText = "R$ 0,00";
                if (alertaDuplicado) alertaDuplicado.style.display = "none";
                return;
            }

            listaCarrinhoContainer.innerHTML = "";

            carrinho.obterItens().forEach((item, index) => {
                const divItem = document.createElement("div");
                divItem.classList.add("item-carrinho");
                divItem.innerHTML = `
                    <div class="item-info">
                        <h4>${item.titulo}</h4>
                        <p>Formato: ${item.formato} ${item.cep ? `- Entrega no CEP: ${item.cep}` : ''}</p>
                    </div>
                    <div class="preco-acoes">
                        <span class="item-preco">${item.preco}</span>
                        <button class="btn-remover" data-index="${index}">Remover</button>
                    </div>
                `;
                listaCarrinhoContainer.appendChild(divItem);
            });

            // executa as regras de negócio do objeto de dominio
            if (alertaDuplicado) {
                alertaDuplicado.style.display = carrinho.verificarDuplicidade() ? "block" : "none";
            }
            if (elementoTotal) {
                elementoTotal.innerText = `R$ ${carrinho.calcularTotal().toFixed(2).replace(".", ",")}`;
            }

            // escuta a ação de exclusão na interface
            const botoesRemover = listaCarrinhoContainer.querySelectorAll(".btn-remover");
            botoesRemover.forEach(botao => {
                botao.addEventListener("click", (e) => {
                    const indexParaRemover = parseInt(e.target.getAttribute("data-index"));
                    
                    // modifica o objeto de domínio e sincroniza na infraestrutura
                    carrinho.removerItem(indexParaRemover);
                    CarrinhoRepository.salvar(carrinho);
                    
                    renderizarCheckout();
                });
            });
        }

        renderizarCheckout();

        const btnFinalizar = document.getElementById("btn-finalizar");
        if (btnFinalizar) {
            btnFinalizar.addEventListener("click", () => {
                const carrinho = CarrinhoRepository.buscar();
                if (carrinho.obterItens().length === 0) { alert("Seu carrinho está vazio!"); return; }
                
                alert("Compra simulada com sucesso!");
                CarrinhoRepository.limpar();
                window.location.href = "livros.html";
            });
        }
    }

  
    // logica de cadastro login etc

    const formCadastro = document.getElementById("form-cadastro");
    if (formCadastro) {
        formCadastro.addEventListener("submit", (event) => {
            event.preventDefault(); 
            const nome = document.getElementById("nome").value;
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            const confirmaSenha = document.getElementById("confirma-senha").value;
            
            if (senha !== confirmaSenha) { alert("As senhas não coincidem!"); return; }
            localStorage.setItem("usuarioLivraria", JSON.stringify({ nome, email, senha }));
            alert("Cadastro realizado!"); window.location.href = "index.html";
        });
    }

    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", (event) => {
            event.preventDefault();
            const emailDigitado = document.getElementById("email").value;
            const senhaDigitada = document.getElementById("senha").value;
            const dadosSalvos = localStorage.getItem("usuarioLivraria");
            
            if (!dadosSalvos) { alert("Nenhum usuário cadastrado."); return; }
            const usuario = JSON.parse(dadosSalvos);
            if (emailDigitado === usuario.email && senhaDigitada === usuario.senha) {
                alert(`Bem-vindo, ${usuario.nome}!`); window.location.href = "livros.html"; 
            } else { alert("E-mail ou senha incorretos."); }
        });
    }
});