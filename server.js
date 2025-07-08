
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// --- Serve Static Files ---
app.use(express.static(path.join(__dirname)));
app.use('/components', express.static(path.join(__dirname, 'components')));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- API Logic ---
const PROMO_CODES_PATH = path.join(__dirname, 'promocodes.json');
const CLAIMED_PAYMENTS_PATH = path.join(__dirname, 'claimed_payments.json');

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("API_KEY is not defined in environment variables.");
}

const YOO_KASSA_SHOP_ID = process.env.YOO_KASSA_SHOP_ID;
const YOO_KASSA_SECRET_KEY = process.env.YOO_KASSA_SECRET_KEY;

if (!YOO_KASSA_SHOP_ID || !YOO_KASSA_SECRET_KEY) {
    console.warn("YooKassa credentials are not defined. Payment endpoints will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const readData = async (filePath, defaultData = {}) => {
  try {
    await fs.access(filePath);
    const rawData = await fs.readFile(filePath, 'utf-8');
    if (rawData.trim() === '') return defaultData;
    return JSON.parse(rawData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    console.error(`Error reading file ${filePath}:`, error);
    return defaultData;
  }
};

const writeData = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
};

const getApiErrorMessage = (error) => {
    if (error && error.message) return error.message;
    return "Произошла неизвестная ошибка на сервере при обращении к AI.";
};

const packages = {
    'pack10': { generations: 10, price: 80.00 },
    'pack100': { generations: 100, price: 500.00 }
};

const checkCodeExpiration = (codeData) => {
    if (codeData.createdAt) {
        const expiresAt = new Date(codeData.createdAt);
        expiresAt.setDate(expiresAt.getDate() + 30);
        return new Date() > expiresAt;
    }
    return false;
};

app.post('/api/generate', async (req, res) => {
  try {
    const { model, contents, config, prepaidCode } = req.body;
    if (!model || !contents) {
      return res.status(400).json({ error: 'Запрос должен содержать поля "model" и "contents".' });
    }

    if (prepaidCode) {
        const codes = await readData(PROMO_CODES_PATH, {});
        const codeData = codes[prepaidCode];
        if (!codeData) {
            return res.status(400).json({ error: 'Код предоплаты не найден.', isCodeError: true });
        }
        
        if (checkCodeExpiration(codeData)) {
            return res.status(400).json({ error: 'Срок действия этого кода истек (30 дней).', isCodeError: true });
        }
        
        if (codeData.remaining <= 0) {
            return res.status(400).json({ error: 'У этого кода закончились использования.', isCodeError: true });
        }
        
        codeData.remaining--;
        await writeData(PROMO_CODES_PATH, codes);
    }
    
    const response = await ai.models.generateContent({ model, contents, config });
    const codes = await readData(PROMO_CODES_PATH, {});
    
    const responsePayload = { text: response.text };
    if (prepaidCode && codes[prepaidCode]) {
        responsePayload.remaining = codes[prepaidCode].remaining;
    }
    
    res.json(responsePayload);

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: getApiErrorMessage(error) });
  }
});

app.post('/api/check-code', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Код не предоставлен.' });

        const codes = await readData(PROMO_CODES_PATH, {});
        const codeData = codes[code];

        if (codeData) {
            if (checkCodeExpiration(codeData)) {
                return res.status(404).json({ error: 'Срок действия этого кода истек (30 дней).' });
            }
            if (codeData.remaining > 0) {
                res.json({ remaining: codeData.remaining });
            } else {
                res.status(404).json({ error: 'У этого кода предоплаты закончились использования.' });
            }
        } else {
            res.status(404).json({ error: 'Код не найден или недействителен.' });
        }
    } catch(error) {
        res.status(500).json({ error: 'Ошибка сервера при проверке кода.' });
    }
});

app.post('/api/create-payment', async (req, res) => {
    if (!YOO_KASSA_SHOP_ID || !YOO_KASSA_SECRET_KEY) {
        return res.status(500).json({ error: 'Платежная система не настроена на сервере.' });
    }

    try {
        const { amount, description, returnUrl, packageId } = req.body;
        const idempotenceKey = uuidv4();
        const authString = Buffer.from(`${YOO_KASSA_SHOP_ID}:${YOO_KASSA_SECRET_KEY}`).toString('base64');
        
        const paymentPayload = {
            amount: { value: amount.toFixed(2), currency: 'RUB' },
            capture: true,
            confirmation: { type: 'redirect', return_url: returnUrl },
            description: description,
            receipt: {
                customer: {
                    // Используем плейсхолдер, так как у нас нет email пользователя
                    email: "payment@ai-schoolboy.ru"
                },
                items: [
                    {
                        description: description.substring(0, 128), // Описание товара в чеке (лимит 128 символов)
                        quantity: "1.00",
                        amount: {
                            value: amount.toFixed(2),
                            currency: "RUB"
                        },
                        vat_code: "1", // 1 = Без НДС
                        payment_mode: "full_prepayment",
                        payment_subject: "service"
                    }
                ]
            },
            metadata: { idempotenceKey, ...(packageId && { packageId }) }
        };

        const paymentResponse = await fetch('https://api.yookassa.ru/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Idempotence-Key': idempotenceKey,
                'Authorization': `Basic ${authString}`,
            },
            body: JSON.stringify(paymentPayload)
        });

        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) throw new Error(paymentData.description || 'Ошибка YooKassa.');

        res.json({ paymentId: paymentData.id, confirmationUrl: paymentData.confirmation.confirmation_url });
    } catch (error) {
        console.error("YooKassa create payment error:", error);
        res.status(500).json({ error: getApiErrorMessage(error) });
    }
});

app.get('/api/check-payment/:paymentId', async (req, res) => {
    if (!YOO_KASSA_SHOP_ID || !YOO_KASSA_SECRET_KEY) {
        return res.status(500).json({ error: 'Платежная система не настроена на сервере.' });
    }
    try {
        const { paymentId } = req.params;
        const authString = Buffer.from(`${YOO_KASSA_SHOP_ID}:${YOO_KASSA_SECRET_KEY}`).toString('base64');
        const statusResponse = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
            headers: { 'Authorization': `Basic ${authString}` }
        });
        const statusData = await statusResponse.json();
        if (!statusResponse.ok) throw new Error(statusData.description || 'Ошибка проверки статуса.');
        res.json({ status: statusData.status, metadata: statusData.metadata });
    } catch (error) {
        console.error("YooKassa check payment error:", error);
        res.status(500).json({ error: getApiErrorMessage(error) });
    }
});

app.post('/api/claim-package', async (req, res) => {
    try {
        const { paymentId, packageId } = req.body;
        if (!packageId || !packages[packageId]) {
            return res.status(400).json({ error: 'Неверный ID пакета.' });
        }
        const pack = packages[packageId];
        
        const claimedPayments = await readData(CLAIMED_PAYMENTS_PATH, []);
        if (claimedPayments.includes(paymentId)) {
            return res.status(400).json({ error: 'Этот платеж уже был использован для получения кода.' });
        }

        const codes = await readData(PROMO_CODES_PATH, {});
        let newCode;
        do {
            newCode = `PACK-${uuidv4().substring(0, 4).toUpperCase()}-${uuidv4().substring(0, 4).toUpperCase()}`;
        } while (codes[newCode]);
        
        codes[newCode] = { 
            total: pack.generations, 
            remaining: pack.generations,
            createdAt: new Date().toISOString()
        };
        claimedPayments.push(paymentId);

        await writeData(PROMO_CODES_PATH, codes);
        await writeData(CLAIMED_PAYMENTS_PATH, claimedPayments);

        res.json({ purchasedCode: newCode });
    } catch(error) {
        console.error("Claim package error:", error);
        res.status(500).json({ error: 'Ошибка на сервере при выдаче кода.' });
    }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`AI-Shkolnik server listening on port ${port}`);
});
