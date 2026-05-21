document.addEventListener("DOMContentLoaded", () => {

    // CAMADA DE DOMÍNIO 
    
    // Livro (ID e atributos próprios)
    class Livro {
        constructor(id, titulo, autor, precoDigital, imagem) {
            this.id = id;
            this.titulo = titulo;
            this.autor = autor;
            this.precoDigital = precoDigital;
            this.imagem = imagem; // <-- Adicionado aqui
        }

        calcularPrecoFisico() {
            return this.precoDigital + 15.00;
        }
    }

    // Carrinho (controla as regras de agrupamento, totais e duplicidades)
    class CarrinhoDeCompras {
        constructor(itensIniciais = []) {
            this.itens = itensIniciais; // array de itens
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
                    return true; // se encontrou duplicado
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

    // CAMADA DE INFRAESTRUTURA (LocalStorage)
    const CarrinhoRepository = {
        salvar(carrinho) {
            localStorage.setItem("itensCarrinho", JSON.stringify(carrinho.obterItens()));
        },
        buscar() {
            const dados = localStorage.getItem("itensCarrinho");
            const itens = dados ? JSON.parse(dados) : [];
            return new CarrinhoDeCompras(itens); // retorna
        },
        limpar() {
            localStorage.removeItem("itensCarrinho");
        }
    };


    // CAMADA DE INTERFACE & APRESENTAÇÃO: HTML e Eventos
    
    // catálogo de entidades do domínio com referencia para pegar imagem.
    const catalogoLivros = [
        { id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis", precoDigital: 29.90, imagem: "imgsite/dom.jpg" },
        { id: 2, titulo: "Grande Sertão: Veredas", autor: "João Guimarães Rosa", precoDigital: 45.50, imagem: "imgsite/grandesertao.jpg" },
        { id: 3, titulo: "O Cortiço", autor: "Aluísio Azevedo", precoDigital: 19.90, imagem: "imgsite/ocortico.jpg" },
        { id: 4, titulo: "Capitães da Areia", "autor": "Jorge Amado", precoDigital: 34.90, imagem: "imgsite/areia.jpg" },
        { id: 5, titulo: "Vidas Secas", autor: "Graciliano Ramos", precoDigital: 25.00, imagem: "imgsite/vidaseca.jpg" },
        { id: 6, titulo: "A Hora da Estrela", autor: "Clarice Lispector", precoDigital: 22.80, imagem: "imgsite/estrela.jpg" },
        { id: 7, titulo: "Quincas Borba", autor: "Machado de Assis", precoDigital: 24.50, imagem: "imgsite/borba.jpg" },
        { id: 8, titulo: "Iracema", autor: "José de Alencar", precoDigital: 15.90, imagem: "imgsite/iracema.jpg" },
        { id: 9, titulo: "O Alquimista", autor: "Paulo Coelho", precoDigital: 39.90, imagem: "imgsite/alquimista.jpg" },
        { id: 10, titulo: "Triste Fim de Policarpo Quaresma", autor: "Lima Barreto", precoDigital: 21.00, imagem: "imgsite/triste.jpg" },
        { id: 11, titulo: "Macunaíma", autor: "Mário de Andrade", precoDigital: 27.90, imagem: "imgsite/macunaima.jpg" },
        { id: 12, titulo: "Auto da Compadecida", autor: "Ariano Suassuna", precoDigital: 32.00, imagem: "imgsite/compadecida.jpg" }
    ].map(dados => new Livro(dados.id, dados.titulo, dados.autor, dados.precoDigital, dados.imagem));

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

        // livros
        catalogoLivros.forEach(livro => {
            const cartao = document.createElement("div");
            cartao.classList.add("cartao-livro");

            cartao.innerHTML = `
                <img src="${livro.imagem}" alt="Capa de ${livro.titulo}" class="capa-livro">                <h3 class="titulo-livro">${livro.titulo}</h3>
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