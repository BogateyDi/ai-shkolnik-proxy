

import {
    BookAICategory, BookAIAudience, BookAIVolume, ScientificDocType, ScientificMethodology
} from './types';

// BookAI Genre Categories
export const BOOKAI_GENRE_CATEGORIES: BookAICategory[] = [
  {
    id: "genre_cat_fiction",
    name: "Художественная литература",
    tooltipText: "Вымышленные истории и повествования.",
    subItems: [
      { id: "genre_fiction_novel", name: "Романы", tooltipText: "Объемные произведения с развитым сюжетом." },
      { id: "genre_fiction_novella", name: "Повести", tooltipText: "Произведения среднего объема." },
      { id: "genre_fiction_short_story", name: "Новеллы", tooltipText: "Короткие рассказы с неожиданной развязкой." },
      { id: "genre_fiction_story", name: "Рассказы", tooltipText: "Небольшие произведения о конкретном событии." },
      { id: "genre_fiction_essay", name: "Эссе", tooltipText: "Размышления автора на свободную тему." },
      { id: "genre_fiction_drama", name: "Драматургия (пьесы)", tooltipText: "Произведения для театральной постановки." },
      { id: "genre_fiction_poetry", name: "Поэзия (стихи, поэмы)", tooltipText: "Литературные произведения в стихотворной форме." },
    ],
  },
  {
    id: "genre_cat_non_fiction",
    name: "Документальная литература",
    tooltipText: "Произведения, основанные на реальных событиях и фактах.",
    subItems: [
      { id: "genre_non_fiction_biography", name: "Биографии и автобиографии", tooltipText: "Описание жизни реальных людей." },
      { id: "genre_non_fiction_memoirs", name: "Воспоминания", tooltipText: "Личные рассказы о прошлом." },
      { id: "genre_non_fiction_docs", name: "Документы и исследования", tooltipText: "Аналитические работы, основанные на документах." },
      { id: "genre_non_fiction_travel", name: "Путевые дневники", tooltipText: "Записки о путешествиях." },
      { id: "genre_non_fiction_textbooks", name: "Учебники и энциклопедии", tooltipText: "Образовательные и справочные издания." },
      { id: "genre_non_fiction_popular_science", name: "Научно-популярная литература", tooltipText: "Научные знания в доступной форме." },
    ],
  },
  {
    id: "genre_cat_detective_thriller",
    name: "Детективы и триллеры",
    tooltipText: "Истории о расследованиях, интригах и напряженных событиях.",
    subItems: [
      { id: "genre_detective_classic", name: "Классический детектив", tooltipText: "Загадочные преступления и их раскрытие." },
      { id: "genre_detective_psychological_thriller", name: "Психологические триллеры", tooltipText: "Напряженные истории с акцентом на психологии." },
      { id: "genre_detective_crime_novel", name: "Криминалистические романы", tooltipText: "Истории о преступном мире и его расследовании." },
      { id: "genre_detective_court_drama", name: "Судебные драмы", tooltipText: "Драматические события в зале суда." },
      { id: "genre_detective_spy_adventure", name: "Шпионские приключения", tooltipText: "Захватывающие истории о шпионах." },
    ],
  },
  {
    id: "genre_cat_fantasy_myth",
    name: "Фэнтези и мифологическая литература",
    tooltipText: "Истории о магии, мифах и вымышленных мирах.",
    subItems: [
      { id: "genre_fantasy_heroic", name: "Героическое фэнтези", tooltipText: "Приключения героев в магических мирах." },
      { id: "genre_fantasy_dark", name: "Темное фэнтези", tooltipText: "Мрачные истории с элементами ужасов." },
      { id: "genre_fantasy_urban", name: "Городское фэнтези", tooltipText: "Магия и мифы в современном городе." },
      { id: "genre_fantasy_epic", name: "Эпическое фэнтези", tooltipText: "Масштабные истории о борьбе добра и зла." },
      { id: "genre_fantasy_fairy_tale", name: "Сказочная литература", tooltipText: "Волшебные истории для всех возрастов." },
    ],
  },
  {
    id: "genre_cat_sci_fi",
    name: "Научная фантастика",
    tooltipText: "Истории о будущем, технологиях и космосе.",
    subItems: [
      { id: "genre_scifi_space_opera", name: "Космические оперы", tooltipText: "Масштабные приключения в космосе." },
      { id: "genre_scifi_post_apocalyptic", name: "Постапокалипсис", tooltipText: "Истории о выживании после катастроф." },
      { id: "genre_scifi_alternate_history", name: "Альтернативная история", tooltipText: "Что, если бы история пошла другим путем?" },
      { id: "genre_scifi_dystopia", name: "Антиутопия", tooltipText: "Истории о несовершенных обществах будущего." },
      { id: "genre_scifi_cyberpunk", name: "Киберпанк", tooltipText: "Высокие технологии и социальный упадок." },
    ],
  },
  {
    id: "genre_cat_historical_prose",
    name: "Историческая проза",
    tooltipText: "Рассказы о прошлом, основанные на исторических событиях.",
    subItems: [
      { id: "genre_historical_epic_novel", name: "Роман-эпопея", tooltipText: "Масштабные повествования об исторических эпохах." },
      { id: "genre_historical_adventure_novel", name: "Историко-приключенческий роман", tooltipText: "Приключения в историческом сеттинге." },
      { id: "genre_historical_adventure_stories", name: "Авантюрные исторические повести", tooltipText: "Захватывающие истории из прошлого." },
    ],
  },
  {
    id: "genre_cat_adventure",
    name: "Приключенческая литература",
    tooltipText: "Захватывающие истории о путешествиях и открытиях.",
    subItems: [
      { id: "genre_adventure_pirate", name: "Пиратские рассказы", tooltipText: "Истории о морских разбойниках." },
      { id: "genre_adventure_action", name: "Экшн и боевики", tooltipText: "Динамичные истории с обилием действия." },
      { id: "genre_adventure_travelogues", name: "Путешественнические повествования", tooltipText: "Рассказы о путешествиях." },
      { id: "genre_adventure_robinsonades", name: "Робинзонады", tooltipText: "Истории о выживании в изоляции." },
      { id: "genre_adventure_mysteries_treasures", name: "Тайны и сокровища", tooltipText: "Поиски сокровищ и разгадывание тайн." },
    ],
  },
  {
    id: "genre_cat_psychological",
    name: "Психологическая литература",
    tooltipText: "Исследование внутреннего мира и взаимоотношений персонажей.",
    subItems: [
      { id: "genre_psychological_inner_state", name: "Проблематика внутреннего состояния героя", tooltipText: "Глубокое погружение в мысли и чувства." },
      { id: "genre_psychological_character_study", name: "Исследование психологии персонажей", tooltipText: "Анализ мотивов и поведения." },
      { id: "genre_psychological_introspection", name: "Интроспекция и рефлексия", tooltipText: "Самоанализ и размышления героев." },
      { id: "genre_psychological_family_conflicts", name: "Семейные конфликты и взаимоотношения", tooltipText: "Сложные отношения внутри семьи." },
    ],
  },
  {
    id: "genre_cat_philosophical",
    name: "Философская литература",
    tooltipText: "Размышления о смысле жизни и фундаментальных вопросах бытия.",
    subItems: [
      { id: "genre_philosophical_metaphysical", name: "Метафизические размышления", tooltipText: "Вопросы о природе реальности и познания." },
      { id: "genre_philosophical_dialogues_essays", name: "Диалоги и эссе", tooltipText: "Философские беседы и размышления." },
      { id: "genre_philosophical_intellectuals", name: "Творчество интеллектуалов", tooltipText: "Произведения мыслителей и философов." },
      { id: "genre_philosophical_existentialists", name: "Произведения экзистенциалистов", tooltipText: "Вопросы свободы, выбора и смысла." },
    ],
  },
  {
    id: "genre_cat_satire_humor",
    name: "Социальная сатира и юмор",
    tooltipText: "Критика общества через смех и иронию.",
    subItems: [
      { id: "genre_satire_comedies", name: "Сатирические комедии", tooltipText: "Смешные истории с критическим подтекстом." },
      { id: "genre_satire_parodies", name: "Пародийные произведения", tooltipText: "Ироничное подражание другим произведениям." },
      { id: "genre_satire_farces_pamphlets", name: "Фарсы и памфлеты", tooltipText: "Резкая сатира и обличение." },
      { id: "genre_satire_humorous_sketches", name: "Юмористические зарисовки", tooltipText: "Короткие смешные истории." },
      { id: "genre_satire_anti_authoritarian_tales", name: "Антиавторитарные сказки", tooltipText: "Сказки с критикой власти." },
    ],
  },
  {
    id: "genre_cat_romance",
    name: "Романтичная литература",
    tooltipText: "Истории о любви, страсти и отношениях.",
    subItems: [
      { id: "genre_romance_love_passion", name: "Любовь и страсть", tooltipText: "Эмоциональные истории о любви." },
      { id: "genre_romance_melodramas", name: "Мелодрамы", tooltipText: "Истории с сильными чувствами и драматизмом." },
      { id: "genre_romance_young_love", name: "Молодёжные любовные истории", tooltipText: "Романтика для молодой аудитории." },
      { id: "genre_romance_historical", name: "Исторические романтические сюжеты", tooltipText: "Любовь в антураже прошлого." },
      { id: "genre_romance_contemporary_urban", name: "Современная городская любовь", tooltipText: "Романтические истории в наше время." },
    ],
  },
  {
    id: "genre_cat_horror",
    name: "Ужасы и хоррор",
    tooltipText: "Истории, вызывающие страх и напряжение.",
    subItems: [
      { id: "genre_horror_mood", name: "Ужасы-настроения", tooltipText: "Создание атмосферы страха и тревоги." },
      { id: "genre_horror_mysteries", name: "Загадки и тайны", tooltipText: "Страшные тайны и их разгадки." },
      { id: "genre_horror_terror_psychological", name: "Террористические и психологические триллеры", tooltipText: "Истории, играющие на нервах." },
      { id: "genre_horror_magical_realism", name: "Магический реализм с элементами хоррора", tooltipText: "Реальность с вкраплениями ужаса." },
    ],
  }
];

// BookAI Style Categories
export const BOOKAI_STYLE_CATEGORIES: BookAICategory[] = [
  {
    id: "style_cat_content_theme",
    name: "По содержанию и тематике",
    tooltipText: "Стили, определяемые содержанием и темами произведения.",
    subItems: [
      { id: "style_content_realism", name: "Реализм", subtext: "Точное воспроизведение действительности", tooltipText: "Стремление к объективному изображению жизни." },
      { id: "style_content_romanticism", name: "Романтизм", subtext: "Акцент на эмоциях, страсти, героизме", tooltipText: "Идеализация героев и чувств." },
      { id: "style_content_symbolism", name: "Символизм", subtext: "Использование образов и символов", tooltipText: "Передача глубоких смыслов через символы." },
      { id: "style_content_modernism", name: "Модернизм", subtext: "Экспериментирование с формами и стилем", tooltipText: "Поиск новых форм выражения в искусстве." },
      { id: "style_content_postmodernism", name: "Постмодернизм", subtext: "Игра с традициями, пародия, деконструкция", tooltipText: "Ирония, цитирование и смешение стилей." },
    ],
  },
  {
    id: "style_cat_writing_style",
    name: "По стилю написания",
    tooltipText: "Особенности языка и манеры изложения.",
    subItems: [
      { id: "style_writing_classic", name: "Классический стиль", subtext: "Традиционный, плавный язык", tooltipText: "Соблюдение канонов жанра, ясный язык." },
      { id: "style_writing_experimental", name: "Экспериментальный стиль", subtext: "Необычные методы выражения", tooltipText: "Оригинальные приемы письма, нарушение норм." },
      { id: "style_writing_simple", name: "Простой стиль", subtext: "Лаконичные, лёгкие для чтения тексты", tooltipText: "Ясность и доступность изложения." },
      { id: "style_writing_high", name: "Высокий стиль", subtext: "Утончённый, изысканный язык", tooltipText: "Богатый описаниями и детализацией язык." },
    ],
  },
  {
    id: "style_cat_contemporary_genres", // Note: These are listed as "genres" but function as stylistic/structural choices here
    name: "Современные форматы и подходы",
    tooltipText: "Современные подходы к структуре и подаче литературных произведений.",
    subItems: [
      { id: "style_contemporary_novella_short", name: "Новелла (как формат)", subtext: "Короткое произведение, чёткий сюжет", tooltipText: "Небольшое количество персонажей, динамичное развитие." },
      { id: "style_contemporary_microprose", name: "Микропроза", subtext: "Короткие, емкие тексты", tooltipText: "Высокая концентрация сюжета и эмоций." },
      { id: "style_contemporary_intertextuality", name: "Интертекстуальность", subtext: "Ссылки на другие произведения", tooltipText: "Использование отсылок к известным текстам." },
      { id: "style_contemporary_interactive", name: "Интерактивная литература", subtext: "Читатель участвует в сюжете", tooltipText: "Возможность влиять на развитие событий." },
      { id: "style_contemporary_graphic_novel", name: "Графические романы (стиль изложения)", subtext: "Сочетание изображений и текста", tooltipText: "Визуальное повествование, комиксовый стиль." },
    ],
  }
];


export const BOOKAI_AUDIENCES: BookAIAudience[] = [
    { id: "children_6_10", name: "Дети (6-10 лет)", subtext: "Простой язык, поучительно", description: "Ясный и простой язык, понятные сюжеты, часто с моралью или образовательным элементом.", tooltipText: "Книги для младшего школьного возраста." },
    { id: "teens_11_16", name: "Подростки (11-16 лет)", subtext: "Актуальные темы, динамичный сюжет", description: "Темы, интересные подросткам (дружба, первая любовь, самоопределение), более сложный язык и сюжет.", tooltipText: "Книги для среднего и старшего школьного возраста." },
    { id: "young_adult_17_25", name: "Молодые взрослые (17-25 лет)", subtext: "Становление личности, сложные выборы", description: "Фокус на проблемах самоидентификации, выбора жизненного пути, сложных эмоциональных переживаниях.", tooltipText: "Young Adult и New Adult." },
    { id: "adults_25_plus", name: "Взрослые (25+)", subtext: "Глубокие темы, разнообразие жанров", description: "Широкий спектр тем, глубина проработки персонажей и конфликтов, разнообразие жанровых предпочтений.", tooltipText: "Книги для взрослой аудитории." },
];

export const BOOKAI_VOLUMES: BookAIVolume[] = [
    { id: "short_story", name: "Короткий рассказ", subtext: "2-5 страниц", description: "~3-8 тыс. слов. Обычно 1-3 смысловые части.", estimatedParts: 3, targetWordCountPerPart: 1500, tooltipText: "Небольшое произведение, 1-3 части/главы." },
    { id: "novella", name: "Повесть", subtext: "10-20 страниц", description: "~15-30 тыс. слов. Обычно 3-7 глав.", estimatedParts: 5, targetWordCountPerPart: 4000, tooltipText: "Произведение среднего объема, 3-7 глав." },
    { id: "novel", name: "Роман", subtext: "50-200 страниц", description: "~70-120 тыс. слов. Обычно 10-25 глав.", estimatedParts: 15, targetWordCountPerPart: 5000, tooltipText: "Крупное произведение, 10-25 глав." },
    { id: "epic", name: "Эпопея/Большой роман", subtext: "200-500 страниц", description: "~120-250 тыс. слов +. Обычно 25+ глав.", estimatedParts: 30, targetWordCountPerPart: 6000, tooltipText: "Очень крупное, многочастное произведение, 25+ глав." },
];

export const SCIENTIFIC_DOC_TYPES: ScientificDocType[] = [
  { id: "diploma", name: "Дипломная работа", subtext: "Комплексное исследование", tooltipText: "Комплексное исследование по выбранной теме для завершения образования." },
  { id: "report", name: "Доклад", subtext: "Выступление или отчет", tooltipText: "Краткое изложение информации по теме для выступления или представления." },
  { id: "essay", name: "Реферат", subtext: "Обзор источников", tooltipText: "Сбор и изложение информации из одного или нескольких источников по теме." },
  { id: "research", name: "Научное изыскание", subtext: "Глубокое исследование", tooltipText: "Углубленное исследование конкретного вопроса или проблемы." },
  { id: "new_tech", name: "Создание новой технологии", subtext: "На основе открытых данных", tooltipText: "Разработка концепции новой технологии, её обоснование и план реализации на основе анализа открытых и достоверных данных." },
  { id: "improve_tech", name: "Усовершенствование технологии", subtext: "Анализ и модернизация", tooltipText: "Анализ существующей технологии, выявление её недостатков и предложение конкретных путей для её усовершенствования." },
  { id: "tutorial_dev", name: "Разработка учебного пособия", subtext: "Создание обучающих материалов", tooltipText: "Генерация структуры и содержания для учебных пособий и методичек по теме." },
  { id: "grant_proposal", name: "Составление грантовой заявки", subtext: "Подготовка документов для гранта", tooltipText: "Формулирование целей, задач, актуальности и плана работ для подачи заявки на грант." },
  { 
    id: "methodology_dev", 
    name: "Разработка методологии", 
    subtext: "Создание раздела методологии", 
    tooltipText: "Генерация подробного описания методологии исследования для вашей научной работы." 
  },
  { 
    id: "presentation", 
    name: "Создание презентации", 
    subtext: "Подготовка слайдов по работе", 
    tooltipText: "Создание структуры и содержания для презентации на основе готовой научной работы." 
  },
];

export const SCIENTIFIC_METHODOLOGIES: ScientificMethodology[] = [
    { 
      id: "qualitative", 
      name: "Качественный анализ", 
      subtext: "Интервью, фокус-группы, анализ текста", 
      tooltipText: "Исследование, основанное на нечисловых данных, направленное на понимание концепций, мнений или опыта." 
    },
    { 
      id: "quantitative", 
      name: "Количественный анализ", 
      subtext: "Статистика, опросы, эксперименты", 
      tooltipText: "Исследование, основанное на сборе и анализе числовых данных для выявления закономерностей и проверки гипотез." 
    },
    { 
      id: "mixed", 
      name: "Смешанный метод", 
      subtext: "Комбинация качественного и количественного", 
      tooltipText: "Интеграция как качественных, так и количественных подходов для более полного понимания исследовательской проблемы." 
    },
    { 
      id: "case_study", 
      name: "Исследование случая (Case Study)", 
      subtext: "Глубокое изучение конкретного объекта", 
      tooltipText: "Подробное изучение одного или нескольких случаев в их реальном контексте для получения глубоких знаний." 
    },
    { 
      id: "systematic_review", 
      name: "Систематический обзор и мета-анализ", 
      subtext: "Анализ существующих исследований", 
      tooltipText: "Сбор и критическая оценка всех доступных исследований по конкретному вопросу для синтеза результатов." 
    },
    { 
      id: "custom", 
      name: "Пользовательская методология", 
      subtext: "Опишите свой подход ниже", 
      tooltipText: "Выберите этот вариант, если ваша методология уникальна или является комбинацией, которую вы хотите описать самостоятельно." 
    },
];