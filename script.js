// === НАСТРОЙКИ ===
const REPLICATE_TOKEN = "r8_0veGC2xuomDUS3QAnXmmiHoGLuXup5A3Tq6ej";
const FLUX_VERSION = "b6fe9e7f2a5f5e5e5e5e5e5e5e5e5e5e5e5e5e5e";

let files = [];

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const processBtn = document.getElementById('process-btn');
const results = document.getElementById('results');
const promptInput = document.getElementById('prompt');

// Drag & Drop + Click
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => handleFiles(e.target.files));

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = '#a855f7'; });
dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = '#555');
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.borderColor = '#555';
    handleFiles(e.dataTransfer.files);
});

function handleFiles(newFiles) {
    files = [...files, ...Array.from(newFiles)];
    updateFileList();
}

function updateFileList() {
    fileList.innerHTML = files.map((f, i) => `
        <div style="padding:10px; background:#222; margin:6px 0; border-radius:8px; display:flex; justify-content:space-between;">
            📸 ${f.name}
            <span onclick="removeFile(${i})" style="color:#ff6666; cursor:pointer; font-weight:bold;">×</span>
        </div>
    `).join('');
}

window.removeFile = function(i) {
    files.splice(i, 1);
    updateFileList();
};

// ====================== ГЕНЕРАЦИЯ ======================
processBtn.addEventListener('click', async () => {
    if (files.length === 0) return alert("Загрузите фото!");
    if (!promptInput.value.trim()) return alert("Введите промпт!");

    processBtn.disabled = true;
    processBtn.textContent = "Генерация...";

    results.innerHTML = "<p style='text-align:center;'>⏳ Отправка на Flux...</p>";

    for (let file of files) {
        try {
            const resultUrl = await processImageWithFlux(file, promptInput.value);
            results.innerHTML += `
                <div style="margin:25px 0; padding:15px; background:#1a1a1a; border-radius:12px;">
                    <p><strong>${file.name}</strong></p>
                    <img src="${URL.createObjectURL(file)}" style="max-width:100%; border-radius:10px;">
                    <p><strong>Результат:</strong></p>
                    <img src="${resultUrl}" style="max-width:100%; border-radius:12px;">
                    <br><br>
                    <a href="${resultUrl}" download style="color:#a855f7;">Скачать</a>
                </div>`;
        } catch (err) {
            console.error("Полная ошибка:", err);
            results.innerHTML += `<p style="color:red;">Ошибка с ${file.name}: ${err.message}</p>`;
        }
    }

    processBtn.disabled = false;
    processBtn.textContent = "Генерировать через Flux";
});

async function processImageWithFlux(imageFile, prompt) {
    try {
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(imageFile);
        });

        console.log("Отправляем запрос на Replicate...");

        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                version: FLUX_VERSION,
                input: {
                    image: `data:image/jpeg;base64,${base64}`,
                    prompt: prompt,
                    strength: 0.65,
                    num_inference_steps: 25
                }
            })
        });

        console.log("Статус ответа:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        let result = await response.json();

        while (result.status !== "succeeded" && result.status !== "failed") {
            await new Promise(r => setTimeout(r, 5000));
            const check = await fetch(result.urls.get, {
                headers: { "Authorization": `Token ${REPLICATE_TOKEN}` }
            });
            result = await check.json();
        }

        if (result.status === "failed") throw new Error(result.error || "Failed");

        return result.output[0];

    } catch (err) {
        console.error("Детали ошибки:", err);
        throw new Error(err.message || "Неизвестная ошибка");
    }
}