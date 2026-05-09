import fs from 'fs';
import path from 'path';

const translationsToAdd = {
  en: {
    "workout.sessionRpe": "Session RPE",
    "workout.actual": "Actual",
    "workout.easy": "Easy (1)",
    "workout.moderate": "Moderate (5)",
    "workout.maxEffort": "Max Effort (10)",
    "workout.workoutNotes": "Workout Notes",
    "workout.saveAndFinish": "Save & Finish"
  },
  es: {
    "workout.sessionRpe": "RPE de Sesión",
    "workout.actual": "Real",
    "workout.easy": "Fácil (1)",
    "workout.moderate": "Moderado (5)",
    "workout.maxEffort": "Esfuerzo Máximo (10)",
    "workout.workoutNotes": "Notas del Entrenamiento",
    "workout.saveAndFinish": "Guardar y Finalizar"
  },
  ko: {
    "workout.sessionRpe": "세션 RPE",
    "workout.actual": "실제",
    "workout.easy": "쉬움 (1)",
    "workout.moderate": "보통 (5)",
    "workout.maxEffort": "최대 노력 (10)",
    "workout.workoutNotes": "운동 노트",
    "workout.saveAndFinish": "저장 및 종료"
  },
  zh: {
    "workout.sessionRpe": "会话 RPE",
    "workout.actual": "实际",
    "workout.easy": "轻松 (1)",
    "workout.moderate": "中等 (5)",
    "workout.maxEffort": "最大努力 (10)",
    "workout.workoutNotes": "锻炼笔记",
    "workout.saveAndFinish": "保存并完成"
  }
};

const langs = ['en', 'es', 'ko', 'zh'];
for (const lang of langs) {
  const filePath = 'src/locales/' + lang + '.json';
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    Object.assign(data, translationsToAdd[lang]);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Updated ' + lang + '.json');
  }
}
