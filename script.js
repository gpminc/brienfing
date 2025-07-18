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
            input.value = ''; // Limpa o valor
            if (input.classList.contains('inline-input')) {
                input.classList.add('hidden'); // Oculta inputs dinâmicos
            }
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false; // Desmarca checkboxes/radios
            }
            if (input.id.includes('ambienteNome')) {
                ambienteNameInput = input;
                input.setAttribute('required', true); // Adiciona 'required' via JS
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

    addNewAmbiente(); // Adiciona o primeiro ambiente ao carregar a página
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

        // --- Variáveis de Estilo para o PDF ---
        const pageMargin = 20; // Margem geral da página
        let currentY = 20; // Posição Y atual no documento
        const lineHeight = 7; // Altura da linha para texto padrão
        const smallLineHeight = 5; // Altura da linha para detalhes de itens
        const sectionSpacing = 15; // Espaço entre seções principais
        const subSectionSpacing = 10; // Espaço entre subseções (ex: entre ambientes)

        // Dimensões do logo (ajuste conforme o tamanho do seu logo)
        const logoWidth = 40;
        const logoHeight = 40;
        // Posição do logo (topo direito)
        const logoX = (doc.internal.pageSize.width - logoWidth) / 2; // CENTRALIZA A IMAGEM AQUI
        const logoY = pageMargin;

        // --- Funções auxiliares para coletar dados (MOVIDAS PARA CÁ) ---
        const getRadioValue = (name) => {
            const radio = document.querySelector(`input[name="${name}"]:checked`);
            return radio ? radio.value : 'Não informado';
        };
        
        const getAnyInputValue = (selector, parent = document) => {
            const input = parent.querySelector(selector);
            const value = input ? input.value.trim() : '';
            return value || 'Não informado';
        };

        // --- FUNÇÃO addText (MOVIDA PARA CÁ) ---
        const addText = (text, x, y, options = {}) => {
            if (!text) text = "Não informado";
            const splitText = doc.splitTextToSize(text, doc.internal.pageSize.width - 2 * pageMargin); // Use pageMargin aqui também
            splitText.forEach(line => {
                if (currentY + lineHeight > doc.internal.pageSize.height - pageMargin) { // Use currentY e pageMargin
                    doc.addPage();
                    currentY = pageMargin; // Reinicia Y na nova página
                }
                doc.text(line, x, currentY, options);
                currentY += options.lineHeight || lineHeight; // Usa lineHeight da opção ou o padrão
            });
        };

        // --- SEU LOGO INOVA EM BASE64 COMPLETO AQUI ---
        // Certifique-se de que esta string Base64 esteja COMPLETA e seja válida.
        // Se ela estiver cortada, você verá o erro "Incomplete or corrupt PNG file".
        // --- Exemplo de Base64 curto de um PNG 1x1 transparente (APENAS PARA TESTE) ---
        const INOVA_LOGO_BASE64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEuWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA3LTE4PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjZkNTViYzdjLTY4ZjItNDUyNC04ZTA2LTE4YzRiZDNiZDk0YzwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5JTk9WQSAtIExvZ28gLSAxPC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOnRpdGxlPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiBy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BQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAoIOgAUEHQAKCDoAFBA0AGggKADQAFBB4ACgg4ABQQdAAr8D7F9xyE2RvpCAAAAAElFTkSuQmCC`; 
        // SUBSTITUA A LINHA ACIMA PELO SEU LOGO BASE64 COMPLETO
        
        // Adiciona o logo
        try {
            doc.addImage(INOVA_LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (e) {
            console.error("Erro ao adicionar logo ao PDF:", e);
            // Se o logo não puder ser adicionado, ajuste a posição inicial do texto para não sobrepor
            currentY = logoY + logoHeight + 10; // Posiciona o texto abaixo de onde o logo deveria estar
        }
        
        // Ajusta a posição Y inicial se o logo foi adicionado ou causou erro
        currentY = Math.max(currentY, logoY + logoHeight + 10); // Garante que o texto não comece em cima do logo

        // Define a fonte padrão (Helvetica)
        doc.setFont("helvetica", "normal"); 
        
        // --- Conteúdo do PDF ---

        // Título Principal
        doc.setFontSize(20);
        doc.setTextColor(0, 56, 179); // Um azul mais escuro para o título
        addText('Briefing de Projeto de Automação', doc.internal.pageSize.width / 2, currentY, { align: 'center' });
        currentY += 10;
        doc.setFontSize(16);
        addText('INOVA Automação', doc.internal.pageSize.width / 2, currentY, { align: 'center' });
        currentY += sectionSpacing;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); // Volta ao preto
        addText('Este documento resume as informações coletadas para o desenvolvimento de um projeto de automação personalizado.', pageMargin, currentY);
        currentY += 15;

        // Seção 1: Dados do Cliente e Imóvel
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        doc.setFont("helvetica", "bold"); // Título da seção em negrito
        addText('1. Dados do Cliente e Imóvel', pageMargin, currentY);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal"); // Volta ao normal
        currentY += 5;

        doc.setFontSize(10);
        addText(`• Cliente/Responsável: ${getAnyInputValue('#nomeCliente')}`, pageMargin, currentY);
        const tipoImovelValue = getRadioValue('tipoImovel');
        const tipoImovelOutro = (tipoImovelValue === 'Outro' && getAnyInputValue('input[name="tipoImovelOutro"]')) ? ` (${getAnyInputValue('input[name="tipoImovelOutro"]', briefingForm)})` : '';
        addText(`• Tipo de Imóvel: ${tipoImovelValue}${tipoImovelOutro}`, pageMargin, currentY);
        addText(`• Localização: ${getAnyInputValue('#localizacaoImovel')}`, pageMargin, currentY);
        addText(`• Área (m²): ${getAnyInputValue('#tamanhoImovel')}`, pageMargin, currentY);
        addText(`• Pavimentos: ${getAnyInputValue('#numPavimentos')}`, pageMargin, currentY);
        addText(`• Situação do Imóvel: ${getRadioValue('situacaoImovel')}`, pageMargin, currentY);
        addText(`• Previsão de Início (Instalação): ${getAnyInputValue('#dataInicioInstalacao')}`, pageMargin, currentY);
        addText(`• Orçamento Estimado: ${getAnyInputValue('#orcamentoEstimado')}`, pageMargin, currentY);
        currentY += sectionSpacing;

        // Seção 2: Ambientes e Automação Desejada
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        doc.setFont("helvetica", "bold");
        addText('2. Ambientes e Automação Desejada', pageMargin, currentY);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        currentY += 5;

        doc.setFontSize(10);

        const currentAmbientes = ambientesContainer.querySelectorAll('.ambiente-card:not(.ambiente-template)');
        if (currentAmbientes.length > 0) {
            currentAmbientes.forEach((ambienteCard, index) => {
                const ambienteId = ambienteCard.getAttribute('data-ambiente-id');
                const ambienteNome = getAnyInputValue(`input[name="ambiente_${ambienteId}_nome"]`, ambienteCard);

                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                addText(`• Ambiente ${index + 1}: ${ambienteNome}`, pageMargin, currentY);
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                currentY += 2;

                ambienteCard.querySelectorAll('.checkbox-options label').forEach(label => {
                    const checkbox = label.querySelector('input[type="checkbox"]');
                    if (checkbox && checkbox.checked) {
                        const functionalityName = label.textContent.split('<input')[0].trim();
                        let detailValue = '';
                        const inlineInput = label.querySelector('.inline-input');
                        if (inlineInput && inlineInput.value) {
                            detailValue = `: ${inlineInput.value.trim()}`;
                        }
                        addText(`   - ${functionalityName}: Sim${detailValue}`, pageMargin + 10, currentY, { lineHeight: smallLineHeight });
                    }
                });
                
                const ambienteDetalhes = getAnyInputValue(`textarea[name="ambiente_${ambienteId}_detalhes"]`, ambienteCard);
                if (ambienteDetalhes !== 'Não informado') {
                    addText(`   - Detalhes Adicionais: ${ambienteDetalhes}`, pageMargin + 10, currentY, { lineHeight: smallLineHeight });
                } else {
                    addText(`   - Detalhes Adicionais: Não informado`, pageMargin + 10, currentY, { lineHeight: smallLineHeight });
                }
                currentY += subSectionSpacing;
            });
            currentY += 5;
        } else {
            addText('Nenhum ambiente especificado.', pageMargin, currentY);
            currentY += 10;
        }

        let geralCard = null;
        const allCards = document.querySelectorAll('.ambiente-card');
        for (const card of allCards) {
            const h3Element = card.querySelector('h3');
            if (h3Element && h3Element.textContent.includes('Necessidades Gerais')) {
                geralCard = card;
                break;
            }
        }

        if (geralCard) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            addText('• Necessidades Gerais (Gerais para todo o imóvel):', pageMargin, currentY);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            currentY += 2;

            geralCard.querySelectorAll('.checkbox-options label').forEach(label => {
                const checkbox = label.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    const functionalityName = label.textContent.split('<input')[0].trim();
                    let detailValue = '';
                    const inlineInput = label.querySelector('.inline-input');
                    if (inlineInput && inlineInput.value) {
                        detailValue = `: ${inlineInput.value.trim()}`;
                    }
                    addText(`   - ${functionalityName}: Sim${detailValue}`, pageMargin + 10, currentY, { lineHeight: smallLineHeight });
                }
            });

            const geralDetalhes = getAnyInputValue('textarea[name="geral_detalhes"]', geralCard);
            if (geralDetalhes !== 'Não informado') {
                 addText(`   - Outras Observações Gerais: ${geralDetalhes}`, pageMargin + 10, currentY, { lineHeight: smallLineHeight });
            } else {
                addText(`   - Outras Observações Gerais: Não informado`, pageMargin + 10, currentY, { lineHeight: smallLineHeight });
            }
            currentY += sectionSpacing;
        }


        // Seção 3: Infraestrutura e Conectividade
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        doc.setFont("helvetica", "bold");
        addText('3. Infraestrutura e Conectividade', pageMargin, currentY);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        currentY += 5;

        doc.setFontSize(10);
        addText(`• Internet: ${getAnyInputValue('#conexaoInternet')}`, pageMargin, currentY);
        const roteadorWifiValue = getRadioValue('roteadorWifi');
        const roteadorWifiModelo = (roteadorWifiValue === 'Sim' && getAnyInputValue('input[name="roteadorWifiModelo"]')) ? ` (Modelo: ${getAnyInputValue('input[name="roteadorWifiModelo"]', briefingForm)})` : '';
        addText(`• Roteador Wi-Fi Atual: ${roteadorWifiValue}${roteadorWifiModelo}`, pageMargin, currentY);
        addText(`• Rede Wi-Fi Mesh: ${getRadioValue('wifiMesh')}`, pageMargin, currentY);
        
        const pontosRJ45Value = getRadioValue('pontosRedeRJ45');
        const pontosRJ45Detalhes = (pontosRJ45Value === 'Parcialmente' && getAnyInputValue('input[name="pontosRedeRJ45Detalhes"]')) ? ` (Detalhes: ${getAnyInputValue('input[name="pontosRedeRJ45Detalhes"]', briefingForm)})` : '';
        addText(`• Pontos de rede RJ45 embutidos: ${pontosRJ45Value}${pontosRJ45Detalhes}`, pageMargin, currentY);
        addText(`• Possibilidade de passar novos cabos (Ethernet): ${getRadioValue('passarNovosCabos')}`, pageMargin, currentY);
        addText(`• Pontos de energia suficientes: ${getRadioValue('pontosEnergiaSuficientes')}`, pageMargin, currentY);
        addText(`• Necessidade de novos pontos elétricos: ${getRadioValue('necessidadeNovosPontosEletricos')}`, pageMargin, currentY);
        addText(`• Espaço disponível no QDC: ${getRadioValue('espacoQDC')}`, pageMargin, currentY);
        addText(`• Tecnologia Preferida: ${getRadioValue('preferenciaTecnologia')}`, pageMargin, currentY);
        currentY += sectionSpacing;

        // Seção 4: Nível de Automação e Rotinas
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        doc.setFont("helvetica", "bold");
        addText('4. Nível de Automação e Rotinas Específicas', pageMargin, currentY);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        currentY += 5;

        doc.setFontSize(10);
        addText(`• Grau de Automação Desejado: ${getRadioValue('grauAutomacao')}`, pageMargin, currentY);
        addText(`• Cenários/Rotinas Específicas:`, pageMargin, currentY);
        addText(`${getAnyInputValue('#cenariosRotinas')}`, pageMargin + 10, currentY);
        currentY += sectionSpacing;

        // Seção 5: Observações Adicionais
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179);
        doc.setFont("helvetica", "bold");
        addText('5. Observações Adicionais', pageMargin, currentY);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        currentY += 5;

        doc.setFontSize(10);
        addText(`• Detalhes do imóvel que podem impactar o projeto:`, pageMargin, currentY);
        addText(`${getAnyInputValue('#detalhesAdicionaisImovel')}`, pageMargin + 10, currentY);
        currentY += sectionSpacing;

        // Salva o PDF
        const fileName = `Briefing_INOVA_${getAnyInputValue('#nomeCliente').replace(/\s/g, '_') || 'Cliente'}.pdf`;
        doc.save(fileName);
    });
});
