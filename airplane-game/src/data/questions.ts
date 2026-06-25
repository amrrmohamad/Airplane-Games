export interface Question {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  category: 'math' | 'science' | 'general';
  categoryName: string;
}

export const QUESTIONS: Question[] = [
  // Math Questions (الرياضيات)
  {
    id: 1,
    question: "كم يساوي حاصل جمع: ٢ + ٣ ؟",
    options: ["٤", "٥", "٦", "٣"],
    answerIndex: 1,
    category: "math",
    categoryName: "الرياضيات الذكية 🔢"
  },
  {
    id: 2,
    question: "إذا كان معك ٣ تفاحات وأعطاك والدك تفاحتين، فكم تفاحة معك الآن؟",
    options: ["٤ تفاحات", "٣ تفاحات", "٥ تفاحات", "٦ تفاحات"],
    answerIndex: 2,
    category: "math",
    categoryName: "الرياضيات الذكية 🔢"
  },
  {
    id: 3,
    question: "ما هو الشكل الذي لديه ٣ أضلاع و٣ زوايا؟",
    options: ["المربع", "المستطيل", "المثلث", "الدائرة"],
    answerIndex: 2,
    category: "math",
    categoryName: "الرياضيات الذكية 🔢"
  },
  {
    id: 4,
    question: "كم يساوي: ١٠ - ٤ ؟",
    options: ["٥", "٦", "٧", "٤"],
    answerIndex: 1,
    category: "math",
    categoryName: "الرياضيات الذكية 🔢"
  },
  {
    id: 5,
    question: "ما هو العدد التالي في هذا النمط: ٢، ٤، ٦، ...؟",
    options: ["٧", "٨", "٩", "١٠"],
    answerIndex: 1,
    category: "math",
    categoryName: "الرياضيات الذكية 🔢"
  },

  // Science Questions (العلوم والمخلوقات)
  {
    id: 6,
    question: "أي من الحيوانات التالية يعيش في الماء ويستطيع السباحة؟",
    options: ["الأسد", "العصفور", "السمكة", "الأرنب"],
    answerIndex: 2,
    category: "science",
    categoryName: "عالم العلوم الطبيعية 🌿"
  },
  {
    id: 7,
    question: "ما هو الكوكب المضيء والساخن الذي يمد الأرض بالدفء والنور صباحاً؟",
    options: ["القمر", "الشمس", "المريخ", "الأرض"],
    answerIndex: 1,
    category: "science",
    categoryName: "عالم العلوم الطبيعية 🌿"
  },
  {
    id: 8,
    question: "ما هو الحيوان الذي يُلقب بـ 'ملك الغابة'؟",
    options: ["النمر", "الأسد", "الفيل", "الفهد"],
    answerIndex: 1,
    category: "science",
    categoryName: "عالم العلوم الطبيعية 🌿"
  },
  {
    id: 9,
    question: "أي جزء من النبتة يمتص الماء والغذاء من التربة؟",
    options: ["الأوراق", "الأزهار", "الجذور", "الساق"],
    answerIndex: 2,
    category: "science",
    categoryName: "عالم العلوم الطبيعية 🌿"
  },
  {
    id: 10,
    question: "أي من هذه الحيوانات يعتبر من الطيور ويستطيع الطيران؟",
    options: ["الكلب", "الدلفين", "الصقر", "القطة"],
    answerIndex: 2,
    category: "science",
    categoryName: "عالم العلوم الطبيعية 🌿"
  },

  // General Questions (معلومات عامة وثقافة)
  {
    id: 11,
    question: "ما هو لون الموز الناضج اللذيذ؟",
    options: ["أحمر", "أزرق", "أصفر", "أخضر"],
    answerIndex: 2,
    category: "general",
    categoryName: "المعلومات العامة 💡"
  },
  {
    id: 12,
    question: "ما هو الشيء الذي نستخدمه لقص الأوراق والكرتون بحذر؟",
    options: ["المقلمة", "القلم", "المقص", "المسطرة"],
    answerIndex: 2,
    category: "general",
    categoryName: "المعلومات العامة 💡"
  },
  {
    id: 13,
    question: "ما هي وسيلة النقل التي تسير على قضبان حديدية وتصدر صوت 'توت توت'؟",
    options: ["السيارة", "القطار", "السفينة", "الطائرة"],
    answerIndex: 1,
    category: "general",
    categoryName: "المعلومات العامة 💡"
  },
  {
    id: 14,
    question: "أي فاكهة من هذه الفواكه مستديرة وحمراء أو خضراء ولها بذرة صغيرة؟",
    options: ["الموز", "البطيخ", "التفاح", "الفراولة"],
    answerIndex: 2,
    category: "general",
    categoryName: "المعلومات العامة 💡"
  },
  {
    id: 15,
    question: "كم عدد ألوان قوس قزح الجميلة؟",
    options: ["٥ ألوان", "٦ ألوان", "٧ ألوان", "٨ ألوان"],
    answerIndex: 2,
    category: "general",
    categoryName: "المعلومات العامة 💡"
  }
];

export const getQuestionsByCategory = (category: string | 'all'): Question[] => {
  if (category === 'all') return QUESTIONS;
  return QUESTIONS.filter(q => q.category === category);
};

export type AdminQuestionInput = {
  question: string;
  options: string[];
  // either provide answerIndex (0-based) or answer text
  answerIndex?: number;
  answer?: string;
  category?: string;
  categoryName?: string;
};

const DEFAULT_CATEGORY: Question['category'] = 'general';

const CATEGORY_NAME_MAP: Record<Question['category'], string> = {
  math: 'الرياضيات الذكية 🔢',
  science: 'عالم العلوم الطبيعية 🌿',
  general: 'المعلومات العامة 💡'
};

export const addQuestion = (input: AdminQuestionInput): Question => {
  // basic validation
  if (!input || typeof input.question !== 'string') {
    throw new Error('Invalid input: question text is required');
  }

  if (!Array.isArray(input.options) || input.options.length < 2) {
    throw new Error('Invalid input: at least two options are required');
  }

  // determine answerIndex
  let answerIndex: number | undefined = undefined;
  if (typeof input.answerIndex === 'number') {
    answerIndex = input.answerIndex;
  } else if (typeof input.answer === 'string') {
    answerIndex = input.options.indexOf(input.answer);
    if (answerIndex === -1) answerIndex = undefined;
  }

  if (typeof answerIndex !== 'number' || answerIndex < 0 || answerIndex >= input.options.length) {
    throw new Error('Invalid input: answerIndex is out of range or missing');
  }

  // normalize category
  const rawCategory = (input.category || DEFAULT_CATEGORY).toLowerCase();
  const category: Question['category'] = rawCategory === 'math' || rawCategory === 'science' ? rawCategory as Question['category'] : DEFAULT_CATEGORY;

  // determine categoryName
  const categoryName = input.categoryName || CATEGORY_NAME_MAP[category];

  // compute next id
  const maxId = QUESTIONS.reduce((m, q) => Math.max(m, q.id), 0);
  const id = maxId + 1;

  const newQuestion: Question = {
    id,
    question: input.question,
    options: input.options,
    answerIndex,
    category,
    categoryName
  };

  QUESTIONS.push(newQuestion);
  return newQuestion;
};
