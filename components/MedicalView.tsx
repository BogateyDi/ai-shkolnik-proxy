

import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { Icon } from '@/components/Icon';
import type { MedicalState, MedicalViewMode, VerificationFile, AnalysisStage, LabFile } from '@/types';
import { SectionHeading } from '@/components/SectionHeading';
import { ProcessVisualizer, Stage } from '@/components/ProcessVisualizer';
import { TextInputGroup } from '@/components/TextInputGroup';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

interface MedicalViewProps {
    apiKey: string | null;
    onGenerationComplete?: () => void;
    getGenericApiErrorMessage: (error: unknown, baseMessage: string) => string;
    medicalState: MedicalState;
    setMedicalState: React.Dispatch<React.SetStateAction<MedicalState>>;
    onBack: () => void;
}

const marked = window.marked;
const DOMPurify = window.DOMPurify;

const renderMarkdown = (markdownText: string | null) => {
    if (!markdownText) return { __html: "" };
    try {
        if (!marked || !DOMPurify) return { __html: "" };
        const rawMarkup = marked.parse(markdownText);
        return { __html: DOMPurify.sanitize(rawMarkup) };
    } catch (e) {
        console.error("Markdown rendering failed", e);
        return { __html: "<p>Ошибка отображения контента.</p>" };
    }
};

const saveBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const analysisStages: Record<MedicalViewMode, Stage[]> = {
    xray: [
        { id: 'preparing', text: 'Подготовка изображения к анализу...', icon: 'fas fa-image' },
        { id: 'analyzing', text: 'Идентификация анатомических структур...', icon: 'fas fa-search-plus' },
        { id: 'concluding', text: 'Поиск аномалий и формирование заключения...', icon: 'fas fa-brain' },
    ],
    diagnosis: [
        { id: 'preparing', text: 'Обработка предоставленного документа...', icon: 'fas fa-file-alt' },
        { id: 'analyzing', text: 'Анализ диагноза и симптомов...', icon: 'fas fa-stethoscope' },
        { id: 'concluding', text: 'Формулирование объяснений и рекомендаций...', icon: 'fas fa-comment-medical' },
    ],
    verification: [
        { id: 'preparing', text: 'Компоновка всех документов для проверки...', icon: 'fas fa-copy' },
        { id: 'analyzing', text: 'Перекрестный анализ данных на нестыковки...', icon: 'fas fa-tasks' },
        { id: 'concluding', text: 'Выявление потенциальных ошибок и формирование отчета...', icon: 'fas fa-flag' },
    ],
    lab: [
        { id: 'preparing', text: 'Обработка документов анализов...', icon: 'fas fa-copy' },
        { id: 'analyzing', text: 'Сравнение с референсными значениями...', icon: 'fas fa-chart-bar' },
        { id: 'concluding', text: 'Выявление отклонений и формирование отчета...', icon: 'fas fa-file-signature' },
    ],
};

const ResultModal: React.FC<{ content: string; onClose: () => void }> = ({ content, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-600">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h4 className="text-xl font-semibold text-amber-400">Полный результат анализа</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <Icon name="fas fa-times" className="text-2xl" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
             <div className="prose prose-slate prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(content)} />
        </div>
      </div>
    </div>
);


export const MedicalView: React.FC<MedicalViewProps> = ({
    apiKey,
    onGenerationComplete,
    getGenericApiErrorMessage,
    medicalState,
    setMedicalState,
    onBack,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    const handleStateChange = useCallback(<K extends keyof MedicalState>(key: K, value: MedicalState[K]) => {
        setMedicalState(prev => ({ ...prev, [key]: value }));
    }, [setMedicalState]);

    const setActiveMode = (mode: MedicalViewMode) => {
        handleStateChange('activeMode', mode);
        // Reset analysis state when switching modes
        handleStateChange('analysisStage', 'idle');
        handleStateChange(`${mode}Error` as keyof MedicalState, null);
        handleStateChange(`${mode}Analysis` as keyof MedicalState, null);

    };
    
    const handleExtractDataFromLabs = async (currentFiles: LabFile[]) => {
        if (!apiKey || currentFiles.length === 0) return;

        handleStateChange('isExtractingLabData', true);

        const prompt = `
        Проанализируй предоставленные тексты и изображения медицинских анализов.
        Извлеки следующую информацию:
        - ФИО пациента (полное имя)
        - Пол пациента
        - Возраст пациента

        Верни результат СТРОГО в формате JSON-объекта с ключами "name", "gender", "age".
        Если какая-то информация не найдена, оставь соответствующее значение пустым ("").
        Пример: {"name": "Иванов Иван Иванович", "gender": "Мужской", "age": "45"}
        
        Не добавляй никакого текста до или после JSON.
        `;
        
        const parts: any[] = [{ text: prompt }];
        currentFiles.forEach(file => {
             parts.push({ text: `\n\n--- Начало файла: ${file.name} ---` });
             if (file.type === 'image') {
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: file.content.split(',')[1] } });
            } else {
                parts.push({ text: file.content });
            }
            parts.push({ text: `--- Конец файла: ${file.name} ---` });
        });

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: { parts },
                config: { responseMimeType: "application/json" }
            });

            let jsonStr = response.text.trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[2]) {
                jsonStr = match[2].trim();
            }

            const parsedData = JSON.parse(jsonStr);
            if (parsedData.name && !medicalState.labPatientName) handleStateChange('labPatientName', parsedData.name);
            if (parsedData.gender && !medicalState.labPatientGender) handleStateChange('labPatientGender', parsedData.gender);
            if (parsedData.age && !medicalState.labPatientAge) handleStateChange('labPatientAge', parsedData.age);

        } catch (error) {
            console.error("Error extracting lab data:", error);
            // Don't show an error to the user, they can just fill it in manually.
        } finally {
            handleStateChange('isExtractingLabData', false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, mode: MedicalViewMode) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isMultiUpload = mode === 'verification' || mode === 'lab';
        const files = isMultiUpload ? Array.from(event.target.files || []) : [file];
        
        const processingStateKey = isMultiUpload 
            ? (mode === 'lab' ? 'isProcessingLabFile' : 'isProcessingVerificationFile')
            : `isProcessing${mode.charAt(0).toUpperCase() + mode.slice(1)}` as keyof MedicalState;
        const errorStateKey = `${mode}Error` as keyof MedicalState;
        
        handleStateChange(processingStateKey as any, true);
        handleStateChange(errorStateKey as any, null);

        const newlyReadFiles: LabFile[] = [];

        const fileReadPromises = files.map(f => new Promise<void>((resolvePromise) => {
            const isImage = f.type.startsWith('image/');
            const isText = f.type === 'text/plain' || f.name.endsWith('.txt') || f.name.endsWith('.md');
            
            if (!isImage && !isText) {
                handleStateChange(errorStateKey as any, `Неподдерживаемый тип файла: ${f.name}. Загрузите изображения или текстовые файлы.`);
                resolvePromise();
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                 if (mode === 'xray') {
                    if(!isImage) { handleStateChange('xrayError', 'Для анализа рентгена необходим файл изображения.'); } else {
                        handleStateChange('xrayImageBase64', content);
                        handleStateChange('xrayImageName', f.name);
                    }
                } else if (mode === 'diagnosis') {
                    handleStateChange('diagnosisFileContent', content);
                    handleStateChange('diagnosisFileName', f.name);
                    handleStateChange('diagnosisFileType', isImage ? 'image' : 'text');
                } else if (mode === 'verification') {
                    setMedicalState(prev => ({ ...prev, verificationFiles: [...prev.verificationFiles, {id: `${f.name}-${Date.now()}`, name: f.name, type: isImage ? 'image' : 'text', content}] }));
                } else if (mode === 'lab') {
                     newlyReadFiles.push({id: `${f.name}-${Date.now()}`, name: f.name, type: isImage ? 'image' : 'text', content});
                }
                resolvePromise();
            };
            reader.onerror = () => {
                handleStateChange(errorStateKey as any, `Ошибка при чтении файла ${f.name}.`);
                resolvePromise();
            };
            if (isImage) reader.readAsDataURL(f); else reader.readAsText(f);
        }));

        await Promise.all(fileReadPromises);

        if (mode === 'lab') {
            setMedicalState(prev => {
                const updatedFiles = [...prev.labFiles, ...newlyReadFiles].slice(0, 10);
                if (newlyReadFiles.length > 0) {
                    handleExtractDataFromLabs(updatedFiles);
                }
                return { ...prev, labFiles: updatedFiles };
            });
        }
        
        handleStateChange(processingStateKey as any, false);
        if(fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
    };

    const handleAnalyze = async () => {
        if (!apiKey) {
            const errorStateKey = `${medicalState.activeMode}Error` as keyof MedicalState;
            handleStateChange(errorStateKey as any, "Анализ невозможен: API ключ не настроен.");
            return;
        }

        const mode = medicalState.activeMode;
        const analyzingStateKey = `isAnalyzing${mode.charAt(0).toUpperCase() + mode.slice(1)}` as keyof MedicalState;
        const errorStateKey = `${mode}Error` as keyof MedicalState;
        const analysisStateKey = `${mode}Analysis` as keyof MedicalState;

        handleStateChange(analyzingStateKey as any, true);
        handleStateChange(errorStateKey as any, null);
        handleStateChange(analysisStateKey as any, null);
        
        let prompt = '';
        let parts: any[] = [];
        let model = 'gemini-2.5-flash-preview-04-17';

        const stagesForMode = analysisStages[mode];
        const advanceStage = async () => {
            for (const stage of stagesForMode) {
                handleStateChange('analysisStage', stage.id as AnalysisStage);
                await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500));
            }
        };

        try {
            advanceStage();
            if (mode === 'xray') {
                if (!medicalState.xrayImageBase64) throw new Error("Изображение рентгена не загружено.");
                prompt = "Ты — высококвалифицированный врач-рентгенолог с многолетним опытом. Перед тобой рентгеновский снимок. Проведи его полный анализ.\n\n**Твоя задача:**\n1.  **Описание:** Подробно опиши, что ты видишь на снимке. Укажи анатомическую область, проекцию, состояние костных структур, суставов, мягких тканей и любые видимые патологические изменения (переломы, затемнения, новообразования, признаки воспаления и т.д.).\n2.  **Заключение:** Сформулируй четкое рентгенологическое заключение на основе твоего описания. Укажи наиболее вероятный диагноз или дифференциальный диагноз.\n3.  **Рекомендации:** Дай рекомендации по дальнейшим действиям. Нужно ли обратиться к узкому специалисту (травматологу, пульмонологу и т.д.)? Требуются ли дополнительные исследования (КТ, МРТ, УЗИ) для уточнения диагноза?\n\n**Важно:** Твой ответ должен быть структурированным, профессиональным и понятным. Всегда добавляй дисклеймер о том, что этот анализ не является окончательным диагнозом и требует очной консультации с врачом.";
                parts.push({ text: prompt });
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: medicalState.xrayImageBase64.split(',')[1] } });
            } else if (mode === 'diagnosis') {
                if (!medicalState.diagnosisFileContent) throw new Error("Файл с диагнозом не загружен.");
                prompt = "Ты — опытный и эмпатичный врач-клиницист широкого профиля. Пациент предоставил тебе свои медицинские документы (текст или изображение). \n\n**Твоя задача:**\n1.  **Анализ документа:** Изучи предоставленный материал и определи основной диагноз.\n2.  **Объяснение диагноза:** Объясни, что означает этот диагноз простым и понятным языком. Опиши суть заболевания, его возможные причины и механизмы развития.\n3.  **Симптомы и течение:** Расскажи о типичных симптомах и вариантах течения данного заболевания.\n4.  **Стандартные подходы к лечению:** Опиши общие принципы и стандартные методы лечения, которые применяются в современной медицине для этого диагноза (консервативные, хирургические, медикаментозные и т.д.).\n5.  **Рекомендации:** Дай общие рекомендации по образу жизни, питанию, физической активности и дальнейшим шагам (к какому специалисту обратиться, какие обследования могут потребоваться).\n\n**Важно:** Твой ответ должен быть максимально информативным и поддерживающим. Всегда добавляй дисклеймер о том, что этот анализ не является окончательным диагнозом и требует очной консультации с врачом.";
                parts.push({ text: prompt });
                if(medicalState.diagnosisFileType === 'image') {
                    parts.push({ inlineData: { mimeType: 'image/jpeg', data: medicalState.diagnosisFileContent.split(',')[1] } });
                } else {
                    parts.push({ text: `\n\nТекст документа для анализа:\n---\n${medicalState.diagnosisFileContent}`});
                }
            } else if (mode === 'verification') {
                 if (medicalState.verificationFiles.length < 2) throw new Error("Для проверки необходимо загрузить как минимум два файла.");
                prompt = "Ты — медицинский эксперт-аудитор. Твоя задача — провести перекрестную проверку нескольких предоставленных медицинских документов и изображений на предмет нестыковок и потенциальных ошибок. \n\n**Твоя задача:**\n1.  **Комплексный анализ:** Внимательно изучи ВСЕ предоставленные материалы.\n2.  **Поиск несоответствий:** Идентификуй любые противоречия, нестыковки или расхождения между документами. Например: диагноз в одном документе не соответствует результатам анализов в другом; описание снимка противоречит самому снимку; рекомендации одного врача противоречат заключению другого.\n3.  **Выявление потенциальных ошибок:** Укажи на возможные ошибки в диагностике или интерпретации данных, если они есть. Обоснуй свои сомнения.\n4.  **Формулировка вопросов:** Сформируй список четких и конкретных вопросов, которые пациент должен задать своему лечащему врачу для прояснения спорных моментов.\n\n**Важно:** Твой анализ должен быть объективным, беспристрастным и основанным только на предоставленных данных. Всегда добавляй дисклеймер о том, что этот анализ не является окончательным диагнозом и требует очной консультации с врачом.";
                parts.push({ text: prompt });
                medicalState.verificationFiles.forEach(file => {
                    parts.push({ text: `\n\n--- Начало файла: ${file.name} ---` });
                     if (file.type === 'image') {
                        parts.push({ inlineData: { mimeType: 'image/jpeg', data: file.content.split(',')[1] } });
                    } else {
                        parts.push({ text: file.content });
                    }
                    parts.push({ text: `--- Конец файла: ${file.name} ---` });
                });
            } else if (mode === 'lab') {
                if (medicalState.labFiles.length === 0) throw new Error("Загрузите файлы анализов.");
                if (!medicalState.labPatientName.trim() || !medicalState.labPatientGender.trim() || !medicalState.labPatientAge.trim()) {
                    throw new Error("Пожалуйста, заполните информацию о пациенте (ФИО, Пол, Возраст).");
                }
                prompt = `Ты — высококвалифицированный врач-диагност, специализирующийся на интерпретации лабораторных анализов.
        
                Информация о пациенте:
                - ФИО: ${medicalState.labPatientName}
                - Пол: ${medicalState.labPatientGender}
                - Возраст: ${medicalState.labPatientAge}

                Ниже приведены результаты лабораторных исследований из одного или нескольких документов.

                **Твоя задача:**
                1.  **Детальный анализ:** Внимательно изучи ВСЕ предоставленные данные. Для каждого показателя сравни результат с референсными значениями (нормами), если они указаны.
                2.  **Выявление отклонений:** Четко укажи все показатели, которые выходят за пределы нормы (повышены или понижены).
                3.  **Интерпретация отклонений:** Для каждого отклонения объясни, о чем это может свидетельствовать. Перечисли возможные причины (заболевания, состояния, прием лекарств и т.д.), которые могут вызывать такие изменения.
                4.  **Поиск нестыковок:** Если загружено несколько анализов, сравни их на предмет противоречий или нелогичной динамики показателей.
                5.  **Общее заключение:** Сформируй итоговое резюме. Опиши общую картину, которую показывают анализы. Есть ли признаки воспалительного процесса, анемии, нарушения функции печени, почек и т.д.?
                6.  **Рекомендации:** Посоветуй, к какому врачу-специалисту следует обратиться для дальнейшей диагностики и консультации (например, гематолог, эндокринолог, гастроэнтеролог).

                **Важно:** Твой ответ должен быть структурированным, профессиональным и понятным. Всегда добавляй дисклеймер о том, что этот анализ не является окончательным диагнозом и требует очной консультации с врачом.
                `;
                parts.push({ text: prompt });
                medicalState.labFiles.forEach(file => {
                    parts.push({ text: `\n\n--- Начало файла: ${file.name} ---` });
                    if (file.type === 'image') {
                        parts.push({ inlineData: { mimeType: 'image/jpeg', data: file.content.split(',')[1] } });
                    } else {
                        parts.push({ text: file.content });
                    }
                    parts.push({ text: `--- Конец файла: ${file.name} ---` });
                });
            }


            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model,
                contents: { parts },
            });

            handleStateChange(analysisStateKey as any, response.text);
            onGenerationComplete?.();

        } catch (error) {
            console.error(`Error analyzing ${mode}:`, error);
            handleStateChange(errorStateKey as any, getGenericApiErrorMessage(error, `Ошибка при анализе данных.`));
        } finally {
            handleStateChange(analyzingStateKey as any, false);
            handleStateChange('analysisStage', 'idle');
        }
    };

    const handleDownloadLabReport = async () => {
        if (!medicalState.labAnalysis) {
            alert("Нет данных анализа для скачивания.");
            return;
        }

        const { labPatientName, labPatientGender, labPatientAge, labAnalystName, labAnalysis } = medicalState;
        
        const docChildren: Paragraph[] = [];

        docChildren.push(new Paragraph({ text: "Анализ лабораторных исследований", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 400 } }));

        const addInfoLine = (label: string, value: string) => {
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: `${label}: `, bold: true }),
                    new TextRun({ text: value }),
                ],
                spacing: { after: 120 }
            }));
        };

        addInfoLine("ФИО пациента", labPatientName);
        addInfoLine("Пол", labPatientGender);
        addInfoLine("Возраст", labPatientAge);
        addInfoLine("Анализ проведен", labAnalystName);

        docChildren.push(new Paragraph({ text: "", spacing: { after: 300 } }));
        docChildren.push(new Paragraph({ text: "Результаты анализа AI:", heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }));

        labAnalysis.split('\n').filter(p => p.trim() !== '').forEach(pText => {
            docChildren.push(new Paragraph({ text: pText, spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED }));
        });

        const doc = new Document({
            creator: "Medical AI Assistant",
            title: `Анализ для ${labPatientName}`,
            sections: [{ properties: {}, children: docChildren }],
        });

        try {
            const blob = await Packer.toBlob(doc);
            saveBlob(blob, `Анализ_${labPatientName.replace(/[^a-z0-9\sа-яё_-]/gi, '') || 'пациент'}.docx`);
        } catch (e) {
            console.error("Error generating DOCX for lab report:", e);
            alert("Произошла ошибка при создании файла .docx.");
        }
    };
    
    const handleDownloadAnalysisReport = async (mode: MedicalViewMode) => {
        const analysisText = medicalState[`${mode}Analysis` as keyof MedicalState] as string | null;
        if (!analysisText) {
            alert("Нет данных анализа для скачивания.");
            return;
        }

        let title = "Отчет об анализе";
        let fileName = "Medical_Analysis_Report";

        switch(mode) {
            case 'xray':
                title = "Анализ рентгеновского снимка";
                fileName = `Анализ_рентгена_${medicalState.xrayImageName || ''}`;
                break;
            case 'diagnosis':
                title = "Анализ предоставленного диагноза";
                fileName = `Анализ_диагноза_${medicalState.diagnosisFileName || ''}`;
                break;
            case 'verification':
                title = "Отчет о перекрестной проверке данных";
                fileName = "Отчет_о_проверке";
                break;
        }

        const docChildren: Paragraph[] = [];
        docChildren.push(new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
        docChildren.push(new Paragraph({ text: "", spacing: { after: 300 } }));

        analysisText.split('\n').filter(p => p.trim() !== '').forEach(pText => {
            // Check for markdown headings
            if (pText.startsWith('### ')) {
                 docChildren.push(new Paragraph({ text: pText.substring(4), heading: HeadingLevel.HEADING_3, spacing: { after: 150, before: 200 } }));
            } else if (pText.startsWith('## ') || pText.startsWith('**')) { // Also treat bold as H2
                const cleanText = pText.replace(/^##\s*|\*\*|##$/g, '').trim();
                docChildren.push(new Paragraph({ text: cleanText, heading: HeadingLevel.HEADING_2, spacing: { after: 180, before: 250 } }));
            } else if (pText.startsWith('# ')) {
                 docChildren.push(new Paragraph({ text: pText.substring(2), heading: HeadingLevel.HEADING_1, spacing: { after: 200, before: 300 } }));
            } else {
                docChildren.push(new Paragraph({ text: pText, spacing: { after: 120 }, alignment: AlignmentType.JUSTIFIED }));
            }
        });

        const doc = new Document({
            creator: "Medical AI Assistant",
            title: title,
            sections: [{ properties: {}, children: docChildren }],
        });

        try {
            const blob = await Packer.toBlob(doc);
            const safeFileName = fileName.replace(/[^a-z0-9_-\sа-яё]/gi, '').substring(0, 50) || 'report';
            saveBlob(blob, `${safeFileName}.docx`);
        } catch (e) {
            console.error(`Error generating DOCX for ${mode} report:`, e);
            alert("Произошла ошибка при создании файла .docx.");
        }
    };


    const renderFileUpload = (mode: MedicalViewMode) => {
        const isLoading = medicalState.isProcessingXray || medicalState.isProcessingDiagnosis || medicalState.isProcessingVerificationFile || medicalState.isProcessingLabFile;
        const isAnalyzing = medicalState.isAnalyzingXray || medicalState.isAnalyzingDiagnosis || medicalState.isAnalyzingVerification || medicalState.isAnalyzingLab;
        const isMulti = mode === 'verification' || mode === 'lab';
        const fileLimit = mode === 'lab' ? medicalState.labFiles.length >= 10 : false;

        return (
            <div className="mb-6">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e, mode)}
                    accept="image/*,text/plain,.md,.txt"
                    multiple={isMulti}
                    className="hidden"
                    id={`file-input-${mode}`}
                    disabled={isLoading || isAnalyzing || fileLimit}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isAnalyzing || fileLimit}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-5 rounded-md shadow hover:shadow-md transition-colors duration-150 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Icon name="fas fa-upload" className="mr-2" />
                    {isMulti ? 'Загрузить файлы' : 'Загрузить файл'}
                </button>
                 {isLoading && <p className="text-amber-400 text-sm mt-2 text-center">Обработка файла...</p>}
                 {fileLimit && <p className="text-yellow-400 text-sm mt-2 text-center">Достигнут лимит в 10 файлов.</p>}
            </div>
        );
    };

    const tabs = [
        { id: 'xray', name: 'Анализ рентгена', icon: 'fas fa-x-ray' },
        { id: 'diagnosis', name: 'Анализ диагноза', icon: 'fas fa-file-medical-alt' },
        { id: 'verification', name: 'Проверка данных', icon: 'fas fa-tasks' },
        { id: 'lab', name: 'Работа с анализами', icon: 'fas fa-vial' },
    ];

    const isAnalysisButtonDisabled = () => {
        const mode = medicalState.activeMode;
        if (medicalState[`isAnalyzing${mode.charAt(0).toUpperCase() + mode.slice(1)}` as keyof MedicalState] || medicalState.isExtractingLabData) return true;
        if (mode === 'xray' && !medicalState.xrayImageBase64) return true;
        if (mode === 'diagnosis' && !medicalState.diagnosisFileContent) return true;
        if (mode === 'verification' && medicalState.verificationFiles.length < 2) return true;
        if (mode === 'lab' && (medicalState.labFiles.length === 0 || !medicalState.labPatientName || !medicalState.labPatientGender || !medicalState.labPatientAge)) return true;
        return false;
    };

    const isAnyAnalysisRunning = medicalState.isAnalyzingXray || medicalState.isAnalyzingDiagnosis || medicalState.isAnalyzingVerification || medicalState.isAnalyzingLab;
    const currentMode = medicalState.activeMode;
    const currentError = medicalState[`${currentMode}Error` as keyof MedicalState] as string | null;
    const currentAnalysis = medicalState[`${currentMode}Analysis` as keyof MedicalState] as string | null;

    
    return (
        <div className="space-y-12">
            {isResultModalOpen && currentAnalysis && (
                <ResultModal content={currentAnalysis} onClose={() => setIsResultModalOpen(false)} />
            )}
            <SectionHeading title="AI-Ассистент по Медицине" iconName="fas fa-heartbeat" iconClass="text-red-400">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors">
                    <Icon name="fas fa-arrow-left" className="mr-2" />
                    Назад к выбору модуля
                </button>
            </SectionHeading>

            <div className="relative group">
                <div className="p-4 bg-red-800/20 border border-red-600/50 rounded-lg text-red-300 flex items-center cursor-pointer" aria-describedby="warning-tooltip">
                    <Icon name="fas fa-exclamation-triangle" className="mr-2"/>
                    <h4 className="font-bold">ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ</h4>
                    <Icon name="fas fa-info-circle" className="ml-auto text-slate-400"/>
                </div>
                <div id="warning-tooltip" role="tooltip" className="absolute bottom-full left-0 mb-2 w-full p-4 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-20">
                    <p className="text-sm">Этот инструмент предназначен исключительно для информационных и образовательных целей. Анализ, предоставляемый ИИ, не является медицинским диагнозом и не может заменить очную консультацию с квалифицированным врачом. Не используйте его для принятия решений о лечении.</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center border-b-2 border-slate-700 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveMode(tab.id as MedicalViewMode)}
                        className={`flex items-center font-medium py-3 px-5 -mb-0.5 transition-colors duration-200 ${medicalState.activeMode === tab.id ? 'border-b-2 border-amber-500 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                        aria-pressed={medicalState.activeMode === tab.id}
                    >
                        <Icon name={tab.icon} className="mr-2.5"/> {tab.name}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Input Panel */}
                <div className="p-6 bg-slate-800/60 rounded-xl shadow-xl border border-slate-700/70 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-amber-300 mb-2">
                            {medicalState.activeMode === 'xray' && '1. Загрузите рентгеновский снимок'}
                            {medicalState.activeMode === 'diagnosis' && '1. Загрузите файл с диагнозом'}
                            {medicalState.activeMode === 'verification' && '1. Загрузите файлы для проверки'}
                            {medicalState.activeMode === 'lab' && '1. Загрузите файлы анализов'}
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            {medicalState.activeMode === 'xray' && 'Поддерживаются форматы изображений: JPG, PNG, WEBP.'}
                            {medicalState.activeMode === 'diagnosis' && 'Поддерживаются изображения (JPG, PNG) или текстовые файлы (.txt, .md).'}
                            {medicalState.activeMode === 'verification' && 'Загрузите минимум 2 файла. Поддерживаются изображения и тексты.'}
                            {medicalState.activeMode === 'lab' && 'Загрузите до 10 файлов. Поддерживаются изображения и тексты.'}
                        </p>
                        
                        {renderFileUpload(medicalState.activeMode)}
                        
                        {/* File Previews */}
                        {medicalState.activeMode === 'xray' && medicalState.xrayImageBase64 && (
                            <div className="mt-4">
                                <img src={medicalState.xrayImageBase64} alt="X-ray preview" className="rounded-lg border border-slate-600 max-h-64 w-auto mx-auto"/>
                                <p className="text-xs text-center mt-2 text-slate-500">{medicalState.xrayImageName}</p>
                            </div>
                        )}
                        {medicalState.activeMode === 'diagnosis' && medicalState.diagnosisFileContent && (
                            <div className="mt-4">
                                {medicalState.diagnosisFileType === 'image' ? (
                                    <img src={medicalState.diagnosisFileContent} alt="Diagnosis preview" className="rounded-lg border border-slate-600 max-h-64 w-auto mx-auto"/>
                                ) : (
                                    <div className="p-3 bg-slate-700 rounded-md max-h-64 overflow-y-auto"><pre className="text-xs text-slate-300 whitespace-pre-wrap">{medicalState.diagnosisFileContent}</pre></div>
                                )}
                                <p className="text-xs text-center mt-2 text-slate-500">{medicalState.diagnosisFileName}</p>
                            </div>
                        )}
                        {medicalState.activeMode === 'verification' && medicalState.verificationFiles.length > 0 && (
                            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-2">
                            {medicalState.verificationFiles.map(file => (
                                <div key={file.id} className="flex items-center gap-3 p-2 bg-slate-700 rounded-md">
                                    <Icon name={file.type === 'image' ? 'far fa-file-image' : 'far fa-file-alt'} className="text-sky-400"/>
                                    <span className="text-sm text-slate-300 flex-grow truncate">{file.name}</span>
                                    <button onClick={() => setMedicalState(p => ({...p, verificationFiles: p.verificationFiles.filter(f => f.id !== file.id)}))} className="text-red-500 hover:text-red-400 text-sm"><Icon name="fas fa-trash"/></button>
                                </div>
                            ))}
                            </div>
                        )}
                         {medicalState.activeMode === 'lab' && medicalState.labFiles.length > 0 && (
                            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-2">
                                {medicalState.labFiles.map(file => (
                                    <div key={file.id} className="flex items-center gap-3 p-2 bg-slate-700 rounded-md">
                                        <Icon name={file.type === 'image' ? 'far fa-file-image' : 'far fa-file-alt'} className="text-sky-400"/>
                                        <span className="text-sm text-slate-300 flex-grow truncate">{file.name}</span>
                                        <button onClick={() => setMedicalState(p => ({...p, labFiles: p.labFiles.filter(f => f.id !== file.id)}))} className="text-red-500 hover:text-red-400 text-sm"><Icon name="fas fa-trash"/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {medicalState.activeMode === 'lab' && (
                         <div className="pt-6 border-t border-slate-600/50 space-y-4">
                            <div className="flex items-center mb-2">
                                <h3 className="text-xl font-semibold text-amber-300">2. Данные пациента</h3>
                                {medicalState.isExtractingLabData && <Icon name="fas fa-spinner fa-spin" className="ml-3 text-amber-400"/>}
                            </div>
                            <TextInputGroup title="ФИО" value={medicalState.labPatientName} onChange={(val) => handleStateChange('labPatientName', val)} inputId="labPatientName" containerClassName="bg-transparent shadow-none border-none p-0" />
                            <TextInputGroup title="Пол" value={medicalState.labPatientGender} onChange={(val) => handleStateChange('labPatientGender', val)} inputId="labPatientGender" placeholder="Мужской / Женский" containerClassName="bg-transparent shadow-none border-none p-0" />
                            <TextInputGroup title="Возраст" value={medicalState.labPatientAge} onChange={(val) => handleStateChange('labPatientAge', val.replace(/[^0-9]/g, ''))} inputId="labPatientAge" type="number" containerClassName="bg-transparent shadow-none border-none p-0" />
                         </div>
                    )}
                    
                    <div className="mt-6 pt-6 border-t border-slate-600/50">
                        <h3 className="text-xl font-semibold text-amber-300 mb-4">{medicalState.activeMode === 'lab' ? '3. Начать анализ' : '2. Начать анализ'}</h3>
                        <button 
                            onClick={handleAnalyze} 
                            disabled={isAnalysisButtonDisabled()}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center"
                        >
                             <Icon name="fas fa-magic" className="mr-2"/>Анализировать
                        </button>
                    </div>

                </div>

                {/* Right: Output Panel */}
                <div className="p-6 bg-slate-800/60 rounded-xl shadow-xl border border-slate-700/70 flex flex-col">
                    <h3 className="text-xl font-semibold text-amber-300 mb-4">Результат анализа</h3>
                    
                    <div className="flex-grow">
                        {isAnyAnalysisRunning ? (
                            <ProcessVisualizer
                                stages={analysisStages[currentMode]}
                                currentStageId={medicalState.analysisStage}
                                title="Процесс анализа AI"
                                isCompleted={false}
                            />
                        ) : currentError ? (
                            <p className="text-red-400">{currentError}</p>
                        ) : currentAnalysis ? (
                            <div>
                                <p className="text-slate-300 mb-4">Анализ завершен. Просмотрите полный отчет для получения подробной информации.</p>
                                <div className="h-40 p-4 bg-slate-900/50 rounded-md overflow-hidden relative cursor-pointer" onClick={() => setIsResultModalOpen(true)}>
                                    <div className="prose prose-slate prose-invert max-w-none text-sm" dangerouslySetInnerHTML={renderMarkdown(currentAnalysis.substring(0, 300) + '...')} />
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-800/60 to-transparent"></div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500">Здесь появится результат анализа.</p>
                        )}
                    </div>
                    
                    {currentAnalysis && !isAnyAnalysisRunning && (
                        <div className="mt-auto pt-6 border-t border-slate-700/50 space-y-4">
                             <button 
                                onClick={() => setIsResultModalOpen(true)}
                                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center justify-center">
                                <Icon name="fas fa-search-plus" className="mr-2"/> Просмотреть полный отчет
                            </button>
                            {currentMode === 'lab' ? (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-amber-300 pt-2">Скачать отчет</h3>
                                    <TextInputGroup title="Анализ провел(а)" value={medicalState.labAnalystName} onChange={(val) => handleStateChange('labAnalystName', val)} inputId="labAnalystNameInput" containerClassName="bg-transparent shadow-none border-none p-0" />
                                    <button onClick={handleDownloadLabReport} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center justify-center">
                                        <Icon name="fas fa-file-word" className="mr-2"/> Скачать отчет (.docx)
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => handleDownloadAnalysisReport(currentMode)} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center justify-center">
                                    <Icon name="fas fa-file-word" className="mr-2"/> Скачать отчет (.docx)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};