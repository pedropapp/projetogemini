const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { join } = require("path");

dotenv.config(); // Load environment variables from .env file
const app = express();
app.use(express.json());
// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Function to generate a random theme
async function run() {
    console.log("Generating a random theme...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = "Você é um professor de redação do ensino médio. você está encarregado de gerar um tema para a redação de seus alunos. O tema deve ser aleatório e conter assuntos relevantes em relação aos acontecimentos recentes. Como assistente, seu output deve ser somente o tema. sem mais nenhuma informação adicional.";
    const result = await model.generateContent(prompt);
    const response = result.response;
    console.log(response.text());
    return response.text(); // Directly return the text
}

// Function to generate a structure based on a theme
async function run2(tema) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Você é um professor de redação do ensino médio. Você está encarregado de gerar uma estrutura para a redação de seus alunos. O tema é ${tema} e deve conter assuntos relevantes em relação aos acontecimentos recentes. Como assistente, seu output deve ser a estrutura adequada para um bom texto do ENEM, buscando a nota 1000. Seu output deve ser somente a estrutura, sem mais nenhuma informação adicional. O seu output nao deve conter **`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}

// Function to generate a redacao based on a structure
async function run3(estrutura) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Você é um professor de redação do ensino médio. Você está encarregado de gerar uma redação do enem nota 1000 para seus alunos. Você vai gerar essa redação a partir de uma estrutura. é importante que você siga a seguinte estrutura ${estrutura}. Como assistente, seu output deve ser somente a redação muito boa com título (sem identificação de que é um título), sem mais nenhuma informação adicional. O seu output nao deve conter **`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}
async function run4(text) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Você é um professor de redação do ensino médio. Você está encarregado de dar uma nota a uma redação do enem providenciada a você. Você vai gerar essa nota a partir do seu conhecimento. Como assistente, seu output deve ser somente a nota (sem nenhuma outra informação, somente o número). O seu output nao deve conter **. a redação que vai avaliar é a seguinte: (${text}) se a redação tiver menos de 100 palavras, você deve dar o output "redação muito curta"`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}
// Function to generate a regeneration based on the input
async function regenerateParagraph(content, input) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Você é um professor de redação do ensino médio. Você está encarregado de gerar uma redação do enem nota 1000 para seus alunos. Seus alunos vão lhe dar uma passagem de seus textos, e é seu trabalho reescrever a passagem de acordo com o comando do seu aluno. seu output deve ser somente a passagem que está recomendando, e nada mais.a passagem selecionada pelo usuário pode ser uma única palavra, e você deve seguir as instruções. Passagem a ser alterada:(${content}) Comando do seu aluno para a passagem: (${input})`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}

// Regenerate paragraph endpoint
app.get("/api/regenerate", async (req, res) => {
    try {
        // Extract parameters from the query string
        const input = req.query.input;
        const range = req.query.range;

        if (!input || !range) {
            return res.status(400).json({ error: "Missing input or range parameter" });
        }

        // This is just an example content. Replace this with your actual content fetching logic.
        const content = range;

        // Generate the rewritten paragraph
        const regeneratedContent = await regenerateParagraph(content, input);
        res.json({ regeneratedContent });
    } catch (error) {
        console.error("Error in /api/regenerate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Endpoint to generate a theme
app.get("/api/tema", async (req, res) => {
    try {
        const generatedText = await run();
        console.log(generatedText);
        res.json({ generatedText });
    } catch (error) {
        console.error("Error in /api/tema:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint to generate a structure based on a theme
app.get("/api/estrutura", async (req, res) => {
    try {
        const tema = req.query.generatedTema;
        if (!tema) {
            return res.status(400).json({ error: "Missing generatedTema parameter" });
        }
        console.log("Tema received:", tema);
        const genStructure = await run2(tema);
        res.json({ genStructure });
    } catch (error) {
        console.error("Error in /api/estrutura:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint to generate a redacao based on a structure
app.get("/api/redacao", async (req, res) => {
    try {
        const estrutura = req.query.generatedEstrutura;
        if (!estrutura) {
            return res.status(400).json({ error: "Missing generatedEstrutura parameter" });
        }
        console.log("Estrutura received:", estrutura);
        const genRedacao = await run3(estrutura);
        res.json({ genRedacao });
    } catch (error) {
        console.error("Error in /api/redacao:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/score", async (req, res) => {
    try {
        const text = req.query.Text;
        if (!text) {
            return res.status(400).json({ error: "Missing generatedEstrutura parameter" });
        }
        const genScore = await run4(text);
        res.json({ genScore });
    } catch (error) {
        console.error("Error in /api/redacao:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Serve static files from the 'public' directory
app.use(express.static(join(__dirname, "public")));

// Route to serve the homepage
app.get("/", (request, response) => {
    response.sendFile(join(__dirname, "./public/home.html"));
});

const server = app.listen(5500, () => {
    console.log("Server started on port http://127.0.0.1:5500");
});

