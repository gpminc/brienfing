document.addEventListener('DOMContentLoaded', () => {
    const briefingForm = document.getElementById('briefingForm');
    const ambientesContainer = document.getElementById('ambientesContainer');
    const addAmbienteButton = document.getElementById('addAmbiente');

    // Acessa o template de ambiente uma única vez. Ele permanecerá oculto.
    const ambienteTemplate = ambientesContainer.querySelector('.ambiente-template');

    let ambienteCounter = 0; // Para manter o controle dos IDs únicos dos ambientes

    // --- Função para atualizar a visibilidade dos botões "Remover" ---
    // Esta função foi movida para o início, antes de ser chamada por addNewAmbiente.
    const updateRemoveButtonVisibility = () => {
        const currentAmbientes = ambientesContainer.querySelectorAll('.ambiente-card:not(.ambiente-template)');
        if (currentAmbientes.length === 1) {
            currentAmbientes[0].querySelector('.remove-ambiente').style.display = 'none';
        } else {
            currentAmbientes.forEach(ambiente => {
                ambiente.querySelector('.remove-ambiente').style.display = 'block';
            });
        }
    };

    // --- Função para adicionar um novo ambiente ---
    const addNewAmbiente = () => {
        ambienteCounter++; // Incrementa o contador para o novo ambiente
        const newAmbiente = ambienteTemplate.cloneNode(true); // Clona o template
        newAmbiente.classList.remove('ambiente-template'); // Remove a classe de template
        newAmbiente.style.display = 'block'; // Torna o novo ambiente visível
        newAmbiente.setAttribute('data-ambiente-id', ambienteCounter); // Define um ID único

        // Atualiza os nomes e IDs dos inputs dentro do novo ambiente para que sejam únicos
        newAmbiente.querySelectorAll('[name]').forEach(input => {
            const originalName = input.name;
            // Ex: de "ambiente_1_iluminacao" para "ambiente_2_iluminacao"
            const parts = originalName.split('_');
            if (parts[0] === 'ambiente') { // Só modifica inputs específicos de ambiente
                parts[1] = ambienteCounter;
                input.name = parts.join('_');
            }
            // Limpa o valor para o novo ambiente não vir com dados do template
            input.value = '';
            // Garante que inputs dinâmicos estejam ocultos por padrão
            if (input.classList.contains('inline-input')) {
                input.classList.add('hidden');
            }
        });

        newAmbiente.querySelectorAll('[id]').forEach(input => {
            const originalId = input.id;
            // Ex: de "ambienteNome_1" para "ambienteNome_2"
            const parts = originalId.split('_');
            if (parts[0] === 'ambiente' || parts[0] === 'ambienteDetalhes') {
                parts[1] = ambienteCounter;
                input.id = parts.join('_');
            }
        });
        newAmbiente.querySelectorAll('label[for]').forEach(label => {
            const originalFor = label.htmlFor;
            const parts = originalFor.split('_');
            if (parts[0] === 'ambiente' || parts[0] === 'ambienteDetalhes') {
                parts[1] = ambienteCounter;
                label.htmlFor = parts.join('_');
            }
        });

        // Adiciona o listener para o botão "Remover" do novo ambiente
        const removeButton = newAmbiente.querySelector('.remove-ambiente');
        removeButton.addEventListener('click', (event) => {
            event.target.closest('.ambiente-card').remove();
            updateRemoveButtonVisibility(); // Atualiza a visibilidade após remover
        });

        // Adiciona listeners para os checkboxes de funcionalidades do novo ambiente
        newAmbiente.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const inlineInput = e.target.parentNode.querySelector('.inline-input');
                if (inlineInput) {
                    if (e.target.checked) {
                        inlineInput.classList.remove('hidden');
                    } else {
                        inlineInput.classList.add('hidden');
                        inlineInput.value = '';
                    }
                }
            });
            checkbox.checked = false; // Garante que os checkboxes do novo ambiente venham desmarcados
        });

        ambientesContainer.appendChild(newAmbiente); // Adiciona o novo ambiente ao container
        updateRemoveButtonVisibility(); // Atualiza a visibilidade do botão remover
    };

    // Adiciona o primeiro ambiente automaticamente ao carregar a página
    addNewAmbiente();

    // Event listener para o botão "Adicionar Ambiente"
    addAmbienteButton.addEventListener('click', addNewAmbiente);

    // --- Lógica de Visibilidade de Inputs Estáticos (fora dos ambientes dinâmicos) ---
    briefingForm.addEventListener('change', (event) => {
        const target = event.target;

        // "Tipo de Imóvel - Outro (Especificar)"
        if (target.name === 'tipoImovel') {
            const outroInput = document.querySelector('input[name="tipoImovelOutro"]');
            if (target.value === 'Outro') {
                outroInput.classList.remove('hidden');
                outroInput.setAttribute('required', true);
            } else {
                outroInput.classList.add('hidden');
                outroInput.removeAttribute('required');
                outroInput.value = '';
            }
        }

        // "Roteador Wi-Fi Atual - Modelo/Marca"
        if (target.name === 'roteadorWifi') {
            const modeloInput = document.querySelector('input[name="roteadorWifiModelo"]');
            if (target.value === 'Sim') {
                modeloInput.classList.remove('hidden');
            } else {
                modeloInput.classList.add('hidden');
                modeloInput.value = '';
            }
        }

        // "Pontos de rede RJ45 embutidos - Detalhes"
        if (target.name === 'pontosRedeRJ45') {
            const detalhesInput = document.querySelector('input[name="pontosRedeRJ45Detalhes"]');
            if (target.value === 'Parcialmente') {
                detalhesInput.classList.remove('hidden');
            } else {
                detalhesInput.classList.add('hidden');
                detalhesInput.value = '';
            }
        }

        // "Dispositivo/Sistema de automação existente - Qual"
        if (target.name === 'geral_dispositivoExistente' && target.type === 'checkbox') {
            const detalhesInput = document.querySelector('input[name="geral_dispositivoExistente_qual"]');
            if (target.checked) {
                detalhesInput.classList.remove('hidden');
            } else {
                detalhesInput.classList.add('hidden');
                detalhesInput.value = '';
            }
        }
    });

    // Dispara o evento 'change' nos inputs já selecionados ao carregar a página,
    // para que a visibilidade dinâmica funcione para o estado inicial.
    briefingForm.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(input => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // --- Geração de PDF ---
    briefingForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yPos = 20;
        const margin = 15;
        const lineHeight = 6;
        const pageHeight = doc.internal.pageSize.height;

        const addText = (text, x, y, options = {}) => {
            const splitText = doc.splitTextToSize(text, doc.internal.pageSize.width - 2 * margin);
            splitText.forEach(line => {
                if (yPos + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(line, x, yPos, options);
                yPos += lineHeight;
            });
        };

        doc.setFont("helvetica");

        const getRadioValue = (name) => {
            const radio = document.querySelector(`input[name="${name}"]:checked`);
            return radio ? radio.value : 'Não informado';
        };
        
        const getAnyInputValue = (selector, parent = document) => {
            const input = parent.querySelector(selector);
            return input ? input.value : '';
        };

        // --- Geração de Conteúdo do PDF ---

        // Título
        doc.setFontSize(18);
        addText('Briefing de Projeto de Automação INOVA', margin, yPos, { align: 'center' });
        yPos += 12;

        doc.setFontSize(10);
        addText('Este documento resume as informações coletadas para o desenvolvimento de um projeto de automação personalizado.', margin, yPos);
        yPos += 15;

        // Seção 1: Dados do Cliente e Imóvel
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        addText('1. Dados do Cliente e Imóvel', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        doc.setFontSize(10);
        addText(`• Cliente/Responsável: ${getAnyInputValue('#nomeCliente')}`, margin, yPos);
        const tipoImovelValue = getRadioValue('tipoImovel');
        const tipoImovelOutro = (tipoImovelValue === 'Outro' && getAnyInputValue('input[name="tipoImovelOutro"]')) ? ` (${getAnyInputValue('input[name="tipoImovelOutro"]', briefingForm)})` : '';
        addText(`• Tipo de Imóvel: ${tipoImovelValue}${tipoImovelOutro}`, margin, yPos);
        addText(`• Localização: ${getAnyInputValue('#localizacaoImovel')}`, margin, yPos);
        addText(`• Área (m²): ${getAnyInputValue('#tamanhoImovel')}`, margin, yPos);
        addText(`• Pavimentos: ${getAnyInputValue('#numPavimentos')}`, margin, yPos);
        addText(`• Situação do Imóvel: ${getRadioValue('situacaoImovel')}`, margin, yPos);
        addText(`• Previsão de Início (Instalação): ${getAnyInputValue('#dataInicioInstalacao')}`, margin, yPos);
        addText(`• Orçamento Estimado: ${getAnyInputValue('#orcamentoEstimado')}`, margin, yPos);
        yPos += 15;

        // Seção 2: Ambientes e Automação Desejada
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        addText('2. Ambientes e Automação Desejada', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        doc.setFontSize(10);

        const currentAmbientes = ambientesContainer.querySelectorAll('.ambiente-card:not(.ambiente-template)');
        if (currentAmbientes.length > 0) {
            currentAmbientes.forEach((ambienteCard, index) => {
                const ambienteId = ambienteCard.getAttribute('data-ambiente-id');
                const ambienteNome = getAnyInputValue(`input[name="ambiente_${ambienteId}_nome"]`, ambienteCard);

                addText(`• Ambiente: ${ambienteNome}`, margin, yPos);
                yPos += 2;

                // Percorre os checkboxes de funcionalidades
                ambienteCard.querySelectorAll('.checkbox-options label').forEach(label => {
                    const checkbox = label.querySelector('input[type="checkbox"]');
                    if (checkbox && checkbox.checked) {
                        const baseName = checkbox.name.split('_').slice(2).join('_'); // e.g., 'iluminacao'
                        let detailValue = '';
                        const inlineInput = label.querySelector('.inline-input');
                        if (inlineInput && inlineInput.value) {
                            detailValue = `: ${inlineInput.value}`;
                        }
                        addText(`   - ${label.textContent.split('<input')[0].trim()}: Sim${detailValue}`, margin, yPos);
                    }
                });
                
                const ambienteDetalhes = getAnyInputValue(`textarea[name="ambiente_${ambienteId}_detalhes"]`, ambienteCard);
                if (ambienteDetalhes) {
                    addText(`   - Detalhes Adicionais: ${ambienteDetalhes}`, margin, yPos);
                }
                yPos += 8; // Espaço após cada ambiente
            });
            yPos += 5; // Espaço extra após o último ambiente
        } else {
            addText('Nenhum ambiente especificado.', margin, yPos);
            yPos += 10;
        }

        // Necessidades Gerais (Cartão estático)
        const geralCard = document.querySelector('.ambiente-card:has(h3:contains("Necessidades Gerais"))');
        if (geralCard) {
            addText('• Necessidades Gerais (Gerais para todo o imóvel):', margin, yPos);
            yPos += 2;

            geralCard.querySelectorAll('.checkbox-options label').forEach(label => {
                const checkbox = label.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    let detailValue = '';
                    const inlineInput = label.querySelector('.inline-input');
                    if (inlineInput && inlineInput.value) {
                        detailValue = `: ${inlineInput.value}`;
                    }
                    addText(`   - ${label.textContent.split('<input')[0].trim()}: Sim${detailValue}`, margin, yPos);
                }
            });

            const geralDetalhes = getAnyInputValue('textarea[name="geral_detalhes"]', geralCard);
            if (geralDetalhes) {
                addText(`   - Outras Observações Gerais: ${geralDetalhes}`, margin, yPos);
            }
            yPos += 15;
        }


        // Seção 3: Infraestrutura e Conectividade
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        addText('3. Infraestrutura e Conectividade', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        doc.setFontSize(10);
        addText(`• Internet: ${getAnyInputValue('#conexaoInternet')}`, margin, yPos);
        const roteadorWifiValue = getRadioValue('roteadorWifi');
        const roteadorWifiModelo = (roteadorWifiValue === 'Sim' && getAnyInputValue('input[name="roteadorWifiModelo"]')) ? ` (Modelo: ${getAnyInputValue('input[name="roteadorWifiModelo"]', briefingForm)})` : '';
        addText(`• Roteador Wi-Fi Atual: ${roteadorWifiValue}${roteadorWifiModelo}`, margin, yPos);
        addText(`• Rede Wi-Fi Mesh: ${getRadioValue('wifiMesh')}`, margin, yPos);
        
        const pontosRJ45Value = getRadioValue('pontosRedeRJ45');
        const pontosRJ45Detalhes = (pontosRJ45Value === 'Parcialmente' && getAnyInputValue('input[name="pontosRedeRJ45Detalhes"]')) ? ` (Detalhes: ${getAnyInputValue('input[name="pontosRedeRJ45Detalhes"]', briefingForm)})` : '';
        addText(`• Pontos de rede RJ45 embutidos: ${pontosRJ45Value}${pontosRJ45Detalhes}`, margin, yPos);
        addText(`• Possibilidade de passar novos cabos (Ethernet): ${getRadioValue('passarNovosCabos')}`, margin, yPos);
        addText(`• Pontos de energia suficientes: ${getRadioValue('pontosEnergiaSuficientes')}`, margin, yPos);
        addText(`• Necessidade de novos pontos elétricos: ${getRadioValue('necessidadeNovosPontosEletricos')}`, margin, yPos);
        addText(`• Espaço disponível no QDC: ${getRadioValue('espacoQDC')}`, margin, yPos);
        addText(`• Tecnologia Preferida: ${getRadioValue('preferenciaTecnologia')}`, margin, yPos);
        yPos += 15;

        // Seção 4: Nível de Automação e Rotinas
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        addText('4. Nível de Automação e Rotinas Específicas', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        doc.setFontSize(10);
        addText(`• Grau de Automação Desejado: ${getRadioValue('grauAutomacao')}`, margin, yPos);
        addText(`• Cenários/Rotinas Específicas:`, margin, yPos);
        addText(`${getAnyInputValue('#cenariosRotinas') || 'Nenhum cenário específico mencionado.'}`, margin + 5, yPos);
        yPos += 15;

        // Seção 5: Observações Adicionais
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        addText('5. Observações Adicionais', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        doc.setFontSize(10);
        addText(`• Detalhes do imóvel que podem impactar o projeto:`, margin, yPos);
        addText(`${getAnyInputValue('#detalhesAdicionaisImovel') || 'Nenhum detalhe adicional mencionado.'}`, margin + 5, yPos);

        // Salva o PDF
        const fileName = `Briefing_INOVA_${getAnyInputValue('#nomeCliente').replace(/\s/g, '_') || 'Cliente'}.pdf`;
        doc.save(fileName);
    });
});