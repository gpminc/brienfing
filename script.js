document.addEventListener('DOMContentLoaded', () => {
    const briefingForm = document.getElementById('briefingForm');
    const ambientesContainer = document.getElementById('ambientesContainer');
    const addAmbienteButton = document.getElementById('addAmbiente');

    const ambienteTemplate = ambientesContainer.querySelector('.ambiente-template');
    let ambienteCounter = 0;

    // --- Função para atualizar a visibilidade dos botões "Remover" ---
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
        ambienteCounter++;
        const newAmbiente = ambienteTemplate.cloneNode(true);
        newAmbiente.classList.remove('ambiente-template');
        newAmbiente.style.display = 'block';
        newAmbiente.setAttribute('data-ambiente-id', ambienteCounter);

        let ambienteNameInput = null;

        newAmbiente.querySelectorAll('[name]').forEach(input => {
            const originalName = input.name;
            const parts = originalName.split('_');
            if (parts[0] === 'ambiente') {
                parts[1] = ambienteCounter;
                input.name = parts.join('_');
            }
            input.value = '';
            if (input.classList.contains('inline-input')) {
                input.classList.add('hidden');
            }
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            }
            if (input.id.includes('ambienteNome')) {
                ambienteNameInput = input;
                input.setAttribute('required', true);
            }
        });

        newAmbiente.querySelectorAll('[id]').forEach(input => {
            const originalId = input.id;
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

        const removeButton = newAmbiente.querySelector('.remove-ambiente');
        removeButton.addEventListener('click', (event) => {
            event.target.closest('.ambiente-card').remove();
            updateRemoveButtonVisibility();
        });

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
        });

        ambientesContainer.appendChild(newAmbiente);
        updateRemoveButtonVisibility();

        if (ambienteNameInput) {
            ambienteNameInput.focus();
        }
    };

    addNewAmbiente();
    addAmbienteButton.addEventListener('click', addNewAmbiente);

    // --- Lógica de Visibilidade de Inputs Estáticos ---
    briefingForm.addEventListener('change', (event) => {
        const target = event.target;

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

        if (target.name === 'roteadorWifi') {
            const modeloInput = document.querySelector('input[name="roteadorWifiModelo"]');
            if (target.value === 'Sim') {
                modeloInput.classList.remove('hidden');
            } else {
                modeloInput.classList.add('hidden');
                modeloInput.value = '';
            }
        }

        if (target.name === 'pontosRedeRJ45') {
            const detalhesInput = document.querySelector('input[name="pontosRedeRJ45Detalhes"]');
            if (target.value === 'Parcialmente') {
                detalhesInput.classList.remove('hidden');
            } else {
                detalhesInput.classList.add('hidden');
                detalhesInput.value = '';
            }
        }

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

    briefingForm.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(input => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // --- Geração de PDF ---
    briefingForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 1. Validação Personalizada
        const requiredInputs = briefingForm.querySelectorAll('[required]');
        let isValid = true;
        let firstInvalidField = null;

        for (const input of requiredInputs) {
            if (input.offsetParent !== null && !input.checkValidity()) {
                isValid = false;
                if (!firstInvalidField) {
                    firstInvalidField = input;
                }
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        }

        if (!isValid) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            if (firstInvalidField) {
                firstInvalidField.focus();
                if (firstInvalidField.type === 'radio' || firstInvalidField.type === 'checkbox') {
                    const groupContainer = firstInvalidField.closest('.radio-options') || firstInvalidField.closest('.checkbox-options');
                    if (groupContainer) {
                        groupContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
            return;
        }

        // 2. Inicializa jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yPos = 20;
        const margin = 15;
        const lineHeight = 6;
        const pageHeight = doc.internal.pageSize.height;

        const addText = (text, x, y, options = {}) => {
            if (!text) text = "Não informado";
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

        const getRadioValue = (name) => {
            const radio = document.querySelector(`input[name="${name}"]:checked`);
            return radio ? radio.value : 'Não informado';
        };
        
        const getAnyInputValue = (selector, parent = document) => {
            const input = parent.querySelector(selector);
            const value = input ? input.value.trim() : '';
            return value || 'Não informado';
        };

        doc.setFont("helvetica");

        // --- Conteúdo do PDF ---

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

                ambienteCard.querySelectorAll('.checkbox-options label').forEach(label => {
                    const checkbox = label.querySelector('input[type="checkbox"]');
                    if (checkbox && checkbox.checked) {
                        const functionalityName = label.textContent.split('<input')[0].trim();
                        let detailValue = '';
                        const inlineInput = label.querySelector('.inline-input');
                        if (inlineInput && inlineInput.value) {
                            detailValue = `: ${inlineInput.value}`;
                        }
                        addText(`   - ${functionalityName}: Sim${detailValue}`, margin, yPos);
                    }
                });
                
                const ambienteDetalhes = getAnyInputValue(`textarea[name="ambiente_${ambienteId}_detalhes"]`, ambienteCard);
                addText(`   - Detalhes Adicionais do Ambiente: ${ambienteDetalhes}`, margin, yPos);
                yPos += 8;
            });
            yPos += 5;
        } else {
            addText('Nenhum ambiente especificado.', margin, yPos);
            yPos += 10;
        }

        // --- Correção: Selecionando o cartão de Necessidades Gerais de forma robusta ---
        // Itera por todos os cards e verifica o conteúdo do h3
        let geralCard = null;
        const allCards = document.querySelectorAll('.ambiente-card'); // Pega todos os cards
        for (const card of allCards) {
            const h3Element = card.querySelector('h3');
            if (h3Element && h3Element.textContent.includes('Necessidades Gerais')) {
                geralCard = card;
                break; // Encontrou, pode sair do loop
            }
        }
        // --- Fim da Correção ---

        if (geralCard) {
            doc.setFontSize(10); // Mantém o tamanho da fonte para o conteúdo
            addText('• Necessidades Gerais (Gerais para todo o imóvel):', margin, yPos);
            yPos += 2;

            geralCard.querySelectorAll('.checkbox-options label').forEach(label => {
                const checkbox = label.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    const functionalityName = label.textContent.split('<input')[0].trim();
                    let detailValue = '';
                    const inlineInput = label.querySelector('.inline-input');
                    if (inlineInput && inlineInput.value) {
                        detailValue = `: ${inlineInput.value}`;
                    }
                    addText(`   - ${functionalityName}: Sim${detailValue}`, margin, yPos);
                }
            });

            const geralDetalhes = getAnyInputValue('textarea[name="geral_detalhes"]', geralCard);
            addText(`   - Outras Observações Gerais: ${geralDetalhes}`, margin, yPos);
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
        addText(`${getAnyInputValue('#cenariosRotinas')}`, margin + 5, yPos);
        yPos += 15;

        // Seção 5: Observações Adicionais
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        addText('5. Observações Adicionais', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        doc.setFontSize(10);
        addText(`• Detalhes do imóvel que podem impactar o projeto:`, margin, yPos);
        addText(`${getAnyInputValue('#detalhesAdicionaisImovel')}`, margin + 5, yPos);

        // Salva o PDF
        const fileName = `Briefing_INOVA_${getAnyInputValue('#nomeCliente').replace(/\s/g, '_') || 'Cliente'}.pdf`;
        doc.save(fileName);
    });
});
