import { Exercise } from "../contexts/WorkoutContext";

export interface AICoachResponse {
  text: string;
  action?: {
    type: 'ADD_EXERCISE' | 'REPLACE_EXERCISE';
    exercises: Exercise[];
  };
}

export const sendMessageToCoach = async (
  message: string,
  currentWorkoutTitle: string,
  currentExercises: string[],
  experimentalFeatures: boolean
): Promise<AICoachResponse> => {
  try {
    const response = await fetch('/api/ai-coach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        currentWorkoutTitle,
        currentExercises,
        experimentalFeatures
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to communicate with AI Coach');
    }

    const result = await response.json();
    
    // Map the AI's simplified exercise structure to our internal Exercise/Set types
    if (result.action && Array.isArray(result.action.exercises)) {
      result.action.exercises = result.action.exercises.map((ex: any, i: number) => ({
        id: `ai-ex-${Date.now()}-${i}`,
        name: ex.name,
        isAdditional: true,
        sets: (ex.sets || []).map((s: any, j: number) => ({
          id: `ai-set-${Date.now()}-${i}-${j}`,
          weight: s?.weight || '0',
          reps: s?.reps || '10',
          rpe: '',
          isCompleted: false
        }))
      }));
    }

    return result as AICoachResponse;
  } catch (e: any) {
    console.error("AI Coach Service Error:", e);
    return { text: e.message || "System error in tactical communication. Stay focused on your sets." };
  }
};
