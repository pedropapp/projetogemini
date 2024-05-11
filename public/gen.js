const quill1 = new Quill('#editor', { theme: 'snow' });
const quill2 = new Quill('#editor2', { theme: 'snow' });
const quill3 = new Quill('#editor3', { theme: 'snow' });
activeRange = null;
selectedText = null;
function showSpinner(spinnerId) {
    document.getElementById(spinnerId).style.display = 'block';
}

// Function to hide a specific spinner
function hideSpinner(spinnerId) {
    document.getElementById(spinnerId).style.display = 'none';
}
document.addEventListener("DOMContentLoaded", function () {
    const structureContainer = document.getElementById("structure-container");
    const freehandContainer = document.getElementById("freehand-container");
    const fulltextContainer = document.getElementById("fulltext-container");

    // Show structure container
    document.getElementById("gerarEstrutura").addEventListener("click", function () {
        structureContainer.style.display = 'flex';
        document.getElementById("hide1").style.display = 'block';
        document.getElementById("hide0").style.display = 'none';
        document.getElementById('gerarTema').style.display = 'none';
    });

    // Show freehand writing container
    document.getElementById("escrever").addEventListener("click", function () {
        freehandContainer.style.display = 'flex';
        document.getElementById("hide3").style.display = 'block';
        document.getElementById("hide0").style.display = 'none';
        document.getElementById('gerarTema').style.display = 'none';
    });

    // Show full text container
    document.getElementById("validateButton").addEventListener("click", function () {
        fulltextContainer.style.display = 'flex';
        document.getElementById("hide2").style.display = 'block';
        document.getElementById("hide1").style.display = 'none';

    });
    document.getElementById('regenerate-btn').addEventListener('click', function () {
        document.getElementById('popup-overlay').style.display = 'flex';
    });

    document.getElementById('cancel-btn').addEventListener('click', function () {
        document.getElementById('popup-overlay').style.display = 'none';
    });
    // Cancel regeneration
    document.getElementById('cancel-btn').addEventListener('click', () => {
        document.getElementById('popup-overlay').style.display = 'none';
    });


        // Generate theme
        document.getElementById("gerarTema").addEventListener("click", async function () {
            try {
                const response = await fetch("/api/tema");
                if (!response.ok) throw new Error('Network response was not ok.');
                const data = await response.json();
                document.getElementById("generatedTema").innerText = data.generatedText;
                document.getElementById("hide0").style.display = 'flex';
            } catch (error) {
                console.error("Error generating theme:", error);
            }
        });

        // Generate structure
        document.getElementById("gerarEstrutura").addEventListener("click", async function () {
            const tema = document.getElementById('generatedTema').innerText;
            showSpinner('spinner-estrutura'); // Show the spinner
            try {
                const queryParams = new URLSearchParams({ generatedTema: tema }).toString();
                const response = await fetch(`/api/estrutura?${queryParams}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
        
                if (!response.ok) throw new Error('Network response was not ok.');
                const data = await response.json();
                quill1.setText(data.genStructure);
            } catch (error) {
                console.error("Error generating structure:", error);
            } finally {
                hideSpinner('spinner-estrutura'); // Hide the spinner regardless of success/error
            }
        });
        

        // Validate redacao
        document.getElementById("validateButton").addEventListener("click", async function () {
            const structure = quill1.getText();
            showSpinner('spinner-redacao');
            try {
                const queryParams = new URLSearchParams({ generatedEstrutura: structure }).toString();
                const response = await fetch(`/api/redacao?${queryParams}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
        
                if (!response.ok) throw new Error('Network response was not ok.');
                const data = await response.json();
                quill2.setText(data.genRedacao);
            } catch (error) {
                console.error("Error validating redacao:", error);
            } finally {
                hideSpinner('spinner-redacao');
            }
        });


        // Update metrics bars
        quill1.on('text-change', metricsBar);
        quill2.on('text-change', metricsBar2);
        quill3.on('text-change', metricsBar3);

        // Display context menu
        quill2.container.addEventListener('mouseup', function (event) {
            const range = quill2.getSelection();
            if (range && range.length > 0) {
                activeRange = range;
                const text = quill2.getText(range.index, range.length);
                console.log("Selected text:", text);
                selectedText = text;
                const menu = document.getElementById('context-menu');

                // Get the scroll positions
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;

                // Calculate mouse position with a small offset and include the scroll offsets
                const mousex = event.clientX + scrollX + 10;
                const mousey = event.clientY + scrollY + 10;

                // Display the context menu at the mouse position
                menu.style.display = 'block';
                menu.style.position = 'absolute';
                menu.style.top = `${mousey}px`;
                menu.style.left = `${mousex}px`;
            } else {
                console.log("No text selected.");
                document.getElementById('context-menu').style.display = 'none';
            }
        });

        // Regenerate paragraph
        document.getElementById('regenerate-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            document.getElementById('popup-overlay').style.display = 'block';
        });
    });

    async function regenParagraph(input, selectedText) {
        if (!selectedText || selectedText.length === 0) {
            console.error("No text selected.");
            return;
        }
        showSpinner('spinner-regen');
        try {
            // Encode the parameters for the query string
            const queryParams = new URLSearchParams({
                input: input,
                range: selectedText,
            }).toString();
    
            const response = await fetch(`/api/regenerate?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) throw new Error('Network response was not ok.');
    
            const data = await response.json();
            const regeneratedContent = data.regeneratedContent;
            console.log("Regenerated content:", regeneratedContent);
            return regeneratedContent;
        } catch (error) {
            console.error("Error:", error);
        } finally {
            hideSpinner('spinner-regen');
        }
    }

    // Confirm regeneration and call the regenParagraph function
    document.getElementById('confirm-btn').addEventListener('click', async function () {
        const userInput = document.getElementById('userInput').value;
        await regenParagraph(userInput, selectedText);
        const newpg = await regenParagraph(userInput, selectedText);
        quill2.deleteText(activeRange.index, activeRange.length);
        quill2.insertText(activeRange.index, newpg);
        document.getElementById('popup-overlay').style.display = 'none';
    });


    function metricsBar() {
        const text = quill1.getText();
        const totalWords = text.trim().split(/\s+/).length;

 
        document.getElementById('totalwordcount').innerHTML = totalWords;
    }

    function metricsBar2() {
        const text = quill2.getText();
        const totalWords = text.trim().split(/\s+/).length;


        document.getElementById('totalwordcount2').innerHTML = totalWords;
    }

    function metricsBar3() {
        const text = quill3.getText();
        const totalWords = text.trim().split(/\s+/).length;


        document.getElementById('totalwordcount3').innerHTML = totalWords;
    }
    async function predictscore() {
        const text = quill2.getText();
        console.log(text);
        try {
            const queryParams = new URLSearchParams({ Text: text }).toString();
            const response = await fetch(`/api/score?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            document.getElementById("predictedscore2").innerText = data.genScore;
        } catch (error) {
            console.error("Error generating structure:", error);
        }

    } 
    async function predictscore2() {
        const text = quill2.getText();
        showSpinner('spinner-score2');
        console.log(text);
        try {
            const queryParams = new URLSearchParams({ Text: text }).toString();
            const response = await fetch(`/api/score?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
    
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            document.getElementById("predictedscore2").innerText = data.genScore;
        } catch (error) {
            console.error("Error generating structure:", error);
        } finally {
            hideSpinner('spinner-score2');
        }
    }
    async function predictscore3() {
        const text = quill3.getText();
        showSpinner('spinner-score2');
        console.log(text);
        try {
            const queryParams = new URLSearchParams({ Text: text }).toString();
            const response = await fetch(`/api/score?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
    
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            document.getElementById("predictedscore3").innerText = data.genScore;
        } catch (error) {
            console.error("Error generating structure:", error);
        } finally {
            hideSpinner('spinner-score2');
        }
    }
    // async function autocomplete() {
    //     const text = quill2.getText();
    //     const paragraphs = text.split('\n');
    //     const lastPg = paragraphs[paragraphs.length - 1];
    //     try {
    //         const queryParams = new URLSearchParams({ Paragraph: lastPg }).toString();
    //         const response = await fetch(`/api/autocoplete?${queryParams}`, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             }
    //         });

    //         if (!response.ok) throw new Error('Network response was not ok.');
    //         const data = await response.json();
    //         document.getElementById("predictedscore2").innerText = data.genScore;
    //     } catch (error) {
    //         console.error("Error generating structure:", error);
    //     }
    // }

